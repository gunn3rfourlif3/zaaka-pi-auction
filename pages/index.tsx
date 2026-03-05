import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { MessageModal } from '../components/MessageModal';
import { useEnhancedWebSocketConnection } from '../hooks/useEnhancedWebSocketConnection';
import { EnhancedAuctionCreation } from '../components/EnhancedAuctionCreation';
import dynamic from 'next/dynamic';

const StandardAuctionCreation = dynamic(() => 
  import('../components/StandardAuctionCreation').then(mod => mod.StandardAuctionCreation), {
  loading: () => <div className="flex justify-center p-12"><RefreshCcw className="animate-spin text-gray-400" /></div>,
  ssr: false
});

import {

  Package, Camera, Gavel, RefreshCcw, X,

  Search, Bell, Timer, TrendingUp,

  ChevronRight, Wallet, Home, Trophy, Plus, Heart, MessageSquare, Check

} from 'lucide-react';



/* Update your AuctionTimer component at the top of index.tsx */
const AuctionTimer = ({ 
  expiryDate, 
  status, 
  onEnd 
}: { 
  expiryDate: string; 
  status?: string; 
  onEnd?: () => void; 
}) => {
  const [timeLeft, setTimeLeft] = useState("");
  const hasEndedCalled = React.useRef(false);

  useEffect(() => {
    const calculate = () => {
      if (!expiryDate || status !== 'OPEN') {
        setTimeLeft("AUCTION ENDED");
        return;
      }

      const expiry = new Date(expiryDate);
      if (isNaN(expiry.getTime())) {
        setTimeLeft("INVALID DATE");
        return;
      }

      const difference = expiry.getTime() - Date.now();
      
      if (difference <= 0) {
        setTimeLeft("AUCTION ENDED");
        if (onEnd && status === 'OPEN' && !hasEndedCalled.current) {
          hasEndedCalled.current = true;
          onEnd();
        }
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft(`${days > 0 ? days + 'd ' : ''}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    calculate(); // Initial call
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [expiryDate, onEnd, status]);

  return <span className="tabular-nums">{timeLeft}</span>;
};


export default function ZaakaDashboard() {

  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(false);

  const [isPaying, setIsPaying] = useState(false);

  const [user, setUser] = useState<{ username: string; uid: string } | null>(null);

  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [bidAmount, setBidAmount] = useState<string>('');
  const [maxBidAmount, setMaxBidAmount] = useState<string>('');

  const [isInitializing, setIsInitializing] = useState(false);

const [view, setView] = useState<'market' | 'inventory' | 'my-bids' | 'detail' | 'create'>('market');

const [watchlist, setWatchlist] = useState<number[]>([]);
  const [useStandardCreate, setUseStandardCreate] = useState(false);

  const [selectedMarketCategory, setSelectedMarketCategory] = useState('All');
  const [now, setNow] = useState(Date.now());
  const [isSocketReady, setIsSocketReady] = useState(false);

  useEffect(() => {
    if (view !== 'create') setUseStandardCreate(false);
  }, [view]);

  // Script tag for Socket.io client - ONLY for non-ngrok environments
  useEffect(() => {
    const isNgrok = typeof window !== 'undefined' && window.location.hostname.includes('ngrok');
    
    // No test scripts loaded in production
    
    // Load winner badge test for testing the Winning -> Winner change
    if (!document.getElementById('winner-badge-test')) {
        const winnerBadgeTestScript = document.createElement('script');
        winnerBadgeTestScript.id = 'winner-badge-test';
        winnerBadgeTestScript.src = '/winner-badge-test.js';
        winnerBadgeTestScript.onload = () => console.log("✅ Winner badge test loaded - test Winning -> Winner changes!");
        winnerBadgeTestScript.onerror = () => console.log("❌ Could not load winner badge test");
        document.body.appendChild(winnerBadgeTestScript);
    }

    // Load enhanced max bid test for testing improved Max Bid functionality
    if (!document.getElementById('enhanced-max-bid-test')) {
        const enhancedMaxBidTestScript = document.createElement('script');
        enhancedMaxBidTestScript.id = 'enhanced-max-bid-test';
        enhancedMaxBidTestScript.src = '/enhanced-max-bid-test.js';
        enhancedMaxBidTestScript.onload = () => console.log("✅ Enhanced Max Bid test loaded - test improved Max Bid validation and UI!");
        enhancedMaxBidTestScript.onerror = () => console.log("❌ Could not load enhanced max bid test");
        document.body.appendChild(enhancedMaxBidTestScript);
    }
    
    if (isNgrok) {
      console.log("🚫 Skipping Socket.IO client loading for ngrok environment");
      setIsSocketReady(true); // Mark as ready to bypass Socket.IO logic
      return; // This is valid - early return in useEffect
    }
    
    if (!document.getElementById('socket-io-script')) {
        const script = document.createElement('script');
        script.id = 'socket-io-script';
        
        // Load from CDN for localhost environments
        script.src = "https://cdn.socket.io/4.8.3/socket.io.min.js";
        script.async = true;
        script.onload = () => { 
            console.log("✅ Socket.io client loaded from CDN successfully");
            setIsSocketReady(true);
        };
        script.onerror = (err) => {
            console.error('❌ Failed to load Socket.IO client from CDN:', err);
            // Fallback: try to load from local server
            const fallbackScript = document.createElement('script');
            fallbackScript.id = 'socket-io-script-fallback';
            fallbackScript.src = "/socket.io/socket.io.js";
            fallbackScript.onload = () => {
                console.log("✅ Socket.io client loaded from local server");
                setIsSocketReady(true);
            };
            fallbackScript.onerror = (fallbackErr) => {
                console.error('❌ Failed to load Socket.IO client from fallback:', fallbackErr);
            };
            document.body.appendChild(fallbackScript);
        };
        document.body.appendChild(script);
    } else {
        // If script already exists, just set ready to true
        setIsSocketReady(true);
    }
  }, []);

  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [chatConfig, setChatConfig] = useState<{
    auctionId: number;
    otherUserId: string;
    otherUsername: string;
    itemTitle: string;
  } | null>(null);

  // --- Real-time Bid Updates (Multi-layered Fallback System) ---
  const handleBidUpdate = useCallback((data: { auctionId: number, newBid: number, bidder: string }) => {
    console.log(`🔔 Real-time Update: ${data.newBid} Pi by ${data.bidder}`);
    console.log(`📊 Update Data:`, data); // Debug: log the full data object
    
    // 1. Update Detail View
    setSelectedItem((prev: any) => {
      // Check ID (handle string/number mismatch)
      if(!prev || Number(prev.id) !== Number(data.auctionId)) {
        console.log(`⏭️  Skipping detail update - auction ID mismatch: ${prev?.id} vs ${data.auctionId}`);
        return prev;
      }
      
      // Strict check: Only return if the price is STRICTLY LOWER.
      if (data.newBid < Number(prev.currentBid)) {
        console.log(`⏭️  Skipping detail update - new bid (${data.newBid}) is lower than current (${prev.currentBid})`);
        return prev;
      }

      console.log(`✅ Updating Detail View for #${data.auctionId}: Bid ${data.newBid} by ${data.bidder}`);
      return {
        ...prev,
        currentBid: data.newBid,
        bids: [{ bidder_id: data.bidder, amount: data.newBid }, ...(prev.bids || [])],
        _count: { ...prev._count, bids: (prev._count?.bids || 0) + 1 }
      };
    });

    // 2. Update Market List
    setItems((prev) => {
      console.log(`📋 Updating market list - checking ${prev.length} items for auction #${data.auctionId}`);
      return prev.map((a: any) => {
        if (Number(a.id) === Number(data.auctionId)) {
          if (data.newBid < Number(a.currentBid)) {
            console.log(`⏭️  Skipping market update - new bid is lower`);
            return a;
          }
          console.log(`✅ Updating market item #${data.auctionId}: ${a.currentBid} → ${data.newBid}`);
          return { 
            ...a, 
            currentBid: data.newBid,
            bids: [{ bidder_id: data.bidder }, ...(a.bids || [])],
            _count: { ...a._count, bids: (a._count?.bids || 0) + 1 }
          };
        }
        return a;
      });
    });
  }, []);

  // Expose handleBidUpdate to window for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).handleBidUpdate = handleBidUpdate;
      console.log("✅ handleBidUpdate exposed to window for testing");
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).handleBidUpdate;
      }
    };
  }, [handleBidUpdate]);

  const handleAuctionFinalized = useCallback((data: { auctionId: number, finalPrice: number, winnerId: string }) => {
    console.log(`🏁 Auction Finalized: ${data.auctionId} won by ${data.winnerId} for ${data.finalPrice} Pi`);
    
    // Update auction status
    setItems((prevItems: any[]) => 
      prevItems.map(item => 
        item.id === data.auctionId 
          ? { ...item, status: 'CLOSED', finalPrice: data.finalPrice, winnerId: data.winnerId }
          : item
      )
    );

    // Update selected item if it's the same auction
    setSelectedItem((prev: any) => {
      if (prev && prev.id === data.auctionId) {
        return { ...prev, status: 'CLOSED', finalPrice: data.finalPrice, winnerId: data.winnerId };
      }
      return prev;
    });

    alert(`Auction ended! Winner: ${data.winnerId}`);
  }, []);

  const { status, transport, socketId, error, reconnect, connectionStats } = useEnhancedWebSocketConnection(
    selectedItem,
    handleBidUpdate,
    handleAuctionFinalized
  );

  // Connection status indicator
  useEffect(() => {
    console.log(`📡 Connection Status: ${status} (${transport})${socketId ? ` - ID: ${socketId}` : ''}${error ? ` - Error: ${error}` : ''}`);
    
    if (status === 'failed') {
      alert(`Real-time connection failed: ${error}. Please refresh the page.`);
    }
  }, [status, transport, socketId, error]);

  const handleOpenChat = (auctionId: number, otherUserId: string, otherUsername: string, itemTitle: string) => {
    setChatConfig({ auctionId, otherUserId, otherUsername, itemTitle });
    setIsMessageModalOpen(true);
  };

  const [isPiInitialized, setIsPiInitialized] = useState(false);

  const [showEnvWarning, setShowEnvWarning] = useState(false);

  // --- MOCK LOGIN FOR TESTING ---
  const handleMockLogin = () => {
    const mockUsername = prompt("Enter a mock username for testing (e.g. 'tester1'):");
    if (mockUsername) {
      setUser({ username: mockUsername, uid: `mock_${mockUsername}_uid` });
      // Clear any existing session data if needed
      alert(`Logged in as ${mockUsername} (Mock Mode)`);
    }
  };
  // ------------------------------

  const isPiSupportedEnv = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const isPiBrowser = typeof navigator !== 'undefined' && 
                       navigator.userAgent.toLowerCase().includes('pibrowser');
    const isInIframe = window.self !== window.parent;
    console.log(`[Pi Env Check] isPiBrowser: ${isPiBrowser}, isInIframe: ${isInIframe}`);
    return isPiBrowser || isInIframe;
  }, []);

  const categories = ['Fashion', 'Electronics', 'Collectibles', 'Home Goods', 'Vehicles', 'Comics', 'Art', 'Jewelry', 'Sports', 'Books'];

