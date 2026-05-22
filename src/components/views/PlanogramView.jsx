import { useState, useRef, useEffect, useCallback } from 'react';
import Badge from '../Badge';
import Button from '../Button';
import ConfirmDialog from '../ConfirmDialog';
import { productCategories, generateShelfLayout, SHELF_WIDTH_INCHES, getMaxFacings, PACK_TYPES, PACK_TYPE_LABELS, VENDORS, VENDOR_COLORS } from '../../data/planogram';

// Module-level glide helpers — used by both PlanogramView and the rendering subcomponents.
function glideWidthOf(g) {
  if (!g) return 0;
  if (g._type === 'custom') return g.width || 0;
  return g.product?.glideWidth || 0;
}
// Facings count: slim cans stack 2 vertically per glide by default; if the
// glide is explicitly marked `single`, it counts as 1. Custom areas count 0;
// everything else is 1 facing per glide.
function facingsOf(g) {
  if (!g || g._type === 'custom') return 0;
  if (g.product?.packType === 'Slim can' && !g.single) return 2;
  return 1;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

/* ─── Custom Select Dropdown ─── */
function SelectDropdown({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-1.5 h-7 w-16 px-2 text-xs font-semibold text-gray-900 bg-white border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
      >
        {value}
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={`shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>
          <path d="M1 1L5 5L9 1" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-[0px_4px_12px_rgba(0,0,0,0.1)] py-1 min-w-[64px]">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`flex items-center justify-between w-full px-3 py-1.5 text-xs font-medium cursor-pointer bg-transparent border-none font-[inherit] hover:bg-gray-50 ${opt === value ? 'text-primary-blue-600' : 'text-gray-900'}`}
            >
              {opt}
              {opt === value && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 3" stroke="#266DF0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Tooltip (matches Figma node 24772:170136) ─── */
function Tooltip({ text, position = 'down', children }) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef(null);

  function show() {
    timeoutRef.current = setTimeout(() => setVisible(true), 400);
  }
  function hide() {
    clearTimeout(timeoutRef.current);
    setVisible(false);
  }

  const posMap = {
    down: 'left-1/2 -translate-x-1/2 top-full mt-1.5',
    up: 'left-1/2 -translate-x-1/2 bottom-full mb-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
  };

  const arrowMap = {
    down: 'left-1/2 -translate-x-1/2 -top-[4px]',
    up: 'left-1/2 -translate-x-1/2 -bottom-[4px]',
    right: '-left-[4px] top-1/2 -translate-y-1/2',
    left: '-right-[4px] top-1/2 -translate-y-1/2',
  };

  return (
    <div className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible && (
        <div className={`absolute z-50 pointer-events-none ${posMap[position]}`}>
          <div className="relative flex flex-col items-center">
            <div className="bg-[#0C111D] px-2.5 py-1 rounded-[7px] whitespace-nowrap">
              <span className="text-xs font-semibold text-white leading-4">{text}</span>
            </div>
            <div className={`absolute w-[10px] h-[10px] ${arrowMap[position]}`}>
              <div className="w-[10px] h-[10px] bg-[#0C111D] rounded-[3px] rotate-45" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Toolbar Icons (inline SVGs) ─── */
function CursorIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M4.5 3L14 8.5L9 9.5L7 14.5L4.5 3Z" stroke={active ? '#266DF0' : '#667085'} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function PlusBoxIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="3" y="3" width="12" height="12" rx="2" stroke={active ? '#266DF0' : '#667085'} strokeWidth="1.4"/>
      <path d="M9 6.5V11.5M6.5 9H11.5" stroke={active ? '#266DF0' : '#667085'} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function MoveIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 3V15M9 3L6.5 5.5M9 3L11.5 5.5M9 15L6.5 12.5M9 15L11.5 12.5M3 9H15M3 9L5.5 6.5M3 9L5.5 11.5M15 9L12.5 6.5M15 9L12.5 11.5" stroke={active ? '#266DF0' : '#667085'} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function TrashIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M3.75 5.25H14.25M7.5 8.25V12.75M10.5 8.25V12.75M4.5 5.25L5.25 14.25C5.25 14.6478 5.40804 15.0294 5.68934 15.3107C5.97064 15.592 6.35218 15.75 6.75 15.75H11.25C11.6478 15.75 12.0294 15.592 12.3107 15.3107C12.592 15.0294 12.75 14.6478 12.75 14.25L13.5 5.25M6.75 5.25V3.75C6.75 3.35218 6.90804 2.97064 7.18934 2.68934C7.47064 2.40804 7.85218 2.25 8.25 2.25H9.75C10.1478 2.25 10.5294 2.40804 10.8107 2.68934C11.092 2.97064 11.25 3.35218 11.25 3.75V5.25" stroke={active ? '#266DF0' : '#667085'} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CopyIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="6" y="6" width="9" height="9" rx="1.5" stroke={active ? '#266DF0' : '#667085'} strokeWidth="1.3"/>
      <path d="M12 6V4.5C12 3.67157 11.3284 3 10.5 3H4.5C3.67157 3 3 3.67157 3 4.5V10.5C3 11.3284 3.67157 12 4.5 12H6" stroke={active ? '#266DF0' : '#667085'} strokeWidth="1.3"/>
    </svg>
  );
}

function CustomIcon({ active }) {
  // Dashed square — signifies a reserved "free space" area
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="3" y="3" width="12" height="12" rx="2" stroke={active ? '#266DF0' : '#667085'} strokeWidth="1.4" strokeDasharray="2 2" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 6H10C11.6569 6 13 7.34315 13 9C13 10.6569 11.6569 12 10 12H8" stroke="#667085" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5.5 3.5L3 6L5.5 8.5" stroke="#667085" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M13 6H6C4.34315 6 3 7.34315 3 9C3 10.6569 4.34315 12 6 12H8" stroke="#667085" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.5 3.5L13 6L10.5 8.5" stroke="#667085" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 2v7M7 2L4.5 4.5M7 2l2.5 2.5M2.5 9v1.5A1.5 1.5 0 0 0 4 12h6a1.5 1.5 0 0 0 1.5-1.5V9" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ZoomInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="4.5" stroke="#667085" strokeWidth="1.3"/>
      <path d="M10.5 10.5L14 14" stroke="#667085" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M7 5V9M5 7H9" stroke="#667085" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function ZoomOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="4.5" stroke="#667085" strokeWidth="1.3"/>
      <path d="M10.5 10.5L14 14" stroke="#667085" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M5 7H9" stroke="#667085" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="6.25" cy="6.25" r="3.75" stroke="#667085" strokeWidth="1.2"/>
      <path d="M9 9L12 12" stroke="#667085" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

/* ─── Width Badge — shows container type label for non-standard sizes ─── */
const WIDTH_LABELS = {
  0.75: { label: 'Slim', bg: 'bg-sky-100', text: 'text-sky-700' },
  1.25: { label: 'Bottle', bg: 'bg-amber-100', text: 'text-amber-700' },
  1.5:  { label: '1L', bg: 'bg-orange-100', text: 'text-orange-700' },
  1.75: { label: '2L+', bg: 'bg-red-100', text: 'text-red-700' },
};

function WidthBadge({ widthMultiplier }) {
  const entry = WIDTH_LABELS[widthMultiplier];
  if (!entry) return null;
  return (
    <span className={`inline-flex items-center px-1 py-0.5 rounded text-[9px] font-semibold ${entry.bg} ${entry.text} leading-none shrink-0`}>
      {entry.label}
    </span>
  );
}

/* ─── Product Row ─── */
function ProductRow({ product, selected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(product)}
      className={`flex items-center gap-2.5 w-full px-3 py-2.5 border-none cursor-pointer font-[inherit] transition-colors border-b border-b-gray-100 ${
        selected ? 'bg-primary-blue-50' : 'bg-transparent hover:bg-gray-50'
      }`}
    >
      <div className="w-8 h-8 rounded bg-gray-100 border border-gray-200 shrink-0 overflow-hidden flex items-center justify-center">
        <img
          src={product.image}
          alt=""
          className="w-full h-full object-contain"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentNode.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gray-100"><span class="text-xs font-bold text-gray-500">${product.id.toUpperCase()}</span></div>`;
          }}
        />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className={`text-xs font-medium leading-tight truncate ${
          selected ? 'text-primary-blue-600' : 'text-gray-900'
        }`}>
          {product.name}
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-xs text-gray-400 font-mono truncate">{product.upc}</span>
          <span className="text-xs text-gray-300">|</span>
          <span className="text-xs text-gray-500 font-medium shrink-0">{product.size}</span>
          <WidthBadge widthMultiplier={product.widthMultiplier} />
        </div>
      </div>
    </button>
  );
}

