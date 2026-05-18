import { useEffect } from 'react';

export default function SidePanel({
  open,
  title,
  onClose,
  children,
  footer,
  width = 540,
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end p-2" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-xl shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_10px_10px_-5px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden"
        style={{ width, maxWidth: '100%', height: '100%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200 shrink-0">
          <p className="text-base font-semibold leading-6 text-black">{title}</p>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-4 h-4 cursor-pointer bg-transparent border-none p-0"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4L12 12" stroke="#0C111D" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-6">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-3 px-4 py-3.5 border-t border-gray-200 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
