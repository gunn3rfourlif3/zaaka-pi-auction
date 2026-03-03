import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ReleaseFundsButton } from '../../components/ReleaseFundsButton';
import Head from 'next/head';

export default function AuctionDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [auction, setAuction] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Handle real-time bid updates
  const handleBidUpdate = (data: any) => {
    if (data && data.auctionId === parseInt(id as string) && data.newBid) {
      console.log("🎯 Bid update received for auction", id, ":", data);
      
      setAuction((prevAuction: any) => {
        if (!prevAuction) return prevAuction;
        
        const updatedAuction = {
          ...prevAuction,
          currentBid: data.newBid,
          _count: {
            ...prevAuction._count,
            bids: (prevAuction._count?.bids || 0) + 1
          },
          bids: [
            {
              id: `bid_${Date.now()}`,
              amount: data.newBid,
              bidder_id: data.bidder || 'unknown',
              created_at: new Date().toISOString()
            },
            ...(prevAuction.bids || [])
          ]
        };
        
        console.log("✅ Updated auction state:", updatedAuction);
        return updatedAuction;
      });
      
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (!id) return;

    const getAuctionData = async () => {
      try {
        const response = await fetch(`/api/auctions/${id}`);
        const data = await response.json();
        setAuction(data);
      } catch (error) {
        console.error("Error fetching auction:", error);
      } finally {
        setLoading(false);
      }
    };

    getAuctionData();

    // Load bid update handler for real-time updates
    const loadBidUpdateHandler = () => {
      if (!document.getElementById('bid-update-handler')) {
        const script = document.createElement('script');
        script.id = 'bid-update-handler';
        script.src = '/bid-update-handler.js';
        script.onload = () => console.log("✅ Bid update handler loaded for detail view");
        script.onerror = () => console.log("❌ Could not load bid update handler for detail view");
        document.body.appendChild(script);
      }
    };

    loadBidUpdateHandler();

    // Make handleBidUpdate available globally for external scripts
    (window as any).handleAuctionDetailBidUpdate = handleBidUpdate;

    // Cleanup function
    return () => {
      delete (window as any).handleAuctionDetailBidUpdate;
    };
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#888', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '12px' }}>
        Syncing Ledger Data...
      </div>
    );
  }

  if (!auction) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Auction not found.</div>;
  }

  return (
    <>
      <Head>
        <link rel="stylesheet" href="/bid-update-styles.css" />
      </Head>
      <div style={{ maxWidth: '500px', margin: '40px auto', padding: '24px', fontFamily: 'sans-serif', color: '#1A1D1F' }}>
      
      {/* HEADER SECTION */}
      <h1 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '8px', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-1px' }}>
        {auction.title || `Asset #${auction.id}`}
      </h1>
      <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.5', marginBottom: '24px' }}>
        {auction.description || "No description provided for this asset."}
      </p>

      {/* KEY METRICS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <div style={{ padding: '20px', background: '#F8F9FB', borderRadius: '24px', border: '1px solid #F0F0F0' }}>
          <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#A0A0A0', textTransform: 'uppercase', margin: '0 0 4px 0', letterSpacing: '1px' }}>Current Price</p>
          <p className="bid-amount" data-auction-id={auction.id} style={{ fontSize: '22px', fontWeight: '900', color: '#10b981', margin: 0 }}>{Number(auction.currentBid).toFixed(2)} π</p>
        </div>
        <div style={{ padding: '20px', background: '#F8F9FB', borderRadius: '24px', border: '1px solid #F0F0F0' }}>
          <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#A0A0A0', textTransform: 'uppercase', margin: '0 0 4px 0', letterSpacing: '1px' }}>Total Bids</p>
          <p className="bid-count" data-auction-id={auction.id} style={{ fontSize: '22px', fontWeight: '900', margin: 0 }}>{auction._count?.bids || 0}</p>
        </div>
      </div>

      {/* STATUS & ACTIONS */}
      <div style={{ 
        padding: '24px', 
        background: auction.status === 'OPEN' ? '#EBF5FF' : '#F3F4F6', 
        borderRadius: '28px',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#4B5563', textTransform: 'uppercase' }}>Escrow Status</span>
          <span style={{ 
            fontSize: '10px', 
            fontWeight: '900', 
            background: auction.status === 'OPEN' ? '#3B82F6' : '#111827', 
            color: 'white', 
            padding: '4px 12px', 
            borderRadius: '100px',
            textTransform: 'uppercase'
          }}>
            {auction.status}
          </span>
        </div>

        {auction.status === 'OPEN' ? (
          <p style={{ fontSize: '13px', color: '#4B5563', margin: 0, lineHeight: '1.4' }}>
            Bidding is currently active. Escrow controls will unlock once the auction timer expires and the winning transaction is verified.
          </p>
        ) : (
          <div>
            <p style={{ fontSize: '13px', color: '#4B5563', marginBottom: '20px', lineHeight: '1.4' }}>
              The winning bid is secured. As the seller, you can now release the funds to your wallet.
            </p>
            <ReleaseFundsButton 
              auctionId={auction.id} 
              onSuccess={(txid: string) => alert("Payout Success! TX: " + txid)} 
            />
          </div>
        )}
      </div>

      {/* BID HISTORY LIST */}
      {auction.bids?.length > 0 && (
        <div style={{ marginTop: '40px' }}>
          <h3 style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', color: '#A0A0A0', letterSpacing: '1.5px', marginBottom: '20px', borderBottom: '1px solid #F0F0F0', paddingBottom: '10px' }}>
            Bid History
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {auction.bids.map((bid: any) => (
              <div key={bid.id} className="bid-history-item" data-auction-id={auction.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#1A1D21' }}>@{bid.bidder_id}</span>
                <span className="bid-history-amount" style={{ fontSize: '14px', fontWeight: '900', color: '#10B981' }}>{Number(bid.amount).toFixed(2)} π</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </>
  );
}