import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';

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

  const [isInitializing, setIsInitializing] = useState(false);

const [view, setView] = useState<'market' | 'inventory' | 'my-bids' | 'detail' | 'create'>('market');

const [watchlist, setWatchlist] = useState<number[]>([]);

  const [isBidModalOpen, setIsBidModalOpen] = useState(false);

  const [selectedMarketCategory, setSelectedMarketCategory] = useState('All');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
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

  const [newListing, setNewListing] = useState({

  title: '',

  description: '',

  price: '',

  images: ['', '', ''], // Three image slots

  duration: '24', // Default to 24 hours

  category: 'Fashion' // Default category

});

// List of categories based on your image


// --- IMAGE UPLOADER LOGIC ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 800; // Resize to max 800px width
      const scaleSize = MAX_WIDTH / img.width;
      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scaleSize;

      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Compress to JPEG at 0.7 quality (70%)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      
      const newImages = [...newListing.images];
      newImages[index] = dataUrl;
      setNewListing({ ...newListing, images: newImages });
    };
    img.src = event.target?.result as string;
  };
  reader.readAsDataURL(file);
};
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



  // 1. AUTHENTICATION LOGIC

  useEffect(() => {
    const syncPi = async () => {
      if (typeof window !== "undefined" && (window as any).Pi) {
        try {
          const Pi = (window as any).Pi;
          await Pi.init({ version: "2.0", sandbox: true });
          console.log("Handshake successful with Pi Sandbox");
          
          // Automatically handle incomplete payments on load
          await Pi.authenticate(['username', 'payments'], async (payment: any) => {
            try {
              const res = await fetch('/api/payments/incomplete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment })
          });
          
          if (res.ok) {
            console.log("Incomplete payment recovered on startup.");
            fetchItems();
          } else {
            console.error("Startup recovery failed:", await res.json());
          }
            } catch (err) {
              console.error("Incomplete payment recovery failed:", err);
            }
          });
        } catch (e) {
          console.warn("Init pending or authentication failed...");
        }
      }
    };
    syncPi();
  }, []);



  const handleLogin = async () => {

    if (isInitializing) return;

    if (!(window as any).Pi) { alert("Pi SDK not found! Use Pi Browser."); return; }

    setIsInitializing(true);



    try {

      const Pi = (window as any).Pi;

      await Pi.init({ version: "2.0", sandbox: true });

      const auth = await Pi.authenticate(['username', 'payments'], async (payment: any) => {
        // Handle Incomplete Payment
        try {
          const res = await fetch('/api/payments/incomplete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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



  // 2. DATA FETCHING (Using include: images from backend)

const fetchItems = useCallback(async () => {
  setLoading(true);
  const activeUser = user?.username?.replace('@', '') || "guest";
  try {
    // Add 'watchlist' to this condition so it fetches the live items to compare against
    const endpoint = (view === 'market' || view === 'my-bids' || view === 'watchlist')
      ? '/api/auctions/live'
      : `/api/seller/items?sellerId=${activeUser}`;
     
    const res = await fetch(endpoint);
    const data = await res.json();
   
    if (Array.isArray(data)) {
      setItems(data);
    } else {
      setItems([]);
    }
  } catch (err) {
    console.error("Fetch failed", err);
    setItems([]);
  } finally {
    setLoading(false);
  }
}, [view, user]);

  useEffect(() => { fetchItems(); }, [fetchItems]);



  // 3. PAYMENT HANDLER

  const handleBidAction = async () => {

    if (!bidAmount || parseFloat(bidAmount) <= (selectedItem?.currentBid || 0)) {

      alert("Please enter a bid higher than the current price.");

      return;

    }

    if (!user) { handleLogin(); return; }



    setIsPaying(true);

    try {

      const checkRes = await fetch('/api/auctions/bid-check', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

          auctionId: selectedItem.id,

          bidAmount: bidAmount,

          userUid: user.uid

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
          buyerUsername: user.username.replace('@', '') 
        },

      }, {

        onReadyForServerApproval: async (paymentId: string) => {

          const res = await fetch('/api/payments/approve', {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({ paymentId })

          });

          return res.ok;

        },

onReadyForServerCompletion: async (paymentId: string, txid: string) => {

// 1. Fire and forget the server completion

fetch('/api/payments/complete', {

method: 'POST',

headers: { 'Content-Type': 'application/json' },

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


// 4. CREATE LISTING HANDLER

  const handleCreateListing = async () => {
  // 1. AUTH CHECK: Only let logged-in users proceed
  if (!user) {
    alert("You must be logged in to publish an auction.");
    handleLogin(); // Trigger your login function
    return;
  }

  const durationHours = parseInt(newListing.duration);
  const expirationDate = new Date();
  expirationDate.setHours(expirationDate.getHours() + durationHours);

  // 2. VALIDATION CHECK
  if (!newListing.title || !newListing.price) {
    alert("Please fill in the title and price.");
    return;
  }

  setLoading(true);
  try {
    const res = await fetch('/api/auctions/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newListing.title,
        description: newListing.description,
        startPrice: newListing.price,
        price: newListing.price, // Ensu
        category: newListing.category,
        sellerId: user.username.replace('@', ''), // Uses authenticated username
        imageUrls: newListing.images.filter(url => url !== ''),
        expiresAt: expirationDate.toISOString()
      })
    });

    if (res.ok) {
      alert("Success! Your auction is live.");
      setNewListing({ title: '', description: '', price: '', duration: '24', images: ['', '', ''] });
      setView('inventory');
      fetchItems();
    }
  } catch (err) {
    console.error("Creation failed", err);
  } finally {
    setLoading(false);
  }
};


  return (
    <>
    <Head>
      <title>Zaaka Marketplace</title>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover"   />
    </Head>

    

    <div className="min-h-screen bg-[#F8F9FB] text-[#1A1D21] pb-36 font-sans antialiased">

     

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

                <div className="bg-white/10 p-3 rounded-2xl"><Wallet size={24} className="text-green-400" /></div>

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

      <main className="px-6">

       

       {(view === 'market' || view === 'watchlist') && (
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
              <p className="text-xl font-black text-green-500 italic">{Number(item.currentBid).toFixed(2)} π</p>
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
            {view === 'watchlist' ? 'No items in your watchlist' : 'No items found'}
          </p>
        </div>
      )}
    </div>
  )}


        {view === 'create' as any && (

  <div className="animate-in fade-in slide-in-from-bottom duration-500">

    <header className="flex justify-between items-center mb-8 pt-4">

      <button onClick={() => setView('inventory')} className="p-3 bg-white rounded-2xl shadow-sm text-gray-400">

        <X size={20} />

      </button>

      <h2 className="text-xl font-black italic uppercase tracking-tighter">New Listing</h2>

      <div className="w-10"></div> {/* Spacer */}

    </header>



    <div className="space-y-6 pb-32">

      {/* Image URL Inputs */}

      <div className="bg-white p-6 rounded-[40px] shadow-sm border border-gray-50">
  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
    <Camera size={14} /> Item Images
  </p>
  <div className="grid grid-cols-3 gap-3">
    {newListing.images.map((img, i) => (
      <div key={i} className="relative aspect-square rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center group">
        {img ? (
          <>
            <img src={img} className="w-full h-full object-cover" alt="Upload Preview" />
            <button 
              onClick={() => removeImage(i)} 
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full shadow-lg"
            >
              <X size={10} />
            </button>
          </>
        ) : (
          <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-gray-300 hover:text-green-500 transition-colors">
            <Plus size={20} />
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => handleImageUpload(e, i)} 
            />
          </label>
        )}
      </div>
    ))}
  </div>
</div>
<div className="bg-white p-6 rounded-[40px] shadow-sm border border-gray-50">
  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 block">
    Item Category
  </label>
  <div className="flex flex-wrap gap-2">
    {categories.map((cat) => (
      <button
        key={cat}
        onClick={() => setNewListing({ ...newListing, category: cat })}
        className={`px-5 py-2.5 rounded-full text-[11px] font-bold transition-all border ${
          newListing.category === cat
            ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105'
            : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'
        }`}
      >
        {cat}
      </button>
    ))}
  </div>
</div>



      {/* Details Section */}

      <div className="bg-white p-6 rounded-[40px] shadow-sm border border-gray-50 space-y-4">

        <div>

          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Listing Title</label>

          <input

            type="text"

            placeholder="e.g. Vintage Rolex Submariner"

            className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none"

            value={newListing.title}

            onChange={(e) => setNewListing({...newListing, title: e.target.value})}

          />

        </div>

        <div>

          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Starting Price (π)</label>

          <input

            type="number"

            placeholder="0.00"

            className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none"

            value={newListing.price}

            onChange={(e) => setNewListing({...newListing, price: e.target.value})}

          />

        </div>

        <div>

          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Description</label>

          <textarea

            rows={4}

            placeholder="Tell us about the history and condition..."

            className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm outline-none resize-none"

            value={newListing.description}

            onChange={(e) => setNewListing({...newListing, description: e.target.value})}

          />

        </div>

      </div>



      <div>

  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">

    Auction Duration

  </label>

  <div className="flex gap-2">

    {[24, 48, 72, 168].map((hours) => (

      <button

        key={hours}

        onClick={() => setNewListing({...newListing, duration: hours.toString()})}

        className={`flex-1 py-3 rounded-2xl text-[10px] font-black border transition-all ${

          newListing.duration === hours.toString()

          ? 'bg-[#1A1D21] text-white border-[#1A1D21]'

          : 'bg-gray-50 text-gray-400 border-gray-100'

        }`}

      >

        {hours < 168 ? `${hours}H` : '7 DAYS'}

      </button>

    ))}

  </div>

</div>



      <button
  onClick={handleCreateListing}
  disabled={loading}
  className={`w-full py-4 mb-6 rounded-3xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg flex items-center justify-center gap-2 ${
    !user ? 'bg-gray-400 text-white' : 'bg-green-500 text-white'
  }`}
>
  {loading ? (
    <RefreshCcw className="animate-spin" />
  ) : !user ? (
    "Login to Publish"
  ) : (
    "Publish Auction"
  )}
  <Camera size={12}/>
</button>

    </div>

  </div>

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
                  <p className="text-xl font-black text-gray-900 italic leading-none">{Number(item.currentBid).toFixed(2)} π</p>
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
              
              return (
                <div key={item.id} className="bg-white rounded-[44px] p-3 border border-gray-50 shadow-sm relative active:scale-[0.98] transition-all">
                  <div className="relative h-48 w-full bg-[#F2F4F7] rounded-[36px] overflow-hidden">
                    <img src={item.images?.[0]?.url || item.image_url} className="w-full h-full object-cover" alt="" />
                    <div className="absolute top-4 left-4">
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl ${
                        isWinning ? 'bg-green-500 text-white' : 'bg-red-500 text-white animate-pulse'
                      }`}>
                        {isWinning ? "Winning" : "Outbid"}
                      </div>
                    </div>
                  </div>
                  <div className="p-5 flex justify-between items-center">
                    <div>
                      <h4 className="text-lg font-black text-gray-900 italic uppercase tracking-tighter">{item.title}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">
                        {isWinning ? "Leading: " : "Highest: "} 
                        <span className={isWinning ? "text-green-500" : "text-red-500"}>
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
        const winningBid = selectedItem.bids?.[0]; // Assuming first bid is the winner in a closed auction
        const isWinner = username === winningBid?.bidder_id;
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
                <p className="text-xl font-black text-green-500 italic">
                  {isClosed 
                    ? `${Number(selectedItem.currentBid).toFixed(2)} π`
                    : (isSeller 
                      ? (selectedItem._count?.bids || 0) 
                      : `${Number(selectedItem.currentBid).toFixed(2)} π`
                    )
                  }
                </p>
                {!isSeller && !isClosed && selectedItem.bids?.[0] && (
                  <p className="text-[9px] font-black text-blue-500 uppercase mt-1 italic opacity-70">
                    by @{selectedItem.bids[0].bidder_id}
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
                        <button className="bg-yellow-500 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-md shadow-yellow-200 active:scale-95 transition-all">
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

                      <button className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 active:scale-95 transition-all">
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
                        <p className="text-lg font-black text-green-500 italic">{Number(selectedItem.currentBid).toFixed(2)} π</p>
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



   

      </main>




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

        <button className={`p-4 rounded-2xl ${view === 'watchlist' ? 'text-white bg-white/10' : 'text-gray-500'}`} onClick={() => setView('watchlist')}><Heart size={22} /></button>

        <button 
          className={`p-4 rounded-2xl transition-all ${view === 'create' ? 'text-white bg-white/10' : 'text-gray-500'}`} 
          onClick={() => setView('create' as any)}
        >
          <Plus size={22} />
        </button>

        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-400 to-blue-400 border border-white/10 shrink-0"></div>
      </nav>


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

          <p className="text-2xl font-black text-gray-900 mt-1">

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



        {/* Max Bid Section */}

        <div>

          <div className="flex justify-between items-center mb-2">

            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Your max bid</label>

            <span className="text-[9px] font-bold text-gray-300 uppercase italic">Optional</span>

          </div>

          <div className="relative group">

            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-black text-gray-200 group-focus-within:text-gray-400 transition-colors">π</span>

            <input

              type="number"

              placeholder={(Number(selectedItem.currentBid) + 1).toFixed(2)}

              className="w-full bg-white border-2 border-gray-100 focus:border-gray-300 rounded-2xl py-5 pl-12 pr-6 text-xl font-black outline-none transition-all placeholder:text-gray-100"

            />

          </div>

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
</>
  );

}