/* ─── Filter Dropdown ─── */
function FilterDropdown({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const normalized = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  const display = value === 'all' ? label : (normalized.find((o) => o.value === value)?.label ?? value);
  const items = [{ value: 'all', label }, ...normalized];

  return (
    <div className="flex-1 min-w-0 relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-1.5 w-full h-7 px-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 transition-colors font-[inherit]"
      >
        <span className="truncate">{display}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={`shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>
          <path d="M1 1L5 5L9 1" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-[0px_4px_12px_rgba(0,0,0,0.1)] py-1 max-h-64 overflow-y-auto">
          {items.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`flex items-center justify-between w-full px-3 py-1.5 text-xs font-medium cursor-pointer bg-transparent border-none font-[inherit] hover:bg-gray-50 ${opt.value === value ? 'text-primary-blue-600' : 'text-gray-900'}`}
            >
              <span className="truncate text-left">{opt.label}</span>
              {opt.value === value && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                  <path d="M2 6L5 9L10 3" stroke="#266DF0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Shelf Row in Canvas ─── */
function ShelfRow({
  shelf, doorIdx, shelfIdx, selectedProduct, activeTool,
  onAddGlide, onRemoveGlide, onDuplicateGlide,
  selectedGlides, onGlideClick,
  pickedGlide, pickedProduct, dragSource, dragOver,
  onGlideMouseDown, onGlideMouseEnter, onShelfMouseUp,
  customIncrement, onAddCustomArea,
  onRemoveShelf,
}) {
  const glides = shelf.glides || [];
  const widthOf = (g) => g?._type === 'custom' ? (g.width || 0) : (g?.product?.glideWidth || 0);
  const used = glides.reduce((s, g) => s + widthOf(g), 0);
  const remaining = Math.max(0, SHELF_WIDTH_INCHES - used);
  const remainingPct = (remaining / SHELF_WIDTH_INCHES) * 100;
  // Smallest possible glide is the slim-can width (2.5″). When the leftover
  // space drops below that, no further product can ever fit — switch to
  // `justify-between` so existing glides spread evenly instead of huddling left.
  const SMALLEST_GLIDE = 2.5;
  const isShelfNearFull = glides.length >= 2 && remaining < SMALLEST_GLIDE;
  const selectedFits = selectedProduct
    ? used + (selectedProduct.glideWidth || 0) <= SHELF_WIDTH_INCHES + 0.001
    : false;
  const pickedFits = pickedProduct
    ? used + (pickedProduct.glideWidth || 0) <= SHELF_WIDTH_INCHES + 0.001
    : false;
  const isDragging = !!dragSource;

  return (
    <div className="flex items-stretch group/shelf">
      <div className="w-[18px] shrink-0 flex items-center justify-center text-[9px] text-gray-400/70 font-medium select-none relative">
        <span className="group-hover/shelf:opacity-0 transition-opacity">{shelfIdx + 1}</span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemoveShelf?.(doorIdx, shelfIdx); }}
          title={`Remove Shelf ${shelfIdx + 1}`}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/shelf:opacity-100 transition-opacity cursor-pointer bg-transparent border-none p-0 hover:text-red-600 text-gray-500"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      <div className={`flex-1 flex border-b border-gray-300/40 bg-transparent relative ${isShelfNearFull ? 'justify-between' : ''}`}>
        {glides.map((glide, glideIdx) => {
          const isCustom = glide._type === 'custom';
          const product = glide.product;
          const widthPct = (widthOf(glide) / SHELF_WIDTH_INCHES) * 100;
          const isSelected = selectedGlides.some(
            (s) => s.doorIdx === doorIdx && s.shelfIdx === shelfIdx && s.glideIdx === glideIdx
          );
          const isPicked = pickedGlide?.doorIdx === doorIdx && pickedGlide?.shelfIdx === shelfIdx && pickedGlide?.glideIdx === glideIdx;
          const isDragSource = dragSource?.doorIdx === doorIdx && dragSource?.shelfIdx === shelfIdx && dragSource?.glideIdx === glideIdx;
          const isDragOver = dragOver?.doorIdx === doorIdx && dragOver?.shelfIdx === shelfIdx && dragOver?.glideIdx === glideIdx;

          let cursorClass = '';
          let hoverClass = '';
          if (activeTool === 'move' && !isDragging) {
            cursorClass = 'cursor-grab';
            hoverClass = 'hover:ring-2 hover:ring-primary-blue-150 hover:ring-inset';
          } else if (activeTool === 'move' && isDragging) {
            cursorClass = 'cursor-grabbing';
          } else if (activeTool === 'select') {
            cursorClass = 'cursor-pointer';
            hoverClass = 'hover:ring-2 hover:ring-primary-blue-150 hover:ring-inset';
          } else if (activeTool === 'remove') {
            cursorClass = 'cursor-pointer';
            hoverClass = 'hover:bg-red-50';
          } else if (activeTool === 'copy' && !isCustom) {
            if (!pickedGlide) {
              cursorClass = 'cursor-copy';
              hoverClass = 'hover:ring-2 hover:ring-green-300 hover:ring-inset';
            }
          }

          let dragOverClass = '';
          if (isDragOver && isDragging && !isDragSource) {
            dragOverClass = 'ring-2 ring-primary-blue-400 ring-inset bg-primary-blue-50/40';
          }

          // Insertion-line cue — show a blue vertical bar on the glide's left edge
          // when an insertion-armed tool is active and the new item would fit.
          const insertingAdd    = activeTool === 'add' && selectedProduct;
          const insertingCopy   = activeTool === 'copy' && pickedProduct;
          const insertingCustom = activeTool === 'custom';
          const insertProduct   = insertingAdd ? selectedProduct : insertingCopy ? pickedProduct : null;
          const insertProductFits = insertProduct
            ? used + (insertProduct.glideWidth || 0) <= SHELF_WIDTH_INCHES + 0.001
            : false;
          const customCueFits   = insertingCustom && customIncrement <= remaining + 0.001;
          const showInsertCue   = (insertProduct && insertProductFits) || customCueFits;

          return (
            <div
              key={glideIdx}
              style={{ width: `${widthPct}%` }}
              onMouseDown={(e) => {
                if (activeTool === 'move') {
                  e.preventDefault(); // Block native image/text drag from hijacking
                  onGlideMouseDown(doorIdx, shelfIdx, glideIdx);
                }
              }}
              onMouseEnter={() => {
                if (activeTool === 'move') onGlideMouseEnter(doorIdx, shelfIdx, glideIdx);
              }}
              onMouseUp={() => {
                if (activeTool === 'move') onShelfMouseUp(doorIdx, shelfIdx, glideIdx);
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (activeTool === 'select') {
                  onGlideClick(doorIdx, shelfIdx, glideIdx);
                } else if (activeTool === 'remove') {
                  onRemoveGlide(doorIdx, shelfIdx, glideIdx);
                } else if (activeTool === 'copy') {
                  // Two-phase: if no source picked yet, pick a non-custom source;
                  // if a source IS picked, insert a duplicate BEFORE this clicked glide.
                  if (!pickedGlide) {
                    if (!isCustom) onDuplicateGlide(doorIdx, shelfIdx, glideIdx);
                  } else {
                    onDuplicateGlide(doorIdx, shelfIdx, glideIdx);
                  }
                } else if (activeTool === 'add' && selectedProduct) {
                  // Insert the new facing BEFORE this glide (custom or not — custom
                  // doesn't react to product clicks beyond moving it right by insertion).
                  onAddGlide(doorIdx, shelfIdx, selectedProduct, glideIdx);
                } else if (activeTool === 'custom') {
                  // Insert a fresh Custom block BEFORE this glide.
                  onAddCustomArea(doorIdx, shelfIdx, customIncrement, glideIdx);
                }
              }}
              className={`h-[52px] border-r border-gray-300/30 flex items-center justify-center transition-all select-none relative group/glide ${cursorClass} ${!isDragging ? hoverClass : ''} ${
                isSelected ? 'ring-2 ring-primary-blue-500 ring-inset bg-primary-blue-50/30' : ''
              } ${isPicked ? 'ring-2 ring-amber-400 ring-inset bg-amber-50/40' : ''} ${dragOverClass}`}
              title={
                isCustom
                  ? `Custom area (${widthOf(glide)}″) — store owner's free space`
                  : product?.packType === 'Slim can' && !glide.single
                  ? `${product.name} (${product.size}) — 2 stacked facings (${product.glideWidth}″)`
                  : product?.packType === 'Slim can' && glide.single
                  ? `${product.name} (${product.size}) — 1 facing, not stacked (${product.glideWidth}″)`
                  : product
                  ? `${product.name} (${product.size}) — ${product.glideWidth}″`
                  : 'Glide'
              }
            >
              {/* Insertion-line cue — left edge of this glide becomes the insert-here marker */}
              {showInsertCue && (
                <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary-blue-500 opacity-0 group-hover/glide:opacity-100 pointer-events-none z-10" />
              )}

              {isCustom ? (
                <div className="w-[88%] h-[80%] rounded border border-dashed border-gray-400 bg-gray-50/50 flex items-center justify-center">
                  <span className="text-[9px] font-semibold text-gray-500 leading-none tracking-wide uppercase">
                    Custom · {Math.round(widthOf(glide) * 10) / 10}″
                  </span>
                </div>
              ) : product?.packType === 'Slim can' && !glide.single ? (
                <div className={`w-full h-full flex flex-col gap-[1px] overflow-hidden transition-opacity ${isDragSource ? 'opacity-40' : ''} ${isPicked ? 'opacity-50' : ''}`}>
                  <img
                    src={product.image}
                    alt=""
                    draggable={false}
                    className="flex-1 min-h-0 w-full object-contain pointer-events-none"
                  />
                  <img
                    src={product.image}
                    alt=""
                    draggable={false}
                    className="flex-1 min-h-0 w-full object-contain pointer-events-none"
                  />
                </div>
              ) : (
              <div
                className={`w-full h-full overflow-hidden transition-opacity ${isDragSource ? 'opacity-40' : ''} ${isPicked ? 'opacity-50' : ''}`}
              >
                <img
                  src={product.image}
                  alt=""
                  draggable={false}
                  className="w-full h-full object-contain pointer-events-none"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentNode.classList.add('flex', 'items-center', 'justify-center');
                    e.target.parentNode.innerHTML = `<span class="text-xs font-medium text-gray-500">${product.id.toUpperCase()}</span>`;
                  }}
                />
              </div>
              )}
            </div>
          );
        })}

        {/* Trailing empty zone — accepts Add, Move drop, Duplicate paste,
            Custom tool clicks, and a right-click → Mark all remaining as Custom.
            Hidden once the shelf flips to auto-distribute mode (no useful slot
            for "append" when glides are space-between). */}
        {remainingPct > 0.1 && !isShelfNearFull && (() => {
          const addArmed    = activeTool === 'add'    && selectedProduct;
          const copyArmed   = activeTool === 'copy'   && pickedProduct;
          const customArmed = activeTool === 'custom';
          const moveArmed   = activeTool === 'move'   && isDragging;
          const customFits  = customArmed && customIncrement <= remaining + 0.001;
          let zoneClass = '';
          let zoneTitle = `${Math.round(remaining * 10) / 10}″ left  (right-click → mark as Custom)`;

          if (addArmed) {
            zoneClass = selectedFits
              ? 'cursor-crosshair hover:bg-primary-blue-50/50'
              : 'bg-gray-100/40 cursor-not-allowed';
            zoneTitle = selectedFits
              ? `Click to add ${selectedProduct.name} (${selectedProduct.glideWidth}″)`
              : `Not enough room — ${Math.round(remaining * 10) / 10}″ left, needs ${selectedProduct.glideWidth}″`;
          } else if (copyArmed) {
            zoneClass = pickedFits
              ? 'cursor-copy hover:bg-green-50/50'
              : 'bg-gray-100/40 cursor-not-allowed';
            zoneTitle = pickedFits
              ? `Click to duplicate ${pickedProduct.name} here (${pickedProduct.glideWidth}″)`
              : `Not enough room — ${Math.round(remaining * 10) / 10}″ left, needs ${pickedProduct.glideWidth}″`;
          } else if (customArmed) {
            zoneClass = customFits
              ? 'cursor-crosshair hover:bg-amber-50/40'
              : 'bg-gray-100/40 cursor-not-allowed';
            zoneTitle = customFits
              ? `Click to extend Custom area by ${customIncrement}″ (right-click → fill remaining)`
              : `Not enough room — ${Math.round(remaining * 10) / 10}″ left, needs ${customIncrement}″`;
          } else if (moveArmed) {
            zoneClass = 'cursor-grabbing bg-primary-blue-50/40 ring-2 ring-primary-blue-300 ring-inset';
            zoneTitle = 'Release to drop here';
          }

          return (
            <div
              style={{ width: `${remainingPct}%` }}
              onMouseEnter={() => {
                // Mirror the per-glide mouseenter so dragging into an *empty*
                // shelf (where the trailing zone is the only target) registers
                // movement and the drop isn't silently rejected.
                if (activeTool === 'move') onGlideMouseEnter(doorIdx, shelfIdx, null);
              }}
              onMouseUp={() => {
                if (activeTool === 'move') onShelfMouseUp(doorIdx, shelfIdx, null);
              }}
              onClick={() => {
                if (addArmed && selectedFits) {
                  onAddGlide(doorIdx, shelfIdx, selectedProduct);
                } else if (copyArmed) {
                  // Pass null as the destination glide index — the handler treats this as "append".
                  onDuplicateGlide(doorIdx, shelfIdx, null);
                } else if (customArmed && customFits) {
                  onAddCustomArea(doorIdx, shelfIdx, customIncrement);
                }
              }}
              onContextMenu={(e) => {
                // Right-click → reserve ALL remaining width as one Custom area.
                e.preventDefault();
                if (remaining >= 0.5) onAddCustomArea(doorIdx, shelfIdx, Infinity);
              }}
              className={`h-[52px] flex items-center justify-center transition-colors select-none ${zoneClass}`}
              title={zoneTitle}
            >
              <span className="text-[9px] text-gray-400/60 font-medium pointer-events-none">
                {Math.round(remaining * 10) / 10}″
              </span>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

/* ─── Single Door Column ─── */
function DoorColumn({
  door, doorIdx, selectedProduct, activeTool,
  onAddGlide, onRemoveGlide, onDuplicateGlide,
  selectedGlides, onGlideClick,
  pickedGlide, pickedProduct, dragSource, dragOver,
  onGlideMouseDown, onGlideMouseEnter, onShelfMouseUp,
  customIncrement, onAddCustomArea,
  onAddShelfToDoor, onRemoveShelf, maxShelves,
}) {
  const facingCount = door.shelves.reduce(
    (acc, s) => acc + (s.glides?.reduce((sum, g) => sum + facingsOf(g), 0) || 0),
    0
  );
  const customInches = door.shelves.reduce(
    (acc, s) => acc + (s.glides?.filter((g) => g._type === 'custom').reduce((sum, g) => sum + (g.width || 0), 0) || 0),
    0
  );
  const shelfCount = door.shelves.length;

  return (
    <div className="flex flex-col gap-1">
      {/* Door label above frame */}
      <div className="flex items-center justify-center">
        <span className="text-[11px] font-semibold text-gray-500 tracking-wide">{door.label}</span>
      </div>

      {/* Cooler door frame */}
      <div className="relative flex flex-col rounded-md overflow-hidden border-[3px] border-[#EAECF0]">
        {/* Top rail */}
        <div className="h-[6px] bg-[#EAECF0] shrink-0" />

        {/* Glass panel */}
        <div className="relative flex flex-col bg-white p-1">
          {/* Door handle — vertical chrome bar on the right */}
          <div
            className="absolute right-[6px] top-1/2 -translate-y-1/2 z-10 pointer-events-none"
            style={{ height: '40%' }}
          >
            <div className="w-[4px] h-full rounded-full bg-gradient-to-b from-gray-300 via-gray-200 to-gray-300 shadow-[0_0_3px_rgba(0,0,0,0.25)] border border-gray-400/40" />
          </div>

          {door.shelves.map((shelf, shelfIdx) => (
            <ShelfRow
              key={shelf.id}
              shelf={shelf}
              doorIdx={doorIdx}
              shelfIdx={shelfIdx}
              selectedProduct={selectedProduct}
              activeTool={activeTool}
              onAddGlide={onAddGlide}
              onRemoveGlide={onRemoveGlide}
              onDuplicateGlide={onDuplicateGlide}
              selectedGlides={selectedGlides}
              onGlideClick={onGlideClick}
              pickedGlide={pickedGlide}
              pickedProduct={pickedProduct}
              dragSource={dragSource}
              dragOver={dragOver}
              onGlideMouseDown={onGlideMouseDown}
              onGlideMouseEnter={onGlideMouseEnter}
              onShelfMouseUp={onShelfMouseUp}
              customIncrement={customIncrement}
              onAddCustomArea={onAddCustomArea}
              onRemoveShelf={onRemoveShelf}
            />
          ))}

          {/* + Add shelf button — inside the glass panel, above the bottom rail */}
          <button
            type="button"
            onClick={() => onAddShelfToDoor?.(doorIdx)}
            disabled={shelfCount >= (maxShelves || 10)}
            className={`flex items-center justify-center gap-1 h-[20px] border-t border-dashed border-gray-300/60 text-[10px] font-medium transition-colors bg-transparent ${
              shelfCount >= (maxShelves || 10)
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-500 hover:bg-primary-blue-50/40 hover:text-primary-blue-600 cursor-pointer'
            }`}
            title={shelfCount >= (maxShelves || 10) ? `Max ${maxShelves || 10} shelves per door` : 'Add a shelf to this door'}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M5 2v6M2 5h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            Add shelf
          </button>
        </div>

        {/* Bottom rail + stats */}
        <div className="h-[32px] flex items-center justify-center bg-[#0B2148] shrink-0">
          <span className="text-[11px] text-white font-medium">
            {facingCount} facings{customInches > 0 ? ` · ${Math.round(customInches * 10) / 10}″ custom` : ''} · {shelfCount} shelves
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function PlanogramView({ doorSet, regionName, onExit }) {
  const [activeTool, setActiveTool] = useState('select');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [productSearch, setProductSearch] = useState('');
  const [focusedDoor, setFocusedDoor] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [showRecentlyUsed, setShowRecentlyUsed] = useState(false);
  const [recentlyUsed, setRecentlyUsed] = useState([]);
  const [viewDoorsOpen, setViewDoorsOpen] = useState(true);
  // When a Slim-can product is the active selection, this toggle switches
  // between adding single cans (default) and stacked pairs.
  const [slimSingleMode, setSlimSingleMode] = useState(true);
  const [vendorMixOpen, setVendorMixOpen] = useState(true);
  const [selectedGlides, setSelectedGlides] = useState([]); // [{doorIdx, shelfIdx, glideIdx}]
  const [pickedGlide, setPickedGlide] = useState(null);     // {doorIdx, shelfIdx, glideIdx}
  const [layout, setLayout] = useState(() =>
    generateShelfLayout(doorSet?.doors || 6, doorSet?.defaultShelf || 7)
  );

  const [toast, setToast] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const showToast = useCallback((message, tone = 'success') => {
    setToast({ message, tone, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const historyRef = useRef([]);
  const futureRef = useRef([]);
  const MAX_HISTORY = 50;

  const pushHistory = useCallback((prevLayout) => {
    historyRef.current = [...historyRef.current.slice(-(MAX_HISTORY - 1)), JSON.stringify(prevLayout)];
    futureRef.current = [];
  }, []);

  const [historyLen, setHistoryLen] = useState(0);
  const [futureLen, setFutureLen] = useState(0);

  const updateLayout = useCallback((updater) => {
    setLayout((prev) => {
      pushHistory(prev);
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setHistoryLen(historyRef.current.length);
      setFutureLen(0);
      return next;
    });
  }, [pushHistory]);

  function handleUndo() {
    if (historyRef.current.length === 0) return;
    const prev = historyRef.current.pop();
    futureRef.current.push(JSON.stringify(layout));
    setLayout(JSON.parse(prev));
    setHistoryLen(historyRef.current.length);
    setFutureLen(futureRef.current.length);
  }

  function handleRedo() {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current.pop();
    historyRef.current.push(JSON.stringify(layout));
    setLayout(JSON.parse(next));
    setHistoryLen(historyRef.current.length);
    setFutureLen(futureRef.current.length);
  }

  const tools = [
    { id: 'select', label: 'Select',      tip: 'Click facings to multi-select; bulk-remove from the action bar.', icon: CursorIcon },
    { id: 'add',    label: 'Add Product', tip: 'Click a shelf to add one facing of the selected product.',          icon: PlusBoxIcon },
    { id: 'custom', label: 'Custom Area', tip: 'Click a shelf to reserve 2.5″ for the store owner. Click again to extend.', icon: CustomIcon },
    { id: 'move',   label: 'Move',        tip: 'Drag a facing to reorder, or drop it onto another shelf.',           icon: MoveIcon },
    { id: 'remove', label: 'Remove',      tip: 'Click a facing to remove it.',                                       icon: TrashIcon },
  ];

  // Each Custom-tool click reserves one increment of free space (= smallest
  // glide width, 2.5″). Consecutive clicks at the end of a shelf coalesce into
  // a single growing Custom block, mirroring how repeated Add-Product clicks
  // build up a lane of the same product.
  const CUSTOM_INCREMENT = 2.5;

  const [dragSource, setDragSource] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const isDraggingRef = useRef(false);
  const dragMovedRef = useRef(false);

  // ─── Glide helpers ──────────────────────────────────────────────────────
  // (glideWidthOf and facingsOf are module-scoped below — used by ShelfRow + DoorColumn too)
  function usedWidth(shelf) {
    return (shelf?.glides || []).reduce((sum, g) => sum + glideWidthOf(g), 0);
  }
  function remainingWidth(shelf) {
    return Math.max(0, SHELF_WIDTH_INCHES - usedWidth(shelf));
  }
  function canAddGlide(shelf, product) {
    if (!product?.glideWidth) return false;
    // Floating point tolerance — 0.001 prevents 30 === 29.999... rejections.
    return usedWidth(shelf) + product.glideWidth <= SHELF_WIDTH_INCHES + 0.001;
  }
  function canAddCustom(shelf, widthIn) {
    if (!widthIn || widthIn <= 0) return false;
    return usedWidth(shelf) + widthIn <= SHELF_WIDTH_INCHES + 0.001;
  }
  function fmtIn(n) {
    return `${Math.round(n * 10) / 10}″`;
  }

  function handleGlideMouseDown(doorIdx, shelfIdx, glideIdx) {
    if (activeTool !== 'move') return;
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

  function handleShelfMouseUp(doorIdx, shelfIdx, glideIdx) {
    // glideIdx may be null when dropping on the trailing empty zone (append)
    if (activeTool !== 'move') return;

    if (isDraggingRef.current && dragSource) {
      const isSameGlide =
        dragSource.doorIdx === doorIdx &&
        dragSource.shelfIdx === shelfIdx &&
        dragSource.glideIdx === glideIdx;

      if (dragMovedRef.current && !isSameGlide) {
        const srcShelf = layout[dragSource.doorIdx]?.shelves[dragSource.shelfIdx];
        const destShelf = layout[doorIdx]?.shelves[shelfIdx];
        const srcGlide = srcShelf?.glides[dragSource.glideIdx];
        if (srcGlide && destShelf) {
          // Cross-shelf overflow check (intra-shelf reorder is always allowed)
          const isSameShelf = dragSource.doorIdx === doorIdx && dragSource.shelfIdx === shelfIdx;
          const need = glideWidthOf(srcGlide);
          const wouldFit = usedWidth(destShelf) + need <= SHELF_WIDTH_INCHES + 0.001;
          if (!isSameShelf && !wouldFit) {
            const label = srcGlide._type === 'custom' ? 'this custom area' : 'this product';
            showToast(`Shelf is full — ${fmtIn(remainingWidth(destShelf))} left, ${label} needs ${fmtIn(need)}`, 'error');
          } else {
            updateLayout((prev) => {
              const next = JSON.parse(JSON.stringify(prev));
              const sShelf = next[dragSource.doorIdx].shelves[dragSource.shelfIdx];
              const dShelf = next[doorIdx].shelves[shelfIdx];
              const [moved] = sShelf.glides.splice(dragSource.glideIdx, 1);
              if (isSameShelf) {
                // Insert at adjusted position
                let insertAt = glideIdx ?? dShelf.glides.length;
                if (dragSource.glideIdx < insertAt) insertAt -= 1;
                dShelf.glides.splice(insertAt, 0, moved);
              } else {
                const insertAt = glideIdx ?? dShelf.glides.length;
                dShelf.glides.splice(insertAt, 0, moved);
              }
              return next;
            });
          }
        }
      }
    }

    isDraggingRef.current = false;
    dragMovedRef.current = false;
    setDragSource(null);
    setDragOver(null);
  }

  function handleGlideClick(doorIdx, shelfIdx, glideIdx) {
    setSelectedGlides((prev) => {
      const exists = prev.some(
        (s) => s.doorIdx === doorIdx && s.shelfIdx === shelfIdx && s.glideIdx === glideIdx
      );
      if (exists) {
        return prev.filter(
          (s) => !(s.doorIdx === doorIdx && s.shelfIdx === shelfIdx && s.glideIdx === glideIdx)
        );
      }
      return [...prev, { doorIdx, shelfIdx, glideIdx }];
    });
  }

  // `insertAt` is the index to splice the new glide BEFORE; null/undefined → append.
  function handleAddGlide(doorIdx, shelfIdx, product, insertAt = null) {
    const shelf = layout[doorIdx]?.shelves[shelfIdx];
    if (!shelf || !product) return;
    if (!canAddGlide(shelf, product)) {
      showToast(
        `Shelf is full — ${fmtIn(remainingWidth(shelf))} left, this product needs ${fmtIn(product.glideWidth)}`,
        'error'
      );
      return;
    }
    updateLayout((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const glides = next[doorIdx].shelves[shelfIdx].glides;
      const entry = { product: { ...product } };
      // Honour slim-single mode for slim cans only — other pack types ignore it.
      if (product.packType === 'Slim can' && slimSingleMode) entry.single = true;
      if (insertAt == null) glides.push(entry);
      else glides.splice(insertAt, 0, entry);
      return next;
    });
    trackRecentlyUsed(product.id);
  }

  // Add (or grow) a Custom area at the trailing end of a shelf.
  //   - Each call reserves `CUSTOM_INCREMENT` inches by default.
  //   - If the last glide is already a Custom block, its width grows in place
  //     so consecutive clicks read as a single block (UX parity with adding
  //     more facings of the same product).
  //   - Pass `Infinity` for the right-click "fill remaining" shortcut.
  function handleAddCustomArea(doorIdx, shelfIdx, requestedWidth = CUSTOM_INCREMENT, insertAt = null) {
    const shelf = layout[doorIdx]?.shelves[shelfIdx];
    if (!shelf) return;
    const rem = remainingWidth(shelf);
    const w = Math.round(Math.min(requestedWidth, rem) * 10) / 10;
    if (w < 0.5) {
      showToast(`Shelf is full — ${fmtIn(rem)} left`, 'error');
      return;
    }
    updateLayout((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const glides = next[doorIdx].shelves[shelfIdx].glides;
      if (insertAt == null) {
        // Append path: auto-coalesce with the trailing custom block.
        const last = glides[glides.length - 1];
        if (last && last._type === 'custom') {
          last.width = Math.round((last.width + w) * 10) / 10;
        } else {
          glides.push({ _type: 'custom', width: w });
        }
      } else {
        // Explicit insertion at a specific index — always a fresh block.
        glides.splice(insertAt, 0, { _type: 'custom', width: w });
      }
      return next;
    });
  }

  function handleRemoveGlide(doorIdx, shelfIdx, glideIdx) {
    updateLayout((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next[doorIdx].shelves[shelfIdx].glides.splice(glideIdx, 1);
      return next;
    });
  }

  function handleDuplicateGlide(doorIdx, shelfIdx, glideIdx) {
    // Two-step copy: click source first, then a destination shelf to add a duplicate.
    // `glideIdx === null` from the trailing-zone path means "append"; otherwise "insert before this glide".
    const source = glideIdx == null ? null : layout[doorIdx]?.shelves[shelfIdx]?.glides[glideIdx];

    if (!pickedGlide && source && source._type !== 'custom' && source.product) {
      setPickedGlide({ doorIdx, shelfIdx, glideIdx });
      return;
    }
    if (pickedGlide) {
      const srcGlide = layout[pickedGlide.doorIdx]?.shelves[pickedGlide.shelfIdx]?.glides[pickedGlide.glideIdx];
      if (!srcGlide?.product) { setPickedGlide(null); return; }
      const destShelf = layout[doorIdx]?.shelves[shelfIdx];
      if (!destShelf) { setPickedGlide(null); return; }
      if (!canAddGlide(destShelf, srcGlide.product)) {
        showToast(
          `Shelf is full — ${fmtIn(remainingWidth(destShelf))} left, this product needs ${fmtIn(srcGlide.product.glideWidth)}`,
          'error'
        );
        setPickedGlide(null);
        return;
      }
      updateLayout((prev) => {
        const next = JSON.parse(JSON.stringify(prev));
        const src = next[pickedGlide.doorIdx].shelves[pickedGlide.shelfIdx].glides[pickedGlide.glideIdx];
        const entry = { product: { ...src.product } };
        const destGlides = next[doorIdx].shelves[shelfIdx].glides;
        if (glideIdx == null) destGlides.push(entry);
        else destGlides.splice(glideIdx, 0, entry);
        return next;
      });
      setPickedGlide(null);
    }
  }

  function handleMarkCustomSelected() {
    if (selectedGlides.length === 0) return;
    // No-op: custom marking on glides isn't a meaningful op in glide model.
    // Kept for API parity; just clears selection.
    setSelectedGlides([]);
  }

  // Replace every selected (non-custom) glide's product with the library-selected
  // product. Custom areas in the selection are skipped — they stay reserved.
  // Validates per-shelf that the swap doesn't overflow the 30″ budget.
  function handleApplySelectedProduct() {
    if (!selectedProduct) {
      showToast('Pick a product in the library first', 'error');
      return;
    }
    if (selectedGlides.length === 0) return;

    // Group selected glides by shelf and filter out custom ones (immutable).
    const byShelf = new Map();
    for (const s of selectedGlides) {
      const shelf = layout[s.doorIdx]?.shelves[s.shelfIdx];
      const glide = shelf?.glides[s.glideIdx];
      if (!shelf || !glide || glide._type === 'custom') continue;
      const k = `${s.doorIdx}|${s.shelfIdx}`;
      if (!byShelf.has(k)) byShelf.set(k, { shelf, indices: [] });
      byShelf.get(k).indices.push(s.glideIdx);
    }

    if (byShelf.size === 0) {
      showToast('No editable facings selected', 'error');
      return;
    }

    // Validate every affected shelf fits the new total width.
    const newW = selectedProduct.glideWidth;
    for (const { shelf, indices } of byShelf.values()) {
      const removedWidth = indices.reduce((sum, i) => sum + (shelf.glides[i].product?.glideWidth || 0), 0);
      const projected = usedWidth(shelf) - removedWidth + indices.length * newW;
      if (projected > SHELF_WIDTH_INCHES + 0.001) {
        showToast(
          `Shelf would overflow — ${selectedProduct.name} (${newW}″) doesn't fit in place of the selected facings`,
          'error'
        );
        return;
      }
    }

    updateLayout((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const isSlimSingle = selectedProduct.packType === 'Slim can' && slimSingleMode;
      for (const [k, { indices }] of byShelf) {
        const [d, sh] = k.split('|').map(Number);
        for (const i of indices) {
          const entry = { product: { ...selectedProduct } };
          if (isSlimSingle) entry.single = true;
          next[d].shelves[sh].glides[i] = entry;
        }
      }
      return next;
    });
    trackRecentlyUsed(selectedProduct.id);
    // Count facings actually written — slim cans count as 2 per glide.
    const glidesApplied = [...byShelf.values()].reduce((sum, { indices }) => sum + indices.length, 0);
    const facingsApplied = glidesApplied * facingsOf({ product: selectedProduct });
    showToast(`Applied ${selectedProduct.name} to ${facingsApplied} facing${facingsApplied === 1 ? '' : 's'}`);
    setSelectedGlides([]);
  }

  function handleRemoveSelected() {
    if (selectedGlides.length === 0) return;
    updateLayout((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      // Remove highest indices first per shelf so earlier removals don't shift later ones.
      const byShelf = new Map();
      for (const s of selectedGlides) {
        const k = `${s.doorIdx}|${s.shelfIdx}`;
        if (!byShelf.has(k)) byShelf.set(k, []);
        byShelf.get(k).push(s.glideIdx);
      }
      for (const [k, idxs] of byShelf) {
        const [d, sh] = k.split('|').map(Number);
        const sorted = [...new Set(idxs)].sort((a, b) => b - a);
        for (const i of sorted) next[d].shelves[sh].glides.splice(i, 1);
      }
      return next;
    });
    setSelectedGlides([]);
  }

  function handleZoomIn() {
    setZoom((z) => Math.min(z + 10, 150));
  }

  function handleZoomOut() {
    setZoom((z) => Math.max(z - 10, 50));
  }

  // ─── Export to PDF ────────────────────────────────────────────────────
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportMenuRef = useRef(null);
  useEffect(() => {
    if (!exportMenuOpen) return;
    function handleClick(e) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) setExportMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [exportMenuOpen]);

  async function captureNode(node) {
    const { default: html2canvas } = await import('html2canvas');
    return html2canvas(node, { backgroundColor: '#ffffff', scale: 2, useCORS: true });
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function safeFile(s) { return String(s || '').replace(/[^a-z0-9-_]+/gi, '_'); }

  async function exportDoorIndex(doorIdx) {
    setExportMenuOpen(false);
    if (focusedDoor !== 'all' && focusedDoor !== doorIdx) {
      showToast('Switch to All Doors view to export a different door', 'error');
      return;
    }
    const node = document.querySelector(`[data-door-idx="${doorIdx}"]`);
    if (!node) {
      showToast('Door not visible — switch to All Doors view first', 'error');
      return;
    }
    setExporting(true);
    try {
      const canvas = await captureNode(node);
      const { default: jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 36;
      const maxW = pageW - margin * 2;
      const maxH = pageH - margin * 2 - 40; // reserve room for header
      const ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
      const w = canvas.width * ratio;
      const h = canvas.height * ratio;
      pdf.setFontSize(14);
      pdf.text(`${doorSet?.title || `${doorSet?.doors || 6} Doors`} — ${regionName} · ${node.getAttribute('data-door-label') || `Door ${doorIdx + 1}`}`, margin, margin + 8);
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', (pageW - w) / 2, margin + 30, w, h);
      pdf.save(`planogram-${safeFile(regionName)}-${safeFile(node.getAttribute('data-door-label') || `door-${doorIdx + 1}`)}.pdf`);
      showToast(`Exported ${node.getAttribute('data-door-label') || `Door ${doorIdx + 1}`}`);
    } catch (err) {
      console.error(err);
      showToast('Export failed — see console', 'error');
    } finally {
      setExporting(false);
    }
  }

  async function exportAllDoors() {
    setExportMenuOpen(false);
    if (focusedDoor !== 'all') {
      showToast('Switch to All Doors view to export the full set', 'error');
      return;
    }
    setExporting(true);
    try {
      const nodes = layout.map((_, i) => document.querySelector(`[data-door-idx="${i}"]`)).filter(Boolean);
      if (nodes.length === 0) throw new Error('No door nodes found');
      const { default: jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 36;
      const maxW = pageW - margin * 2;
      const maxH = pageH - margin * 2 - 40;
      for (let i = 0; i < nodes.length; i++) {
        const canvas = await captureNode(nodes[i]);
        const ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
        const w = canvas.width * ratio;
        const h = canvas.height * ratio;
        if (i > 0) pdf.addPage();
        pdf.setFontSize(14);
        pdf.text(`${doorSet?.title || `${doorSet?.doors || 6} Doors`} — ${regionName} · ${nodes[i].getAttribute('data-door-label') || `Door ${i + 1}`}`, margin, margin + 8);
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', (pageW - w) / 2, margin + 30, w, h);
      }
      pdf.save(`planogram-${safeFile(regionName)}-all-doors.pdf`);
      showToast(`Exported ${nodes.length} doors to PDF`);
    } catch (err) {
      console.error(err);
      showToast('Export failed — see console', 'error');
    } finally {
      setExporting(false);
    }
  }

  const MAX_SHELVES_PER_DOOR = 10;

  function handleAddShelfToDoor(doorIdx) {
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

  function handleRemoveShelfRequest(doorIdx, shelfIdx) {
    const shelf = layout[doorIdx]?.shelves[shelfIdx];
    if (!shelf) return;
    if (layout[doorIdx].shelves.length <= 1) {
      showToast('Each door must keep at least one shelf', 'error');
      return;
    }
    const facingTotal = shelf.glides.reduce((sum, g) => sum + facingsOf(g), 0);
    const customWidth = shelf.glides.reduce((sum, g) => sum + (g._type === 'custom' ? g.width : 0), 0);
    if (facingTotal === 0 && customWidth === 0) {
      removeShelf(doorIdx, shelfIdx);
      return;
    }
    const fragments = [];
    if (facingTotal > 0) fragments.push(`${facingTotal} facing${facingTotal === 1 ? '' : 's'}`);
    if (customWidth > 0) fragments.push(`${Math.round(customWidth * 10) / 10}″ custom`);
    setConfirmAction({
      title: `Remove Shelf ${shelfIdx + 1} from Door ${doorIdx + 1}?`,
      message: `${fragments.join(' + ')} will be deleted.`,
      confirmLabel: 'Yes, Remove',
      run: () => removeShelf(doorIdx, shelfIdx),
    });
  }

  function removeShelf(doorIdx, shelfIdx) {
    updateLayout((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next[doorIdx].shelves.splice(shelfIdx, 1);
      // Re-label remaining shelves for sanity.
      next[doorIdx].shelves.forEach((s, i) => { s.label = `Shelf ${i + 1}`; });
      return next;
    });
  }

  function switchTool(toolId) {
    setActiveTool(toolId);
    setPickedGlide(null);
    setDragSource(null);
    setDragOver(null);
    isDraggingRef.current = false;
    if (toolId !== 'select') {
      setSelectedGlides([]);
    }
  }

  useEffect(() => {
    function handleGlobalMouseUp() {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        dragMovedRef.current = false;
        setDragSource(null);
        setDragOver(null);
      }
    }
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        isDraggingRef.current = false;
        dragMovedRef.current = false;
        setDragSource(null);
        setDragOver(null);
        setPickedGlide(null);
        setSelectedGlides([]);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const allProducts = productCategories.flatMap((cat) =>
    cat.products.map((p) => ({ ...p, category: cat.name }))
  );

  const allCategoryNames = productCategories.map((c) => c.name);
  // Only show pack types that actually appear in the catalogue (keeps order from PACK_TYPES).
  const availablePackTypes = PACK_TYPES
    .filter((pt) => allProducts.some((p) => p.packType === pt))
    .map((pt) => ({ value: pt, label: PACK_TYPE_LABELS[pt] || pt }));

  const filteredProducts = allProducts.filter((p) => {
    if (showRecentlyUsed && !recentlyUsed.includes(p.id)) return false;
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (sizeFilter !== 'all' && p.packType !== sizeFilter) return false;
    if (productSearch) {
      const q = productSearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.upc.includes(productSearch) ||
        p.size.toLowerCase().includes(q)
      );
    }
    return true;
  });

  function trackRecentlyUsed(productId) {
    setRecentlyUsed((prev) => {
      const filtered = prev.filter((id) => id !== productId);
      return [productId, ...filtered].slice(0, 15);
    });
  }

  const totalFacings = layout.reduce(
    (acc, door) => acc + door.shelves.reduce(
      (a, s) => a + (s.glides?.reduce((sum, g) => sum + facingsOf(g), 0) || 0),
      0
    ),
    0
  );

  // Sum facings per vendor across the whole layout.
  const vendorMix = (() => {
    const acc = Object.fromEntries(VENDORS.map((v) => [v, 0]));
    for (const door of layout) {
      for (const shelf of door.shelves) {
        for (const g of shelf.glides || []) {
          if (g._type === 'custom') continue;
          const v = g.product?.vendor || 'Other';
          const key = VENDORS.includes(v) ? v : 'Other';
          acc[key] += facingsOf(g);
        }
      }
    }
    return acc;
  })();
  const totalCustomInches = layout.reduce(
    (acc, door) => acc + door.shelves.reduce(
      (a, s) => a + (s.glides?.filter((g) => g._type === 'custom').reduce((sum, g) => sum + (g.width || 0), 0) || 0),
      0
    ),
    0
  );

  // Source product for an in-progress Duplicate operation. Used by ShelfRow's
  // trailing empty zone to render a "click to duplicate" affordance.
  const pickedProduct = pickedGlide
    ? layout[pickedGlide.doorIdx]?.shelves[pickedGlide.shelfIdx]?.glides[pickedGlide.glideIdx]?.product
    : null;

  const showBulkPanel = activeTool === 'select' && selectedGlides.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Top action bar */}
      <div className="flex items-center justify-between h-14 px-6 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-950">
            {doorSet?.doors || 6} Doors
          </span>
          <span className="text-xs text-gray-400">|</span>
          <span className="text-xs text-gray-500">{regionName}</span>
          <Badge state="Active">
            {doorSet?.status === 'active' ? 'Active' : doorSet?.status === 'draft' ? 'Draft' : 'Archive'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge state="Default">
            {totalFacings} facings{totalCustomInches > 0 ? ` · ${Math.round(totalCustomInches * 10) / 10}″ custom` : ''}
          </Badge>
          <Button
            type="Outline"
            size="sm"
            onClick={() => {
              if (totalFacings === 0) {
                onExit?.();
                return;
              }
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
                  showToast('Changes discarded');
                  onExit?.();
                },
              });
            }}
          >
            Discard
          </Button>
          <Button
            type="Outline"
            size="sm"
            onClick={() => showToast('Draft saved')}
          >
            Save Draft
          </Button>
          <Button
            type="Default"
            size="sm"
            onClick={() => {
              if (totalFacings === 0) {
                showToast('Add at least one product before publishing', 'error');
                return;
              }
              setConfirmAction({
                title: 'Publish this planogram?',
                message: `${totalFacings} facings across ${layout.length} doors will be published to ${regionName}.`,
                confirmLabel: 'Yes, Publish',
                run: () => {
                  showToast('Planogram published');
                  onExit?.();
                },
              });
            }}
          >
            Publish
          </Button>
        </div>
      </div>

      {/* Toolbar above canvas */}
      <div className="flex items-center h-[56px] px-4 bg-gray-50 shrink-0">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{layout.length} doors &times; {layout[0]?.shelves.length || 0} shelves</span>
        </div>

        <div className="ml-auto flex items-center">
          <div className="flex items-center gap-1">
            {tools.map((tool) => (
              <Tooltip key={tool.id} text={tool.tip || tool.label} position="down">
                <button
                  onClick={() => switchTool(tool.id)}
                  className={`flex items-center gap-1.5 h-8 px-2.5 rounded-lg border cursor-pointer transition-colors text-xs font-medium ${
                    activeTool === tool.id
                      ? 'bg-primary-blue-50 border-primary-blue-150 text-primary-blue-600'
                      : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <tool.icon active={activeTool === tool.id} />
                  {tool.label}
                </button>
              </Tooltip>
            ))}

          </div>

          <div className="w-px h-5 bg-gray-200 mx-3" />

          <div className="flex items-center gap-1">
            <Tooltip text="Undo" position="down">
              <button
                onClick={handleUndo}
                disabled={historyLen === 0}
                className={`flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white cursor-pointer transition-colors ${
                  historyLen === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'
                }`}
              >
                <UndoIcon />
              </button>
            </Tooltip>
            <Tooltip text="Redo" position="down">
              <button
                onClick={handleRedo}
                disabled={futureLen === 0}
                className={`flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white cursor-pointer transition-colors ${
                  futureLen === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'
                }`}
              >
                <RedoIcon />
              </button>
            </Tooltip>
          </div>

          <div className="w-px h-5 bg-gray-200 mx-3" />

          <div className="flex items-center gap-1">
            <Tooltip text="Zoom Out" position="down">
              <button
                onClick={handleZoomOut}
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer"
              >
                <ZoomOutIcon />
              </button>
            </Tooltip>
            <span className="text-xs font-medium text-gray-600 w-10 text-center">{zoom}%</span>
            <Tooltip text="Zoom In" position="down">
              <button
                onClick={handleZoomIn}
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer"
              >
                <ZoomInIcon />
              </button>
            </Tooltip>
          </div>

          <div className="w-px h-5 bg-gray-200 mx-3" />

          {/* Export dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <Tooltip text={exporting ? 'Generating PDF…' : 'Download as PDF'} position="down">
              <button
                onClick={() => !exporting && setExportMenuOpen((o) => !o)}
                disabled={exporting}
                className={`flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 transition-colors ${
                  exporting ? 'opacity-60 cursor-wait' : 'hover:bg-gray-50 cursor-pointer'
                }`}
              >
                <ExportIcon />
                {exporting ? 'Exporting…' : 'Export'}
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={`shrink-0 transition-transform duration-150 ${exportMenuOpen ? 'rotate-180' : ''}`}>
                  <path d="M1 1L5 5L9 1" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </Tooltip>
            {exportMenuOpen && (
              <div className="absolute right-0 top-9 z-30 bg-white border border-gray-200 rounded-lg shadow-[0px_4px_12px_rgba(0,0,0,0.1)] py-1 min-w-[200px] max-h-[280px] overflow-y-auto">
                <button
                  onClick={exportAllDoors}
                  disabled={focusedDoor !== 'all'}
                  title={focusedDoor !== 'all' ? 'Switch to All Doors view to export the full set' : undefined}
                  className={`flex items-center justify-between w-full px-3 py-2 text-xs font-semibold border-none font-[inherit] transition-colors ${
                    focusedDoor !== 'all' ? 'text-gray-300 cursor-not-allowed bg-transparent' : 'text-gray-900 hover:bg-gray-50 cursor-pointer bg-transparent'
                  }`}
                >
                  <span>All {layout.length} doors</span>
                  <span className="text-[10px] text-gray-400 font-normal">multi-page PDF</span>
                </button>
                <div className="h-px bg-gray-100 my-1" />
                {layout.map((door, idx) => {
                  const disabled = focusedDoor !== 'all' && focusedDoor !== idx;
                  return (
                    <button
                      key={door.id}
                      onClick={() => exportDoorIndex(idx)}
                      disabled={disabled}
                      title={disabled ? 'Switch to All Doors view to export a different door' : undefined}
                      className={`flex items-center justify-between w-full px-3 py-1.5 text-xs font-medium border-none font-[inherit] transition-colors ${
                        disabled ? 'text-gray-300 cursor-not-allowed bg-transparent' : 'text-gray-900 hover:bg-gray-50 cursor-pointer bg-transparent'
                      }`}
                    >
                      <span>{door.label}</span>
                      <span className="text-[10px] text-gray-400 font-normal">PDF</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main layout: sidebar + canvas */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar */}
        <div className="w-[340px] shrink-0 border-r border-gray-200 flex flex-col bg-white">

          {/* View Doors — collapsible */}
          <div className="px-3 py-4 border-b border-gray-200">
            <button
              onClick={() => setViewDoorsOpen(!viewDoorsOpen)}
              className="flex items-center justify-between w-full bg-transparent border-none cursor-pointer p-0 font-[inherit]"
            >
              <span className="text-sm font-semibold text-gray-700">View Doors</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-transform duration-200 ${viewDoorsOpen ? '' : '-rotate-90'}`}>
                <path d="M3 4.5L6 7.5L9 4.5" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {viewDoorsOpen && (
            <div className="flex flex-col gap-1 mt-2">
              <button
                onClick={() => setFocusedDoor('all')}
                className={`flex items-center gap-2 w-full px-2.5 py-2 text-xs font-medium rounded-md border cursor-pointer font-[inherit] transition-colors ${
                  focusedDoor === 'all'
                    ? 'bg-primary-blue-50 border-primary-blue-150 text-primary-blue-600'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1.5" y="2" width="3" height="10" rx="0.75" stroke={focusedDoor === 'all' ? '#266DF0' : '#667085'} strokeWidth="1.2"/>
                  <rect x="5.5" y="2" width="3" height="10" rx="0.75" stroke={focusedDoor === 'all' ? '#266DF0' : '#667085'} strokeWidth="1.2"/>
                  <rect x="9.5" y="2" width="3" height="10" rx="0.75" stroke={focusedDoor === 'all' ? '#266DF0' : '#667085'} strokeWidth="1.2"/>
                </svg>
                All Doors
              </button>
              <div className="grid grid-cols-3 gap-1">
                {layout.map((door, idx) => (
                  <button
                    key={door.id}
                    onClick={() => setFocusedDoor(idx)}
                    className={`flex items-center justify-center h-7 text-xs font-medium rounded-md border cursor-pointer font-[inherit] transition-colors ${
                      focusedDoor === idx
                        ? 'bg-primary-blue-50 border-primary-blue-150 text-primary-blue-600'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    D{idx + 1}
                  </button>
                ))}
              </div>
            </div>
            )}
          </div>

          {/* Vendor mix */}
          <div className="px-3 py-4 border-b border-gray-200">
            <button
              onClick={() => setVendorMixOpen(!vendorMixOpen)}
              className="flex items-center justify-between w-full bg-transparent border-none cursor-pointer p-0 font-[inherit]"
            >
              <span className="text-sm font-semibold text-gray-700">Vendor mix</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-transform duration-200 ${vendorMixOpen ? '' : '-rotate-90'}`}>
                <path d="M3 4.5L6 7.5L9 4.5" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {vendorMixOpen && (
              totalFacings === 0 ? (
                <p className="mt-2.5 text-[11px] text-gray-400">No facings placed yet.</p>
              ) : (
                <div className="mt-2.5 space-y-2">
                  {VENDORS.map((v) => {
                    const count = vendorMix[v] || 0;
                    const pct = totalFacings > 0 ? (count / totalFacings) * 100 : 0;
                    return (
                      <div key={v}>
                        <div className="flex items-center justify-between text-[11px] text-gray-600">
                          <span className="font-medium">{v}</span>
                          <span>
                            <span className="font-semibold text-gray-900">{count}</span>
                            <span className="text-gray-400"> · {pct < 1 && count > 0 ? '<1' : Math.round(pct)}%</span>
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: VENDOR_COLORS[v] }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>

          {/* Product library */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-3 pt-4 pb-3">
              <span className="text-sm font-semibold text-gray-700">Product Library</span>
            </div>

            <div className="px-3 pb-2 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 h-7 px-2 rounded-md border border-gray-200 bg-white">
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Search name, UPC..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-gray-700 placeholder:text-gray-400 w-full font-[inherit]"
                />
                {productSearch && (
                  <button
                    onClick={() => setProductSearch('')}
                    className="shrink-0 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer text-sm leading-none"
                  >
                    &times;
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <FilterDropdown
                  label="All Categories"
                  value={categoryFilter}
                  options={allCategoryNames}
                  onChange={setCategoryFilter}
                />
                <FilterDropdown
                  label="All Sizes"
                  value={sizeFilter}
                  options={availablePackTypes}
                  onChange={setSizeFilter}
                />
              </div>
            </div>

            <div className="px-3 pb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRecentlyUsed}
                  onChange={() => setShowRecentlyUsed(!showRecentlyUsed)}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-primary-blue-500 accent-primary-blue-500 cursor-pointer"
                />
                <span className="text-xs font-medium text-gray-600 select-none">
                  Recently Used
                  {recentlyUsed.length > 0 && (
                    <span className="text-gray-400 ml-1">({recentlyUsed.length})</span>
                  )}
                </span>
              </label>
            </div>

            <div className="flex-1 overflow-y-auto border-t border-gray-100">
              {filteredProducts.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  selected={selectedProduct?.id === product.id}
                  onSelect={(p) => {
                    setSelectedProduct(p);
                    // If the user is in the middle of a bulk Select op, stay in Select
                    // so they can hit "Apply selected product". Otherwise default to Add.
                    if (!(activeTool === 'select' && selectedGlides.length > 0)) {
                      switchTool('add');
                    }
                  }}
                />
              ))}
              {filteredProducts.length === 0 && (
                <div className="px-3 py-8 text-center">
                  <div className="text-xs text-gray-400">
                    {showRecentlyUsed && recentlyUsed.length === 0
                      ? 'No products used yet. Place a product on the canvas to see it here.'
                      : 'No products match your filters.'}
                  </div>
                  {(categoryFilter !== 'all' || sizeFilter !== 'all' || productSearch || showRecentlyUsed) && (
                    <button
                      onClick={() => {
                        setCategoryFilter('all');
                        setSizeFilter('all');
                        setProductSearch('');
                        setShowRecentlyUsed(false);
                      }}
                      className="mt-2 text-xs font-medium text-primary-blue-500 bg-transparent border-none cursor-pointer font-[inherit] hover:underline"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="px-3 py-1.5 border-t border-gray-100 shrink-0">
              <span className="text-xs text-gray-400">
                {filteredProducts.length} of {allProducts.length} products
              </span>
            </div>
          </div>

          {selectedProduct && activeTool !== 'select' ? (
            <div className="px-3 py-3 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-md bg-white border border-gray-200 shrink-0 overflow-hidden flex items-center justify-center">
                  <img
                    src={selectedProduct.image}
                    alt=""
                    className="w-full h-full object-contain"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-gray-900 truncate">{selectedProduct.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5 truncate">
                    <span className="text-xs text-gray-400 font-mono truncate">{selectedProduct.upc}</span>
                    <span className="text-xs text-gray-300 shrink-0">·</span>
                    <span className="text-xs text-gray-500 shrink-0">{selectedProduct.size}</span>
                    <WidthBadge widthMultiplier={selectedProduct.widthMultiplier} />
                  </div>
                </div>
              </div>
              <p className="text-xs text-primary-blue-500 mt-2 font-medium">
                Click a shelf to place one facing ({fmtIn(selectedProduct.glideWidth || 0)} wide, max {getMaxFacings(selectedProduct)} per 30″ shelf).
              </p>

              {/* Slim-can stack/single toggle — only shown for slim-can products */}
              {selectedProduct.packType === 'Slim can' && (
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-[11px] text-gray-500 font-medium">Mode:</span>
                  <div className="inline-flex rounded-md border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => setSlimSingleMode(false)}
                      className={`h-6 px-2 text-[11px] font-semibold transition-colors border-none cursor-pointer ${
                        !slimSingleMode
                          ? 'bg-primary-blue-500 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                      title="Each click adds 2 stacked cans (1 glide = 2 facings)"
                    >
                      Stacked × 2
                    </button>
                    <button
                      onClick={() => setSlimSingleMode(true)}
                      className={`h-6 px-2 text-[11px] font-semibold transition-colors border-none cursor-pointer border-l border-gray-200 ${
                        slimSingleMode
                          ? 'bg-primary-blue-500 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                      title="Each click adds 1 single can (1 glide = 1 facing)"
                    >
                      Single
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Canvas area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white relative">

          <div className="flex-1 overflow-auto p-6">
            {focusedDoor === 'all' ? (
              <div
                className="grid grid-cols-3 gap-6 transition-transform origin-top-left"
                style={{ transform: `scale(${zoom / 100})` }}
              >
                {layout.map((door, doorIdx) => (
                  <div key={door.id} data-door-idx={doorIdx} data-door-label={door.label}>
                    <DoorColumn
                      door={door}
                      doorIdx={doorIdx}
                      selectedProduct={selectedProduct}
                      activeTool={activeTool}
                      onAddGlide={handleAddGlide}
                      onRemoveGlide={handleRemoveGlide}
                      onDuplicateGlide={handleDuplicateGlide}
                      selectedGlides={selectedGlides}
                      onGlideClick={handleGlideClick}
                      pickedGlide={pickedGlide}
                      pickedProduct={pickedProduct}
                      dragSource={dragSource}
                      dragOver={dragOver}
                      onGlideMouseDown={handleGlideMouseDown}
                      onGlideMouseEnter={handleGlideMouseEnter}
                      onShelfMouseUp={handleShelfMouseUp}
                      customIncrement={CUSTOM_INCREMENT}
                      onAddCustomArea={handleAddCustomArea}
                      onAddShelfToDoor={handleAddShelfToDoor}
                      onRemoveShelf={handleRemoveShelfRequest}
                      maxShelves={MAX_SHELVES_PER_DOOR}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setFocusedDoor((prev) => Math.max(0, prev - 1))}
                    disabled={focusedDoor === 0}
                    className={`flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white cursor-pointer transition-colors ${
                      focusedDoor === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'
                    }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M8.75 2.625L4.375 7L8.75 11.375" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <span className="text-sm font-semibold text-gray-900">
                    Door {focusedDoor + 1} <span className="text-gray-400 font-normal">of {layout.length}</span>
                  </span>
                  <button
                    onClick={() => setFocusedDoor((prev) => Math.min(layout.length - 1, prev + 1))}
                    disabled={focusedDoor === layout.length - 1}
                    className={`flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white cursor-pointer transition-colors ${
                      focusedDoor === layout.length - 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'
                    }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M5.25 2.625L9.625 7L5.25 11.375" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>

                <div
                  className="inline-flex transition-transform origin-top"
                  style={{ transform: `scale(${(zoom / 100) * 1.6})` }}
                >
                  <div style={{ width: '320px' }} data-door-idx={focusedDoor} data-door-label={layout[focusedDoor]?.label}>
                    <DoorColumn
                      door={layout[focusedDoor]}
                      doorIdx={focusedDoor}
                      selectedProduct={selectedProduct}
                      activeTool={activeTool}
                      onAddGlide={handleAddGlide}
                      onRemoveGlide={handleRemoveGlide}
                      onDuplicateGlide={handleDuplicateGlide}
                      selectedGlides={selectedGlides}
                      onGlideClick={handleGlideClick}
                      pickedGlide={pickedGlide}
                      pickedProduct={pickedProduct}
                      dragSource={dragSource}
                      dragOver={dragOver}
                      onGlideMouseDown={handleGlideMouseDown}
                      onGlideMouseEnter={handleGlideMouseEnter}
                      onShelfMouseUp={handleShelfMouseUp}
                      customIncrement={CUSTOM_INCREMENT}
                      onAddCustomArea={handleAddCustomArea}
                      onAddShelfToDoor={handleAddShelfToDoor}
                      onRemoveShelf={handleRemoveShelfRequest}
                      maxShelves={MAX_SHELVES_PER_DOOR}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Floating bulk actions bar */}
          {showBulkPanel && (
            <div className="fixed bottom-6 z-50 pointer-events-auto" style={{ left: 'calc(340px + (100vw - 340px) / 2)', transform: 'translateX(-50%)' }}>
              <div className="flex items-center bg-[#0C111D] rounded-full shadow-[0px_8px_21px_1px_rgba(5,47,63,0.22)] overflow-hidden pl-4">
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center justify-center w-8 h-7 bg-[#182230] rounded-2xl">
                    <span className="text-sm font-medium text-white leading-none">{selectedGlides.length}</span>
                  </div>
                  <span className="text-xs font-medium text-white whitespace-nowrap">Selected</span>
                </div>

                <div className="flex items-center self-stretch ml-[18px]">
                  <div className="flex items-center gap-2 py-3 flex-nowrap">

                    <button
                      onClick={handleApplySelectedProduct}
                      disabled={!selectedProduct}
                      title={selectedProduct ? `Replace selected facings with ${selectedProduct.name}` : 'Pick a product in the library first'}
                      className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm font-normal text-white border-none font-[inherit] transition-colors whitespace-nowrap shrink-0 ${
                        selectedProduct ? 'bg-[#182230] hover:bg-[#1e2d45] cursor-pointer' : 'bg-[#182230] opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                        <path d="M2.5 8.5L6 12L13.5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Apply selected product
                    </button>

                    <button
                      onClick={handleRemoveSelected}
                      className="flex items-center gap-1 px-2 py-1.5 bg-[#182230] hover:bg-red-900/60 rounded-lg text-sm font-normal text-red-400 border-none cursor-pointer font-[inherit] transition-colors whitespace-nowrap shrink-0"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                        <path d="M3 4.5H13M6.5 7.5V11.5M9.5 7.5V11.5M4 4.5L4.75 12.5C4.75 12.83 4.89 13.15 5.13 13.39C5.37 13.62 5.69 13.75 6 13.75H10C10.31 13.75 10.63 13.62 10.87 13.39C11.11 13.15 11.25 12.83 11.25 12.5L12 4.5M6 4.5V3.25C6 2.94 6.13 2.62 6.36 2.39C6.59 2.16 6.91 2 7.25 2H8.75C9.09 2 9.41 2.16 9.64 2.39C9.87 2.62 10 2.94 10 3.25V4.5" stroke="#F87171" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Remove
                    </button>
                  </div>

                  <button
                    onClick={() => setSelectedGlides([])}
                    style={{ borderLeft: '1px solid #182230' }}
                    className="flex items-center justify-center px-4 bg-transparent hover:bg-[#182230] text-white cursor-pointer font-[inherit] transition-colors self-stretch border-none"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M5 5L15 15M15 5L5 15" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className={`flex items-center gap-2 px-3.5 py-2 rounded-lg shadow-[0px_8px_24px_rgba(0,0,0,0.18)] text-sm font-medium ${
            toast.tone === 'error' ? 'bg-[#B42318] text-white' : 'bg-[#0C111D] text-white'
          }`}>
            {toast.tone === 'error' ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 5.5v3M8 10.5h.005M14 8A6 6 0 1 1 2 8a6 6 0 0 1 12 0Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
