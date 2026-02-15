import React from 'react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ReleaseFundsButton } from '../../components/ReleaseFundsButton';

export default function AuctionDetailPage() {
const router = useRouter();
const { id } = router.query;
const [auction, setAuction] = useState(null);

useEffect(() => {
if (id) {
setAuction({ id: Number(id), status: 'ESCROWED' });
}
}, [id]);

if (!auction) {
return React.createElement('div', { style: { padding: '20px' } }, 'Loading Auction Details...');
}

return (
<div style={{ maxWidth: '450px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
<h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>
Auction #{auction.id}
</h1>

  <div style={{ margin: '20px 0', padding: '15px', background: '#f0f4f8', borderRadius: '10px' }}>
    <p><strong>Status:</strong> {auction.status}</p>
    <p style={{ fontSize: '14px', color: '#555' }}>
      The Pi is currently held in our secure escrow ledger.
    </p>
  </div>

  <ReleaseFundsButton 
    auctionId={auction.id} 
    onSuccess={(txid: string) => alert("Payout Success! TX: " + txid)} 
  />
</div>
);
}