/**
 * 🔄 ENHANCED HTTP POLLING CLIENT - Fixes intermittent real-time updates
 * Provides robust HTTP polling with better reliability and error recovery
 */

export class EnhancedHttpPollingClient {
    private baseUrl: string;
    private auctionId: number;
    private clientId: string;
    private pollingInterval: number;
    private isPolling: boolean = false;
    private listeners: Map<string, Function[]> = new Map();
    private lastPollTime: number = 0;
    private consecutiveFailures: number = 0;
    private maxConsecutiveFailures: number = 15; // Increased from 10
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 10;
    private pollTimeout: NodeJS.Timeout | null = null;

    constructor(baseUrl: string, auctionId: number, clientId: string, pollingInterval: number = 2500) { // Reduced from 3000ms
        this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
        this.auctionId = auctionId;
        this.clientId = clientId;
        this.pollingInterval = pollingInterval;
        
        // Generate unique client ID if not provided
        if (!this.clientId) {
            this.clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
    }

    async start(): Promise<void> {
        if (this.isPolling) {
            console.log('⚠️  HTTP polling already running');
            return;
        }

        console.log(`🔄 Starting ENHANCED HTTP polling for auction ${this.auctionId}`);
        this.isPolling = true;
        this.consecutiveFailures = 0;
        this.reconnectAttempts = 0;
        
        try {
            await this.subscribe();
            this.startHeartbeat();
            this.pollLoop();
        } catch (error) {
            console.error('❌ Failed to start enhanced HTTP polling:', error);
            this.isPolling = false;
            throw error;
        }
    }

    async stop(): Promise<void> {
        if (!this.isPolling) {
            console.log('⚠️  HTTP polling not running');
            return;
        }

        console.log(`🛑 Stopping ENHANCED HTTP polling for auction ${this.auctionId}`);
        this.isPolling = false;
        
        // Clear all intervals and timeouts
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        
        if (this.pollTimeout) {
            clearTimeout(this.pollTimeout);
            this.pollTimeout = null;
        }
        
        try {
            await this.unsubscribe();
        } catch (error) {
            console.warn('⚠️  Error during unsubscribe (non-critical):', error);
        }
        
        this.emit('stopped');
    }

    private startHeartbeat(): void {
        // Send heartbeat every 30 seconds to keep connection alive
        this.heartbeatInterval = setInterval(() => {
            if (this.isPolling) {
                this.sendHeartbeat();
            }
        }, 30000);
    }

    private async sendHeartbeat(): Promise<void> {
        // Use existing poll endpoint for heartbeat - just check connection
        const url = `${this.baseUrl}/api/http-poll?action=poll&auctionId=${this.auctionId}&clientId=${this.clientId}`;
        
        try {
            const response = await fetch(url, {
                method: 'GET', // Use GET instead of POST for poll endpoint
                headers: {
                    'ngrok-skip-browser-warning': 'true',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            if (response.ok) {
                console.log(`💓 Heartbeat sent successfully`);
            } else {
                console.warn(`⚠️  Heartbeat returned ${response.status} (non-critical)`);
            }
        } catch (error) {
            console.warn('⚠️  Heartbeat failed (non-critical):', error);
        }
    }

    on(event: string, callback: Function): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(callback);
    }

    private emit(event: string, data?: any): void {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(callback => callback(data));
        }
    }

    private async subscribe(): Promise<void> {
        const url = `${this.baseUrl}/api/http-poll?action=subscribe&auctionId=${this.auctionId}&clientId=${this.clientId}`;
        
        try {
            console.log(`📋 Subscribing to enhanced HTTP polling for auction ${this.auctionId}`);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                body: JSON.stringify({ auctionId: this.auctionId, clientId: this.clientId })
            });

            if (!response.ok) {
                throw new Error(`HTTP subscribe failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`✅ Successfully subscribed to enhanced HTTP polling for auction ${this.auctionId}:`, data);
            
        } catch (error) {
            console.error(`❌ Failed to subscribe to enhanced HTTP polling for auction ${this.auctionId}:`, error);
            throw error;
        }
    }

    private async unsubscribe(): Promise<void> {
        const url = `${this.baseUrl}/api/http-poll?action=unsubscribe&clientId=${this.clientId}`;
        
        try {
            console.log(`📋 Unsubscribing from enhanced HTTP polling`);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (!response.ok) {
                console.warn(`HTTP unsubscribe warning: ${response.status} ${response.statusText}`);
            } else {
                const data = await response.json();
                console.log(`✅ Successfully unsubscribed from enhanced HTTP polling:`, data);
            }
            
        } catch (error) {
            console.error(`❌ Failed to unsubscribe from enhanced HTTP polling:`, error);
            // Don't throw - cleanup should be silent
        }
    }

    private async poll(): Promise<void> {
        const url = `${this.baseUrl}/api/http-poll?action=poll&auctionId=${this.auctionId}&clientId=${this.clientId}`;
        
        try {
            console.log(`📡 Starting enhanced long poll for auction ${this.auctionId} (max 30s)`);
            const pollStart = Date.now();
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'ngrok-skip-browser-warning': 'true',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                // Set timeout for long polling - slightly longer than server timeout
                signal: AbortSignal.timeout(35000) // 35 second timeout (server uses 25s)
            });

            const pollDuration = Date.now() - pollStart;
            console.log(`📡 Enhanced long poll completed after ${pollDuration}ms`);

            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`⚠️  Enhanced HTTP polling endpoint not found (404) - server may not support enhanced HTTP polling`);
                    this.emit('error', new Error('Enhanced HTTP polling not supported by server'));
                    return;
                }
                throw new Error(`Enhanced HTTP poll failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success) {
                this.consecutiveFailures = 0; // Reset failure counter
                
                if (data.updates && data.updates.length > 0) {
                    console.log(`🎯 Received ${data.updates.length} updates via enhanced HTTP polling`);
                    
                    data.updates.forEach((update: any) => {
                        this.emit(update.type || 'bid_update', update);
                    });
                } else {
                    console.log(`📡 No updates received during enhanced long poll`);
                }
                
                this.lastPollTime = Date.now();
            } else {
                console.warn(`⚠️  Enhanced HTTP poll returned non-success:`, data);
            }
            
        } catch (error) {
            this.consecutiveFailures++;
            
            if (error.name === 'AbortError') {
                console.log(`⏱️  Enhanced HTTP poll timeout after ~35s (expected for long polling)`);
            } else {
                console.error(`❌ Enhanced HTTP poll error (attempt ${this.consecutiveFailures}/${this.maxConsecutiveFailures}):`, error);
                
                if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
                    console.error(`🚨 Maximum consecutive failures reached (${this.maxConsecutiveFailures}). Stopping enhanced polling.`);
                    this.emit('error', new Error('Maximum consecutive enhanced polling failures reached'));
                    this.isPolling = false;
                    return;
                }
            }
        }
    }

