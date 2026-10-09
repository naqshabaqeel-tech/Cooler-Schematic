import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Select — custom single-select dropdown matching the design (replaces the
 * native <select>, which renders the OS picker on iOS). The list is portaled
 * to <body> with fixed positioning so side-panel scroll containers can't clip
 * it, and it scrolls independently on touch.
 *
 * options: [{ value, label }]
 */
export default function Select({ value, options, onChange, placeholder = 'Select…' }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const ref = useRef(null);
  const btnRef = useRef(null);
  const listRef = useRef(null);

  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const r = btnRef.current?.getBoundingClientRect();
      if (!r) return;
      const below = window.innerHeight - r.bottom - 12;
      const above = r.top - 12;
      const flip = below < 160 && above > below;
      const maxHeight = Math.min(260, Math.max(120, flip ? above : below));
      setPos({
        left: r.left,
        width: r.width,
        maxHeight,
        ...(flip ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }),
      });
    }
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current?.contains(e.target) || listRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', handleClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', handleClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = options.find((o) => String(o.value) === String(value));

  return (
    <div className="relative" ref={ref}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-1.5 w-full h-10 px-3 bg-white border border-gray-200 rounded-lg shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors font-[inherit] focus:outline-none focus:border-primary-blue-500 focus:ring-2 focus:ring-primary-blue-150"
      >
        <span className={`truncate ${current ? '' : 'text-gray-500'}`}>{current ? current.label : placeholder}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={`shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>
          <path d="M1 1L5 5L9 1" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && pos && createPortal(
        <div
          ref={listRef}
          style={{ position: 'fixed', zIndex: 70, ...pos, touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
          className="bg-white border border-gray-200 rounded-lg shadow-[0px_4px_12px_rgba(0,0,0,0.1)] py-1 overflow-y-auto overscroll-contain"
        >
          {options.map((opt) => {
            const selected = String(opt.value) === String(value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange?.(String(opt.value)); setOpen(false); }}
                className={`flex items-center justify-between gap-2 w-full px-3 py-2 text-sm font-medium text-left border-none cursor-pointer font-[inherit] hover:bg-gray-50 ${
                  selected ? 'text-primary-blue-600 bg-primary-blue-50/50' : 'text-gray-900 bg-transparent'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {selected && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                    <path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}
