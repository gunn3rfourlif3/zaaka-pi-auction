import { useState } from 'react';

interface WonItem {
  id: number;
  title: string;
  amount: number;
  status: string;
}

export default function BuyerDashboard({ wonItems, buyerId }: { wonItems: WonItem[], buyerId: string }) {
  const [loading, setLoading] = useState<number | null>(null);

  const handleConfirm = async (auctionId: number) => {
    setLoading(auctionId);
    try {
      const res = await fetch('/api/auctions/confirm-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auctionId, buyerId }),
      });

      if (res.ok) {
        alert("Success! Pi released to seller. Trust Score updated.");
        window.location.reload();
      } else {
        throw new Error("Payout failed.");
      }
    } catch (err) {
      alert(err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-pi-purple">🏆 Your Won Items</h2>
      <div className="grid gap-4">
        {wonItems.map((item) => (
          <div key={item.id} className="border p-4 rounded-xl shadow-sm bg-white flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-lg">{item.title}</h3>
              <p className="text-gray-500">{item.amount} Pi</p>
              <span className={`text-xs px-2 py-1 rounded ${item.status === 'CLOSED' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                {item.status === 'CLOSED' ? '📦 In Transit / In Escrow' : '✅ Completed'}
              </span>
            </div>
            
            {item.status === 'CLOSED' && (
              <button
                onClick={() => handleConfirm(item.id)}
                disabled={loading === item.id}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {loading === item.id ? "Processing..." : "Confirm Receipt"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}