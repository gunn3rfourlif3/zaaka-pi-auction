import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, Camera, Gavel, RefreshCcw, X, 
  CreditCard, Search, Bell, Timer, TrendingUp, 
  ChevronRight, Wallet, Filter, Home, Trophy 
} from 'lucide-react';

export default function ZaakaDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [view, setView] = useState<'market' | 'inventory'>('market');
  const [user, setUser] = useState<{ username: string; uid: string } | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(false);

  // 1. AUTHENTICATION LOGIC
  useEffect(() => {
const syncPi = async () => {
if (typeof window !== "undefined" && (window as any).Pi) {
try {
await (window as any).Pi.init({ version: "2.0", sandbox: true });
console.log("Handshake successful with ngrok origin");
} catch (e) {
console.warn("Init pending...");
}
}
};
syncPi();
}, []);

  const handleLogin = async () => {
    console.log("LOGIN ATTEMPT STARTED");
if (isInitializing) { console.log("Already initing..."); return; }
if (!(window as any).Pi) { alert("Pi SDK not found! Use Pi Browser."); return; }
setIsInitializing(true);

try {
const Pi = (window as any).Pi;
console.log("Initing Pi...");
await Pi.init({ version: "2.0", sandbox: true });
await new Promise(resolve => setTimeout(resolve, 1000));
console.log("Authenticating...");
const auth = await Pi.authenticate(['username', 'payments'], (p: any) => {});
setUser(auth.user);
} catch (err: any) {
  console.error("SDK Error:", err);
  } finally {
    setIsInitializing(false);
    }
    };


  // 2. DATA FETCHING (MySQL Sanity Check)
  const fetchItems = useCallback(async () => {
    setLoading(true);
    const activeUser = user?.username || "guest";
    try {
      const endpoint = view === 'market' ? '/api/auctions/live' : `/api/seller/items?sellerId=${activeUser}`;
      const res = await fetch(endpoint);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [view, user]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // 3. PAYMENT HANDLER
  const handleBidAction = async () => {
  // 1. Initial UI Checks
  if (!bidAmount || parseFloat(bidAmount) <= 0) {
    alert("Please enter a valid bid amount.");
    return;
  }

  if (!user || !user.uid) {
    alert("Please connect your wallet first.");
    handleLogin();
    return;
  }

  setIsPaying(true);

  try {
    // 2. HIT THE GATEKEEPER API FIRST (Server-side validation)
    const checkRes = await fetch('/api/auctions/bid-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        auctionId: selectedItem.id, 
        bidAmount: bidAmount,
        userUid: user.uid // Verified Pi User ID
      })
    });

    const checkData = await checkRes.json();

    if (!checkRes.ok) {
      // Handles: Bid too low, already winning, or auction closed
      alert(checkData.error || "Validation failed.");
      setIsPaying(false);
      return;
    }

    // 3. ONLY IF VALID, PROCEED TO PI WALLET HANDSHAKE
    await (window as any).Pi.createPayment({
      amount: parseFloat(bidAmount),
      memo: `Bid for ${selectedItem.title} on Zaaka`,
      metadata: { 
        auctionId: selectedItem.id,
        buyerUid: user.uid 
      },
    }, {
      // Pi Server Approval Step
      onReadyForServerApproval: async (paymentId) => {

console.log("Approving on backend...");

const response = await fetch('/api/payments/approve', {

method: 'POST',

headers: { 'Content-Type': 'application/json' },

body: JSON.stringify({ paymentId })

});

return response.ok;

},

      // Pi Blockchain Completion Step
      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        const completeRes = await fetch('/api/payments/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId, txid })
        });

        if (completeRes.ok) {
          alert("Bid placed successfully! You are now the high bidder.");
          setSelectedItem(null);
          setBidAmount('');
          fetchItems(); // Refresh the MySQL feed to show the new price
        }
      },

      onCancel: () => {
        console.log("User cancelled payment.");
        setIsPaying(false);
      },

      onError: (error: Error) => {
        console.error("Pi Wallet Error:", error);
        alert("Wallet error: " + error.message);
        setIsPaying(false);
      }
    });

  } catch (err: any) {
    console.error("Bidding System Error:", err);
    alert("An unexpected error occurred. Please try again.");
    setIsPaying(false);
  }
};
  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#1A1D21] pb-36 font-sans antialiased">
      
      {/* HEADER SECTION */}
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

        {/* ACCOUNT STATUS */}
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
     <button onClick={handleLogin} disabled={isInitializing || !!user} className="bg-green-500 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2">
              {isInitializing ? "SYNCING..." : "CONNECT WALLET"}
            </button>
          ) : (
            <div className="bg-white/10 p-3 rounded-2xl"><Wallet size={24} className="text-green-400" /></div>
          )}
        </div>
      </header>

      <main className="px-6 pt-10">
        {/* TAB SWITCHER */}
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

        {/* ITEM FEED */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center py-24 opacity-20"><RefreshCcw className="animate-spin" size={32} /></div>
          ) : (
            items.map((item: any) => (
              <div key={item.id} className="bg-white rounded-[44px] p-3 border border-gray-50 shadow-sm group">
                <div className="relative h-60 w-full bg-[#F2F4F7] rounded-[36px] overflow-hidden flex items-center justify-center">
                  {item.title.toLowerCase().includes('camera') ? <Camera size={48} className="text-gray-300" /> : <Package size={48} className="text-gray-300" />}
                  
                  {/* WINNING BADGE */}
                  {user && item.highBidderId === user.uid && (
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg animate-bounce z-10">
                      <Trophy size={14} />
                      <span className="text-[10px] font-black uppercase tracking-tighter">Winning</span>
                    </div>
                  )}

                  {/* TIMER BADGE */}
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 shadow-sm">
                    <Timer size={14} className="text-red-500" />
                    <span className="text-[10px] font-black text-gray-900 tracking-tighter uppercase italic">04:12:08</span>
                  </div>
                </div>

                <div className="p-5 flex justify-between items-end">
                  <div>
                    <h4 className="text-lg font-black text-gray-900 italic uppercase tracking-tighter mb-1">{item.title}</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Asset #{item.id}</p>
                  </div>
                  <div className="text-right">
                    
                    <p className="text-[10px] font-black text-gray-300 uppercase leading-none mb-1">Current Bid</p>
                    <p className="text-xl font-black text-green-500 italic leading-none">
                      {Number(item.currentBid).toFixed(2)} <span className="text-sm">π</span>
                    </p>
                  </div>
                </div>
                
                <button 
  onClick={() => user ? setSelectedItem(item) : handleLogin()}
  className={`w-full py-5 rounded-[28px] font-black uppercase text-[11px] tracking-[0.2em] shadow-lg active:scale-[0.97] transition-all flex items-center justify-center gap-2 ${
    user && item.highBidderId === user.uid 
      ? 'bg-green-600 text-white cursor-default' 
      : 'bg-[#1A1D21] text-white hover:bg-green-500'
  }`}
>
  {user && item.highBidderId === user.uid ? (
    <>YOU ARE HIGH BIDDER <ChevronRight size={14} /></>
  ) : (
    <>{user ? "Place a Bid" : "Login to Bid"} <ChevronRight size={14} /></>
  )}
</button>
              </div>
            ))
          )}
        </div>
      </main>

      {/* NAVIGATION BAR */}
      <nav className="fixed bottom-8 left-8 right-8 h-20 bg-[#1A1D21]/95 backdrop-blur-xl rounded-[32px] flex items-center justify-around px-6 shadow-2xl z-50">
        <button className="text-white bg-white/10 p-4 rounded-2xl"><Home size={22} /></button>
        <button className="text-gray-500"><Search size={22} /></button>
        <button className="text-gray-500"><Gavel size={22} /></button>
        <button className="text-gray-500"><div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-400 to-blue-400"></div></button>
      </nav>

      {/* BID MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-end justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[48px] p-8 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-500">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-gray-900 italic tracking-tighter uppercase">{selectedItem.title}</h3>
              <X onClick={() => setSelectedItem(null)} className="text-gray-400 cursor-pointer" />
            </div>
            <div className="bg-[#F8F9FB] py-10 rounded-[40px] mb-8 border border-gray-100 text-center">
              <input type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)}
                placeholder="0.00" className="bg-transparent text-6xl font-black text-gray-900 outline-none w-full text-center" 
              />
              <span className="text-xl font-black text-green-500 italic">PI</span>
            </div>
            <div className="text-right">
  {selectedItem && (
    <p className="text-[10px] font-black text-red-3500 uppercase mb-1 tracking-widest animate-pulse">
      Min Bid: <span className="text-red-600 font-black">{(Number(selectedItem.currentBid) + 0.1).toFixed(2)}</span> π
    </p>
  )}
  <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Current Bid</p>
  <p className="text-xl font-black text-green-500 italic leading-none">
    {selectedItem?.currentBid ? Number(selectedItem.currentBid).toFixed(2) : "0.00"} π
  </p>
</div>
            <button onClick={handleBidAction} disabled={isPaying}
              className={`w-full py-6 rounded-[32px] font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 ${isPaying ? 'bg-gray-100 text-gray-400' : 'bg-green-500 text-white shadow-xl shadow-green-200 active:scale-95'}`}>
              {isPaying ? <RefreshCcw className="animate-spin" /> : <TrendingUp size={20} />}
              {isPaying ? 'Processing...' : 'Confirm Bid'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}