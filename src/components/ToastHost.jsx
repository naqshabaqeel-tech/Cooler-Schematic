import { useEffect, useState } from 'react';
import { subscribeToast } from '../lib/toast';

export default function ToastHost() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    return subscribeToast((event) => {
      setToasts((prev) => [...prev, event]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== event.id));
      }, 2600);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg shadow-[0px_8px_24px_rgba(0,0,0,0.18)] text-sm font-medium ${
            t.tone === 'error' ? 'bg-[#B42318] text-white' : t.tone === 'info' ? 'bg-[#1E57C0] text-white' : 'bg-[#0C111D] text-white'
          }`}
        >
          {t.tone === 'error' ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 5.5v3M8 10.5h.005M14 8A6 6 0 1 1 2 8a6 6 0 0 1 12 0Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          {t.message}
        </div>
      ))}
    </div>
  );
}
