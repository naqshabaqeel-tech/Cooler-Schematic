import { useEffect, useLayoutEffect, useState } from 'react';

/**
 * PlanogramTour — first-run interactive walkthrough for the schematic editor.
 *
 * Each step optionally pins itself to a real DOM element selected via a
 * `data-tour="..."` attribute (or `data-tour-tool="<toolId>"` for the
 * toolbar). The overlay:
 *   1. dims the rest of the page with a giant box-shadow ring,
 *   2. paints a blue highlight rect around the target, and
 *   3. anchors a dark tooltip card below the target (or above if no room).
 *
 * Card chrome:
 *   - Dark `#0C111D` background to match the bulk-action bar and toasts.
 *   - "Step X of Y" text indicator (no dot strip — keeps the card compact and
 *     the progress unambiguous at higher step counts).
 *
 * Keyboard: ←/→ to move, Esc to skip. Click Skip / Finish to close. The
 * `onClose` callback fires whichever way the tour ends, so the parent can
 * persist the "seen" flag in localStorage.
 */

const STEPS = [
  {
    id: 'welcome',
    placement: 'center',
    title: 'Welcome — let’s build your planogram',
    body:
      'In a minute we’ll show you the product library, the canvas, the selected-product panel and how to save. Press → / ← to move between steps, or Esc to skip.',
    primary: 'Start tour',
  },
  {
    id: 'library',
    selector: '[data-tour="library-list"]',
    placement: 'right',
    title: 'Product Library — pick or drag',
    body:
      'All products live here, with Custom facing at the top for space the store decides. Search or filter, then either click a product and click a shelf, or drag it onto a shelf — the slot turns blue when it fits and red when it doesn’t.',
  },
  {
    id: 'canvas',
    selector: '[data-tour="canvas"]',
    placement: 'left',
    title: 'The canvas — all doors side by side',
    body:
      'Every door sits in one scrollable canvas. Scroll sideways to move between doors and use the zoom controls to focus on one. The number under each shelf shows the inches left. Click a shelf, or a facing, to place your selected product there.',
  },
  {
    id: 'selected',
    selector: '[data-tour="selected-panel"]',
    placement: 'left',
    title: 'Selected product — fine-tune it',
    body:
      'Whatever you select shows up here. Use the facings stepper to add or remove facings, Fill Shelf to use up the rest of the shelf, and Remove Block to take it off. Select a placed product and click another slot to insert it there too.',
  },
  {
    id: 'toolbar',
    selector: '[data-tour="toolbar"]',
    placement: 'down',
    title: 'Undo, redo and zoom',
    body:
      'Every edit is on the undo stack — slip up and just ⌘Z (or hit Undo). Zoom out for the whole cooler, or in for detail. The ? button replays this tour.',
  },
  {
    id: 'save',
    selector: '[data-tour="header-cta"]',
    placement: 'down',
    title: 'Save, export or publish',
    body:
      'Use Save As to keep a draft or export a PDF of one door or all doors, and Publish when it’s ready. Cancel discards your changes. You can change the status from the badge next to the title.',
  },
  {
    id: 'done',
    placement: 'center',
    title: 'You’re ready',
    body:
      'Pick a product, click a shelf, and build out your first door. Press the ? button any time to see this tour again.',
    primary: 'Finish',
  },
];

