import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';

interface RatingData {
  average: number;
  count: number;
}

/**
 * Compact star-rating badge for a user (seller or buyer).
 * Usage: <UserRating userId={seller_id} />
 */
export function UserRating({ userId, showCount = true }: { userId: string; showCount?: boolean }) {
  const [data, setData] = useState<RatingData | null>(null);

  useEffect(() => {
    let active = true;
    if (!userId) return;
    fetch(`/api/reviews/list?userId=${encodeURIComponent(userId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (active && d) setData({ average: d.average, count: d.count }); })
      .catch(() => {});
    return () => { active = false; };
  }, [userId]);

  if (!data || data.count === 0) {
    return <span className="text-xs text-gray-400">No ratings yet</span>;
  }

  const full = Math.round(data.average);
  return (
    <span className="inline-flex items-center gap-1" title={`${data.average} / 5 from ${data.count} review(s)`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={i <= full ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
        />
      ))}
      <span className="text-xs font-semibold text-gray-700">{data.average.toFixed(1)}</span>
      {showCount && <span className="text-xs text-gray-400">({data.count})</span>}
    </span>
  );
}

export default UserRating;
