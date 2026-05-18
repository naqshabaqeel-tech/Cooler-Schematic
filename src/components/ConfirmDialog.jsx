import { useEffect } from 'react';

export default function ConfirmDialog({
  open,
  title,
  message,
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  onCancel,
  onConfirm,
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') onCancel?.();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onCancel}
    >
      <div
        className="bg-white border border-gray-200 rounded-xl shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] p-6 w-full max-w-md flex gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold leading-5 text-black">{title}</p>
            <p className="text-sm font-medium leading-5 text-gray-600">{message}</p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onCancel}
              className="flex items-center justify-center gap-2 h-9 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] text-sm font-semibold text-black cursor-pointer hover:bg-gray-50 font-[inherit]"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className="flex items-center justify-center gap-2 h-9 px-2.5 py-1.5 bg-primary-blue-500 rounded-lg text-sm font-semibold text-white cursor-pointer hover:bg-primary-blue-600 font-[inherit] border-none"
              style={{ backgroundColor: '#266DF0' }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
