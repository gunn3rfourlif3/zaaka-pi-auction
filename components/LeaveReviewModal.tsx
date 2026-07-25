import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

/**
 * Modal for leaving a review after a completed auction. The server derives the
 * counterpart (buyer<->seller) from the auction's escrow record, so only an
 * auctionId is sent.
 *
 * Usage:
 *   <LeaveReviewModal auctionId={id} onClose={...} onSubmitted={...} />
 */
export function LeaveReviewModal({
  auctionId,
  onClose,
  onSubmitted,
}: {
  auctionId: number;
  onClose: () => void;
  onSubmitted?: () => void;
}) {
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (stars < 1) { toast.error('Please select a star rating.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auctionId, stars, comment }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Thanks for your review!');
        onSubmitted?.();
        onClose();
      } else {
        toast.error(data.error || 'Could not submit review.');
      }
    } catch {
      toast.error('Could not submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">Leave a review</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="mb-4 flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setStars(i)}
              aria-label={`${i} star`}
            >
              <Star
                size={32}
                className={i <= (hover || stars) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
              />
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          rows={4}
          placeholder="Share details of your experience (optional)"
          className="mb-4 w-full resize-none rounded-lg border border-gray-200 p-3 text-sm focus:border-green-500 focus:outline-none"
        />

        <button
          onClick={submit}
          disabled={submitting}
          className="w-full rounded-lg bg-green-600 py-2.5 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit review'}
        </button>
      </div>
    </div>
  );
}

export default LeaveReviewModal;
