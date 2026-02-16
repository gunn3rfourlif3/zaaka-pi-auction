import React, { useState, useEffect, useCallback } from 'react';
import { Package, Camera, Gavel, CheckCircle, RefreshCcw, LayoutDashboard, ShoppingBag } from 'lucide-react';

export default function AuctionDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'market' | 'inventory'>('market');
  const sellerId = "pioneer_123"; 

  // Use useCallback to ensure the function is stable
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setItems([]); // Clear current items to show it's loading fresh
    
    try {
      const endpoint = view === 'market' 
        ? '/api/auctions/live' 
        : `/api/seller/items?sellerId=${sellerId}`;
      
      console.log(`Fetching from: ${endpoint}`); // Debugging line
        
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Network response was not ok');
      
      const data = await res.json();
      console.log("Data received:", data); // Debugging line
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [view, sellerId]); // Re-create function only when view or sellerId changes

  // Trigger fetch every time view changes
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen pb-28 font-sans border-x border-gray-200">
      {/* Header */}
      <header className="p-6 bg-white border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight italic">ZAAKA</h1>
          <p className="text-[10px] text-purple-600 font-bold uppercase tracking-widest leading-none mt-1">
            {view === 'market' ? 'Global Market' : 'Your Escrow'}
          </p>
        </div>
        <div className="bg-gray-100 p-2 rounded-xl text-gray-400">
          <LayoutDashboard size={20} />
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Toggle Indicator */}
        <div className="flex gap-2 p-1 bg-gray-200/50 rounded-2xl">
          <button 
            onClick={() => setView('market')}
            className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all ${view === 'market' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
          >
            Marketplace
          </button>
          <button 
            onClick={() => setView('inventory')}
            className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all ${view === 'inventory' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
          >
            Inventory
          </button>
        </div>

        {/* Items List */}
        <div className="space-y-3">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <RefreshCcw className="animate-spin mb-2" size={32} />
                <p className="text-xs font-bold uppercase tracking-tighter">Syncing Blockchain...</p>
             </div>
          ) : items.length > 0 ? (
            items.map((item: any) => (
              <div key={item.id} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${item.status === 'OPEN' ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-500'}`}>
                    {item.title.toLowerCase().includes('camera') ? <Camera size={20} /> : <Package size={20} />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                    <p className="text-[10px] text-gray-400 font-mono">STATUS: {item.status}</p>
                  </div>
                  <button className="bg-gray-900 text-white text-[10px] px-4 py-2 rounded-xl font-black active:scale-95 transition-transform">
                    {view === 'market' ? 'BID' : 'VIEW'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-400 text-sm font-medium">No {view} items found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-gray-100 px-8 py-4 flex justify-between items-center">
        <button onClick={() => setView('market')} className={`flex flex-col items-center ${view === 'market' ? 'text-blue-600' : 'text-gray-300'}`}>
          <Gavel size={24} />
          <span className="text-[9px] font-black mt-1 uppercase tracking-widest">Market</span>
        </button>
        <button onClick={() => setView('inventory')} className={`flex flex-col items-center ${view === 'inventory' ? 'text-blue-600' : 'text-gray-300'}`}>
          <Package size={24} />
          <span className="text-[9px] font-black mt-1 uppercase tracking-widest">Inventory</span>
        </button>
      </nav>
    </div>
  );
}