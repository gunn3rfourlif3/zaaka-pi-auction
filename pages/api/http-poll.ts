import { NextApiRequest, NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';

// Global storage for HTTP polling clients and their subscriptions
const pollingClients = new Map<string, { auctionIds: Set<number>, lastUpdate: number }>();
const bidUpdateQueue = new Map<number, any[]>(); // auctionId -> updates array

// Clean up old clients every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [clientId, client] of pollingClients.entries()) {
        if (now - client.lastUpdate > 300000) { // 5 minutes
            pollingClients.delete(clientId);
            console.log(`🧹 Cleaned up inactive polling client: ${clientId}`);
        }
    }
}, 300000);

function handlePoll(req: NextApiRequest, res: NextApiResponse, auctionId: string, clientId: string) {
    return new Promise<void>((resolve) => {
        try {
            // Update client activity
            if (!pollingClients.has(clientId)) {
                pollingClients.set(clientId, { auctionIds: new Set(), lastUpdate: Date.now() });
            }
            
            const client = pollingClients.get(clientId)!;
            client.lastUpdate = Date.now();
            
            // Check for updates for this auction
            const updates = bidUpdateQueue.get(parseInt(auctionId)) || [];
            
            if (updates.length > 0) {
                // Return all pending updates and clear queue
                bidUpdateQueue.set(parseInt(auctionId), []);
                
                console.log(`📡 HTTP Poll Response: ${updates.length} updates for auction ${auctionId}`);
                res.status(200).json({ 
                    success: true, 
                    updates,
                    timestamp: Date.now()
                });
                resolve();
                return;
            }
            
            // No updates, hold connection for 25 seconds (long polling)
            const startTime = Date.now();
            const maxWait = 25000; // 25 seconds max wait
            let resolved = false;
            
            const checkForUpdates = () => {
                if (resolved) return; // Already responded
                
                const currentUpdates = bidUpdateQueue.get(parseInt(auctionId)) || [];
                const elapsed = Date.now() - startTime;
                
                if (currentUpdates.length > 0 || elapsed >= maxWait) {
                    // Clear updates if any
                    if (currentUpdates.length > 0) {
                        bidUpdateQueue.set(parseInt(auctionId), []);
                    }
                    
                    console.log(`📡 HTTP Poll Response: ${currentUpdates.length} updates after ${elapsed}ms`);
                    res.status(200).json({ 
                        success: true, 
                        updates: currentUpdates,
                        timestamp: Date.now()
                    });
                    resolved = true;
                    resolve();
                    return;
                }
                
                // Check again in 1 second
                setTimeout(checkForUpdates, 1000);
            };
            
            // Start checking for updates
            checkForUpdates();
            
        } catch (error) {
            console.error('❌ HTTP Poll Error:', error);
            if (!res.headersSent) {
                res.status(500).json({ success: false, error: 'Internal server error' });
            }
            resolve();
        }
    });
}

function handleUpdate(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { auctionId, newBid, bidder, type = 'bid_update' } = req.body;
        
        if (!auctionId || newBid === undefined || !bidder) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }
        
        const update = {
            type,
            auctionId: parseInt(auctionId),
            newBid: parseFloat(newBid),
            bidder,
            timestamp: Date.now()
        };
        
        // Add to update queue for HTTP polling clients
        if (!bidUpdateQueue.has(auctionId)) {
            bidUpdateQueue.set(auctionId, []);
        }
        bidUpdateQueue.get(auctionId)!.push(update);
        
        // Also emit via Socket.IO if available
        const io = (global as any).io;
        if (io) {
            io.emit(type, update);
            io.to(`auction_${auctionId}`).emit(type, update);
            console.log(`🚀 Emitted ${type} via Socket.IO: Auction ${auctionId}, Bid ${newBid} by ${bidder}`);
        }
        
        console.log(`📡 Queued ${type} for HTTP polling: Auction ${auctionId}, Bid ${newBid} by ${bidder}`);
        
        return res.status(200).json({ 
            success: true, 
            message: 'Update queued successfully',
            update
        });
        
    } catch (error) {
        console.error('❌ HTTP Update Error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

function handleSubscribe(req: NextApiRequest, res: NextApiResponse, auctionId: string, clientId: string) {
    try {
        if (!pollingClients.has(clientId)) {
            pollingClients.set(clientId, { auctionIds: new Set(), lastUpdate: Date.now() });
        }
        
        const client = pollingClients.get(clientId)!;
        client.auctionIds.add(parseInt(auctionId));
        client.lastUpdate = Date.now();
        
        console.log(`� HTTP Poll Subscribe: Client ${clientId} subscribed to auction ${auctionId}`);
        
        return res.status(200).json({ 
            success: true, 
            message: 'Subscribed successfully',
            clientId,
            auctionId: parseInt(auctionId)
        });
        
    } catch (error) {
        console.error('❌ HTTP Subscribe Error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

function handleUnsubscribe(req: NextApiRequest, res: NextApiResponse, clientId: string) {
    try {
        if (pollingClients.has(clientId)) {
            pollingClients.delete(clientId);
            console.log(`📋 HTTP Poll Unsubscribe: Client ${clientId} unsubscribed`);
        }
        
        return res.status(200).json({ 
            success: true, 
            message: 'Unsubscribed successfully'
        });
        
    } catch (error) {
        console.error('❌ HTTP Unsubscribe Error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Set CORS headers for ngrok compatibility
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, ngrok-skip-browser-warning');
    res.setHeader('Access-Control-Max-Age', '86400');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const { action, auctionId, clientId } = req.query;
    
    console.log(`� HTTP Polling API: ${action} request for auction ${auctionId}, client ${clientId}`);
    
    try {
        switch (action) {
            case 'poll':
                await handlePoll(req, res, auctionId as string, clientId as string);
                break;
            case 'update':
                return handleUpdate(req, res);
            case 'subscribe':
                return handleSubscribe(req, res, auctionId as string, clientId as string);
            case 'unsubscribe':
                return handleUnsubscribe(req, res, clientId as string);
            default:
                return res.status(400).json({ success: false, error: 'Invalid action' });
        }
    } catch (error) {
        console.error('❌ HTTP Polling API Error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}