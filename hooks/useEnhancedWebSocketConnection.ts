/**
 * 🔄 ENHANCED WEBSOCKET CONNECTION HOOK - Fixes intermittent real-time updates
 * Provides robust connection management with better reliability and error recovery
 */

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import EnhancedHttpPollingClient from '../services/enhanced-http-polling-client';
import { getServerBaseUrl, getWebSocketUrl } from '../lib/server-url';

export type ConnectionStatus = 'connecting' | 'connected' | 'failed' | 'fallback' | 'manual' | 'reconnecting';
export type TransportType = 'websocket' | 'polling' | 'http' | 'none';

export interface EnhancedWebSocketConnectionResult {
    status: ConnectionStatus;
    transport: TransportType;
    socketId: string | null;
    error: string | null;
    reconnect: () => void;
    disconnect: () => void;
    connectionStats: {
        totalUpdates: number;
        lastUpdateTime: number | null;
        connectionStartTime: number;
        transportChanges: number;
    };
}

export function useEnhancedWebSocketConnection(
    selectedItem: any,
    onBidUpdate: (data: { auctionId: number, newBid: number, bidder: string }) => void,
    onAuctionFinalized: (data: { auctionId: number, finalPrice: number, winnerId: string }) => void
): EnhancedWebSocketConnectionResult {
    const [status, setStatus] = useState<ConnectionStatus>('connecting');
    const [transport, setTransport] = useState<TransportType>('none');
    const [socketId, setSocketId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [connectionStats, setConnectionStats] = useState({
        totalUpdates: 0,
        lastUpdateTime: null as number | null,
        connectionStartTime: Date.now(),
        transportChanges: 0
    });
    
    const socketRef = useRef<Socket | null>(null);
    const httpClientRef = useRef<EnhancedHttpPollingClient | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isConnectingRef = useRef<boolean>(false);
    const connectionAttemptsRef = useRef<number>(0);
    const maxConnectionAttempts = 10;
    const totalUpdatesRef = useRef<number>(0);

    const generateClientId = (): string => {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };

    const detectEnvironment = (): { isLocalhost: boolean; isNgrok: boolean } => {
        const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '';
        const isNgrok = hostname.includes('ngrok');
        return { isLocalhost, isNgrok };
    };

    const handleBidUpdate = (data: any) => {
        console.log(`🎯 Enhanced bid update received:`, data);
        totalUpdatesRef.current++;
        setConnectionStats(prev => ({
            ...prev,
            totalUpdates: totalUpdatesRef.current,
            lastUpdateTime: Date.now()
        }));
        onBidUpdate(data);
    };

    const handleAuctionFinalized = (data: any) => {
        console.log(`🏁 Enhanced auction finalized received:`, data);
        onAuctionFinalized(data);
    };

    const attemptSocketIOConnection = async (): Promise<boolean> => {
        return new Promise((resolve) => {
            try {
                const { isLocalhost, isNgrok } = detectEnvironment();
                const clientId = generateClientId();
                
                // COMPLETELY SKIP Socket.IO for ngrok environments
                if (isNgrok) {
                    console.log(`🚫 Skipping Socket.IO for ngrok environment - using enhanced HTTP polling only`);
                    setError('Socket.IO disabled for ngrok - will use enhanced HTTP polling');
                    resolve(false);
                    return;
                }
                
                console.log(`🚀 Attempting enhanced Socket.IO connection (attempt ${connectionAttemptsRef.current + 1}/${maxConnectionAttempts})`);
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
                    reconnectionAttempts: 15, // Increased from 10
                    reconnectionDelay: 2000, // Reduced from 3000ms
                    reconnectionDelayMax: 8000, // Reduced from 10000ms
                    randomizationFactor: 0.3 // Reduced from 0.5
                });

                socket.on('connect', () => {
                    console.log(`✅ Enhanced Socket.IO connected successfully`);
                    console.log(`   Socket ID: ${socket.id}`);
                    console.log(`   Transport: ${socket.io.engine.transport.name}`);
                    
                    setStatus('connected');
                    setTransport(socket.io.engine.transport.name as TransportType);
                    setSocketId(socket.id || null);
                    setError(null);
                    connectionAttemptsRef.current = 0;
                    
                    if (selectedItem) {
                        console.log(`📡 Joining enhanced auction room: ${selectedItem.id}`);
                        socket.emit('join_auction', selectedItem.id);
                    }
                    
                    resolve(true);
                });

                socket.on('disconnect', (reason) => {
                    console.log(`🔌 Enhanced Socket.IO disconnected: ${reason}`);
                    setStatus('reconnecting');
                    setTransport('none');
                    setSocketId(null);
                });

                socket.on('connect_error', (error) => {
                    console.error(`❌ Enhanced Socket.IO connection error:`, error.message);
                    setError(`Socket.IO error: ${error.message}`);
                    resolve(false);
                });

                socket.on('bid_update', handleBidUpdate);
                socket.on('auction_finalized', handleAuctionFinalized);

                socket.on('reconnect_attempt', (attemptNumber) => {
                    console.log(`🔄 Enhanced Socket.IO reconnection attempt ${attemptNumber}`);
                    setStatus('reconnecting');
                });

                socket.on('reconnect', (attemptNumber) => {
                    console.log(`✅ Enhanced Socket.IO reconnected after ${attemptNumber} attempts`);
                    setStatus('connected');
                    setTransport(socket.io.engine.transport.name as TransportType);
                    setSocketId(socket.id || null);
                    setError(null);
                    
                    if (selectedItem) {
                        socket.emit('join_auction', selectedItem.id);
                    }
                });

                socket.on('reconnect_failed', () => {
                    console.error(`🚨 Enhanced Socket.IO reconnection failed after ${connectionAttemptsRef.current} attempts`);
                    setError('Enhanced Socket.IO reconnection failed');
                    resolve(false);
                });

                // Store socket reference
                socketRef.current = socket;
                
                // Set a timeout for connection
                setTimeout(() => {
                    if (socket && !socket.connected) {
                        console.log(`⏱️ Enhanced Socket.IO connection timeout`);
                        socket.disconnect();
                        resolve(false);
                    }
                }, 15000); // Reduced from 20000ms

            } catch (error) {
                console.error(`❌ Enhanced Socket.IO setup error:`, error);
                setError(`Enhanced Socket.IO setup error: ${error}`);
                resolve(false);
            }
        });
    };

    const attemptHttpPollingConnection = async (): Promise<boolean> => {
        try {
            const { isNgrok } = detectEnvironment();
            const clientId = generateClientId();
            
            console.log(`🔄 Attempting enhanced HTTP polling connection`);
            
            // Determine base URL
            let baseUrl: string;
            if (isNgrok) {
                baseUrl = getServerBaseUrl();
            } else {
                baseUrl = 'http://localhost:5500';
            }

            const httpClient = new EnhancedHttpPollingClient(
                baseUrl,
                selectedItem?.id || 1,
                clientId,
                2500 // Reduced from 3000ms for better responsiveness
            );

            httpClient.on('bid_update', (data) => {
                console.log(`🎯 Received bid update via enhanced HTTP polling: ${data.newBid}π by ${data.bidder}`);
                handleBidUpdate(data);
            });

            httpClient.on('auction_finalized', (data) => {
                console.log(`🏁 Received auction finalized via enhanced HTTP polling: Auction ${data.auctionId}`);
                handleAuctionFinalized(data);
            });

            httpClient.on('error', (err) => {
                console.error(`❌ Enhanced HTTP polling error:`, err);
                setError(`Enhanced HTTP polling error: ${err.message}`);
            });

            await httpClient.start();
            
            console.log(`✅ Enhanced HTTP polling connected successfully`);
            setStatus('fallback');
            setTransport('http');
            setSocketId(clientId);
            setError(null);
            
            httpClientRef.current = httpClient;
            
            return true;
            
        } catch (error) {
            console.error(`❌ Enhanced HTTP polling setup error:`, error);
            setError(`Enhanced HTTP polling setup failed: ${error}`);
            return false;
        }
    };

    const attemptConnection = async (): Promise<void> => {
        if (isConnectingRef.current) {
            console.log('⚠️  Enhanced connection already in progress, skipping...');
            return;
        }

        isConnectingRef.current = true;
        connectionAttemptsRef.current++;
        
        try {
            setStatus('connecting');
            setError(null);
            
            const { isLocalhost, isNgrok } = detectEnvironment();
            
            // For ngrok environments, go straight to enhanced HTTP polling
            if (isNgrok) {
                console.log(`🚀 Ngrok detected - using enhanced HTTP polling directly`);
                const httpConnected = await attemptHttpPollingConnection();
                
                if (httpConnected) {
                    console.log('✅ Successfully connected via enhanced HTTP polling (ngrok)');
                    return;
                }
                
                console.log('❌ Enhanced HTTP polling failed for ngrok');
                setStatus('failed');
                setError('Unable to establish enhanced HTTP polling connection through ngrok.');
                return;
            }
            
            // For localhost environments, try enhanced Socket.IO first
            console.log(`🚀 Attempting connection strategy ${connectionAttemptsRef.current}: Enhanced Socket.IO`);
            const socketIOConnected = await attemptSocketIOConnection();
            
            if (socketIOConnected) {
                console.log('✅ Successfully connected via enhanced Socket.IO');
                return;
            }
            
            // If enhanced Socket.IO fails, try enhanced HTTP polling
            console.log('🔄 Enhanced Socket.IO failed, trying enhanced HTTP polling fallback');
            const httpConnected = await attemptHttpPollingConnection();
            
            if (httpConnected) {
                console.log('✅ Successfully connected via enhanced HTTP polling');
                return;
            }
            
            // If both fail, set status to failed
            console.log('❌ All enhanced connection strategies failed');
            setStatus('failed');
            setError('Unable to establish enhanced real-time connection. Please refresh the page.');
            
            // If we haven't exceeded max attempts, retry after delay
            if (connectionAttemptsRef.current < maxConnectionAttempts) {
                const delay = Math.min(1000 * Math.pow(1.5, connectionAttemptsRef.current), 20000); // Reduced max delay
                console.log(`⏱️  Retrying enhanced connection in ${delay}ms (attempt ${connectionAttemptsRef.current + 1}/${maxConnectionAttempts})`);
                
                reconnectTimeoutRef.current = setTimeout(() => {
                    attemptConnection();
                }, delay);
            }
            
        } catch (error) {
            console.error('❌ Enhanced connection attempt error:', error);
            setStatus('failed');
            setError(`Enhanced connection attempt failed: ${error}`);
        } finally {
            isConnectingRef.current = false;
        }
    };

    const reconnect = (): void => {
        console.log('🔄 Manual enhanced reconnection requested');
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
        }, 500); // Reduced from 1000ms
    };

    const disconnect = (): void => {
        console.log('🔌 Disconnecting enhanced real-time connection');
        
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
        
        setStatus('manual');
        setTransport('none');
        setSocketId(null);
    };

    useEffect(() => {
        console.log('🚀 Starting enhanced real-time connection setup');
        attemptConnection();
        
        return () => {
            console.log('🧹 Cleaning up enhanced real-time connection');
            disconnect();
        };
    }, [selectedItem?.id]);

    return {
        status,
        transport,
        socketId,
        error,
        reconnect,
        disconnect,
        connectionStats
    };
}