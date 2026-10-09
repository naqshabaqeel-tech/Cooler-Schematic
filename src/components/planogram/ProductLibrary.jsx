import { useState, useRef, useEffect } from 'react';
import { SearchIcon, CaretIcon, CustomAreaIcon } from './Icons';
import { beginTouchDrag, CUSTOM_DRAG_ITEM } from './helpers';

function FilterDropdown({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [open]);

  const normalized = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  const display = value === 'all' ? label : (normalized.find((o) => o.value === value)?.label ?? value);
  const items = [{ value: 'all', label }, ...normalized];

  return (
    <div className="flex-1 min-w-0 relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-1.5 w-full h-10 px-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors font-[inherit]"
      >
        <span className="truncate">{display}</span>
        <CaretIcon open={open} />
      </button>
      {open && (
        <div
          style={{ touchAction: 'pan-y' }}
          className="absolute left-0 right-0 top-11 z-20 bg-white border border-gray-200 rounded-lg shadow-[0px_4px_12px_rgba(0,0,0,0.1)] py-1 max-h-64 overflow-y-auto overscroll-contain"
        >
          {items.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`flex items-center justify-between w-full px-3 py-2 text-sm font-medium cursor-pointer bg-transparent border-none font-[inherit] hover:bg-gray-50 ${opt.value === value ? 'text-primary-blue-600' : 'text-gray-900'}`}
            >
              <span className="truncate text-left">{opt.label}</span>
              {opt.value === value && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                  <path d="M2 6L5 9L10 3" stroke="#266DF0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Product card. Mouse users drag the whole card (HTML5 DnD); touch/pen users
// drag from the grip handle (pointer-event drag with a floating clone).
function LibraryCard({ item, selected, custom, onSelect, onDragStart, onDragEnd, onTouchDrop }) {
  const cardRef = useRef(null);
  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      draggable
      onClick={() => onSelect(item)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(item); } }}
      onDragStart={(e) => {
        try { e.dataTransfer.setData('text/plain', item.id); } catch { /* some browsers block */ }
        e.dataTransfer.effectAllowed = 'copy';
        onDragStart?.(item);
      }}
      onDragEnd={() => onDragEnd?.()}
      className={`flex items-center gap-3 w-full p-2 rounded-lg border bg-white text-left cursor-grab active:cursor-grabbing transition-colors ${
        selected ? 'border-primary-blue-500 ring-1 ring-primary-blue-500' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <span
        onPointerDown={(e) => {
          if (e.pointerType === 'mouse') return;
          beginTouchDrag(e, cardRef.current, {
            onStart: () => onDragStart?.(item),
            onDrop: (d, sh, at) => onTouchDrop?.(item, d, sh, at),
            onEnd: () => onDragEnd?.(),
          });
        }}
        style={{ touchAction: 'none' }}
        className="hidden pointer-coarse:flex items-center justify-center w-6 h-10 -ml-1 shrink-0 text-gray-400"
        aria-label="Drag handle"
      >
        <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
          <circle cx="3" cy="3" r="1.3" /><circle cx="9" cy="3" r="1.3" />
          <circle cx="3" cy="8" r="1.3" /><circle cx="9" cy="8" r="1.3" />
          <circle cx="3" cy="13" r="1.3" /><circle cx="9" cy="13" r="1.3" />
        </svg>
      </span>
      <div className="w-12 h-14 rounded-md bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center text-gray-400">
        {custom ? (
          <CustomAreaIcon />
        ) : (
          <img
            src={item.image}
            alt=""
            draggable={false}
            className="w-full h-full object-contain"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-gray-900 leading-snug">{custom ? 'Custom facing' : item.name}</div>
        <div className="text-sm text-gray-600 leading-snug mt-0.5">
          {custom ? 'Reserve any width for store owners use' : item.upc}
        </div>
      </div>
    </div>
  );
}

export default function ProductLibrary({
  products,
  search, onSearch,
  categoryNames, categoryFilter, onCategoryFilter,
  packTypes, sizeFilter, onSizeFilter,
  selection,
  onSelectProduct, onSelectCustom,
  onDragStart, onDragEnd, onTouchDrop,
}) {
  const filtersActive = categoryFilter !== 'all' || sizeFilter !== 'all' || !!search;
  return (
    <div className="flex flex-col h-full min-h-0" data-tour="library">
      <div className="px-4 pt-4 pb-3 flex flex-col gap-3 shrink-0">
        <h2 className="text-base font-semibold text-gray-950 m-0">Product Library</h2>
        <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-gray-200 bg-white text-gray-500 focus-within:border-primary-blue-500 focus-within:ring-2 focus-within:ring-primary-blue-150">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search name or sku"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-gray-900 placeholder:text-gray-500 w-full font-[inherit]"
          />
        </div>
        <div className="flex gap-2">
          <FilterDropdown label="All Categories" value={categoryFilter} options={categoryNames} onChange={onCategoryFilter} />
          <FilterDropdown label="All Sizes" value={sizeFilter} options={packTypes} onChange={onSizeFilter} />
        </div>
        <p className="text-sm text-gray-600 leading-snug m-0">
          Each pack takes its real width on the shelf. Drag it onto a shelf, or click it &amp; then click a shelf’s free space.
        </p>
      </div>

      <div
        className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-2 overscroll-contain"
        style={{ touchAction: 'pan-y' }}
        data-tour="library-list"
      >
        <LibraryCard
          custom
          item={CUSTOM_DRAG_ITEM}
          selected={selection?.kind === 'custom'}
          onSelect={onSelectCustom}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onTouchDrop={onTouchDrop}
        />
        {products.map((p) => (
          <LibraryCard
            key={p.id}
            item={p}
            selected={selection?.kind === 'library' && selection.product.id === p.id}
            onSelect={onSelectProduct}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onTouchDrop={onTouchDrop}
          />
        ))}
        {products.length === 0 && (
          <div className="py-8 text-center">
            <div className="text-sm text-gray-600">No products match your filters.</div>
            {filtersActive && (
              <button
                onClick={() => { onCategoryFilter('all'); onSizeFilter('all'); onSearch(''); }}
                className="mt-2 text-sm font-medium text-primary-blue-600 bg-transparent border-none cursor-pointer font-[inherit] hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
