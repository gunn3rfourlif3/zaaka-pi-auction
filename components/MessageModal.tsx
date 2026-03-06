import React, { useState, useEffect, useRef } from 'react';
import { X, Send, RefreshCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Message {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  auctionId: number;
  currentUserId: string; // The logged-in user's username/ID
  otherUserId: string;   // The person they are chatting with (seller or winner)
  otherUsername: string; // Display name for the header
  itemTitle: string;
  auctionSellerId?: string; // Optional: seller ID to determine roles
  winningBidderId?: string; // Optional: winner ID to determine roles
}

export const MessageModal: React.FC<MessageModalProps> = ({
  isOpen,
  onClose,
  auctionId,
  currentUserId,
  otherUserId,
  otherUsername,
  itemTitle,
  auctionSellerId,
  winningBidderId
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!isOpen) return;

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [isOpen, auctionId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages/list?auctionId=${auctionId}&userId=${currentUserId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Failed to load messages", error);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUserId,
          receiverId: otherUserId,
          auctionId: auctionId,
          content: newMessage
        })
      });

      if (res.ok) {
        setNewMessage('');
        fetchMessages(); // Refresh immediately
      } else {
        toast.error("Failed to send message");
      }
    } catch (error) {
      console.error("Send error:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md h-[600px] rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="font-black text-lg uppercase italic tracking-tighter text-gray-900">
              @{otherUsername}
            </h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase truncate max-w-[200px]">
              {itemTitle}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white rounded-full shadow-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300">
              <p className="text-xs font-bold uppercase tracking-widest">No messages yet</p>
              <p className="text-[10px] mt-2">Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === currentUserId;
              
              // Determine if sender is seller or winner based on auction context
              const isSenderSeller = auctionSellerId && msg.sender_id === auctionSellerId;
              const isSenderWinner = winningBidderId && msg.sender_id === winningBidderId;
              
              // Determine colors based on sender role
              let bubbleClasses = '';
              let timestampClasses = '';
              
              if (isMe) {
                // Current user's messages
                if (currentUserId === auctionSellerId) {
                  // Seller messages (green)
                  bubbleClasses = 'bg-green-600 text-white rounded-br-none';
                  timestampClasses = 'text-green-100';
                } else if (currentUserId === winningBidderId) {
                  // Winner messages (gold)
                  bubbleClasses = 'bg-yellow-500 text-white rounded-br-none';
                  timestampClasses = 'text-yellow-100';
                } else {
                  // Default fallback
                  bubbleClasses = 'bg-blue-600 text-white rounded-br-none';
                  timestampClasses = 'text-blue-100';
                }
              } else {
                // Other person's messages
                if (isSenderSeller) {
                  // Seller messages (green)
                  bubbleClasses = 'bg-green-600 text-white rounded-bl-none';
                  timestampClasses = 'text-green-100';
                } else if (isSenderWinner) {
                  // Winner messages (gold)
                  bubbleClasses = 'bg-yellow-500 text-white rounded-bl-none';
                  timestampClasses = 'text-yellow-100';
                } else {
                  // Default fallback
                  bubbleClasses = 'bg-gray-100 text-gray-800 rounded-bl-none';
                  timestampClasses = 'text-gray-400';
                }
              }
              
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium leading-relaxed ${bubbleClasses}`}
                  >
                    {msg.content}
                    <div className={`text-[9px] mt-1 font-bold uppercase tracking-wider opacity-60 ${timestampClasses}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <div className="relative flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              className="flex-1 bg-white border border-gray-200 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-blue-500 transition-all placeholder:text-gray-400"
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="p-4 bg-[#1A1D21] text-white rounded-2xl hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {sending ? <RefreshCcw className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