// const filteredItems = (items || [])
//   .filter((item: any) => item.status === 'OPEN') // Only show active auctions
//   .filter((item: any) => 
//     selectedMarketCategory === 'All' ? true : item.category === selectedMarketCategory
//   );
  
const filteredItems = items.filter(item => {
  const username = user?.username?.replace('@', '');
  const isSeller = username === item.seller_id;
  const isExpired = new Date(item.expires_at).getTime() <= now;
  const isClosed = item.status === 'CLOSED' || isExpired;
  const winningBid = item.bids?.[0];
  const isWinner = username === winningBid?.bidder_id;

  if (view === 'watchlist' as any) {
    return user && watchlist.includes(item.id);
  }

  if (view === 'my-bids') {
    // Show if: user has bid AND (auction is OPEN OR (user WON and NOT delivered))
    const userHasBid = item.bids?.some((b: any) => b.bidder_id === username);
    return userHasBid && (!isClosed || (isWinner && !item.delivered));
  }

  if (view === 'inventory') {
    // Show if: user is SELLER AND (auction is OPEN OR (auction is CLOSED and NOT delivered))
    return isSeller && (!isClosed || !item.delivered);
  }

  // Market view: Only show OPEN and NOT expired auctions
  return item.status === 'OPEN' && !isExpired && (selectedMarketCategory === 'All' ? true : item.category === selectedMarketCategory);
});

// --- LISTING CREATION LOGIC MOVED TO StandardAuctionCreation.tsx ---

useEffect(() => {
  const saved = localStorage.getItem('zaaka_watchlist');
  if (saved) setWatchlist(JSON.parse(saved));
}, []);

// Save Watchlist whenever it changes
useEffect(() => {
  if (user) {
    const saved = localStorage.getItem(`zaaka_watchlist_${user.uid}`);
    setWatchlist(saved ? JSON.parse(saved) : []);
  } else {
    setWatchlist([]); // Clear view if logged out
  }
}, [user]);

// Save Watchlist - Only when user and watchlist change
useEffect(() => {
  if (user) {
    localStorage.setItem(`zaaka_watchlist_${user.uid}`, JSON.stringify(watchlist));
  }
}, [watchlist, user]);

const toggleWatchlist = (e: React.MouseEvent, id: number) => {
  e.stopPropagation();
  e.preventDefault();

  if (!user) {
    alert("Please log in to manage your watchlist.");
    handleLogin();
    return;
  }

  setWatchlist(prev => 
    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
  );
};





const handleCancelAuction = async () => {

  if (!selectedItem || !user) return;

 

  const confirmCancel = confirm("Are you sure you want to cancel this auction? It will be removed from the marketplace.");

  if (!confirmCancel) return;



  setLoading(true);

  try {

    const res = await fetch('/api/auctions/status', {

      method: 'PATCH',

      headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify({

        id: selectedItem.id,

        sellerId: user.username.replace('@', ''),

        status: 'CANCELLED'

      })

    });



    if (res.ok) {

      alert("Auction successfully cancelled.");

      setSelectedItem(null);

      setView('inventory'); // Take them back to their inventory

      fetchItems(); // Refresh the data

    } else {

      const err = await res.json();

      alert(err.error || "Failed to cancel auction.");

    }

  } catch (error) {

    console.error("Cancel error:", error);

    alert("An error occurred while cancelling the auction.");

  } finally {

    setLoading(false);

  }

};