    private pollLoop = async (): Promise<void> => {
        while (this.isPolling) {
            try {
                await this.poll();
                
                // Wait before next poll (unless we're stopping)
                if (this.isPolling) {
                    // Use shorter polling interval for better responsiveness
                    const actualInterval = Math.max(this.pollingInterval, 1000); // Minimum 1 second
                    console.log(`⏱️  Waiting ${actualInterval}ms before next enhanced poll`);
                    await new Promise(resolve => setTimeout(resolve, actualInterval));
                }
                
            } catch (error) {
                console.error('❌ Error in enhanced poll loop:', error);
                
                // Wait before retrying (with exponential backoff)
                if (this.isPolling) {
                    const backoffTime = Math.min(this.pollingInterval * Math.pow(1.5, this.consecutiveFailures), 15000); // Max 15 seconds
                    console.log(`⏱️  Waiting ${backoffTime}ms before retrying enhanced poll loop`);
                    await new Promise(resolve => setTimeout(resolve, backoffTime));
                }
            }
        }
    };

    getStatus(): { isPolling: boolean; consecutiveFailures: number; lastPollTime: number; reconnectAttempts: number } {
        return {
            isPolling: this.isPolling,
            consecutiveFailures: this.consecutiveFailures,
            lastPollTime: this.lastPollTime,
            reconnectAttempts: this.reconnectAttempts
        };
    }
}

export default EnhancedHttpPollingClient;