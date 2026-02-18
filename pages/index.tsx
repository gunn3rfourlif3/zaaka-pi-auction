import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, Camera, Gavel, RefreshCcw, X, 
  Search, Bell, Timer, TrendingUp, 
  ChevronRight, Wallet, Home, Trophy, Plus 
} from 'lucide-react';

const AuctionTimer = ({ expiryDate }: { expiryDate: string }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculate = () => {
      const difference = +new Date(expiryDate) - +new Date();
      if (difference <= 0) {
        setTimeLeft("AUCTION ENDED");
        return;
      }

      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));

      setTimeLeft(
        `${days > 0 ? days + 'd ' : ''}${hours.toString().padStart(2, '0')}:${minutes
          .toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    const timer = setInterval(calculate, 1000);
    calculate(); // Initial call

    return () => clearInterval(timer);
  }, [expiryDate]);

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
  const [view, setView] = useState<'market' | 'inventory' | 'detail'>('market');
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [newListing, setNewListing] = useState({
  title: '',
  description: '',
  price: '',
  images: ['', '', ''], // Three image slots
  duration: '24' // Default to 24 hours
});


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
          await (window as any).Pi.init({ version: "2.0", sandbox: true });
          console.log("Handshake successful with Pi Sandbox");
        } catch (e) {
          console.warn("Init pending...");
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
      const auth = await Pi.authenticate(['username', 'payments'], (p: any) => {});
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
    // Ensure your backend endpoint respects the "status"
    const endpoint = view === 'market' 
      ? '/api/auctions/live' 
      : `/api/seller/items?sellerId=${activeUser}`;
      
    const res = await fetch(endpoint);
    const data = await res.json();
    
    // 🟢 Extra safety: Filter out non-OPEN items on the frontend too
    const filteredData = Array.isArray(data) 
      ? data.filter((item: any) => item.status === 'OPEN') 
      : [];
      
    setItems(filteredData);
  } catch (err) {
    console.error("Fetch failed", err);
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
        metadata: { auctionId: selectedItem.id, buyerUid: user.uid },
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
          const res = await fetch('/api/payments/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId, txid })
          });
          if (res.ok) {
            alert("Bid placed!");
            setIsBidModalOpen(false);
            setSelectedItem(null);
            setView('market');
            fetchItems();
          }
        },
        onCancel: () => setIsPaying(false),
        onError: (err: Error) => { alert(err.message); setIsPaying(false); }
      });
    } catch (err) {
      setIsPaying(false);
    }
  };
// 4. CREATE LISTING HANDLER
  const handleCreateListing = async () => {
  const durationHours = parseInt(newListing.duration);
  const expirationDate = new Date();
  expirationDate.setHours(expirationDate.getHours() + durationHours);
  if (!newListing.title || !newListing.price || !user) {
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
        sellerId: user.username.replace('@', ''),
        imageUrls: newListing.images.filter(url => url !== ''),
        expiresAt: expirationDate.toISOString()// Remove empty inputs
      })
    });

    if (res.ok) {
      alert("Success! Your auction is live.");
      setNewListing({ title: '', description: '', price: '', duration: '', images: ['', '', ''] });
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
            <div className="flex gap-4 mb-8">
              {['Market', 'Inventory'].map((tab) => (
                <button key={tab} onClick={() => setView(tab.toLowerCase() as any)}
                  className={`flex-1 py-4 rounded-full text-[10px] font-black tracking-[0.1em] uppercase transition-all ${
                    view === tab.toLowerCase() ? 'bg-[#1A1D21] text-white shadow-xl' : 'bg-white text-gray-400 border border-gray-100'
                  }`}>
                  {tab}
                </button>
              ))}
            </div>
          </main>
        </>
      )}

      {/* VIEW RENDERING */}
      <main className="px-6">
        {view === 'market' && (
          <div className="space-y-6">
            {loading ? (
              <div className="flex flex-col items-center py-24 opacity-20"><RefreshCcw className="animate-spin" size={32} /></div>
            ) : (
              items.map((item: any) => (
                <div key={item.id} className="bg-white rounded-[44px] p-3 border border-gray-50 shadow-sm">
                  <div className="relative h-60 w-full bg-[#F2F4F7] rounded-[36px] overflow-hidden flex items-center justify-center">
                    <img src={item.images?.[0]?.url || item.image_url} className="w-full h-full object-cover" alt={item.title} />
                  </div>
                  <div className="p-5 flex justify-between items-end">
                    <div>
                      <h4 className="text-lg font-black text-gray-900 italic uppercase tracking-tighter mb-1">{item.title}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Asset #{item.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-300 uppercase leading-none mb-1">Price</p>
                      <p className="text-xl font-black text-green-500 italic leading-none">{Number(item.currentBid).toFixed(2)} π</p>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedItem(item); setView('detail'); }}
                    className="w-full py-5 rounded-[28px] bg-[#1A1D21] text-white font-black uppercase text-[11px] tracking-[0.2em]">
                    View Auction <ChevronRight size={14} className="inline ml-1" />
                  </button>
                </div>
              ))
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
          <Camera size={14} /> Item Images (URLs)
        </p>
        <div className="space-y-3">
          {newListing.images.map((url, i) => (
            <input
              key={i}
              type="text"
              placeholder={`Image URL #${i + 1}`}
              className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-xs outline-none focus:border-green-500 transition-all"
              value={url}
              onChange={(e) => {
                const imgs = [...newListing.images];
                imgs[i] = e.target.value;
                setNewListing({...newListing, images: imgs});
              }}
            />
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
         className="w-full py-4 mb-6 rounded-3xl bg-green-500 text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-lg flex items-center justify-center gap-2"
      >
        {loading ? <RefreshCcw className="animate-spin" /> : "Publish Auction"}<Camera size={12}/>
      </button>
    </div>
  </div>
)}

        {/* INVENTORY VIEW (Add this block!) */}
  {view === 'inventory' && (
    <div className="space-y-6">
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Your Listings ({items.length})</h3>
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
    </div>
  )}

        {view === 'detail' && selectedItem && (
          <div className="animate-in fade-in slide-in-from-right duration-300">
            <button onClick={() => setView('market')} className="mb-6 flex items-center gap-2 font-black uppercase text-[10px] tracking-widest text-gray-400">
               <ChevronRight className="rotate-180" size={14}/> Back to Market
            </button>
            
            {/* RELATIONAL IMAGE CAROUSEL */}
            <div className="bg-white rounded-[48px] p-4 shadow-sm mb-8">
               <div className="h-[400px] bg-gray-100 rounded-[40px] flex gap-2 overflow-x-auto snap-x no-scrollbar">
                  {selectedItem.images && selectedItem.images.length > 0 ? (
                    selectedItem.images.map((img: any) => (
                      <div key={img.id} className="min-w-full h-full snap-center overflow-hidden rounded-[40px]">
                        <img src={img.url} className="w-full h-full object-cover" alt="Auction Gallery" />
                      </div>
                    ))
                  ) : (
                    <div className="min-w-full h-full">
                      <img src={selectedItem.image_url} className="w-full h-full object-cover" alt="Main Item" />
                    </div>
                  )}
               </div>
               <div className="flex justify-center gap-2 mt-4">
                  {(selectedItem.images?.length || 1) > 1 && selectedItem.images.map((_: any, i: number) => (
                    <div key={i} className={`h-1.5 rounded-full ${i === 0 ? 'w-8 bg-[#1A1D21]' : 'w-2 bg-gray-200'}`}></div>
                  ))}
               </div>
            </div>

            <div className="px-2 pb-20">
              {/* SELLER IDENTITY BADGE */}
      {user?.username?.replace('@', '') === selectedItem.seller_id && (
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-[0.15em] mb-4 border border-blue-100">
          <Package size={12} /> Your Listing
        </div>
      )}
              <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-2">{selectedItem.title}</h2>
              <p className="text-gray-500 leading-relaxed mb-8 text-sm">{selectedItem.description || "No description provided."}</p>
              <div className="bg-white p-6 rounded-[32px] border border-gray-50 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
            {user?.username?.replace('@', '') === selectedItem.seller_id ? "Total Bids" : "Highest Bid"}
          </p>
          <p className="text-2xl font-black text-green-500 italic">
            {user?.username?.replace('@', '') === selectedItem.seller_id 
              ? (selectedItem._count?.bids || 0) 
              : `${Number(selectedItem.currentBid).toFixed(2)} π`}
          </p>
        </div>
              
              <div className="flex justify-between items-center mb-10 bg-white p-6 rounded-[32px] border border-gray-50 shadow-sm">
                 <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Highest Bid</p>
                    <p className="text-3xl font-black text-green-500 italic">{Number(selectedItem.currentBid).toFixed(2)} π</p>
                 </div>
           <div className="bg-white p-6 rounded-[32px] border border-gray-50 shadow-sm">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
             Status
           </p>
           <p className={`text-xl font-black italic uppercase ${selectedItem.status === 'CANCELLED' ? 'text-red-500' : 'text-green-500'}`}>
             {selectedItem.status}
           </p>
        </div>      
           <div className="bg-white p-6 rounded-[32px] border border-gray-50 shadow-sm text-right">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ends In</p>
           <p className="text-lg font-black italic uppercase">
             {selectedItem.status === 'CANCELLED' ? (
               <span className="text-gray-300">--:--:--</span>
             ) : (
               <AuctionTimer expiryDate={selectedItem.expires_at} />
             )}
           </p>
        </div>
              
              </div>
              
  {/* CONDITIONAL ACTION BUTTONS */}
      {user?.username?.replace('@', '') === selectedItem.seller_id ? (
        <div className="space-y-4">
          <button 
  onClick={handleCancelAuction}
  disabled={loading}
  className="w-full py-6 rounded-[32px] border-2 border-red-100 text-red-500 font-black uppercase tracking-[0.2em] hover:bg-red-50 transition-all flex items-center justify-center gap-2"
>
  {loading ? <RefreshCcw className="animate-spin" size={18} /> : "Cancel Auction"}
</button>
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <Gavel size={14} />
            <p className="text-[9px] font-bold uppercase tracking-widest">Ownership protection active</p>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => user ? setIsBidModalOpen(true) : handleLogin()}
          className="w-full py-6 rounded-[32px] bg-[#1A1D21] text-white font-black uppercase tracking-[0.2em] shadow-xl active:scale-[0.98] transition-transform"
        >
          {user ? "Place your bid" : "Login to Bid"}
        </button>
      )}

            </div>
          </div>
        )}
      </main>

      {/* BOTTOM NAV */}
      {view !== 'detail' && (
        <nav className="fixed bottom-8 left-8 right-8 h-20 bg-[#1A1D21]/95 backdrop-blur-xl rounded-[32px] flex items-center justify-around px-6 shadow-2xl z-50">
          <button className="text-white bg-white/10 p-4 rounded-2xl" onClick={() => setView('market')}><Home size={22} /></button>
          <button className="text-gray-500"><Search size={22} /></button>
          <button className="text-gray-500" onClick={() => setView('inventory')}><Gavel size={22} /></button>
          {/* THE CENTRAL SELL BUTTON */}
    <button className="text-white bg-white/10 p-4 rounded-2xl"  onClick={() => setView('create' as any)}>  <Plus size={22}  /></button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-400 to-blue-400"></div>
        </nav>
      )}

      {/* BID MODAL (2nd Image Layout) */}
      {isBidModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-end justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-[48px] p-8 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-500">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black uppercase italic tracking-tight">Place your bid</h3>
                <X onClick={() => setIsBidModalOpen(false)} className="text-gray-400 cursor-pointer" />
              </div>
              <div className="flex gap-3 mb-6">
                  {[0.5, 1, 5, 10].map(val => (
                     <button key={val} onClick={() => setBidAmount((Number(selectedItem.currentBid) + val).toFixed(2))}
                      className="flex-1 py-3 bg-gray-50 rounded-2xl text-[10px] font-black border border-gray-100 active:bg-green-100">
                        +{val} π
                     </button>
                  ))}
              </div>
              <div className="bg-[#F8F9FB] py-10 rounded-[40px] mb-8 border border-gray-100 text-center">
                <input type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={(Number(selectedItem.currentBid) + 0.1).toFixed(2)} 
                  className="bg-transparent text-6xl font-black text-gray-900 outline-none w-full text-center" 
                />
              </div>
              <button onClick={handleBidAction} disabled={isPaying}
                className="w-full py-6 rounded-[32px] bg-green-500 text-white font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg">
                {isPaying ? <RefreshCcw className="animate-spin" /> : <TrendingUp size={20} />}
                {isPaying ? 'Processing...' : 'Confirm Bid'}
              </button>
            </div>
        </div>
      )}
    </div>
  );
}