export default function PlanogramTour({ onClose }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState(null);
  const step = STEPS[stepIdx];
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === STEPS.length - 1;

  // Recompute the highlight rect whenever the step changes, the window
  // resizes, or the underlying layout shifts (e.g. user scrolls). We poll on
  // a short interval rather than wiring MutationObserver — the cost is tiny
  // and it handles the long tail of layout reflows (image loads, font swaps)
  // without instrumenting every parent component.
  useLayoutEffect(() => {
    if (!step.selector) {
      setRect(null);
      return;
    }
    let cancelled = false;
    function compute() {
      if (cancelled) return;
      const el = document.querySelector(step.selector);
      if (!el) { setRect(null); return; }
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) { setRect(null); return; }
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      const offScreen = r.bottom < 0 || r.top > window.innerHeight;
      if (offScreen) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    compute();
    const interval = setInterval(compute, 300);
    window.addEventListener('resize', compute);
    window.addEventListener('scroll', compute, true);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('resize', compute);
      window.removeEventListener('scroll', compute, true);
    };
  }, [step.selector]);

  // Keyboard navigation. Esc skips; arrows step.
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        if (isLast) onClose(); else setStepIdx((i) => i + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (!isFirst) setStepIdx((i) => i - 1);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isFirst, isLast, onClose]);

  // Tooltip placement — prefer below the target; fall back to above; clamp
  // horizontally inside the viewport. Centered when there's no rect.
  const CARD_W = 360;
  const CARD_H_EST = 220;
  let cardStyle;
  if (!rect || step.placement === 'center') {
    cardStyle = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  } else {
    const m = 16;
    let top, left;
    const spaceBelow = window.innerHeight - (rect.top + rect.height);
    const spaceAbove = rect.top;
    if (step.placement === 'right' && window.innerWidth - (rect.left + rect.width) > CARD_W + m) {
      top = Math.max(m, Math.min(window.innerHeight - CARD_H_EST - m, rect.top + rect.height / 2 - CARD_H_EST / 2));
      left = rect.left + rect.width + m;
    } else if (step.placement === 'left' && rect.left > CARD_W + m) {
      top = Math.max(m, Math.min(window.innerHeight - CARD_H_EST - m, rect.top + rect.height / 2 - CARD_H_EST / 2));
      left = rect.left - CARD_W - m;
    } else if (spaceBelow > CARD_H_EST + m || spaceBelow > spaceAbove) {
      top = rect.top + rect.height + m;
      left = rect.left + rect.width / 2 - CARD_W / 2;
    } else {
      top = rect.top - CARD_H_EST - m;
      left = rect.left + rect.width / 2 - CARD_W / 2;
    }
    left = Math.max(m, Math.min(window.innerWidth - CARD_W - m, left));
    top = Math.max(m, Math.min(window.innerHeight - CARD_H_EST - m, top));
    cardStyle = { top, left };
  }

  const pad = 8;
  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Product walkthrough">
      {/* Dim layer — either a flat backdrop (no target) or a cutout via box-shadow. */}
      {rect ? (
        <div
          className="absolute pointer-events-none rounded-lg"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.62)',
            transition: 'top 200ms, left 200ms, width 200ms, height 200ms',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-900/60" />
      )}

      {/* Highlight ring */}
      {rect && (
        <div
          className="absolute pointer-events-none rounded-lg ring-2 ring-primary-blue-400"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: '0 0 0 4px rgba(38, 109, 240, 0.18)',
            transition: 'top 200ms, left 200ms, width 200ms, height 200ms',
          }}
        />
      )}

      {/* Tooltip card — dark surface matching the bulk-action bar / toast palette. */}
      <div
        className="absolute rounded-xl shadow-[0px_24px_38px_-8px_rgba(15,23,42,0.55)] flex flex-col gap-4 p-5 pointer-events-auto"
        style={{ ...cardStyle, width: CARD_W, backgroundColor: '#0C111D' }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-xs font-semibold text-white/60 tracking-wide">
              Step {stepIdx + 1} of {STEPS.length}
            </span>
            <h3 className="text-sm font-semibold text-white leading-tight">{step.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Skip walkthrough"
            className="shrink-0 flex items-center justify-center w-6 h-6 rounded-md cursor-pointer bg-transparent border-none text-white/50 hover:text-white hover:bg-white/10 p-0"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <p className="text-xs text-white/80 leading-relaxed">{step.body}</p>

        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-white/55 hover:text-white cursor-pointer bg-transparent border-none p-0 font-[inherit]"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={() => setStepIdx((i) => i - 1)}
                className="flex items-center justify-center h-8 px-3 bg-white/10 border border-white/15 rounded-lg text-xs font-semibold text-white cursor-pointer hover:bg-white/15 font-[inherit]"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={() => (isLast ? onClose() : setStepIdx((i) => i + 1))}
              className="flex items-center justify-center h-8 px-3 rounded-lg text-xs font-semibold text-white cursor-pointer hover:opacity-90 font-[inherit] border-none"
              style={{ backgroundColor: '#266DF0' }}
            >
              {step.primary || (isLast ? 'Finish' : 'Next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
