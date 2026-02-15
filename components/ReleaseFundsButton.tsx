import React, { useState, useEffect } from 'react';

export const ReleaseFundsButton = ({ auctionId, onSuccess }) => {
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [isCompleted, setIsCompleted] = useState(false);
const [uid, setUid] = useState(null);

useEffect(() => {
const authenticateUser = async () => {
try {
const Pi = (window as any).Pi;
if (Pi) {
const user = await Pi.authenticate(['username', 'payments']);
setUid(user.user.uid);
}
} catch (err) {
setError("Please open in Pi Browser.");
}
};
authenticateUser();
}, []);

const handleConfirmReceipt = async () => {
if (!uid) return alert("Wait for Pi authentication...");
if (!window.confirm("Confirm receipt? This releases funds to the seller.")) return;

setLoading(true);
try {
  const response = await fetch('/api/auctions/confirm-receipt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ auctionId, buyerId: uid }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  setIsCompleted(true);
  if (onSuccess) onSuccess(data.txid);
} catch (err) {
  setError(err.message);
} finally {
  setLoading(false);
}
};

if (isCompleted) {
return React.createElement('div', {
style: { color: 'green', fontWeight: 'bold', padding: '10px' }
}, '✅ Funds Released!');
}

return (
<div style={{ width: '100%' }}>
{error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
<button
onClick={handleConfirmReceipt}
disabled={loading || !uid}
style={{
width: '100%',
padding: '15px',
background: uid ? '#FFD700' : '#ccc',
border: 'none',
borderRadius: '12px',
fontWeight: 'bold',
cursor: uid ? 'pointer' : 'not-allowed'
}}
>
{loading ? "Processing..." : "I've Received the Item"}
</button>
</div>
);
};