import { useState } from 'react';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

interface WonItem {
  id: number;
  title: string;
  amount: number;
  status: string;
}

export default function BuyerDashboard({ wonItems, buyerId }: { wonItems: WonItem[], buyerId: string }) {
  const [loading, setLoading] = useState<number | null>(null);

  const handleConfirm = async (auctionId: number) => {
    MySwal.fire({
      title: 'Confirm Receipt',
      text: "Only confirm if you have received the item.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#7c3aed',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, I received it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoading(auctionId);
        try {
          const res = await fetch('/api/auctions/confirm-receipt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ auctionId, buyerId }),
          });

          if (res.ok) {
            MySwal.fire(
              'Confirmed!',
              'Pi has been released to the seller.',
              'success'
            ).then(() => {
              window.location.reload();
            });
          } else {
            throw new Error("Payout failed.");
          }
        } catch (err: any) {
          MySwal.fire('Error', err.message || "An error occurred", 'error');
        } finally {
          setLoading(null);
        }
      }
    });
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