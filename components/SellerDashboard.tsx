import React, { useEffect, useState } from 'react';

interface AuctionItem {
  id: number;
  title: string;
  seller_id: string;
  status: string;
  created_at: string;
}

const SellerDashboard = () => {
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Using the ID from your database row
  const sellerId = "pioneer_123"; 

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch(`/api/seller/items?sellerId=${sellerId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.details || data.error || 'Failed to fetch');
        }

        setItems(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [sellerId]);

  if (loading) return <div className="p-8">Loading your auctions...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Seller Dashboard</h1>
      
      <div className="grid gap-4">
        {items.length === 0 ? (
          <p className="text-gray-500">No auction items found.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="border p-4 rounded-lg shadow-sm bg-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">{item.title}</h2>
                <p className="text-sm text-gray-500">ID: #{item.id}</p>
                <p className="text-sm text-gray-400">Created: {new Date(item.created_at).toLocaleDateString()}</p>
              </div>
              
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  item.status === 'SETTLED_TO_SELLER' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {item.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;