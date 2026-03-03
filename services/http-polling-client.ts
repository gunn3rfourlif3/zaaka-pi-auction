export class HttpPollingClient {
    private baseUrl: string;
    private auctionId: number;
    private clientId: string;
    private pollingInterval: number;
    private isPolling: boolean = false;
    private listeners: Map<string, Function[]> = new Map();
    private lastPollTime: number = 0;
    private consecutiveFailures: number = 0;
    private maxConsecutiveFailures: number = 10;

    constructor(baseUrl: string, auctionId: number, clientId: string, pollingInterval: number = 3000) {
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

        console.log(`🔄 Starting HTTP polling for auction ${this.auctionId}`);
        this.isPolling = true;
        this.consecutiveFailures = 0;
        
        try {
            await this.subscribe();
            this.pollLoop();
        } catch (error) {
            console.error('❌ Failed to start HTTP polling:', error);
            this.isPolling = false;
            throw error;
        }
    }

    async stop(): Promise<void> {
        if (!this.isPolling) {
            console.log('⚠️  HTTP polling not running');
            return;
        }

        console.log(`🛑 Stopping HTTP polling for auction ${this.auctionId}`);
        this.isPolling = false;
        
        try {
            await this.unsubscribe();
        } catch (error) {
            console.error('❌ Failed to unsubscribe from HTTP polling:', error);
        }
    }

    on(event: string, callback: Function): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(callback);
    }

    off(event: string, callback: Function): void {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event)!;
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    private emit(event: string, ...args: any[]): void {
        if (this.listeners.has(event)) {
            this.listeners.get(event)!.forEach(callback => {
                try {
                    callback(...args);
                } catch (error) {
                    console.error(`❌ Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    private async subscribe(): Promise<void> {
        const url = `${this.baseUrl}/api/http-poll?action=subscribe&auctionId=${this.auctionId}&clientId=${this.clientId}`;
        
        try {
            console.log(`📋 Subscribing to auction ${this.auctionId} via HTTP polling`);
            
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
            console.log(`✅ Successfully subscribed to auction ${this.auctionId}:`, data);
            
        } catch (error) {
            console.error(`❌ Failed to subscribe to auction ${this.auctionId}:`, error);
            throw error;
        }
    }

    private async unsubscribe(): Promise<void> {
        const url = `${this.baseUrl}/api/http-poll?action=unsubscribe&clientId=${this.clientId}`;
        
        try {
            console.log(`📋 Unsubscribing from HTTP polling`);
            
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
                console.log(`✅ Successfully unsubscribed:`, data);
            }
            
        } catch (error) {
            console.error(`❌ Failed to unsubscribe:`, error);
            // Don't throw - cleanup should be silent
        }
    }

    private async poll(): Promise<void> {
        const url = `${this.baseUrl}/api/http-poll?action=poll&auctionId=${this.auctionId}&clientId=${this.clientId}`;
        
        try {
            console.log(`📡 Starting long poll for auction ${this.auctionId} (max 30s)`);
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
            console.log(`📡 Long poll completed after ${pollDuration}ms`);

            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`⚠️  HTTP polling endpoint not found (404) - server may not support HTTP polling`);
                    this.emit('error', new Error('HTTP polling not supported by server'));
                    return;
                }
                throw new Error(`HTTP poll failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success) {
                this.consecutiveFailures = 0; // Reset failure counter
                
                if (data.updates && data.updates.length > 0) {
                    console.log(`🎯 Received ${data.updates.length} updates via HTTP polling`);
                    
                    data.updates.forEach((update: any) => {
                        this.emit(update.type || 'bid_update', update);
                    });
                } else {
                    console.log(`📡 No updates received during long poll`);
                }
                
                this.lastPollTime = Date.now();
            } else {
                console.warn(`⚠️  HTTP poll returned non-success:`, data);
            }
            
        } catch (error) {
            this.consecutiveFailures++;
            
            if (error.name === 'AbortError') {
                console.log(`⏱️  HTTP poll timeout after ~35s (expected for long polling)`);
            } else {
                console.error(`❌ HTTP poll error (attempt ${this.consecutiveFailures}/${this.maxConsecutiveFailures}):`, error);
                
                if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
                    console.error(`🚨 Maximum consecutive failures reached (${this.maxConsecutiveFailures}). Stopping polling.`);
                    this.emit('error', new Error('Maximum consecutive polling failures reached'));
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
                    await new Promise(resolve => setTimeout(resolve, this.pollingInterval));
                }
                
            } catch (error) {
                console.error('❌ Error in poll loop:', error);
                
                // Wait before retrying (with exponential backoff)
                if (this.isPolling) {
                    const backoffTime = Math.min(this.pollingInterval * Math.pow(2, this.consecutiveFailures), 30000);
                    console.log(`⏱️  Waiting ${backoffTime}ms before retrying poll loop`);
                    await new Promise(resolve => setTimeout(resolve, backoffTime));
                }
            }
        }
    };

    getStatus(): { isPolling: boolean; consecutiveFailures: number; lastPollTime: number } {
        return {
            isPolling: this.isPolling,
            consecutiveFailures: this.consecutiveFailures,
            lastPollTime: this.lastPollTime
        };
    }
}

export default HttpPollingClient;