import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import HttpPollingClient from '../services/http-polling-client';
import { getServerBaseUrl, getWebSocketUrl } from '../lib/server-url';

export type ConnectionStatus = 'connecting' | 'connected' | 'failed' | 'fallback' | 'manual';
export type TransportType = 'websocket' | 'polling' | 'http' | 'none';

export interface WebSocketConnectionResult {
    status: ConnectionStatus;
    transport: TransportType;
    socketId: string | null;
    error: string | null;
    reconnect: () => void;
    disconnect: () => void;
}

export function useWebSocketConnection(
    selectedItem: any,
    onBidUpdate: (data: { auctionId: number, newBid: number, bidder: string }) => void,
    onAuctionFinalized: (data: { auctionId: number, finalPrice: number, winnerId: string }) => void
): WebSocketConnectionResult {
    const [status, setStatus] = useState<ConnectionStatus>('connecting');
    const [transport, setTransport] = useState<TransportType>('none');
    const [socketId, setSocketId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const socketRef = useRef<Socket | null>(null);
    const httpClientRef = useRef<HttpPollingClient | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isConnectingRef = useRef<boolean>(false);
    const connectionAttemptsRef = useRef<number>(0);
    const maxConnectionAttempts = 5;

    const generateClientId = (): string => {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };

    const detectEnvironment = (): { isLocalhost: boolean; isNgrok: boolean } => {
        const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '';
        const isNgrok = hostname.includes('ngrok');
        return { isLocalhost, isNgrok };
    };

    const attemptSocketIOConnection = async (): Promise<boolean> => {
        return new Promise((resolve) => {
            try {
                const { isLocalhost, isNgrok } = detectEnvironment();
                const clientId = generateClientId();
                
                // COMPLETELY SKIP Socket.IO for ngrok environments
                if (isNgrok) {
                    console.log(`🚫 Skipping Socket.IO for ngrok environment - using HTTP polling only`);
                    setError('Socket.IO disabled for ngrok - will use HTTP polling');
                    resolve(false);
                    return;
                }
                
                console.log(`🚀 Attempting Socket.IO connection (attempt ${connectionAttemptsRef.current + 1}/${maxConnectionAttempts})`);
                console.log(`🌐 Environment: ${isLocalhost ? 'localhost' : 'remote'}`);
                
                // Determine server URL
                let serverUrl: string | undefined;
                if (isLocalhost) {
                    serverUrl = 'http://localhost:5500';
                } else {
                    // Use dynamic server URL detection for remote environments
                    serverUrl = getServerBaseUrl();
                }

                const socket = io(serverUrl, {
                    transports: ['websocket', 'polling'],
                    timeout: 20000,
                    forceNew: true,
                    reconnection: true,
                    reconnectionAttempts: 10,
                    reconnectionDelay: 3000,
                    reconnectionDelayMax: 10000,
                    randomizationFactor: 0.5
                });

                socket.on('connect', () => {
                    console.log(`✅ Socket.IO connected successfully`);
                    console.log(`   Socket ID: ${socket.id}`);
                    console.log(`   Transport: ${socket.io.engine.transport.name}`);
                    
                    setStatus('connected');
                    setTransport(socket.io.engine.transport.name as TransportType);
                    setSocketId(socket.id || null);
                    setError(null);
                    connectionAttemptsRef.current = 0;
                    
                    if (selectedItem) {
                        console.log(`📡 Joining auction room: ${selectedItem.id}`);
                        socket.emit('join_auction', selectedItem.id);
                    }
                    
                    resolve(true);
                });

                socket.on('connect_error', (err) => {
                    console.error(`❌ Socket.IO connection error:`, err.message);
                    console.error(`   Transport: ${socket.io.engine.transport.name}`);
                    
                    setError(`Socket.IO connection failed: ${err.message}`);
                    socket.disconnect();
                    resolve(false);
                });

                socket.on('disconnect', (reason) => {
                    console.log(`🔌 Socket.IO disconnected: ${reason}`);
                    if (reason === 'io server disconnect') {
                        // Server forcefully disconnected, try to reconnect
                        setTimeout(() => {
                            if (socketRef.current === socket) {
                                socket.connect();
                            }
                        }, 1000);
                    }
                });

                socket.on('bid_update', (data) => {
                    console.log(`🎯 Received bid update via Socket.IO: ${data.newBid}π by ${data.bidder}`);
                    onBidUpdate(data);
                });

                socket.on('auction_finalized', (data) => {
                    console.log(`🏁 Received auction finalized via Socket.IO: Auction ${data.auctionId}`);
                    onAuctionFinalized(data);
                });

                // Set timeout for connection attempt
                setTimeout(() => {
                    if (socket.connected) return;
                    
                    console.log(`⏱️  Socket.IO connection timeout after 20 seconds`);
                    socket.disconnect();
                    setError('Socket.IO connection timeout');
                    resolve(false);
                }, 20000);

                socketRef.current = socket;
                
            } catch (error) {
                console.error(`❌ Socket.IO setup error:`, error);
                setError(`Socket.IO setup failed: ${error}`);
                resolve(false);
            }
        });
    };

    const attemptHttpPollingConnection = async (): Promise<boolean> => {
        try {
            const { isNgrok } = detectEnvironment();
            const clientId = generateClientId();
            
            console.log(`🔄 Attempting HTTP polling connection`);
            
            // Determine base URL
            let baseUrl: string;
            if (isNgrok) {
                baseUrl = getServerBaseUrl();
            } else {
                baseUrl = 'http://localhost:5500';
            }

            const httpClient = new HttpPollingClient(
                baseUrl,
                selectedItem?.id || 1,
                clientId,
                3000 // 3 second polling interval
            );

            httpClient.on('bid_update', (data) => {
                console.log(`🎯 Received bid update via HTTP polling: ${data.newBid}π by ${data.bidder}`);
                onBidUpdate(data);
            });

            httpClient.on('auction_finalized', (data) => {
                console.log(`🏁 Received auction finalized via HTTP polling: Auction ${data.auctionId}`);
                onAuctionFinalized(data);
            });

            httpClient.on('error', (err) => {
                console.error(`❌ HTTP polling error:`, err);
                setError(`HTTP polling error: ${err.message}`);
            });

            await httpClient.start();
            
            console.log(`✅ HTTP polling connected successfully`);
            setStatus('fallback');
            setTransport('http');
            setSocketId(clientId);
            setError(null);
            
            httpClientRef.current = httpClient;
            return true;
            
        } catch (error) {
            console.error(`❌ HTTP polling setup error:`, error);
            setError(`HTTP polling setup failed: ${error}`);
            return false;
        }
    };

    const attemptConnection = async (): Promise<void> => {
        if (isConnectingRef.current) {
            console.log('⚠️  Connection already in progress, skipping...');
            return;
        }

        isConnectingRef.current = true;
        connectionAttemptsRef.current++;
        
        try {
            setStatus('connecting');
            setError(null);
            
            const { isLocalhost, isNgrok } = detectEnvironment();
            
            // For ngrok environments, go straight to HTTP polling
            if (isNgrok) {
                console.log(`🚀 Ngrok detected - using HTTP polling directly`);
                const httpConnected = await attemptHttpPollingConnection();
                
                if (httpConnected) {
                    console.log('✅ Successfully connected via HTTP polling (ngrok)');
                    return;
                }
                
                console.log('❌ HTTP polling failed for ngrok');
                setStatus('failed');
                setError('Unable to establish HTTP polling connection through ngrok.');
                return;
            }
            
            // For localhost environments, try Socket.IO first
            console.log(`🚀 Attempting connection strategy ${connectionAttemptsRef.current}: Socket.IO`);
            const socketIOConnected = await attemptSocketIOConnection();
            
            if (socketIOConnected) {
                console.log('✅ Successfully connected via Socket.IO');
                return;
            }
            
            // If Socket.IO fails, try HTTP polling
            console.log('🔄 Socket.IO failed, trying HTTP polling fallback');
            const httpConnected = await attemptHttpPollingConnection();
            
            if (httpConnected) {
                console.log('✅ Successfully connected via HTTP polling');
                return;
            }
            
            // If both fail, set status to failed
            console.log('❌ All connection strategies failed');
            setStatus('failed');
            setError('Unable to establish real-time connection. Please refresh the page.');
            
            // If we haven't exceeded max attempts, retry after delay
            if (connectionAttemptsRef.current < maxConnectionAttempts) {
                const delay = Math.min(1000 * Math.pow(2, connectionAttemptsRef.current), 30000);
                console.log(`⏱️  Retrying connection in ${delay}ms (attempt ${connectionAttemptsRef.current + 1}/${maxConnectionAttempts})`);
                
                reconnectTimeoutRef.current = setTimeout(() => {
                    attemptConnection();
                }, delay);
            }
            
        } catch (error) {
            console.error('❌ Connection attempt error:', error);
            setStatus('failed');
            setError(`Connection attempt failed: ${error}`);
        } finally {
            isConnectingRef.current = false;
        }
    };

    const reconnect = (): void => {
        console.log('🔄 Manual reconnection requested');
        connectionAttemptsRef.current = 0;
        
        // Clear any existing reconnection timeout
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        
        // Disconnect existing connections
        disconnect();
        
        // Attempt new connection
        setTimeout(() => {
            attemptConnection();
        }, 1000);
    };

    const disconnect = (): void => {
        console.log('🔌 Disconnecting all connections');
        
        // Clear reconnection timeout
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        
        // Disconnect Socket.IO
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        
        // Stop HTTP polling
        if (httpClientRef.current) {
            httpClientRef.current.stop();
            httpClientRef.current = null;
        }
        
        setStatus('connecting');
        setTransport('none');
        setSocketId(null);
        setError(null);
    };

    // Effect for handling selectedItem changes
    useEffect(() => {
        if (!selectedItem) return;
        
        console.log(`🔄 Selected item changed to auction ${selectedItem.id}`);
        
        // Update Socket.IO room
        if (socketRef.current && socketRef.current.connected) {
            console.log(`📡 Rejoining auction room: ${selectedItem.id}`);
            socketRef.current.emit('join_auction', selectedItem.id);
        }
        
        // Update HTTP polling client
        if (httpClientRef.current && status === 'fallback') {
            console.log(`🔄 Restarting HTTP polling for auction ${selectedItem.id}`);
            httpClientRef.current.stop().then(() => {
                const newClient = new HttpPollingClient(
                    httpClientRef.current ? (httpClientRef.current as any).baseUrl : 'http://localhost:5500',
                    selectedItem.id,
                    generateClientId(),
                    3000
                );
                
                // Copy event listeners
                newClient.on('bid_update', onBidUpdate);
                newClient.on('auction_finalized', onAuctionFinalized);
                
                httpClientRef.current = newClient;
                return newClient.start();
            }).catch(error => {
                console.error('❌ Failed to restart HTTP polling:', error);
            });
        }
    }, [selectedItem?.id]);

    // Initial connection effect
    useEffect(() => {
        attemptConnection();
        
        return () => {
            console.log('🧹 Cleaning up WebSocket connection');
            disconnect();
        };
    }, []); // Only run once on mount

    return {
        status,
        transport,
        socketId,
        error,
        reconnect,
        disconnect
    };
}