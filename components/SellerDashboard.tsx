import { useState, useEffect } from 'react';

interface SoldItem {
  id: number;
  title: string;
  current_bid: number;
  status: 'COMPLETED' | 'CLOSED' | 'SETTLED_TO_SELLER';
  end_time: string;
}

export default function SellerDashboard({ sellerId }: { sellerId: string }) {
  const [items, setItems] = useState<SoldItem[]>([]);

  // Fetch items belonging to this seller
  useEffect(() => {
    fetch(`/api/seller/items?sellerId=${sellerId}`)
      .then(res => res.json())
      .then(data => setItems(data));
  }, [sellerId]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-pi-purple">🏪 Seller Studio</h2>
      
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="border p-5 rounded-2xl bg-white shadow-sm flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold">{item.title}</h3>
              <p className="text-xl text-purple-700 font-mono">{item.current_bid} Pi</p>
            </div>

            <div className="text-right">
              {item.status === 'COMPLETED' && (
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                  ⏳ Waiting for Payment Settlement
                </span>
              )}
              {item.status === 'CLOSED' && (
                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
                  📦 Pi Held in Escrow (Ship Item Now)
                </span>
              )}
              {item.status === 'SETTLED_TO_SELLER' && (
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                  💰 Paid to Wallet
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}