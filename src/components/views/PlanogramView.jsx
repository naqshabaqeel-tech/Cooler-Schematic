import { useState, useRef, useEffect, useCallback, useSyncExternalStore } from 'react';
import Badge from '../Badge';
import Button from '../Button';
import ConfirmDialog from '../ConfirmDialog';
import PlanogramSummary from '../PlanogramSummary';
import PlanogramTour from '../PlanogramTour';
import ProductLibrary from '../planogram/ProductLibrary';
import SelectedPanel from '../planogram/SelectedPanel';
import { DoorColumn } from '../planogram/CanvasParts';
import {
  BackIcon, UndoIcon, RedoIcon, ZoomInIcon, ZoomOutIcon, HelpIcon, CaretIcon, CloseIcon, ProductsIcon,
} from '../planogram/Icons';
import { CUSTOM_INCREMENT, glideWidthOf, facingsOf, fmtIn, blockBounds } from '../planogram/helpers';
import {
  productCategories, generateShelfLayout, SHELF_WIDTH_INCHES, getMaxFacings,
  PACK_TYPES, PACK_TYPE_LABELS, VENDORS,
} from '../../data/planogram';

const MAX_SHELVES_PER_DOOR = 10;
const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', badge: 'Active' },
  { value: 'draft', label: 'Draft', badge: 'Inactive' },
  { value: 'archive', label: 'Archive', badge: 'Default' },
];

/* ─── Small tooltip used by the floating toolbar ─── */
function Tooltip({ text, children }) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef(null);
  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => { timeoutRef.current = setTimeout(() => setVisible(true), 400); }}
      onMouseLeave={() => { clearTimeout(timeoutRef.current); setVisible(false); }}
    >
      {children}
      {visible && (
        <div className="absolute z-50 pointer-events-none left-1/2 -translate-x-1/2 top-full mt-1.5">
          <div className="bg-[#0C111D] px-2.5 py-1 rounded-[7px] whitespace-nowrap">
            <span className="text-sm font-semibold text-white leading-5">{text}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// True at ≥1024px (desktop layout: side panels docked; below that: tablet sheet/drawer).
function useIsDesktop() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia('(min-width: 1024px)');
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => window.matchMedia('(min-width: 1024px)').matches,
    () => true
  );
}

// Closes `onClose` when a pointer lands outside `ref`.
function useOutsideClose(ref, open, onClose) {
  useEffect(() => {
    if (!open) return;
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('pointerdown', handle);
    return () => document.removeEventListener('pointerdown', handle);
  }, [open, onClose, ref]);
}

