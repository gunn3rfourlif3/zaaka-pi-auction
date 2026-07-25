import React, { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';

interface Notification {
  id: number;
  type: string;
  message: string;
  auction_id: number | null;
  read: boolean;
  created_at: string;
}

/**
 * Header notification bell. Polls the user's notifications (cookie-authenticated)
 * and lets them mark all read. Renders nothing if the user isn't signed in.
 *
 * Usage: <NotificationBell />  (place in the header once logged in)
 */
export function NotificationBell({ pollMs = 30000 }: { pollMs?: number }) {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const res = await fetch('/api/notifications/list');
      if (res.status === 401) { setAuthed(false); return; }
      if (!res.ok) return;
      const data = await res.json();
      setAuthed(true);
      setItems(data.notifications || []);
      setUnread(data.unread || 0);
    } catch {
      /* ignore transient errors */
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, pollMs);
    return () => clearInterval(t);
  }, [pollMs]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications/mark-read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch { /* ignore */ }
  };

  if (!authed) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen((o) => !o); if (!open && unread) markAllRead(); }}
        className="relative rounded-full p-2 hover:bg-gray-100"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-gray-700" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 max-h-96 w-80 overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-lg">
          <div className="border-b px-4 py-2 text-sm font-semibold text-gray-700">Notifications</div>
          {items.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">No new notifications.</div>
          ) : (
            items.map((n) => (
              <div key={n.id} className={`px-4 py-3 text-sm ${n.read ? 'text-gray-500' : 'bg-green-50 text-gray-800'}`}>
                <div>{n.message}</div>
                <div className="mt-0.5 text-[11px] text-gray-400">{new Date(n.created_at).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
