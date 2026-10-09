// Shared glide helpers + touch-drag utility for the planogram editor.

// Smallest custom-area step (= smallest possible glide width).
export const CUSTOM_INCREMENT = 2.5;

// Drag payload for the library's Custom facing card.
export const CUSTOM_DRAG_ITEM = { _custom: true, id: '__custom__', name: 'Custom area', glideWidth: CUSTOM_INCREMENT };

export function glideWidthOf(g) {
  if (!g) return 0;
  if (g._type === 'custom') return g.width || 0;
  return g.product?.glideWidth || 0;
}

// Slim cans stack 2 per glide unless explicitly marked `single`. Custom areas
// count 0; everything else is 1 facing per glide.
export function facingsOf(g) {
  if (!g || g._type === 'custom') return 0;
  if (g.product?.packType === 'Slim can' && !g.single) return 2;
  return 1;
}

export function fmtIn(n) {
  return `${Math.round(n * 10) / 10}″`;
}

// A "block" is a run of adjacent glides holding the same product.
export function blockBounds(glides, idx) {
  const g = glides?.[idx];
  if (!g || g._type === 'custom' || !g.product) return { start: idx, end: idx };
  const same = (x) => x && x._type !== 'custom' && x.product?.id === g.product.id;
  let start = idx;
  let end = idx;
  while (start > 0 && same(glides[start - 1])) start -= 1;
  while (end < glides.length - 1 && same(glides[end + 1])) end += 1;
  return { start, end };
}

/**
 * Touch/pen drag (HTML5 drag-and-drop doesn't fire for touch). Floats a clone
 * of `sourceEl` under the finger; on release hit-tests for a `data-lib-drop`
 * target ("door:shelf:glide|end") and calls onDrop(door, shelf, glideIdx|null).
 */
export function beginTouchDrag(e, sourceEl, { onStart, onDrop, onEnd }) {
  e.preventDefault();
  e.stopPropagation();
  onStart?.();
  const box = sourceEl.getBoundingClientRect();
  const offX = e.clientX - box.left;
  const offY = e.clientY - box.top;
  const ghost = sourceEl.cloneNode(true);
  ghost.removeAttribute('draggable');
  ghost.style.cssText =
    `position:fixed;z-index:9999;pointer-events:none;width:${box.width}px;height:${box.height}px;` +
    'opacity:.85;background:#fff;border:1px solid #EAECF0;border-radius:8px;' +
    'box-shadow:0 4px 12px rgba(0,0,0,.15);margin:0';
  document.body.appendChild(ghost);
  const place = (ev) => { ghost.style.left = `${ev.clientX - offX}px`; ghost.style.top = `${ev.clientY - offY}px`; };
  place(e);
  const move = (ev) => place(ev);
  const blockScroll = (ev) => ev.preventDefault();
  window.addEventListener('touchmove', blockScroll, { passive: false });
  const finish = (ev, drop) => {
    window.removeEventListener('touchmove', blockScroll);
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', cancel);
    ghost.remove();
    if (drop) {
      const target = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('[data-lib-drop]');
      if (target) {
        const [d, sh, g] = target.dataset.libDrop.split(':');
        onDrop?.(Number(d), Number(sh), g === 'end' ? null : Number(g));
      }
    }
    onEnd?.();
  };
  const up = (ev) => finish(ev, true);
  const cancel = (ev) => finish(ev, false);
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', cancel);
}
