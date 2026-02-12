import BuyerDashboard from '../components/BuyerDashboard';
import SellerDashboard from '../components/SellerDashboard';

export default function Home() {
  // In a real app, these would come from your Pi SDK Auth
  const MOCK_USER_ID = "pioneer_123"; 
  
  // Mock data for initial render test
  const wonItems = [
    { id: 2, title: "Vintage Pi Coin Physical Edition", amount: 50, status: "CLOSED" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-purple-900">Zaaka Auction Console</h1>
        <p className="text-gray-600">Testing Environment: Protocol v23</p>
      </div>

      <BuyerDashboard wonItems={wonItems} buyerId={MOCK_USER_ID} />
      
      <div className="my-10 border-t border-gray-200" />
      
      <SellerDashboard sellerId={MOCK_USER_ID} />
    </div>
  );
}