function MenuItem({ children, onClick, indent, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-between w-full h-10 ${indent ? 'pl-6 pr-3' : 'px-3'} text-sm font-medium text-gray-900 bg-transparent border-none cursor-pointer hover:bg-gray-50 font-[inherit] text-left disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

const toolbarBtn =
  'flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white text-gray-600 cursor-pointer transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed';

/**
 * PlanogramView
 * @param {object}   props.doorSet     — { title, doors, defaultShelf, status }
 * @param {string}   props.regionName
 * @param {function} [props.onExit]    — leave the editor (after publish / discard)
 * @param {function} [props.onBack]    — back arrow; the parent shows the unsaved-changes warning
 * @param {function} [props.onStatusChange] — (status) => void; makes the status badge editable
 * @param {Array}    [props.layout] / [props.onLayoutChange] — controlled layout
 * @param {"tools"|"location"} [props.variant="tools"]
 */
export default function PlanogramView({
  doorSet, regionName, onExit, onBack, onStatusChange,
  layout: controlledLayout, onLayoutChange,
  variant = 'tools', readOnly = false, onToggleReadOnly,
}) {
  /* ── selection model ──────────────────────────────────────────────────
     null
     { kind:'library', product }            — a library product is armed
     { kind:'custom' }                      — the Custom area card is armed
     { kind:'glide', doorIdx, shelfIdx, glideIdx } — a placed block is selected
     Whatever is selected is also the "clipboard": clicking a shelf slot
     inserts it there. */
  const [selection, setSelection] = useState(null);
  const isDesktop = useIsDesktop();
  const [slimSingleMode, setSlimSingleMode] = useState(true);
  const [libraryDragProduct, setLibraryDragProduct] = useState(null);
  const [pickedShelf, setPickedShelf] = useState(null); // whole-shelf copy {doorIdx, shelfIdx}
  const [dragSource, setDragSource] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const isDraggingRef = useRef(false);
  const dragMovedRef = useRef(false);

  const [zoom, setZoom] = useState(100);
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [libraryOpen, setLibraryOpen] = useState(false); // tablet drawer

  const [saveMenuOpen, setSaveMenuOpen] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const saveMenuRef = useRef(null);
  const statusMenuRef = useRef(null);
  const closeSave = useCallback(() => setSaveMenuOpen(false), []);
  const closeStatus = useCallback(() => setStatusMenuOpen(false), []);
  useOutsideClose(saveMenuRef, saveMenuOpen, closeSave);
  useOutsideClose(statusMenuRef, statusMenuOpen, closeStatus);

  const [toast, setToast] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [summaryMode, setSummaryMode] = useState(null);
  const [exporting, setExporting] = useState(false);

  const TOUR_FLAG = 'cooler-schematic-tour-v2';
  const [showTour, setShowTour] = useState(() => {
    if (typeof window === 'undefined') return false;
    try { return !window.localStorage.getItem(TOUR_FLAG); } catch { return false; }
  });
  function dismissTour() {
    setShowTour(false);
    try { window.localStorage.setItem(TOUR_FLAG, '1'); } catch { /* storage unavailable */ }
  }

  /* ── layout + undo/redo ─────────────────────────────────────────────── */
  const [internalLayout, setInternalLayout] = useState(() =>
    controlledLayout ?? generateShelfLayout(doorSet?.doors || 6, doorSet?.defaultShelf || 7)
  );
  const isControlled = controlledLayout !== undefined;
  const layout = isControlled ? controlledLayout : internalLayout;
  const setLayout = useCallback((updater) => {
    if (isControlled) {
      onLayoutChange((prev) => (typeof updater === 'function' ? updater(prev) : updater));
    } else {
      setInternalLayout(updater);
    }
  }, [isControlled, onLayoutChange]);

  // Errors read "Title — detail": split into a heading and a subheading.
  const showToast = useCallback((message, tone = 'success', description) => {
    let title = message;
    let desc = description;
    if (!desc && message.includes(' — ')) {
      const [a, ...rest] = message.split(' — ');
      title = a;
      desc = rest.join(' — ');
    }
    setToast({ title, desc, tone, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.tone === 'error' ? 4000 : 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const historyRef = useRef([]);
  const futureRef = useRef([]);
  const MAX_HISTORY = 50;
  const [historyLen, setHistoryLen] = useState(0);
  const [futureLen, setFutureLen] = useState(0);

  // Always edit from the latest layout (kept in a ref so several edits in one
  // event handler chain correctly) and keep side effects out of state updaters.
  const layoutRef = useRef(layout);
  useEffect(() => { layoutRef.current = layout; }, [layout]);

  const updateLayout = useCallback((updater) => {
    const prev = layoutRef.current;
    const next = typeof updater === 'function' ? updater(prev) : updater;
    historyRef.current = [...historyRef.current.slice(-(MAX_HISTORY - 1)), JSON.stringify(prev)];
    futureRef.current = [];
    layoutRef.current = next;
    setLayout(next);
    setHistoryLen(historyRef.current.length);
    setFutureLen(0);
  }, [setLayout]);

  function handleUndo() {
    if (historyRef.current.length === 0) return;
    const prev = historyRef.current.pop();
    futureRef.current.push(JSON.stringify(layout));
    setLayout(JSON.parse(prev));
    setHistoryLen(historyRef.current.length);
    setFutureLen(futureRef.current.length);
    setSelection(null);
  }
  function handleRedo() {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current.pop();
    historyRef.current.push(JSON.stringify(layout));
    setLayout(JSON.parse(next));
    setHistoryLen(historyRef.current.length);
    setFutureLen(futureRef.current.length);
    setSelection(null);
  }

  /* ── shelf math ─────────────────────────────────────────────────────── */
  const usedWidth = (shelf) => (shelf?.glides || []).reduce((sum, g) => sum + glideWidthOf(g), 0);
  const remainingWidth = (shelf) => Math.max(0, SHELF_WIDTH_INCHES - usedWidth(shelf));
  const canAddGlide = (shelf, product) =>
    !!product?.glideWidth && usedWidth(shelf) + product.glideWidth <= SHELF_WIDTH_INCHES + 0.001;
  const round1 = (n) => Math.round(n * 10) / 10;
  const round2 = (n) => Math.round(n * 100) / 100;

  /* ── placing things ─────────────────────────────────────────────────── */
  // Inserts one facing. `insertAt` = index to insert BEFORE (null → append).
  // Selects the newly placed facing so the right panel reflects it.
  function handleAddGlide(doorIdx, shelfIdx, product, insertAt = null, single) {
    if (readOnly) return false;
    const shelf = layout[doorIdx]?.shelves[shelfIdx];
    if (!shelf || !product) return false;
    if (!canAddGlide(shelf, product)) {
      showToast(
        'Shelf is full',
        'error',
        `${fmtIn(remainingWidth(shelf))} left, this product needs ${fmtIn(product.glideWidth)}`
      );
      return false;
    }
    const isSingle = product.packType === 'Slim can' && (single === undefined ? slimSingleMode : single);
    const newIdx = insertAt == null ? shelf.glides.length : insertAt;
    updateLayout((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const glides = next[doorIdx].shelves[shelfIdx].glides;
      const entry = { product: { ...product } };
      if (isSingle) entry.single = true;
      glides.splice(newIdx, 0, entry);
      return next;
    });
    setSelection({ kind: 'glide', doorIdx, shelfIdx, glideIdx: newIdx });
    return true;
  }

  // Reserve space for the store. Neighbouring custom blocks coalesce so
  // consecutive customs read as one slab.
  function handleAddCustomArea(doorIdx, shelfIdx, requestedWidth = CUSTOM_INCREMENT, insertAt = null, note) {
    if (readOnly) return;
    const shelf = layout[doorIdx]?.shelves[shelfIdx];
    if (!shelf) return;
    const rem = remainingWidth(shelf);
    const w = round1(Math.min(requestedWidth, rem));
    if (w < 0.5) {
      showToast('Shelf is full', 'error', `${fmtIn(rem)} left`);
      return;
    }
    const next = JSON.parse(JSON.stringify(layout));
    const glides = next[doorIdx].shelves[shelfIdx].glides;
    let resultIdx;
    if (insertAt == null) {
      const last = glides[glides.length - 1];
      if (last && last._type === 'custom') {
        last.width = round1(last.width + w);
        resultIdx = glides.length - 1;
      } else {
        glides.push({ _type: 'custom', width: w, ...(note ? { note } : {}) });
        resultIdx = glides.length - 1;
      }
    } else {
      const leftIdx = insertAt - 1;
      const rightIdx = insertAt;
      const leftIsCustom = glides[leftIdx]?._type === 'custom';
      const rightIsCustom = glides[rightIdx]?._type === 'custom';
      if (leftIsCustom && rightIsCustom) {
        glides[leftIdx].width = round1(glides[leftIdx].width + glides[rightIdx].width + w);
        glides.splice(rightIdx, 1);
        resultIdx = leftIdx;
      } else if (leftIsCustom) {
        glides[leftIdx].width = round1(glides[leftIdx].width + w);
        resultIdx = leftIdx;
      } else if (rightIsCustom) {
        glides[rightIdx].width = round1(glides[rightIdx].width + w);
        resultIdx = rightIdx;
      } else {
        glides.splice(insertAt, 0, { _type: 'custom', width: w, ...(note ? { note } : {}) });
        resultIdx = insertAt;
      }
    }
    updateLayout(() => next);
    setSelection({ kind: 'glide', doorIdx, shelfIdx, glideIdx: resultIdx });
  }

  /* ── what is currently armed (selection doubles as the clipboard) ───── */
  const selGlide = selection?.kind === 'glide'
    ? layout[selection.doorIdx]?.shelves[selection.shelfIdx]?.glides[selection.glideIdx]
    : null;
  let armed = null; // { type:'product', product, single } | { type:'custom', width, note }
  if (selection?.kind === 'library') {
    armed = { type: 'product', product: selection.product, single: selection.product.packType === 'Slim can' ? slimSingleMode : false };
  } else if (selection?.kind === 'custom') {
    armed = { type: 'custom', width: CUSTOM_INCREMENT };
  } else if (selGlide?._type === 'custom') {
    armed = { type: 'custom', width: selGlide.width, note: selGlide.note };
  } else if (selGlide?.product) {
    armed = { type: 'product', product: selGlide.product, single: !!selGlide.single };
  }
  const armedWidth = !armed ? 0 : armed.type === 'product' ? (armed.product.glideWidth || 0) : (armed.width || CUSTOM_INCREMENT);

  function placeArmed(doorIdx, shelfIdx, insertAt) {
    if (!armed) return;
    if (armed.type === 'product') handleAddGlide(doorIdx, shelfIdx, armed.product, insertAt, armed.single);
    else handleAddCustomArea(doorIdx, shelfIdx, armed.width, insertAt, armed.note);
  }

  function handleGlideClick(doorIdx, shelfIdx, glideIdx) {
    if (readOnly) return;
    if (pickedShelf) { handlePasteShelf(doorIdx, shelfIdx); return; }
    const isSel = selection?.kind === 'glide' && selection.doorIdx === doorIdx && selection.shelfIdx === shelfIdx;
    if (isSel) {
      const { start, end } = blockBounds(layout[doorIdx].shelves[shelfIdx].glides, selection.glideIdx);
      if (glideIdx >= start && glideIdx <= end) { setSelection(null); return; } // click the block again → deselect
    }
    if (armed) { placeArmed(doorIdx, shelfIdx, glideIdx); return; } // insert BEFORE this facing
    setSelection({ kind: 'glide', doorIdx, shelfIdx, glideIdx });
  }

  function handleZoneClick(doorIdx, shelfIdx) {
    if (readOnly) return;
    if (pickedShelf) { handlePasteShelf(doorIdx, shelfIdx); return; }
    if (armed) placeArmed(doorIdx, shelfIdx, null);
    else setSelection(null);
  }

  /* ── library ────────────────────────────────────────────────────────── */
  const isTablet = () => typeof window !== 'undefined' && window.innerWidth < 1024;
  function selectLibraryProduct(p) {
    setPickedShelf(null);
    setSelection((cur) => (cur?.kind === 'library' && cur.product.id === p.id ? null : { kind: 'library', product: p }));
    if (isTablet()) setLibraryOpen(false);
  }
  function selectLibraryCustom() {
    setPickedShelf(null);
    setSelection((cur) => (cur?.kind === 'custom' ? null : { kind: 'custom' }));
    if (isTablet()) setLibraryOpen(false);
  }
  function handleLibraryDrop(doorIdx, shelfIdx, insertAt) {
    if (readOnly) return;
    const item = libraryDragProduct;
    setLibraryDragProduct(null);
    if (!item) return;
    if (item._custom) handleAddCustomArea(doorIdx, shelfIdx, CUSTOM_INCREMENT, insertAt);
    else handleAddGlide(doorIdx, shelfIdx, item, insertAt);
  }
  function handleLibraryTouchDrop(item, doorIdx, shelfIdx, insertAt) {
    if (item._custom) handleAddCustomArea(doorIdx, shelfIdx, CUSTOM_INCREMENT, insertAt);
    else handleAddGlide(doorIdx, shelfIdx, item, insertAt);
  }

  const allProducts = productCategories.flatMap((cat) => cat.products.map((p) => ({ ...p, category: cat.name })));
  const availablePackTypes = PACK_TYPES
    .filter((pt) => allProducts.some((p) => p.packType === pt))
    .map((pt) => ({ value: pt, label: PACK_TYPE_LABELS[pt] || pt }));
  const filteredProducts = allProducts.filter((p) => {
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (sizeFilter !== 'all' && p.packType !== sizeFilter) return false;
    if (productSearch) {
      const q = productSearch.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.upc.includes(productSearch) || p.size.toLowerCase().includes(q);
    }
    return true;
  });

  /* ── moving placed facings (drag: always on) ────────────────────────── */
  function performMove(src, doorIdx, shelfIdx, glideIdx) {
    const srcShelf = layout[src.doorIdx]?.shelves[src.shelfIdx];
    const destShelf = layout[doorIdx]?.shelves[shelfIdx];
    const srcGlide = srcShelf?.glides[src.glideIdx];
    if (!srcGlide || !destShelf) return;
    const isSameShelf = src.doorIdx === doorIdx && src.shelfIdx === shelfIdx;
    const need = glideWidthOf(srcGlide);
    if (!isSameShelf && usedWidth(destShelf) + need > SHELF_WIDTH_INCHES + 0.001) {
      showToast('Shelf is full', 'error', `${fmtIn(remainingWidth(destShelf))} left, this product needs ${fmtIn(need)}`);
      return;
    }
    updateLayout((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const sShelf = next[src.doorIdx].shelves[src.shelfIdx];
      const dShelf = next[doorIdx].shelves[shelfIdx];
      const [moved] = sShelf.glides.splice(src.glideIdx, 1);
      let insertAt = glideIdx ?? dShelf.glides.length;
      if (isSameShelf && src.glideIdx < insertAt) insertAt -= 1;
      dShelf.glides.splice(insertAt, 0, moved);
      return next;
    });
    setSelection(null);
  }

  function handleGlideMouseDown(doorIdx, shelfIdx, glideIdx) {
    if (readOnly) return;
    const glide = layout[doorIdx]?.shelves[shelfIdx]?.glides[glideIdx];
    if (!glide || glide._type === 'custom') return;
    isDraggingRef.current = true;
    dragMovedRef.current = false;
    setDragSource({ doorIdx, shelfIdx, glideIdx });
    setDragOver({ doorIdx, shelfIdx, glideIdx });
  }
  function handleGlideMouseEnter(doorIdx, shelfIdx, glideIdx) {
    if (!isDraggingRef.current) return;
    dragMovedRef.current = true;
    setDragOver({ doorIdx, shelfIdx, glideIdx });
  }
  function endDrag() {
    isDraggingRef.current = false;
    dragMovedRef.current = false;
    setDragSource(null);
    setDragOver(null);
  }
  function handleShelfMouseUp(doorIdx, shelfIdx, glideIdx, cancel) {
    if (cancel) { endDrag(); return; }
    if (isDraggingRef.current && dragSource) {
      const isSame = dragSource.doorIdx === doorIdx && dragSource.shelfIdx === shelfIdx && dragSource.glideIdx === glideIdx;
      if (dragMovedRef.current && !isSame) performMove(dragSource, doorIdx, shelfIdx, glideIdx);
    }
    endDrag();
  }
  function handleTouchMoveDrop(src, doorIdx, shelfIdx, glideIdx) {
    const isSame = src.doorIdx === doorIdx && src.shelfIdx === shelfIdx && src.glideIdx === glideIdx;
    if (!isSame) performMove(src, doorIdx, shelfIdx, glideIdx);
  }

  useEffect(() => {
    function up() { if (isDraggingRef.current) endDrag(); }
    document.addEventListener('mouseup', up);
    return () => document.removeEventListener('mouseup', up);
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        endDrag();
        setPickedShelf(null);
        setSelection(null);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  /* ── whole-shelf copy / paste ───────────────────────────────────────── */
  function handlePickShelf(doorIdx, shelfIdx) {
    if (readOnly) return;
    if (pickedShelf && pickedShelf.doorIdx === doorIdx && pickedShelf.shelfIdx === shelfIdx) {
      setPickedShelf(null);
      return;
    }
    if (pickedShelf) { handlePasteShelf(doorIdx, shelfIdx); return; }
    setSelection(null);
    setPickedShelf({ doorIdx, shelfIdx });
  }

  function handlePasteShelf(destDoorIdx, destShelfIdx) {
    if (!pickedShelf) return;
    if (pickedShelf.doorIdx === destDoorIdx && pickedShelf.shelfIdx === destShelfIdx) {
      setPickedShelf(null);
      return;
    }
    const srcShelf = layout[pickedShelf.doorIdx]?.shelves[pickedShelf.shelfIdx];
    const destShelf = layout[destDoorIdx]?.shelves[destShelfIdx];
    if (!srcShelf || !destShelf) { setPickedShelf(null); return; }
    if ((srcShelf.glides || []).length === 0) {
      showToast('Source shelf has nothing to copy', 'error');
      setPickedShelf(null);
      return;
    }
    const srcLabel = srcShelf.label || `Shelf ${pickedShelf.shelfIdx + 1}`;
    const destLabel = destShelf.label || `Shelf ${destShelfIdx + 1}`;
    const srcDoor = pickedShelf.doorIdx;
    const apply = () => {
      updateLayout((prev) => {
        const next = JSON.parse(JSON.stringify(prev));
        next[destDoorIdx].shelves[destShelfIdx].glides = JSON.parse(JSON.stringify(srcShelf.glides));
        return next;
      });
      showToast(`Copied ${srcLabel} → Door ${destDoorIdx + 1} ${destLabel}`);
      setPickedShelf(null);
      setSelection(null);
    };
    if ((destShelf.glides || []).length > 0) {
      const destFacings = destShelf.glides.reduce((s, g) => s + facingsOf(g), 0);
      const destCustom = destShelf.glides.reduce((s, g) => s + (g._type === 'custom' ? g.width : 0), 0);
      const frag = [];
      if (destFacings > 0) frag.push(`${destFacings} facing${destFacings === 1 ? '' : 's'}`);
      if (destCustom > 0) frag.push(`${fmtIn(destCustom)} custom`);
      setConfirmAction({
        title: `Replace Door ${destDoorIdx + 1} ${destLabel}?`,
        message: `${frag.join(' + ')} on the destination shelf will be overwritten with the contents of Door ${srcDoor + 1} ${srcLabel}.`,
        confirmLabel: 'Yes, Replace',
        run: apply,
      });
    } else {
      apply();
    }
  }

  /* ── shelves ────────────────────────────────────────────────────────── */
  function handleAddShelfToDoor(doorIdx) {
    if (readOnly) return;
    const door = layout[doorIdx];
    if (!door) return;
    if (door.shelves.length >= MAX_SHELVES_PER_DOOR) {
      showToast(`Each door can hold at most ${MAX_SHELVES_PER_DOOR} shelves`, 'error');
      return;
    }
    updateLayout((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const d = next[doorIdx];
      const n = d.shelves.length + 1;
      d.shelves.push({ id: `${d.id}-shelf-${n}`, label: `Shelf ${n}`, glides: [] });
      return next;
    });
  }
  function removeShelf(doorIdx, shelfIdx) {
    updateLayout((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next[doorIdx].shelves.splice(shelfIdx, 1);
      next[doorIdx].shelves.forEach((s, i) => { s.label = `Shelf ${i + 1}`; });
      return next;
    });
    setSelection(null);
  }
  function handleRemoveShelfRequest(doorIdx, shelfIdx) {
    if (readOnly) return;
    const shelf = layout[doorIdx]?.shelves[shelfIdx];
    if (!shelf) return;
    if (layout[doorIdx].shelves.length <= 1) {
      showToast('Each door must keep at least one shelf', 'error');
      return;
    }
    const facingTotal = shelf.glides.reduce((sum, g) => sum + facingsOf(g), 0);
    const customWidth = shelf.glides.reduce((sum, g) => sum + (g._type === 'custom' ? g.width : 0), 0);
    if (facingTotal === 0 && customWidth === 0) { removeShelf(doorIdx, shelfIdx); return; }
    const frag = [];
    if (facingTotal > 0) frag.push(`${facingTotal} facing${facingTotal === 1 ? '' : 's'}`);
    if (customWidth > 0) frag.push(`${fmtIn(customWidth)} custom`);
    setConfirmAction({
      title: `Remove Shelf ${shelfIdx + 1} from Door ${doorIdx + 1}?`,
      message: `${frag.join(' + ')} will be deleted.`,
      confirmLabel: 'Yes, Remove',
      run: () => removeShelf(doorIdx, shelfIdx),
    });
  }

  /* ── right panel actions ────────────────────────────────────────────── */
  const selShelf = selection?.kind === 'glide' ? layout[selection.doorIdx]?.shelves[selection.shelfIdx] : null;
  const selBlock = selShelf && selGlide ? blockBounds(selShelf.glides, selection.glideIdx) : null;

  function panelPlus() {
    if (!selGlide || !selShelf) return;
    const { doorIdx, shelfIdx, glideIdx } = selection;
    if (selGlide._type === 'custom') {
      const rem = remainingWidth(selShelf);
      if (rem < 0.5) { showToast('Shelf is full', 'error', `${fmtIn(rem)} left`); return; }
      const add = round1(Math.min(CUSTOM_INCREMENT, rem));
      updateLayout((prev) => {
        const next = JSON.parse(JSON.stringify(prev));
        const g = next[doorIdx].shelves[shelfIdx].glides[glideIdx];
        g.width = round1(g.width + add);
        return next;
      });
      return;
    }
    handleAddGlide(doorIdx, shelfIdx, selGlide.product, selBlock.end + 1, !!selGlide.single);
    // keep the original block selected
    setSelection({ kind: 'glide', doorIdx, shelfIdx, glideIdx });
  }

  function panelMinus() {
    if (!selGlide || !selShelf) return;
    const { doorIdx, shelfIdx, glideIdx } = selection;
    if (selGlide._type === 'custom') {
      const nextW = round1(selGlide.width - CUSTOM_INCREMENT);
      updateLayout((prev) => {
        const next = JSON.parse(JSON.stringify(prev));
        const glides = next[doorIdx].shelves[shelfIdx].glides;
        if (nextW < 0.5) glides.splice(glideIdx, 1);
        else glides[glideIdx].width = nextW;
        return next;
      });
      if (nextW < 0.5) setSelection(null);
      return;
    }
    const { start, end } = selBlock;
    updateLayout((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next[doorIdx].shelves[shelfIdx].glides.splice(end, 1);
      return next;
    });
    if (end === start) setSelection(null);
    else setSelection({ kind: 'glide', doorIdx, shelfIdx, glideIdx: Math.min(glideIdx, end - 1) });
  }

  function panelFill() {
    if (!selGlide || !selShelf) return;
    const { doorIdx, shelfIdx, glideIdx } = selection;
    const rem = remainingWidth(selShelf);
    if (selGlide._type === 'custom') {
      if (rem < 0.5) { showToast('Shelf is full', 'error', `${fmtIn(rem)} left`); return; }
      updateLayout((prev) => {
        const next = JSON.parse(JSON.stringify(prev));
        const g = next[doorIdx].shelves[shelfIdx].glides[glideIdx];
        g.width = round1(g.width + rem);
        return next;
      });
      return;
    }
    const w = selGlide.product.glideWidth || 0;
    const n = w > 0 ? Math.floor((rem + 0.001) / w) : 0;
    if (n <= 0) { showToast('Shelf is full', 'error', `${fmtIn(rem)} left, this product needs ${fmtIn(w)}`); return; }
    updateLayout((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const glides = next[doorIdx].shelves[shelfIdx].glides;
      const { end } = blockBounds(glides, glideIdx);
      const copies = Array.from({ length: n }, () => JSON.parse(JSON.stringify(glides[glideIdx])));
      glides.splice(end + 1, 0, ...copies);
      return next;
    });
  }

  function panelRemove() {
    if (!selGlide || !selShelf) return;
    const { doorIdx, shelfIdx, glideIdx } = selection;
    updateLayout((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const glides = next[doorIdx].shelves[shelfIdx].glides;
      if (glides[glideIdx]?._type === 'custom') {
        glides.splice(glideIdx, 1);
      } else {
        const { start, end } = blockBounds(glides, glideIdx);
        glides.splice(start, end - start + 1);
      }
      return next;
    });
    setSelection(null);
  }

  function panelToggleStack(single) {
    if (selection?.kind === 'library') { setSlimSingleMode(single); return; }
    if (!selGlide || !selShelf || selGlide._type === 'custom') return;
    const { doorIdx, shelfIdx, glideIdx } = selection;
    updateLayout((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const glides = next[doorIdx].shelves[shelfIdx].glides;
      const { start, end } = blockBounds(glides, glideIdx);
      for (let i = start; i <= end; i++) {
        if (single) glides[i].single = true;
        else delete glides[i].single;
      }
      return next;
    });
  }

  function panelNote(text) {
    if (!selGlide || selGlide._type !== 'custom') return;
    const { doorIdx, shelfIdx, glideIdx } = selection;
    updateLayout((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const g = next[doorIdx].shelves[shelfIdx].glides[glideIdx];
      if (text) g.note = text;
      else delete g.note;
      return next;
    });
  }

  // What the right panel shows.
  let info = null;
  if (selection?.kind === 'library') {
    const p = selection.product;
    info = {
      placed: false, isCustom: false, product: p, widthIn: round2(p.glideWidth),
      maxPerShelf: getMaxFacings(p), canStack: p.packType === 'Slim can', single: slimSingleMode,
    };
  } else if (selection?.kind === 'custom') {
    info = { placed: false, isCustom: true, widthIn: CUSTOM_INCREMENT };
  } else if (selGlide && selShelf) {
    if (selGlide._type === 'custom') {
      info = {
        placed: true, isCustom: true, door: selection.doorIdx + 1, shelf: selection.shelfIdx + 1,
        widthIn: selGlide.width, note: selGlide.note,
        noteKey: `${selection.doorIdx}-${selection.shelfIdx}-${selection.glideIdx}-${selGlide.note || ''}`,
        canAdd: remainingWidth(selShelf) >= 0.5,
      };
    } else {
      const block = selShelf.glides.slice(selBlock.start, selBlock.end + 1);
      info = {
        placed: true, isCustom: false, product: selGlide.product,
        door: selection.doorIdx + 1, shelf: selection.shelfIdx + 1, widthIn: round2(selGlide.product.glideWidth),
        facings: block.reduce((s, g) => s + facingsOf(g), 0),
        canAdd: canAddGlide(selShelf, selGlide.product),
        canStack: selGlide.product.packType === 'Slim can', single: !!selGlide.single,
      };
    }
  }

  /* ── totals ─────────────────────────────────────────────────────────── */
  const totalFacings = layout.reduce(
    (acc, door) => acc + door.shelves.reduce((a, s) => a + (s.glides?.reduce((sum, g) => sum + facingsOf(g), 0) || 0), 0), 0
  );
  const totalOverrides = layout.reduce(
    (acc, door) => acc + door.shelves.reduce((a, s) => a + (s.glides?.length || 0), 0), 0
  );
  const vendorMix = (() => {
    const acc = Object.fromEntries(VENDORS.map((v) => [v, 0]));
    for (const door of layout) {
      for (const shelf of door.shelves) {
        for (const g of shelf.glides || []) {
          if (g._type === 'custom') continue;
          const v = g.product?.vendor || 'Other';
          acc[VENDORS.includes(v) ? v : 'Other'] += facingsOf(g);
        }
      }
    }
    return acc;
  })();

  /* ── zoom ───────────────────────────────────────────────────────────── */
  const handleZoomIn = () => setZoom((z) => Math.min(z + 10, 150));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 10, 50));

  /* ── PDF export (all doors are always on the canvas) ────────────────── */
  const safeFile = (s) => String(s || '').replace(/[^a-z0-9-_]+/gi, '_');
  async function captureNode(node) {
    const { default: html2canvas } = await import('html2canvas');
    return html2canvas(node, { backgroundColor: '#ffffff', scale: 2, useCORS: true });
  }
  // Capture at 100% so the zoom level never distorts the PDF.
  async function withNormalZoom(fn) {
    const prev = zoom;
    if (prev !== 100) {
      setZoom(100);
      await new Promise((r) => setTimeout(r, 250));
    }
    try { return await fn(); } finally { if (prev !== 100) setZoom(prev); }
  }
  async function addDoorPage(pdf, node, i, first) {
    const canvas = await captureNode(node);
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 36;
    const ratio = Math.min((pageW - margin * 2) / canvas.width, (pageH - margin * 2 - 40) / canvas.height);
    const w = canvas.width * ratio;
    const h = canvas.height * ratio;
    if (!first) pdf.addPage();
    pdf.setFontSize(14);
    pdf.text(`${doorSet?.title || `${doorSet?.doors || 6} Doors`} — ${regionName} · ${node.getAttribute('data-door-label') || `Door ${i + 1}`}`, margin, margin + 8);
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', (pageW - w) / 2, margin + 30, w, h);
  }
  async function exportDoors(indices, fileName, doneMessage) {
    setSaveMenuOpen(false);
    setExporting(true);
    try {
      await withNormalZoom(async () => {
        const nodes = indices.map((i) => document.querySelector(`[data-door-idx="${i}"]`));
        if (nodes.some((n) => !n)) throw new Error('Door not found');
        const { default: jsPDF } = await import('jspdf');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
        for (let k = 0; k < nodes.length; k++) await addDoorPage(pdf, nodes[k], indices[k], k === 0);
        pdf.save(fileName);
      });
      showToast(doneMessage);
    } catch (err) {
      console.error(err);
      showToast('Export failed', 'error', 'See the console for details');
    } finally {
      setExporting(false);
    }
  }
  const exportAllDoors = () =>
    exportDoors(layout.map((_, i) => i), `planogram-${safeFile(regionName)}-all-doors.pdf`, `Exported ${layout.length} doors to PDF`);
  const exportDoorIndex = (i) =>
    exportDoors([i], `planogram-${safeFile(regionName)}-${safeFile(layout[i]?.label || `door-${i + 1}`)}.pdf`, `Exported ${layout[i]?.label || `Door ${i + 1}`}`);

  /* ── header actions ─────────────────────────────────────────────────── */
  function handleCancel() {
    if (totalFacings === 0) { onExit?.(); return; }
    setConfirmAction({
      title: 'Discard all changes?',
      message: 'This will remove all products from this planogram and return you to the previous screen.',
      confirmLabel: 'Yes, Discard',
      run: () => {
        setLayout(generateShelfLayout(doorSet?.doors || 6, doorSet?.defaultShelf || 7));
        historyRef.current = [];
        futureRef.current = [];
        setHistoryLen(0);
        setFutureLen(0);
        setSelection(null);
        showToast('Changes discarded');
        onExit?.();
      },
    });
  }
  function handlePublish() {
    if (totalFacings === 0) {
      showToast('Add at least one product', 'error', 'before publishing');
      return;
    }
    setSummaryMode('publish');
  }

  const status = doorSet?.status === 'active' ? 'active' : doorSet?.status === 'draft' ? 'draft' : 'archive';
  const statusOpt = STATUS_OPTIONS.find((o) => o.value === status) || STATUS_OPTIONS[0];

  const pdfMenuItems = (
    <>
      <div className="px-3 pt-2 pb-1 text-sm font-semibold text-gray-600">As PDF</div>
      <MenuItem indent onClick={exportAllDoors} disabled={exporting}>
        <span>All doors</span><span className="text-sm text-gray-600 font-normal">multi-page PDF</span>
      </MenuItem>
      {layout.map((door, idx) => (
        <MenuItem key={door.id} indent onClick={() => exportDoorIndex(idx)} disabled={exporting}>
          <span>{door.label}</span><span className="text-sm text-gray-600 font-normal">PDF</span>
        </MenuItem>
      ))}
    </>
  );
  const menuPanel = 'absolute right-0 top-11 z-40 bg-white border border-gray-200 rounded-lg shadow-[0px_4px_12px_rgba(0,0,0,0.1)] py-1 min-w-[240px] max-h-[360px] overflow-y-auto';

  const showSidePanels = !readOnly;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 min-h-16 px-4 lg:px-6 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {variant === 'tools' && onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back"
              className="flex items-center justify-center w-10 h-10 rounded-lg border-none bg-transparent text-gray-900 cursor-pointer hover:bg-gray-100 shrink-0"
            >
              <BackIcon />
            </button>
          )}
          <span className="text-base font-semibold text-gray-950 whitespace-nowrap">{doorSet?.doors || 6} Doors</span>
          <span className="text-gray-300">|</span>
          <span className="text-sm text-gray-600 truncate">{regionName}</span>
          {variant === 'tools' && onStatusChange && !readOnly ? (
            <div className="relative" ref={statusMenuRef}>
              <button
                type="button"
                onClick={() => setStatusMenuOpen((o) => !o)}
                aria-label="Change status"
                className="border-none bg-transparent p-0 cursor-pointer font-[inherit] flex items-center"
              >
                <Badge state={statusOpt.badge} rightIcon={<CaretIcon open={statusMenuOpen} />}>{statusOpt.label}</Badge>
              </button>
              {statusMenuOpen && (
                <div className="absolute left-0 top-9 z-40 bg-white border border-gray-200 rounded-lg shadow-[0px_4px_12px_rgba(0,0,0,0.1)] py-1 min-w-[160px]">
                  {STATUS_OPTIONS.map((o) => (
                    <MenuItem key={o.value} onClick={() => { setStatusMenuOpen(false); if (o.value !== status) { onStatusChange(o.value); showToast(`Status set to ${o.label}`); } }}>
                      <span>{o.label}</span>
                      {o.value === status && <span className="text-primary-blue-600">✓</span>}
                    </MenuItem>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Badge state={statusOpt.badge}>{statusOpt.label}</Badge>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0" data-tour="header-cta">
          {variant === 'tools' && !readOnly && (
            <>
              <Button type="Plain" size="l" onClick={handleCancel}>Cancel</Button>
              <div className="relative" ref={saveMenuRef}>
                <Button type="Outline" size="l" onClick={() => setSaveMenuOpen((o) => !o)} trailingIcon={<CaretIcon open={saveMenuOpen} />}>
                  {exporting ? 'Exporting…' : 'Save As'}
                </Button>
                {saveMenuOpen && (
                  <div className={menuPanel}>
                    <MenuItem onClick={() => { setSaveMenuOpen(false); setSummaryMode('draft'); }}>As draft</MenuItem>
                    <div className="h-px bg-gray-100 my-1" />
                    {pdfMenuItems}
                  </div>
                )}
              </div>
              <Button type="Default" size="l" onClick={handlePublish}>Publish</Button>
            </>
          )}

          {variant === 'location' && (
            <>
              <Badge state="Default">{`${totalOverrides} override${totalOverrides === 1 ? '' : 's'}`}</Badge>
              <div className="relative" ref={saveMenuRef}>
                <Button type="Outline" size="l" onClick={() => setSaveMenuOpen((o) => !o)} trailingIcon={<CaretIcon open={saveMenuOpen} />}>
                  {exporting ? 'Exporting…' : 'Export'}
                </Button>
                {saveMenuOpen && <div className={menuPanel}>{pdfMenuItems}</div>}
              </div>
              {onToggleReadOnly && (
                <button
                  type="button"
                  onClick={onToggleReadOnly}
                  title={readOnly ? 'Switch to Editor mode' : 'Switch to Viewer mode (read-only)'}
                  aria-label={readOnly ? 'Switch to Editor mode' : 'Switch to Viewer mode'}
                  className={toolbarBtn}
                >
                  {readOnly ? (
                    <svg width="18" height="18" viewBox="0 0 256 256" fill="none">
                      <path d="M40 216l4-44L172 44a8 8 0 0 1 11 0l29 29a8 8 0 0 1 0 11L84 212l-44 4z" stroke="currentColor" strokeWidth="14" strokeLinejoin="round" />
                      <path d="M152 64l40 40" stroke="currentColor" strokeWidth="14" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 256 256" fill="none">
                      <path d="M128 56C56 56 16 128 16 128s40 72 112 72 112-72 112-72-40-72-112-72z" stroke="currentColor" strokeWidth="14" />
                      <circle cx="128" cy="128" r="32" stroke="currentColor" strokeWidth="14" />
                    </svg>
                  )}
                </button>
              )}
              {!readOnly && (
                <Button type="Default" size="l" onClick={() => showToast(`Saved ${totalOverrides} override${totalOverrides === 1 ? '' : 's'}`)}>
                  Save Changes
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Body: library | canvas | selected product ── */}
      <div className="relative flex flex-1 min-h-0 gap-3 p-3 bg-gray-50">
        {showSidePanels && libraryOpen && (
          <div className="lg:hidden absolute inset-0 z-20 bg-black/30" onClick={() => setLibraryOpen(false)} />
        )}

        {showSidePanels && (
          <aside
            className={`${libraryOpen ? 'translate-x-0' : '-translate-x-[120%]'} absolute left-3 top-3 bottom-3 z-30 w-[320px] transition-transform duration-200 shadow-xl lg:shadow-none lg:static lg:translate-x-0 lg:w-[320px] lg:z-auto bg-white rounded-xl border border-gray-200 shrink-0 overflow-hidden flex flex-col`}
          >
            <ProductLibrary
              products={filteredProducts}
              search={productSearch} onSearch={setProductSearch}
              categoryNames={productCategories.map((c) => c.name)}
              categoryFilter={categoryFilter} onCategoryFilter={setCategoryFilter}
              packTypes={availablePackTypes}
              sizeFilter={sizeFilter} onSizeFilter={setSizeFilter}
              selection={selection}
              onSelectProduct={selectLibraryProduct}
              onSelectCustom={selectLibraryCustom}
              onDragStart={(item) => { setLibraryDragProduct(item); if (isTablet()) setLibraryOpen(false); }}
              onDragEnd={() => setLibraryDragProduct(null)}
              onTouchDrop={handleLibraryTouchDrop}
            />
          </aside>
        )}

        {/* Canvas column */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* Floating toolbar */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-gray-200 shrink-0" data-tour="toolbar">
            {showSidePanels && (
              <button
                type="button"
                onClick={() => setLibraryOpen(true)}
                className="lg:hidden flex items-center gap-2 h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50 font-[inherit]"
              >
                <ProductsIcon /> Products
              </button>
            )}
            <div className="ml-auto flex items-center gap-2">
              {!readOnly && (
                <div className="flex items-center gap-1" data-tour="undo-redo">
                  <Tooltip text="Undo"><button type="button" aria-label="Undo" onClick={handleUndo} disabled={historyLen === 0} className={toolbarBtn}><UndoIcon /></button></Tooltip>
                  <Tooltip text="Redo"><button type="button" aria-label="Redo" onClick={handleRedo} disabled={futureLen === 0} className={toolbarBtn}><RedoIcon /></button></Tooltip>
                </div>
              )}
              {!readOnly && <div className="w-px h-6 bg-gray-200 mx-1" />}
              <div className="flex items-center gap-1">
                <Tooltip text="Zoom out"><button type="button" aria-label="Zoom out" onClick={handleZoomOut} className={toolbarBtn}><ZoomOutIcon /></button></Tooltip>
                <span className="text-sm font-semibold text-gray-700 w-12 text-center">{zoom}</span>
                <Tooltip text="Zoom in"><button type="button" aria-label="Zoom in" onClick={handleZoomIn} className={toolbarBtn}><ZoomInIcon /></button></Tooltip>
              </div>
              {!readOnly && (
                <>
                  <div className="w-px h-6 bg-gray-200 mx-1" />
                  <Tooltip text="Restart the product walkthrough">
                    <button
                      type="button"
                      aria-label="Help"
                      onClick={() => { try { window.localStorage.removeItem(TOUR_FLAG); } catch { /* storage unavailable */ } setShowTour(true); }}
                      className={toolbarBtn}
                    >
                      <HelpIcon />
                    </button>
                  </Tooltip>
                </>
              )}
            </div>
          </div>

          {/* Canvas */}
          <div className="relative flex-1 min-h-0 rounded-xl border border-gray-200 bg-white overflow-hidden flex flex-col">
            {pickedShelf && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-[#0B2148] text-white text-sm font-medium px-4 py-2 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.18)] max-w-[90%]">
                <span className="truncate">
                  {`${layout[pickedShelf.doorIdx]?.shelves[pickedShelf.shelfIdx]?.label || `Shelf ${pickedShelf.shelfIdx + 1}`} from Door ${pickedShelf.doorIdx + 1} copied — click any shelf to paste`}
                </span>
                <button type="button" onClick={() => setPickedShelf(null)} aria-label="Cancel" className="ml-1 text-white/80 hover:text-white cursor-pointer bg-transparent border-none p-1 shrink-0">
                  <CloseIcon />
                </button>
              </div>
            )}

            <div
              className="flex-1 min-h-0 overflow-auto"
              data-tour="canvas"
              style={{ backgroundImage: 'radial-gradient(#D0D5DD 1px, transparent 1px)', backgroundSize: '16px 16px', touchAction: 'pan-x pan-y' }}
              onClick={(e) => { if (!e.target.closest('[data-door-idx]')) { setSelection(null); } }}
            >
              {/* Extra room below the doors so the canvas always scrolls up/down, and so
                  doors can be scrolled clear of the tablet bottom sheet. */}
              <div
                className="flex items-start gap-12 p-8 pb-24 w-max min-w-full"
                style={{ zoom: zoom / 100, paddingBottom: !isDesktop && info ? '55vh' : undefined }}
              >
                {layout.map((door, doorIdx) => (
                  <div key={door.id} data-door-idx={doorIdx} data-door-label={door.label} className="w-[400px] shrink-0">
                    <DoorColumn
                      door={door}
                      doorIdx={doorIdx}
                      maxShelves={MAX_SHELVES_PER_DOOR}
                      onAddShelfToDoor={handleAddShelfToDoor}
                      readOnly={readOnly}
                      shelfProps={{
                        armedWidth,
                        selectedGlide: selection?.kind === 'glide' ? selection : null,
                        pickedShelf, onPickShelf: handlePickShelf,
                        dragSource, dragOver,
                        libraryDragProduct, onLibraryDrop: handleLibraryDrop,
                        onGlideClick: handleGlideClick, onZoneClick: handleZoneClick,
                        onGlideMouseDown: handleGlideMouseDown,
                        onGlideMouseEnter: handleGlideMouseEnter,
                        onShelfMouseUp: handleShelfMouseUp,
                        onTouchMoveDrop: handleTouchMoveDrop,
                        onRemoveShelf: handleRemoveShelfRequest,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {!readOnly && (
            <p className="text-sm text-gray-600 leading-snug m-0 px-1 shrink-0">
              Drag a placed pack onto another slot to swap them. Select a pack to remove it or repeat it across the shelf.
            </p>
          )}
        </div>

        {/* Right panel — desktop */}
        {showSidePanels && isDesktop && (
          <aside className="w-[300px] shrink-0 overflow-y-auto">
            <SelectedPanel
              info={info}
              onPlus={panelPlus} onMinus={panelMinus} onFill={panelFill} onRemove={panelRemove}
              onToggleStack={panelToggleStack} onNote={panelNote}
              vendorMix={vendorMix} totalFacings={totalFacings}
            />
          </aside>
        )}

        {/* Right panel — tablet bottom sheet (only while something is selected) */}
        {showSidePanels && !isDesktop && info && (
          <div className="absolute left-3 right-3 bottom-3 z-30 max-h-[55%] overflow-y-auto rounded-xl shadow-[0_-4px_24px_rgba(0,0,0,0.18)]">
            <SelectedPanel
              hideVendor
              info={info}
              onClose={() => setSelection(null)}
              onPlus={panelPlus} onMinus={panelMinus} onFill={panelFill} onRemove={panelRemove}
              onToggleStack={panelToggleStack} onNote={panelNote}
              vendorMix={vendorMix} totalFacings={totalFacings}
            />
          </div>
        )}
      </div>

      {showTour && !readOnly && <PlanogramTour onClose={dismissTour} />}

      <PlanogramSummary
        open={!!summaryMode}
        mode={summaryMode || 'draft'}
        doorCount={layout.length}
        facings={totalFacings}
        vendorMix={vendorMix}
        regionName={regionName}
        onCancel={() => setSummaryMode(null)}
        onConfirm={() => {
          const wasPublish = summaryMode === 'publish';
          setSummaryMode(null);
          if (wasPublish) {
            showToast('Planogram published');
            onExit?.();
          }
        }}
      />

      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.title}
        message={confirmAction?.message}
        cancelLabel="Cancel"
        confirmLabel={confirmAction?.confirmLabel || 'Confirm'}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          const run = confirmAction?.run;
          setConfirmAction(null);
          run?.();
        }}
      />

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] w-[min(92vw,420px)]">
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white border border-gray-200 shadow-[0px_8px_24px_rgba(0,0,0,0.18)]">
            {toast.tone === 'error' ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0 mt-0.5">
                <circle cx="10" cy="10" r="9" fill="#D92D20" />
                <path d="M7 7l6 6M13 7l-6 6" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0 mt-0.5">
                <circle cx="10" cy="10" r="9" fill="#067647" />
                <path d="M6 10.5l2.8 2.8L14 7.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-gray-950">{toast.title}</div>
              {toast.desc && <div className="text-sm text-gray-600 mt-0.5">{toast.desc}</div>}
            </div>
            <button type="button" onClick={() => setToast(null)} aria-label="Dismiss" className="shrink-0 flex items-center justify-center w-8 h-8 -mr-1 -mt-1 rounded-lg border-none bg-transparent text-gray-700 cursor-pointer hover:bg-gray-100">
              <CloseIcon />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
