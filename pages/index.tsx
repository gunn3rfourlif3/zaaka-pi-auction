import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, Camera, Gavel, RefreshCcw, X, 
  CreditCard, Search, Bell, Timer, TrendingUp, 
  ChevronRight, Wallet, Filter, Home 
} from 'lucide-react';

export default function ZaakaDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [view, setView] = useState<'market' | 'inventory'>('market');
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(false);

  // 1. STABILIZED AUTHENTICATION
  const handleLogin = async () => {
    if (isInitializing || user || !(window as any).Pi) return;
    setIsInitializing(true);

    try {
      const Pi = (window as any).Pi;
      // Initialize with Sandbox flag to match the portal
      await Pi.init({ version: "2.0", sandbox: true });
      
      // Delay to let the postMessage bridge verify the ngrok origin
      await new Promise(resolve => setTimeout(resolve, 1500));

      const auth = await Pi.authenticate(['username', 'payments'], (payment: any) => {
        console.log("Incomplete payment detected:", payment);
      });

      setUser(auth.user);
    } catch (err: any) {
      console.error("Auth Error:", err);
    } finally {
      setIsInitializing(false);
    }
  };

  // 2. DATA FETCHING
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
    if (!bidAmount || parseFloat(bidAmount) <= 0) return alert("Enter a valid amount.");
    setIsPaying(true);
    try {
      await (window as any).Pi.createPayment({
        amount: parseFloat(bidAmount),
        memo: `Bid: ${selectedItem.title}`,
        metadata: { auctionId: selectedItem.id },
      }, {
        onReadyForServerApproval: (id: string) => console.log("Server Approval ID:", id),
        onReadyForServerCompletion: (id: string, txid: string) => {
          alert("Bid Successful!");
          setSelectedItem(null);
          setIsPaying(false);
          fetchItems();
        },
        onCancel: () => setIsPaying(false),
        onError: (err: Error) => {
          alert("Wallet Error: " + err.message);
          setIsPaying(false);
        }
      });
    } catch (err: any) {
      alert("Trigger Failed: " + err.message);
      setIsPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#1A1D21] pb-36 font-sans antialiased">
      
      {/* HEADER */}
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

        {/* ACCOUNT STATUS CARD */}
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
            <button 
              onClick={handleLogin}
              disabled={isInitializing}
              className="bg-green-500 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-wider active:scale-95 transition-all flex items-center gap-2"
            >
              {isInitializing ? <RefreshCcw size={14} className="animate-spin" /> : <TrendingUp size={14} />}
              {isInitializing ? "SYNCING..." : "CONNECT"}
            </button>
          ) : (
            <div className="bg-white/10 p-3 rounded-2xl"><Wallet size={24} className="text-green-400" /></div>
          )}
        </div>
      </header>

      <main className="px-6 pt-10">
        {/* VIEW TOGGLE */}
        <div className="flex gap-4 mb-8">
          {['Market', 'Inventory'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setView(tab.toLowerCase() as any)}
              className={`flex-1 py-4 rounded-full text-[10px] font-black tracking-[0.1em] transition-all uppercase ${
                view === tab.toLowerCase() ? 'bg-[#1A1D21] text-white shadow-xl' : 'bg-white text-gray-400 border border-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* LISTINGS */}
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black tracking-widest uppercase italic text-gray-400">
              {view === 'market' ? "Live Auctions" : "Your Collection"}
            </h3>
            <Filter size={16} className="text-gray-300" />
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-24 gap-4 opacity-20">
              <RefreshCcw className="animate-spin" size={32} />
            </div>
          ) : (
            items.map((item: any) => (
              <div key={item.id} className="bg-white rounded-[44px] p-3 border border-gray-50 shadow-sm group">
                <div className="relative h-60 w-full bg-[#F2F4F7] rounded-[36px] overflow-hidden flex items-center justify-center">
                  {item.title.toLowerCase().includes('camera') ? <Camera size={48} className="text-gray-300" /> : <Package size={48} className="text-gray-300" />}
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 shadow-sm">
                    <Timer size={14} className="text-red-500" />
                    <span className="text-[10px] font-black text-gray-900 tracking-tighter uppercase italic">04:12:08</span>
                  </div>
                </div>

                <div className="p-5 flex justify-between items-end">
                  <div>
                    <h4 className="text-lg font-black text-gray-900 italic uppercase tracking-tighter mb-1">{item.title}</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ref #{item.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-300 uppercase leading-none mb-1 tracking-tighter">Current Bid</p>
                    <p className="text-xl font-black text-green-500 italic leading-none">24.50 π</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => user ? setSelectedItem(item) : handleLogin()}
                  className="w-full bg-[#1A1D21] text-white py-5 rounded-[28px] font-black uppercase text-[11px] tracking-[0.2em] shadow-lg active:scale-[0.97] transition-all flex items-center justify-center gap-2 hover:bg-green-500"
                >
                  {user ? "Place a Bid" : "Login to Bid"}
                  <ChevronRight size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </main>

      {/* FLOATING NAV */}
      <nav className="fixed bottom-8 left-8 right-8 h-20 bg-[#1A1D21]/95 backdrop-blur-xl rounded-[32px] flex items-center justify-around px-6 shadow-2xl z-50">
        <button className="text-white bg-white/10 p-4 rounded-2xl"><Home size={22} /></button>
        <button className="text-gray-500"><Search size={22} /></button>
        <button className="text-gray-500"><Gavel size={22} /></button>
        <button className="text-gray-500"><div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-400 to-blue-400"></div></button>
      </nav>

      {/* MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-end justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[48px] p-8 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-500">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-gray-900 italic tracking-tighter uppercase">{selectedItem.title}</h3>
              <X onClick={() => setSelectedItem(null)} className="text-gray-400 cursor-pointer" />
            </div>
            <div className="bg-[#F8F9FB] py-10 rounded-[40px] mb-8 border border-gray-100 text-center">
              <input 
                type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)}
                placeholder="0.00" className="bg-transparent text-6xl font-black text-gray-900 outline-none w-full text-center" 
              />
              <span className="text-xl font-black text-green-500 italic">PI</span>
            </div>
            <button 
              onClick={handleBidAction} disabled={isPaying}
              className={`w-full py-6 rounded-[32px] font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 ${isPaying ? 'bg-gray-100 text-gray-400' : 'bg-green-500 text-white shadow-xl shadow-green-200 active:scale-95'}`}
            >
              {isPaying ? <RefreshCcw className="animate-spin" /> : <TrendingUp size={20} />}
              {isPaying ? 'Processing...' : 'Place Bid Now'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}