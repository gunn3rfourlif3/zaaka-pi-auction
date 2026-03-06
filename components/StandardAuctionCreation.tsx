import React, { useState } from 'react';
import { Camera, RefreshCcw, X, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

interface StandardAuctionCreationProps {
  user: { username: string; uid: string } | null;
  onAuctionCreated: () => void;
  onSwitchToAI: () => void;
  handleLogin: () => void;
}

export const StandardAuctionCreation: React.FC<StandardAuctionCreationProps> = ({
  user,
  onAuctionCreated,
  onSwitchToAI,
  handleLogin
}) => {
  const [loading, setLoading] = useState(false);
  const [newListing, setNewListing] = useState({
    title: '',
    description: '',
    price: '',
    images: ['', '', ''], // Three image slots
    duration: '0.0833', // Default to 5 minutes (5/60 hours)
    category: 'Fashion' // Default category
  });

  const categories = ['Fashion', 'Electronics', 'Collectibles', 'Home Goods', 'Vehicles', 'Comics', 'Art', 'Jewelry', 'Sports', 'Books'];

  // --- IMAGE UPLOADER LOGIC ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800; // Resize to max 800px width
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Compress to JPEG at 0.7 quality (70%)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        
        const newImages = [...newListing.images];
        newImages[index] = dataUrl;
        setNewListing({ ...newListing, images: newImages });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...newListing.images];
    newImages[index] = '';
    setNewListing({ ...newListing, images: newImages });
  };

  const handleCreateListing = async () => {
    // 1. AUTH CHECK: Only let logged-in users proceed
    if (!user) {
      toast.error("You must be logged in to publish an auction.");
      handleLogin(); // Trigger your login function
      return;
    }

    const durationHours = parseFloat(newListing.duration);
    const durationMinutes = Math.round(durationHours * 60); // Convert hours to minutes
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + durationMinutes);

    // 2. VALIDATION CHECK
    if (!newListing.title || !newListing.price) {
      toast.error("Please fill in the title and price.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auctions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newListing.title,
          description: newListing.description,
          startPrice: newListing.price,
          price: newListing.price, // Ensure compatibility
          category: newListing.category,
          sellerId: user.username.replace('@', ''), // Uses authenticated username
          imageUrls: newListing.images.filter(url => url !== ''),
          expiresAt: expirationDate.toISOString()
        })
      });

      if (res.ok) {
        MySwal.fire({
          title: 'Success!',
          text: 'Your auction is live.',
          icon: 'success',
          confirmButtonColor: '#22c55e',
          confirmButtonText: 'Great!'
        });
        setNewListing({ title: '', description: '', price: '', duration: '0.0833', images: ['', '', ''], category: 'General' });
        onAuctionCreated();
      } else {
        const err = await res.json();
        console.error("Creation failed:", err);
        MySwal.fire({
          title: 'Error',
          text: err.error || "Unknown error",
          icon: 'error'
        });
      }
    } catch (err) {
      console.error("Creation failed", err);
      MySwal.fire({
        title: 'Network Error',
        text: "Failed to connect to server. Please try again.",
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-32 animate-in fade-in duration-300">
      {/* Return to AI header */}
      <div className="flex items-center justify-between p-3 rounded-[40px] border-2 bg-gray-50 border-gray-200">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">
          <span>Standard Mode</span>
        </div>
        <button
          onClick={onSwitchToAI}
          className="flex items-center gap-2 px-4 py-2 rounded-[40px] text-[9px] font-black uppercase tracking-[0.2em] transition-all bg-green-500 text-white hover:bg-green-600"
        >
          Vision AI
        </button>
      </div>

      {/* Image URL Inputs */}
      <div className="bg-white p-6 rounded-[40px] shadow-sm border border-gray-50">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
          <Camera size={14} /> Item Images
        </p>
        <div className="grid grid-cols-3 gap-3">
          {newListing.images.map((img, i) => (
            <div key={i} className="relative aspect-square rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center group">
              {img ? (
                <>
                  <img src={img} className="w-full h-full object-cover" alt="Upload Preview" />
                  <button 
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full shadow-lg"
                    onClick={() => handleRemoveImage(i)}
                  >
                    <X size={10} />
                  </button>
                </>
              ) : (
                <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-gray-300 hover:text-green-500 transition-colors">
                  <Plus size={20} />
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => handleImageUpload(e, i)}
                  />
                </label>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-[40px] shadow-sm border border-gray-50">
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 block">
          Item Category
        </label>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setNewListing({ ...newListing, category: cat })}
              className={`px-5 py-2.5 rounded-full text-[11px] font-bold transition-all border ${
                newListing.category === cat
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105'
                  : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Details Section */}
      <div className="bg-white p-6 rounded-[40px] shadow-sm border border-gray-50 space-y-4">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Listing Title</label>
          <input
            type="text"
            placeholder="e.g. Vintage Rolex Submariner"
            className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none"
            value={newListing.title}
            onChange={(e) => setNewListing({...newListing, title: e.target.value})}
          />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Starting Price (π)</label>
          <input
            type="number"
            placeholder="0.00"
            className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none"
            value={newListing.price}
            onChange={(e) => setNewListing({...newListing, price: e.target.value})}
          />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Description</label>
          <textarea
            rows={4}
            placeholder="Tell us about the history and condition..."
            className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm outline-none resize-none"
            value={newListing.description}
            onChange={(e) => setNewListing({...newListing, description: e.target.value})}
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
          Auction Duration
        </label>
        <div className="flex gap-2">
          {[5, 10, 15, 30].map((minutes) => (
            <button
              key={minutes}
              onClick={() => setNewListing({...newListing, duration: (minutes/60).toString()})}
              className={`flex-1 py-3 rounded-2xl text-[10px] font-black border transition-all ${
                newListing.duration === (minutes/60).toString()
                  ? 'bg-[#1A1D21] text-white border-[#1A1D21]'
                  : 'bg-gray-50 text-gray-400 border-gray-100'
              }`}
            >
              {minutes}M
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleCreateListing}
        disabled={loading}
        className={`w-full py-4 mb-6 rounded-3xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg flex items-center justify-center gap-2 ${
          !user ? 'bg-gray-400 text-white' : 'bg-green-500 text-white'
        }`}
      >
        {loading ? (
          <RefreshCcw className="animate-spin" />
        ) : !user ? (
          "Login to Publish"
        ) : (
          "Publish Auction"
        )}
        <Camera size={12}/>
      </button>
    </div>
  );
};