const getTimeRemaining = (expiryDate: string) => {

  const total = Date.parse(expiryDate) - Date.parse(new Date().toString());

  if (total <= 0) return "EXPIRED";



  const seconds = Math.floor((total / 1000) % 60);

  const minutes = Math.floor((total / 1000 / 60) % 60);

  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);

  const days = Math.floor(total / (1000 * 60 * 60 * 24));



  return `${days > 0 ? days + 'd ' : ''}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

};

  // 1. DATA FETCHING (Using include: images from backend)

  const fetchItems = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const activeUser = user?.username?.replace('@', '') || "guest";
    try {
      const endpoint = (view === 'market' || view === 'my-bids')
        ? '/api/auctions/live'
        : `/api/seller/items?sellerId=${activeUser}`;
       
      const res = await fetch(endpoint, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      const data = await res.json();
     
      if (Array.isArray(data)) {
        setItems(data);
        
        // SYNC SELECTED ITEM IF OPEN
        // If we are currently viewing an item, update its local state from the fresh batch
        // to ensure we have the latest bidder info which might be missing from partial socket updates
        if (view === 'detail' && selectedItem) {
             const freshItem = data.find((i: any) => i.id === selectedItem.id);
             if (freshItem) {
                 // Only update if freshItem has MORE recent info (higher bid)
                 // or if we are just syncing identical states.
                 // We avoid overwriting if local state is somehow ahead (race condition protection)
                 if (Number(freshItem.currentBid) >= Number(selectedItem.currentBid)) {
                     setSelectedItem((prev: any) => ({ ...prev, ...freshItem }));
                 }
             }
        }

      } else {
        setItems([]);
      }
    } catch (err) {
      console.error("Fetch failed", err);
      setItems([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [view, user, selectedItem]); // Add selectedItem to dependencies to allow syncing

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Timer + Polling for robustness
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    // Poll every 5 seconds to catch missed updates
    const polling = setInterval(() => {
       if (view === 'market' || view === 'detail') fetchItems(true);
    }, 5000);

    return () => {
        clearInterval(timer);
        clearInterval(polling);
    };
  }, [view, fetchItems]);

  // Sync selectedItem with items updates (for polling consistency)
  useEffect(() => {
    if (view === 'detail' && selectedItem && items.length > 0) {
      const updated = items.find((i: any) => i.id === selectedItem.id);
      if (updated) {
         // Only update if there are material changes to avoid unnecessary re-renders
         if (updated.currentBid !== selectedItem.currentBid || 
             updated.status !== selectedItem.status || 
             updated.bids?.length !== selectedItem.bids?.length) {
             console.log("Syncing selectedItem with polled data");
             setSelectedItem((prev: any) => ({ ...prev, ...updated }));
         }
      }
    }
  }, [items, view]);



  // 2. AUTHENTICATION LOGIC

  useEffect(() => {
    // 0. GLOBAL ERROR LISTENER TO CAPTURE THE POSTMESSAGE SOURCE
    const handleGlobalError = (event: ErrorEvent | PromiseRejectionEvent) => {
      if (event instanceof ErrorEvent && event.message?.includes('postMessage')) {
        console.warn("Caught postMessage origin error. This usually means sandbox detection is mismatching with Pi Network's expectation.");
      }
    };
    window.addEventListener('error', handleGlobalError);
    return () => window.removeEventListener('error', handleGlobalError);
  }, []);

  useEffect(() => {
    const syncPi = async () => {
      if (typeof window === "undefined") return;

      console.log(`[Pi Handshake] Checking window.Pi... (hostname: ${window.location.hostname})`);
      
      if (!(window as any).Pi) {
        console.log("[Pi Handshake] Pi SDK script not yet detected in window object.");
        return;
      }

      if (isPiInitialized) {
        console.log("[Pi Handshake] Pi SDK is already initialized. Skipping redundant init.");
        return;
      }

      try {
        const Pi = (window as any).Pi;
        
        const isPiBrowser = typeof navigator !== 'undefined' && 
                           navigator.userAgent.toLowerCase().includes('pibrowser');
        const isInIframe = window.self !== window.parent;

        // FINAL GUARD: If we are not in the Pi Browser OR an iframe (Sandbox), do not initialize.
        if (!isPiSupportedEnv()) {
          console.warn("[Pi Handshake] Environment check failed. Pi SDK will not be initialized to prevent origin errors.");
          setShowEnvWarning(true);
          setIsPiInitialized(true); 
          return;
        }

        const isSandbox = !isPiBrowser && isInIframe;

        console.log(`[Pi Handshake] Initializing SDK. Mode: ${isSandbox ? 'SANDBOX' : 'NETWORK'} (isPiBrowser: ${isPiBrowser}, isInIframe: ${isInIframe})`);

        await Pi.init({ version: "2.0", sandbox: isSandbox });
        setIsPiInitialized(true);
        console.log(`✅ [Pi Handshake] SUCCESS! Handshake successful with Pi ${isSandbox ? 'Sandbox' : 'Network'}`);
        
        // Give the SDK 500ms to stabilize the handshake before authenticating
        setTimeout(async () => {
          try {
            console.log("[Pi Handshake] Authenticating...");
            await Pi.authenticate(['username', 'payments'], async (payment: any) => {
              console.log("[Pi Handshake] Authenticated. Checking for incomplete payments...");
              try {
                const res = await fetch('/api/payments/incomplete', {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                  },
                  body: JSON.stringify({ payment })
                });
                
                if (res.ok) {
                  console.log("[Pi Handshake] Incomplete payment recovered on startup.");
                  fetchItems();
                } else {
                  console.error("[Pi Handshake] Startup recovery failed:", await res.json());
                }
              } catch (err) {
                console.error("[Pi Handshake] Incomplete payment recovery failed:", err);
              }
            });
          } catch (authErr: any) {
            console.error("❌ [Pi Handshake] Authentication Error:", authErr.message || authErr);
          }
        }, 500);
      } catch (e: any) {
        console.error("❌ [Pi Handshake] Initialization Failed:", e.message || e);
      }
    };

    // Try immediately
    syncPi();

    // Check again every 1.5 seconds if not yet initialized
    const checkInterval = setInterval(() => {
      if (!(window as any).Pi || isPiInitialized) return;
      syncPi();
    }, 1500);

    return () => clearInterval(checkInterval);
  }, [isPiInitialized, fetchItems]);



  const handleLogin = async () => {
    if (isInitializing) return;

    if (!(window as any).Pi) { alert("Pi SDK not found! Use Pi Browser."); return; }

    if (!isPiSupportedEnv()) {
      setShowEnvWarning(true);
      alert("Please open this app in the Pi Browser (mobile) or Pi Sandbox (desktop) to connect your wallet.");
      return;
    }

    setIsInitializing(true);

    try {
      const Pi = (window as any).Pi;
      
      // Only init if not already initialized
      if (!isPiInitialized) {
        const isPiBrowser = typeof navigator !== 'undefined' && 
                           navigator.userAgent.toLowerCase().includes('pibrowser');
        const isInIframe = typeof window !== 'undefined' && window.self !== window.parent;
        const isSandbox = !isPiBrowser && isInIframe;
        await Pi.init({ version: "2.0", sandbox: isSandbox });
        setIsPiInitialized(true);
      }

      const auth = await Pi.authenticate(['username', 'payments'], async (payment: any) => {
        // Handle Incomplete Payment
        try {
          const res = await fetch('/api/payments/incomplete', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ payment })
          });
          
          if (res.ok) {
            console.log("Pending payment handled successfully.");
            fetchItems(); // Refresh the list
          } else {
            const errorData = await res.json();
            console.error("Failed to recover payment:", errorData);
            alert(`Payment recovery failed: ${errorData.details || "Unknown error"}`);
          }
        } catch (error) {
          console.error("Failed to handle pending payment:", error);
        }
      });

      setUser(auth.user);
    } catch (err: any) {
      console.error("SDK Error:", err);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      setUser(null);
      setView('market');
      // Reset any local storage or session state if needed
      // Since user state drives most visibility, clearing it is usually enough
    }
  };




  // 3. PAYMENT HANDLER

  const handleBidAction = async () => {
    
    // Ensure numeric comparison handles string inputs safely
    const currentPrice = Number(selectedItem?.currentBid || 0);
    const incomingBid = parseFloat(bidAmount);

    if (!bidAmount || isNaN(incomingBid) || incomingBid <= currentPrice) {
      alert(`Please enter a bid higher than ${currentPrice.toFixed(2)}.`);
      return;
    }

    // Enhanced Max Bid Validation
    if (maxBidAmount) {
      const maxBidValue = parseFloat(maxBidAmount);
      const minValidMaxBid = incomingBid + 0.1; // Must be at least 0.1 higher than current bid
      
      if (maxBidValue <= incomingBid) {
        alert(`Max bid (${maxBidValue.toFixed(2)}) must be higher than your current bid (${incomingBid.toFixed(2)}).`);
        return;
      }
      
      if (maxBidValue < minValidMaxBid) {
        alert(`Max bid must be at least ${minValidMaxBid.toFixed(2)} π (0.1 higher than your bid).`);
        return;
      }
      
      // Validate against auction current price (defensive check)
      if (maxBidValue <= Number(selectedItem.currentBid)) {
        alert(`Max bid must be higher than the current auction price (${Number(selectedItem.currentBid).toFixed(2)} π).`);
        return;
      }
    }

    if (!user) { handleLogin(); return; }

    setIsPaying(true);

    // --- MOCK USER BYPASS ---
    if (user.uid.startsWith('mock_')) {
      // Use 'pay_mock_' prefix to match lib/pi_api.ts logic
      const mockPaymentId = `pay_mock_${Date.now()}`;
      const mockTxid = `mock_tx_${Date.now()}`;
      
      try {
        // 1. Approve (Check if auction is still valid)
        const approveRes = await fetch('/api/payments/approve', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ paymentId: mockPaymentId, auctionId: selectedItem.id })
        });
        
        if (!approveRes.ok) {
           const err = await approveRes.json();
           alert(err.error || "Mock Validation Failed");
           setIsPaying(false);
           return;
        }

        // 2. Complete
        const res = await fetch('/api/payments/complete', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ 
             paymentId: mockPaymentId, 
             txid: mockTxid,
             debug: {
               auctionId: selectedItem.id,
               amount: parseFloat(bidAmount),
               userId: user.uid,
               username: user.username.replace('@', ''),
               maxBid: maxBidAmount // Include Max Bid
             }
           })
        });

        if (res.ok) {
           const newBidValue = parseFloat(bidAmount);
           if (selectedItem && user) {
             setSelectedItem((prev: any) => ({
               ...prev,
               currentBid: newBidValue,
               bids: [{ bidder_id: user.username.replace('@', ''), amount: newBidValue }, ...(prev.bids || [])],
               _count: { ...prev._count, bids: (prev._count?.bids || 0) + 1 }
             }));
           }
           setIsPaying(false);
           setIsBidModalOpen(false);
           setBidAmount('');
           setMaxBidAmount('');
           fetchItems();
           alert("Mock Bid successful! (Test Mode)");
        } else {
           alert("Mock Bid failed.");
           setIsPaying(false);
        }
      } catch (e) {
        console.error(e);
        alert("Mock Bid error");
        setIsPaying(false);
      }
      return;
    }

    try {

      const checkRes = await fetch('/api/auctions/bid-check', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({

          auctionId: selectedItem.id,

          bidAmount: bidAmount,

          userUid: user.uid,
          
          maxBid: maxBidAmount

        })

      });



      const checkData = await checkRes.json();

      if (!checkRes.ok) {

        alert(checkData.error || "Validation failed.");

        setIsPaying(false);

        return;

      }



      await (window as any).Pi.createPayment({

        amount: parseFloat(bidAmount),

        memo: `Bid for ${selectedItem.title} on Zaaka`,

        metadata: { 
          auctionId: selectedItem.id, 
          buyerUid: user.uid,
          buyerUsername: user.username.replace('@', ''),
          maxBid: maxBidAmount // Include Max Bid in Pi Metadata
        },

      }, {

        onReadyForServerApproval: async (paymentId: string) => {

          const res = await fetch('/api/payments/approve', {

            method: 'POST',

            headers: { 
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true'
            },

            body: JSON.stringify({ paymentId })

          });

          return res.ok;

        },

onReadyForServerCompletion: async (paymentId: string, txid: string) => {

// 1. Fire and forget the server completion

fetch('/api/payments/complete', {

method: 'POST',

headers: { 
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true'
},

body: JSON.stringify({ paymentId, txid })

});



// 2. Immediate UI Update

const newBidValue = parseFloat(bidAmount);



// Update the view state manually so the price changes right now

if (selectedItem && user) {

setSelectedItem((prev: any) => ({

...prev,

currentBid: newBidValue,

bids: [{ bidder_id: user.username.replace('@', ''), amount: newBidValue }, ...(prev.bids || [])],

_count: { ...prev._count, bids: (prev._count?.bids || 0) + 1 }

}));

}



// 3. Close everything immediately

setIsPaying(false);

setIsBidModalOpen(false);

setBidAmount('');



// 4. Refresh the big list in the background (no 'await' here)

fetchItems();



alert("Bid successful!");

},

        onCancel: () => setIsPaying(false),

        onError: (err: Error) => { alert(err.message); setIsPaying(false); }

      });

    } catch (err) {

      setIsPaying(false);

    }

  };

const handleAutoSettle = useCallback(async (auctionId: number, itemSellerId: string) => {
  if (!auctionId || !itemSellerId) return;

  try {
    const response = await fetch('/api/auctions/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: auctionId,
        sellerId: itemSellerId, // We pass the ITEM'S owner, not the current viewer
        status: 'CLOSED'
      })
    });

    if (response.ok) {
      fetchItems(); // Refresh the list for everyone
    }
  } catch (err) {
    console.error("Auto-settle failed:", err);
  }
}, [fetchItems]);

const handleConfirmReceipt = async (auctionId: number) => {
  if (!user) return;
  setLoading(true);
  try {
    const res = await fetch('/api/auctions/receipt', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: auctionId,
        username: user.username.replace('@', '')
      })
    });

    if (res.ok) {
      alert("Receipt confirmed! The auction has been removed from your bids.");
      setSelectedItem(null);
      setView('market');
      fetchItems();
    } else {
      const err = await res.json();
      alert(err.error || "Failed to confirm receipt.");
    }
  } catch (error) {
    console.error("Receipt error:", error);
    alert("An error occurred.");
  } finally {
    setLoading(false);
  }
};



  return (
    <React.Fragment>
      <Head>
        <title>Zaaka Marketplace</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
        <link rel="stylesheet" href="/bid-update-styles.css" />
      </Head>

      <div className="min-h-screen bg-[#F8F9FB] text-[#1A1D21] pb-36 font-sans antialiased">

      {/* ENVIRONMENT WARNING BANNER */}
      {showEnvWarning && (
        <div className="bg-amber-50 border-b border-amber-200 p-4 animate-in slide-in-from-top duration-500">
          <div className="flex items-start gap-3 max-w-xl mx-auto">
            <div className="bg-amber-500 p-2 rounded-xl text-white">
              <MessageSquare size={16} />
            </div>
            <div>
                <h3 className="text-amber-900 font-black uppercase text-[10px] tracking-wider mb-1 italic">
                  Development Environment Detected
                </h3>
                <p className="text-amber-800 text-[11px] leading-relaxed font-medium">
                  Pi Network functionality (Auth & Payments) requires the <span className="font-bold underline">Pi Browser</span> on mobile or the <span className="font-bold underline">Pi Sandbox portal</span> on desktop.
                </p>
                <div className="mt-2 flex gap-2">
                  <a 
                    href="https://nondefinitely-fibrinogenic-talitha.ngrok-free.dev" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block bg-amber-500 text-white px-3 py-1.5 rounded-lg font-black text-[9px] uppercase shadow-sm"
                  >
                    Authorize Browser (Ngrok Fix)
                  </a>
                  
                  {/* Mock Login Button */}
                  <button 
                    onClick={handleMockLogin}
                    className="inline-block bg-white text-amber-600 border border-amber-200 px-3 py-1.5 rounded-lg font-black text-[9px] uppercase shadow-sm hover:bg-amber-50"
                  >
                    Mock Login (Test Mode)
                  </button>
                </div>
            </div>
            <button 
              onClick={() => setShowEnvWarning(false)}
              className="ml-auto text-amber-400 hover:text-amber-600 p-1"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* CONNECTION STATUS INDICATOR */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between max-w-xl mx-auto">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              status === 'connected' ? 'bg-green-500' :
              status === 'fallback' ? 'bg-blue-500' :
              status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
              'bg-red-500'
            }`}></div>
            <span className="text-xs font-medium text-gray-600">
              {status === 'connected' ? 'Connected' :
               status === 'fallback' ? 'HTTP Polling' :
               status === 'connecting' ? 'Connecting...' :
               status === 'failed' ? 'Connection Failed' :
               'Offline'}
            </span>
            {transport && transport !== 'none' && (
              <span className="text-xs text-gray-400">({transport})</span>
            )}
          </div>
          {status === 'failed' && (
            <button 
              onClick={reconnect}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Retry Connection
            </button>
          )}
        </div>
      </div>

      {/* HEADER SECTION */}

      {view !== 'detail' && (

        <>

          <header className="px-6 pt-12 pb-8 bg-white rounded-b-[48px] shadow-sm border-b border-gray-100">

            <div className="flex justify-between items-center mb-8">

              <div className="bg-gray-100 p-3 rounded-2xl text-gray-400"><Search size={20} /></div>

              <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none">

                ZAAKA<span className="text-green-500">.</span>

              </h1>

              <div className="relative bg-gray-100 p-3 rounded-2xl text-gray-400">

                <Bell size={20} />

                <span className="absolute top-3.5 right-3.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>

              </div>

            </div>



            <div className="bg-[#1A1D21] rounded-[32px] p-6 text-white flex justify-between items-center shadow-xl">

              <div>

                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em] mb-1">

                  {user ? "Verified Pioneer" : "Wallet Status"}

                </p>

                <h2 className="text-xl font-black italic tracking-tight uppercase leading-tight">

                  {user ? `@${user.username}` : "Not Connected"}

                </h2>

              </div>

              {!user ? (
                <button onClick={handleLogin} disabled={isInitializing} className="bg-green-500 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase">
                  {isInitializing ? "SYNCING..." : "CONNECT WALLET"}
                </button>
              ) : (
                <button onClick={handleLogout} className="bg-white/10 p-3 rounded-2xl hover:bg-white/20 transition-all active:scale-95" title="Logout">
                  <Wallet size={24} className="text-green-400" />
                </button>
              )}

            </div>

          </header>



          <main className="px-6 pt-10">

            <div className="flex gap-2 mb-8">
  {['Market', 'Inventory', 'My Bids', 'Watchlist'].map((tab) => {
    const tabKey = tab.toLowerCase().replace(' ', '-'); // Converts "My Bids" to "my-bids"
    return (
      <button 
        key={tab} 
        onClick={() => setView(tabKey as any)}
        className={`flex-1 py-4 rounded-full text-[10px] font-black tracking-[0.1em] uppercase transition-all ${
          view === tabKey 
            ? 'bg-[#1A1D21] text-white shadow-xl' 
            : 'bg-white text-gray-400 border border-gray-100'
        }`}
      >
        {tab}
      </button>
    );
  })}
</div>

          </main>

        </>

      )}



      {/* VIEW RENDERING */}

       {(view === 'market') && (
    <div className="space-y-6">
      {/* CATEGORY SCROLLER - Only visible in Market tab */}
      {view === 'market' && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-6 mb-2 -mx-2 px-2">
          <button 
            onClick={() => setSelectedMarketCategory('All')}
            className={`px-5 py-2.5 rounded-full text-[11px] font-black uppercase transition-all border ${
              selectedMarketCategory === 'All' ? 'bg-blue-600 text-white' : 'bg-white text-gray-400'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button 
              key={cat} 
              onClick={() => setSelectedMarketCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-[11px] font-black uppercase whitespace-nowrap border ${
                selectedMarketCategory === cat ? 'bg-blue-600 text-white' : 'bg-white text-gray-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20 opacity-20">
          <RefreshCcw className="animate-spin" size={32} />
        </div>
      ) : filteredItems.length > 0 ? (
        filteredItems.map((item: any) => (
          <div 
            key={item.id} 
            onClick={() => { setSelectedItem(item); setView('detail'); }} 
            className="bg-white rounded-[44px] p-3 border border-gray-50 shadow-sm transition-transform cursor-pointer"
          >
            <div className="relative h-60 w-full bg-[#F2F4F7] rounded-[36px] overflow-hidden">
              <img src={item.images?.[0]?.url || item.image_url} className="w-full h-full object-cover" alt="" />
              
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                <p className="text-[11px] font-black text-white italic">
                  
                  <AuctionTimer 
  expiryDate={item.expires_at}
  status={item.status}
  onEnd={() => handleAutoSettle(item.id, item.seller_id)} 
/>
                  
                  
                </p>
              </div>

              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-[8px] font-black uppercase text-blue-600">
                {item.category || 'General'}
              </div>

              {/* THE HEART BUTTON */}
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation(); 
                  toggleWatchlist(e, item.id);
                }} 
                className="absolute bottom-4 right-4 p-3 bg-white/90 backdrop-blur rounded-2xl shadow-xl z-20"
              >
                <Heart 
                  size={20} 
                  className={watchlist.includes(item.id) ? "fill-red-500 text-red-500" : "text-gray-400"} 
                />
              </button>
            </div>
            
            <div className="p-5 flex justify-between items-end">
              <div>
                <h4 className="text-lg font-black text-gray-900 italic uppercase tracking-tighter">{item.title}</h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Asset #{item.id}</p>
              </div>
              <p className="text-xl font-black text-green-500 italic bid-amount" data-auction-id={item.id}>{Number(item.currentBid).toFixed(2)} π</p>
            </div>
            
            <button className="w-full py-5 rounded-[28px] bg-[#1A1D21] text-white font-black uppercase text-[11px]">
              View Auction
            </button>
          </div>
        ))
      ) : (
        <div className="text-center py-24 bg-white rounded-[44px] border border-dashed border-gray-200">
          <Package className="mx-auto text-gray-200 mb-4" size={48} />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
            No items found
          </p>
        </div>
      )}
    </div>
  )}


        {(view === 'create') && !useStandardCreate && (
          <div className="animate-in fade-in slide-in-from-bottom duration-500">
            <EnhancedAuctionCreation
              onAuctionCreated={(auction) => {
                alert("Success! Your auction is live.");
                setUseStandardCreate(false);
                setView('inventory');
                fetchItems();
              }}
              onSwitchToStandard={() => setUseStandardCreate(true)}
              className="pb-32"
            />
          </div>
        )}



    {view === 'create' && useStandardCreate && (
      <StandardAuctionCreation 
        user={user}
        onAuctionCreated={() => {
          setView('inventory');
          fetchItems();
        }}
        onSwitchToAI={() => setUseStandardCreate(false)}
        handleLogin={handleLogin}
      />
    )}

        {/* INVENTORY VIEW (Add this block!) */}

  {view === 'inventory' && (
  <div className="space-y-6">
    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Your Listings ({items.length})</h3>
    
    {/* 🟢 Login check added: Only shows activity message if user is not logged in */}
    {!user ? (
      <div className="text-center py-24 bg-white rounded-[44px] border border-dashed border-gray-200">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Log in to see your activity</p>
      </div>
    ) : (
      <>
        {loading ? (
          <div className="flex flex-col items-center py-24 opacity-20"><RefreshCcw className="animate-spin" size={32} /></div>
        ) : items.length > 0 ? (
          items.map((item: any) => (
            <div key={item.id} className="bg-white rounded-[44px] p-3 border border-blue-100 shadow-md">
              <div className="relative h-48 w-full bg-[#F2F4F7] rounded-[36px] overflow-hidden">
                <img src={item.images?.[0]?.url} className="w-full h-full object-cover" alt={item.title} />
                
                <div className="absolute top-4 left-4 bg-blue-600 text-white text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
                  Owner View
                </div>
              </div>

              <div className="p-5">
                <h4 className="text-lg font-black text-gray-900 italic uppercase tracking-tighter mb-1">{item.title}</h4>
                <div className="flex justify-between items-center mt-4">
                  <p className="text-xl font-black text-gray-900 italic leading-none bid-amount" data-auction-id={item.id}>{Number(item.currentBid).toFixed(2)} π</p>
                  <button onClick={() => { setSelectedItem(item); setView('detail'); }}
                    className="px-6 py-3 rounded-2xl bg-gray-100 text-[#1A1D21] font-black uppercase text-[9px] tracking-widest">
                    Manage
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-[44px] border border-dashed border-gray-200">
            <Package className="mx-auto text-gray-200 mb-4" size={48} />
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No Items Found</p>
          </div>
        )}
      </>
    )}
  </div>
)}

{view === 'my-bids' && (
  <div className="space-y-6 animate-in fade-in duration-500">
    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Participation History</h3>
    
    {!user ? (
      <div className="text-center py-24 bg-white rounded-[44px] border border-dashed border-gray-200">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Log in to see your activity</p>
      </div>
    ) : (
      <>
        {loading ? (
          <div className="flex justify-center py-20 opacity-20"><RefreshCcw className="animate-spin" /></div>
        ) : items.filter(item => 
            item.bids?.some((b: any) => b.bidder_id === user.username?.replace('@', '') || b.bidder_id === user.uid)
          ).length > 0 ? (
          items
            .filter(item => 
              item.bids?.some((b: any) => b.bidder_id === user.username?.replace('@', '') || b.bidder_id === user.uid)
            )
            .map((item: any) => {
              const cleanUsername = user?.username?.replace('@', '');
              const topBidder = item.bids?.[0]?.bidder_id;
              const isWinning = topBidder === cleanUsername || topBidder === user?.uid;
              const isAuctionOver = item.status !== 'OPEN' || new Date(item.expires_at).getTime() <= Date.now();
              
              return (
                <div key={item.id} className="bg-white rounded-[44px] p-3 border border-gray-50 shadow-sm relative active:scale-[0.98] transition-all">
                  <div className="relative h-48 w-full bg-[#F2F4F7] rounded-[36px] overflow-hidden">
                    <img src={item.images?.[0]?.url || item.image_url} className="w-full h-full object-cover" alt="" />
                    <div className="absolute top-4 left-4">
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl ${
                        isWinning ? (isAuctionOver ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white') : 'bg-red-500 text-white animate-pulse'
                      }`}>
                        {isWinning ? (
                          isAuctionOver ? (
                            <><Trophy size={12} className="text-yellow-300" /> Winner</>
                          ) : (
                            "Winning"
                          )
                        ) : (
                          "Outbid"
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-5 flex justify-between items-center">
                    <div>
                      <h4 className="text-lg font-black text-gray-900 italic uppercase tracking-tighter">{item.title}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">
                        {isWinning ? (isAuctionOver ? "Winner: " : "Leading: ") : "Highest: "} 
                        <span className={isWinning ? "text-green-500" : "text-red-500"} data-auction-id={item.id}>
                          {Number(item.currentBid).toFixed(2)} π
                        </span>
                      </p>
                    </div>
                    <button 
                      onClick={() => { setSelectedItem(item); setView('detail'); }}
                      className="px-6 py-3 rounded-2xl bg-[#1A1D21] text-white font-black uppercase text-[9px]"
                    >
                      View
                    </button>
                  </div>
                </div>
              );
            })
        ) : (
          <div className="text-center py-20 bg-white rounded-[44px] border border-dashed border-gray-200">
            <Package className="mx-auto text-gray-200 mb-4" size={48} />
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No bids placed yet</p>
          </div>
        )}
      </>
    )}
  </div>
)}


       {view === 'detail' && selectedItem && (
  <div className="animate-in fade-in slide-in-from-right duration-300">
    <button onClick={() => setView('market')} className="mb-6 flex items-center gap-2 font-black uppercase text-[10px] tracking-widest text-gray-400">
      <ChevronRight className="rotate-180" size={14} /> Back to Market
    </button>

    {/* IMAGE CAROUSEL */}
    <div className="bg-white rounded-[48px] p-4 shadow-sm mb-8">
      <div className="h-[400px] bg-gray-100 rounded-[40px] flex gap-2 overflow-x-auto snap-x no-scrollbar">
        {selectedItem.images && selectedItem.images.length > 0 ? (
          selectedItem.images.map((img: any) => (
            <div key={img.id} className="min-w-full h-full snap-center overflow-hidden rounded-[40px]">
              <img src={img.url} className="w-full h-full object-cover" alt="" />
            </div>
          ))
        ) : (
          <div className="min-w-full h-full">
            <img src={selectedItem.image_url} className="w-full h-full object-cover" alt="" />
          </div>
        )}
      </div>
    </div>

    <div className="px-2 pb-20">
      {/* ROLE IDENTIFICATION */}
      {(() => {
        const username = user?.username?.replace('@', '');
        const isSeller = username === selectedItem.seller_id;
        
        // Ensure we strictly use the top bid from the array which is already sorted by backend
        const winningBid = selectedItem.bids && selectedItem.bids.length > 0 ? selectedItem.bids[0] : null;
        
        // Check if the current user is the actual winner
        const isWinner = winningBid && (username === winningBid.bidder_id);
        
        const isExpired = new Date(selectedItem.expires_at).getTime() <= now;
        const isClosed = selectedItem.status === 'CLOSED' || isExpired;

        return (
          <>
            {/* SELLER IDENTITY BADGE */}
            {isSeller && (
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-[0.15em] mb-4 border border-blue-100">
                <Package size={12} /> Your Listing
              </div>
            )}

            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-2">{selectedItem.title}</h2>
            <p className="text-gray-500 leading-relaxed mb-8 text-sm">{selectedItem.description || "No description provided."}</p>

            {/* STATS GRID */}
            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="bg-white p-6 rounded-[32px] border border-gray-50 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  {isClosed ? (isSeller ? "Final Sale Price" : "Final Price") : (isSeller ? "Total Bids" : "Highest Bid")}
                </p>
                <p className="text-xl font-black text-green-500 italic bid-amount" data-auction-id={selectedItem.id}>
                  {isClosed 
                    ? `${Number(selectedItem.currentBid).toFixed(2)} π`
                    : (isSeller 
                      ? (selectedItem._count?.bids || 0) 
                      : `${Number(selectedItem.currentBid).toFixed(2)} π`
                    )
                  }
                </p>
                {!isSeller && !isClosed && (
                  <p className="text-[9px] font-black text-blue-500 uppercase mt-1 italic opacity-70">
                    {/* Fallback to 'Unknown' if bids array is empty or bidder_id is missing */}
                    by @{selectedItem.bids?.[0]?.bidder_id || "..."}
                  </p>
                )}
              </div>

              <div className="bg-white p-6 rounded-[32px] border border-gray-50 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  {isClosed ? "Auction Status" : "Ends In"}
                </p>
                <p className="text-xl font-black italic uppercase">
                  {selectedItem.status === 'CANCELLED' ? (
                    <span className="text-gray-300 text-sm">CANCELLED</span>
                  ) : isClosed ? (
                    <span className="text-red-500">CLOSED</span>
                  ) : (
                    <AuctionTimer 
                      expiryDate={selectedItem.expires_at} 
                      status={selectedItem.status}
                      onEnd={() => handleAutoSettle(selectedItem.id, selectedItem.seller_id)}
                    />
                  )}
                </p>
              </div>
            </div>

            {/* ACTION BUTTONS / POST-AUCTION VIEWS */}
            {isClosed ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom duration-500">
                {isWinner ? (
                  /* THE WINNER VIEW */
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-[40px] p-8 border border-yellow-100 relative overflow-hidden">
                    <div className="relative z-10">
                      <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-yellow-200 rotate-3">
                        <Trophy className="text-white" size={32} />
                      </div>
                      <h3 className="text-2xl font-black italic uppercase tracking-tighter text-yellow-700 mb-2">You Won!</h3>
                      <p className="text-yellow-600/80 text-sm mb-8 leading-relaxed font-medium">Congratulations! You are the winner of this auction. Please contact the seller to arrange delivery.</p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => handleOpenChat(selectedItem.id, selectedItem.seller_id, selectedItem.seller_id, selectedItem.title)}
                          className="bg-yellow-500 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-md shadow-yellow-200 active:scale-95 transition-all"
                        >
                          <MessageSquare size={14} /> Contact Seller
                        </button>
                        <button 
                          onClick={() => handleConfirmReceipt(selectedItem.id)}
                          disabled={loading || selectedItem.delivered}
                          className="bg-white text-yellow-600 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 border border-yellow-100 shadow-sm active:scale-95 transition-all disabled:opacity-50"
                        >
                          {loading ? <RefreshCcw className="animate-spin" size={14} /> : (selectedItem.delivered ? "Received" : <><Check size={14} /> Confirm Receipt</>)}
                        </button>
                      </div>
                    </div>
                    {/* Decorative Background Elements */}
                    <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-yellow-200/20 rounded-full blur-3xl"></div>
                  </div>
                ) : isSeller ? (
                  /* THE SELLER VIEW */
                  <div className="bg-[#1A1D21] rounded-[40px] p-8 text-white border border-gray-800 relative overflow-hidden">
                    <div className="relative z-10">
                      <div className="inline-flex items-center gap-2 bg-green-500 text-white text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-widest mb-4">
                        <Check size={10} /> Item Sold
                      </div>
                      <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-6">Auction Successful</h3>
                      
                      <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-8">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Winning Bidder</p>
                        <p className="text-lg font-black text-blue-400 italic">@{winningBid?.bidder_id || "Unknown"}</p>
                      </div>

                      <button 
                        onClick={() => handleOpenChat(selectedItem.id, winningBid?.bidder_id, winningBid?.bidder_id, selectedItem.title)}
                        className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 active:scale-95 transition-all"
                      >
                        <MessageSquare size={16} /> Message Winner
                      </button>
                    </div>
                  </div>
                ) : (
                  /* OTHERS VIEW */
                  <div className="bg-gray-50 rounded-[40px] p-8 border border-dashed border-gray-200 text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">This Auction has</p>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900 mb-6">Officially Closed</h3>
                    <div className="inline-flex items-center gap-4 bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="text-left">
                        <p className="text-[8px] font-black text-gray-400 uppercase">Final Price</p>
                        <p className="text-lg font-black text-green-500 italic bid-amount" data-auction-id={selectedItem.id}>{Number(selectedItem.currentBid).toFixed(2)} π</p>
                      </div>
                      <div className="w-px h-8 bg-gray-100"></div>
                      <div className="text-left">
                        <p className="text-[8px] font-black text-gray-400 uppercase">Winner</p>
                        <p className="text-sm font-black text-gray-900 italic">@{winningBid?.bidder_id}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : isSeller ? (
              <button
                onClick={handleCancelAuction}
                disabled={loading}
                className="w-full py-6 rounded-[32px] border-2 border-red-100 text-red-500 font-black uppercase tracking-[0.2em] hover:bg-red-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCcw className="animate-spin" size={18} /> : "Cancel Auction"}
              </button>
            ) : (
              <button
                onClick={() => {
                  if (!user) {
                    handleLogin();
                  } else {
                    setIsBidModalOpen(true);
                  }
                }}
                className="w-full py-6 rounded-[32px] font-black uppercase tracking-[0.2em] shadow-xl active:scale-[0.98] transition-all bg-[#1A1D21] text-white"
              >
                {user ? "Place your bid" : "Login to Bid"}
              </button>
            )}
          </>
        );
      })()}
    </div>
  </div>
)}



   

        {/* BOTTOM NAV */}
{view !== 'detail' && (
<nav className="fixed bottom-[max(70px,env(safe-area-inset-bottom)+46px)] left-8 right-8 h-20 bg-[#1A1D21]/95 backdrop-blur-xl rounded-[32px] flex items-center justify-around px-6 shadow-2xl z-[999]">
        <button 
          className={`p-4 rounded-2xl transition-all ${view === 'market' ? 'text-white bg-white/10' : 'text-gray-500'}`} 
          onClick={() => setView('market')}
        >
          <Home size={22} />
        </button>

        {/* <button className="text-gray-500"><Search size={22} /></button> */}

        <button 
          className={`p-4 rounded-2xl transition-all ${view === 'inventory' ? 'text-white bg-white/10' : 'text-gray-500'}`} 
          onClick={() => setView('inventory')}
        >
          <Gavel size={22} />
        </button>



        <button 
          className={`p-4 rounded-2xl transition-all ${view === 'create' ? 'text-white bg-white/10' : 'text-gray-500'}`} 
          onClick={() => {
            setUseStandardCreate(false);
            setView('create' as any);
          }}
        >
          <Plus size={22} />
        </button>

        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-400 to-blue-400 border border-white/10 shrink-0"></div>
      </nav>


      )}



      {/* MESSAGE MODAL */}
      {isMessageModalOpen && chatConfig && user && (
        <MessageModal
          isOpen={isMessageModalOpen}
          onClose={() => setIsMessageModalOpen(false)}
          auctionId={chatConfig.auctionId}
          currentUserId={user.username.replace('@', '')}
          otherUserId={chatConfig.otherUserId}
          otherUsername={chatConfig.otherUsername}
          itemTitle={chatConfig.itemTitle}
          auctionSellerId={selectedItem?.seller_id}
          winningBidderId={selectedItem?.bids?.[0]?.bidder_id}
        />
      )}

      {/* BID MODAL (2nd Image Layout) */}

      {isBidModalOpen && selectedItem && (

  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">

    <div className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] p-8 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-300">

     

      {/* Header */}

      <div className="flex justify-between items-start mb-2">

        <div>

          <h3 className="text-2xl font-black text-gray-900">Place your bid</h3>

          <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-[280px]">

            You can place your current bid and you can also place a max bid just in case anybody outbids your proposal

          </p>

        </div>

        <button

          onClick={() => setIsBidModalOpen(false)}

          className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-colors"

        >

          <X size={20} />

        </button>

      </div>



      {/* Last Bid Stats Card */}

      <div className="bg-[#F8F9FB] rounded-2xl p-4 flex justify-between items-center mb-8 border border-gray-100">

        <div>

          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
            {selectedItem.bids && selectedItem.bids.length > 0 ? (
              <>Last bid by <span className="text-blue-500">@{selectedItem.bids[0].bidder_id}</span></>
            ) : (
              "No bids yet"
            )}
          </p>

          <p className="text-2xl font-black text-gray-900 mt-1 bid-amount" data-auction-id={selectedItem.id}>

            {Number(selectedItem.currentBid).toFixed(2)} <span className="text-sm font-bold">π</span>

          </p>

        </div>

        <button className="text-[10px] font-black text-gray-400 underline decoration-gray-300 underline-offset-4 uppercase">

          See all {selectedItem._count?.bids || 0} Bids

        </button>

      </div>



      {/* Bid Input Section */}

      <div className="space-y-6">

        <div>

          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Your bid</label>

          <div className="relative group">

            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-black text-gray-900 group-focus-within:text-green-500 transition-colors">π</span>

            <input

              type="number"

              value={bidAmount}

              onChange={(e) => setBidAmount(e.target.value)}

              placeholder={(Number(selectedItem.currentBid) + 0.1).toFixed(2)}

              className="w-full bg-white border-2 border-gray-100 focus:border-green-500 rounded-2xl py-5 pl-12 pr-6 text-xl font-black outline-none transition-all placeholder:text-gray-200"

            />

          </div>

         

          {/* Increment Suggestions */}

          <div className="grid grid-cols-4 gap-2 mt-3">

            {[0.1, 0.5, 1.0, 2.5].map((inc) => {

              const suggestedVal = (Number(selectedItem.currentBid) + inc).toFixed(2);

              return (

                <button

                  key={inc}

                  onClick={() => setBidAmount(suggestedVal)}

                  className="py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-[10px] font-black text-gray-600 transition-colors border border-gray-100"

                >

                  π{suggestedVal}

                </button>

              );

            })}

          </div>

        </div>



        {/* Enhanced Max Bid Section */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
              Your max bid
              <span className="ml-2 text-[8px] text-blue-500">💡 We&apos;ll auto-bid for you up to this amount</span>
            </label>
            <span className="text-[9px] font-bold text-gray-300 uppercase italic">Optional</span>
          </div>
          
          <div className="relative group">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-black text-gray-200 group-focus-within:text-gray-400 transition-colors">π</span>
            <input
              type="number"
              step="0.01"
              min={(Number(selectedItem.currentBid) + 0.1).toFixed(2)}
              value={maxBidAmount}
              onChange={(e) => {
                const value = e.target.value;
                // Only allow positive numbers
                if (value === '' || (Number(value) >= 0 && !isNaN(Number(value)))) {
                  setMaxBidAmount(value);
                }
              }}
              placeholder={`Min: ${(Number(selectedItem.currentBid) + 0.1).toFixed(2)}`}
              className="w-full bg-white border-2 border-gray-100 focus:border-blue-300 rounded-2xl py-5 pl-12 pr-6 text-xl font-black outline-none transition-all placeholder:text-gray-300"
            />
          </div>
          
          {/* Max Bid Help Text */}
          {maxBidAmount && (
            <div className="mt-2 text-[9px] text-gray-500">
              {Number(maxBidAmount) > Number(selectedItem.currentBid) ? (
                <span className="text-green-600">✅ Max bid is valid</span>
              ) : (
                <span className="text-red-600">❌ Max bid must be higher than current price</span>
              )}
            </div>
          )}
        </div>

      </div>



      {/* Action Button */}

      <button

        onClick={handleBidAction}

        disabled={isPaying}

        className="w-full mt-10 py-6 rounded-[24px] bg-[#1A1D21] text-white font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] transition-all disabled:bg-gray-200"

      >

        {isPaying ? <RefreshCcw className="animate-spin" size={20} /> : "Place Bid"}

      </button>

    </div>
  </div>
  )}
  </div>
  </React.Fragment>
  );

}
