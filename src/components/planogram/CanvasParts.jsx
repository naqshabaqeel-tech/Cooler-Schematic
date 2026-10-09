import { useRef } from 'react';
import { SHELF_WIDTH_INCHES } from '../../data/planogram';
import { facingsOf, blockBounds, beginTouchDrag } from './helpers';
import { CopyIcon } from './Icons';

const CELL_H = 'h-[72px]';

/* ─── Shelf row ─── */
export function ShelfRow({
  shelf, doorIdx, shelfIdx,
  armedWidth,            // inches the armed item would take (0/undefined = nothing armed)
  selectedGlide,         // {doorIdx, shelfIdx, glideIdx} | null
  pickedShelf, onPickShelf,
  dragSource, dragOver,
  libraryDragProduct, onLibraryDrop,
  onGlideClick, onZoneClick,
  onGlideMouseDown, onGlideMouseEnter, onShelfMouseUp,
  onTouchMoveDrop,
  onRemoveShelf,
  readOnly,
}) {
  const glides = shelf.glides || [];
  const widthOf = (g) => (g?._type === 'custom' ? (g.width || 0) : (g?.product?.glideWidth || 0));
  const used = glides.reduce((s, g) => s + widthOf(g), 0);
  const remaining = Math.max(0, SHELF_WIDTH_INCHES - used);
  const remainingPct = (remaining / SHELF_WIDTH_INCHES) * 100;
  const isShelfNearFull = glides.length >= 2 && remaining < 2.5;
  const isDragging = !!dragSource;
  const armed = !readOnly && armedWidth > 0;
  const armedFits = armed && used + armedWidth <= SHELF_WIDTH_INCHES + 0.001;
  const isPickedShelfSrc = pickedShelf?.doorIdx === doorIdx && pickedShelf?.shelfIdx === shelfIdx;
  const pasteArmed = !readOnly && !!pickedShelf && !isPickedShelfSrc;
  const timerRef = useRef(null);

  const selOnShelf = selectedGlide?.doorIdx === doorIdx && selectedGlide?.shelfIdx === shelfIdx;
  const block = selOnShelf ? blockBounds(glides, selectedGlide.glideIdx) : null;

  const libFits = libraryDragProduct ? used + (libraryDragProduct.glideWidth || 0) <= SHELF_WIDTH_INCHES + 0.001 : false;

  // Long-press (touch/pen) on a placed glide starts a move-drag.
  function onGlidePointerDown(e, glideIdx, isCustom) {
    if (readOnly || isCustom || e.pointerType === 'mouse') return;
    const el = e.currentTarget;
    const start = { x: e.clientX, y: e.clientY };
    let last = { ...start };
    const cancel = () => {
      clearTimeout(timerRef.current);
      window.removeEventListener('pointermove', track);
      window.removeEventListener('pointerup', cancel);
      window.removeEventListener('pointercancel', cancel);
    };
    const track = (ev) => {
      last = { x: ev.clientX, y: ev.clientY };
      if (Math.hypot(last.x - start.x, last.y - start.y) > 10) cancel();
    };
    window.addEventListener('pointermove', track);
    window.addEventListener('pointerup', cancel);
    window.addEventListener('pointercancel', cancel);
    timerRef.current = setTimeout(() => {
      cancel();
      beginTouchDrag(
        { clientX: last.x, clientY: last.y, preventDefault() {}, stopPropagation() {} },
        el,
        {
          onStart: () => onGlideMouseDown(doorIdx, shelfIdx, glideIdx),
          onDrop: (d, sh, at) => onTouchMoveDrop?.({ doorIdx, shelfIdx, glideIdx }, d, sh, at),
          onEnd: () => onShelfMouseUp(-1, -1, null, true),
        }
      );
    }, 320);
  }

  return (
    <div className={`flex items-stretch group/shelf relative ${isPickedShelfSrc ? 'ring-2 ring-amber-400 ring-inset bg-amber-50/30' : ''}`}>
      {/* Shelf number — becomes a delete × on hover (always shown beside it on touch) */}
      <div className="w-[24px] pointer-coarse:w-[56px] shrink-0 flex items-center justify-center pointer-coarse:justify-between pointer-coarse:pl-1 text-sm text-gray-400 font-medium select-none relative">
        <span className={readOnly ? '' : 'group-hover/shelf:opacity-0 transition-opacity pointer-coarse:opacity-100!'}>{shelfIdx + 1}</span>
        {!readOnly && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemoveShelf?.(doorIdx, shelfIdx); }}
            title={`Remove Shelf ${shelfIdx + 1}`}
            aria-label={`Remove Shelf ${shelfIdx + 1}`}
            className="absolute inset-0 pointer-coarse:static pointer-coarse:w-9 pointer-coarse:h-9 pointer-coarse:rounded-md flex items-center justify-center opacity-0 group-hover/shelf:opacity-100 pointer-coarse:opacity-60! transition-opacity cursor-pointer bg-transparent border-none p-0 hover:text-red-600 text-gray-500"
          >
            <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
              <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      <div className={`flex-1 flex border-b border-gray-300/40 bg-transparent relative ${isShelfNearFull ? 'justify-between' : ''}`}>
        {glides.map((glide, glideIdx) => {
          const isCustom = glide._type === 'custom';
          const product = glide.product;
          const widthPct = (widthOf(glide) / SHELF_WIDTH_INCHES) * 100;
          const isSelected = !!block && glideIdx >= block.start && glideIdx <= block.end;
          const isDragSource = dragSource?.doorIdx === doorIdx && dragSource?.shelfIdx === shelfIdx && dragSource?.glideIdx === glideIdx;
          const isDragOver = dragOver?.doorIdx === doorIdx && dragOver?.shelfIdx === shelfIdx && dragOver?.glideIdx === glideIdx;

          let cursor = 'cursor-pointer';
          if (!readOnly && !armed && !isCustom) cursor = isDragging ? 'cursor-grabbing' : 'cursor-grab';
          if (armed && !armedFits) cursor = 'cursor-not-allowed';
          if (readOnly) cursor = 'cursor-default';

          return (
            <div
              key={glideIdx}
              style={{ width: `${widthPct}%` }}
              data-lib-drop={`${doorIdx}:${shelfIdx}:${glideIdx}`}
              onDragOver={(e) => {
                if (!libraryDragProduct) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = libFits ? 'copy' : 'none';
              }}
              onDrop={(e) => {
                if (!libraryDragProduct) return;
                e.preventDefault();
                e.stopPropagation();
                onLibraryDrop?.(doorIdx, shelfIdx, glideIdx); // insert BEFORE this glide
              }}
              onMouseDown={(e) => {
                if (readOnly || e.button !== 0 || isCustom) return;
                e.preventDefault(); // block native image drag
                onGlideMouseDown(doorIdx, shelfIdx, glideIdx);
              }}
              onMouseEnter={() => { if (!readOnly) onGlideMouseEnter(doorIdx, shelfIdx, glideIdx); }}
              onMouseUp={() => { if (!readOnly) onShelfMouseUp(doorIdx, shelfIdx, glideIdx); }}
              onPointerDown={(e) => onGlidePointerDown(e, glideIdx, isCustom)}
              onClick={(e) => { e.stopPropagation(); if (!readOnly) onGlideClick(doorIdx, shelfIdx, glideIdx); }}
              className={`${CELL_H} border-r border-gray-300/30 flex items-center justify-center transition-all select-none relative group/glide ${cursor} ${
                isSelected ? 'ring-2 ring-primary-blue-500 ring-inset bg-primary-blue-50/40' : ''
              } ${isDragOver && isDragging && !isDragSource ? 'ring-2 ring-primary-blue-500 ring-inset bg-primary-blue-50/40' : ''} ${
                libraryDragProduct
                  ? libFits ? 'hover:ring-2 hover:ring-primary-blue-500 hover:ring-inset hover:bg-primary-blue-50/40' : 'hover:bg-red-50/40 cursor-not-allowed'
                  : ''
              } ${!armed && !isDragging && !readOnly && !isSelected ? 'hover:ring-2 hover:ring-primary-blue-150 hover:ring-inset' : ''}`}
              title={
                isCustom
                  ? `Custom area (${widthOf(glide)}″)${glide.note ? ` — ${glide.note}` : ''}`
                  : product
                  ? `${product.name} (${product.size}) — ${product.glideWidth}″`
                  : 'Glide'
              }
            >
              {/* Insertion cue — left edge shows where an armed item will land */}
              {armed && armedFits && (
                <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary-blue-500 opacity-0 group-hover/glide:opacity-100 pointer-events-none z-10" />
              )}

              {isCustom ? (
                <div className="w-[92%] h-[84%] rounded border border-dashed border-gray-400 bg-gray-200/70 flex items-center justify-center px-1">
                  {glide.note && <span className="text-sm font-medium leading-tight truncate text-gray-600">{glide.note}</span>}
                </div>
              ) : product?.packType === 'Slim can' && !glide.single ? (
                <div className={`w-full h-full flex flex-col gap-[1px] overflow-hidden transition-opacity ${isDragSource ? 'opacity-40' : ''}`}>
                  <img src={product.image} alt="" draggable={false} className="flex-1 min-h-0 w-full object-contain pointer-events-none" />
                  <img src={product.image} alt="" draggable={false} className="flex-1 min-h-0 w-full object-contain pointer-events-none" />
                </div>
              ) : (
                <div className={`w-full h-full overflow-hidden transition-opacity ${isDragSource ? 'opacity-40' : ''}`}>
                  <img
                    src={product.image}
                    alt=""
                    draggable={false}
                    className="w-full h-full object-contain pointer-events-none"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentNode.classList.add('flex', 'items-center', 'justify-center');
                      e.target.parentNode.innerHTML = `<span class="text-sm font-medium text-gray-500">${product.id.toUpperCase()}</span>`;
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Trailing empty zone — append target; also shows the inches left. */}
        {remainingPct > 0.1 && !isShelfNearFull && (
          <div
            style={{ width: `${remainingPct}%` }}
            data-lib-drop={`${doorIdx}:${shelfIdx}:end`}
            onDragOver={(e) => {
              if (!libraryDragProduct) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = libFits ? 'copy' : 'none';
            }}
            onDrop={(e) => {
              if (!libraryDragProduct) return;
              e.preventDefault();
              e.stopPropagation();
              onLibraryDrop?.(doorIdx, shelfIdx, null);
            }}
            onMouseEnter={() => { if (!readOnly) onGlideMouseEnter(doorIdx, shelfIdx, null); }}
            onMouseUp={() => { if (!readOnly) onShelfMouseUp(doorIdx, shelfIdx, null); }}
            onClick={() => { if (!readOnly) onZoneClick(doorIdx, shelfIdx); }}
            className={`${CELL_H} flex items-center justify-center transition-colors select-none ${
              libraryDragProduct
                ? libFits ? 'cursor-copy hover:bg-primary-blue-50/40 hover:ring-2 hover:ring-primary-blue-150 hover:ring-inset' : 'bg-gray-100/40 cursor-not-allowed'
                : armed
                ? armedFits ? 'cursor-pointer hover:bg-primary-blue-50/50 hover:ring-2 hover:ring-primary-blue-150 hover:ring-inset' : 'bg-gray-100/40 cursor-not-allowed'
                : isDragging ? 'hover:bg-primary-blue-50/40' : ''
            }`}
            title={`${Math.round(remaining * 10) / 10}″ left`}
          >
            <span className="text-sm text-gray-400 font-medium pointer-events-none">{Math.round(remaining * 10) / 10}″</span>
          </div>
        )}
      </div>

      {/* Copy this whole shelf (then click another shelf to paste) */}
      {!readOnly && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onPickShelf?.(doorIdx, shelfIdx); }}
          title={isPickedShelfSrc ? 'Source shelf — click to deselect' : pickedShelf ? 'Click to paste the copied shelf here' : 'Copy this entire shelf'}
          aria-label="Copy shelf"
          className={`absolute right-1 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-7 h-7 rounded-md border bg-white shadow-sm transition-all cursor-pointer ${
            isPickedShelfSrc
              ? 'opacity-100 border-amber-400 text-amber-600'
              : pasteArmed
              ? 'opacity-100 border-green-300 text-green-600 hover:bg-green-50'
              : 'opacity-0 group-hover/shelf:opacity-100 pointer-coarse:opacity-100 border-gray-200 text-gray-500 hover:bg-gray-50'
          }`}
        >
          <CopyIcon />
        </button>
      )}
    </div>
  );
}

/* ─── Door column ─── */
export function DoorColumn({ door, doorIdx, maxShelves, onAddShelfToDoor, readOnly, shelfProps }) {
  const facingCount = door.shelves.reduce(
    (acc, s) => acc + (s.glides?.reduce((sum, g) => sum + facingsOf(g), 0) || 0), 0
  );
  const customInches = door.shelves.reduce(
    (acc, s) => acc + (s.glides?.filter((g) => g._type === 'custom').reduce((sum, g) => sum + (g.width || 0), 0) || 0), 0
  );
  const shelfCount = door.shelves.length;

  return (
    <div className="flex flex-col rounded-lg overflow-hidden border border-primary-blue-150 bg-white shadow-sm">
      {/* Header band: door name + facings (inches of custom space when present) */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-primary-blue-50 shrink-0">
        <span className="text-sm font-semibold text-gray-900">{door.label}</span>
        <span className="text-sm font-medium text-gray-800">
          {facingCount} facings{customInches > 0 ? ` · ${Math.round(customInches * 10) / 10}″ custom` : ''}
        </span>
      </div>

      <div className="relative flex flex-col bg-white p-1 pr-5">
        {/* Door handle */}
        <div className="absolute right-[6px] top-1/2 -translate-y-1/2 z-10 pointer-events-none" style={{ height: '40%' }}>
          <div className="w-[4px] h-full rounded-full bg-gradient-to-b from-gray-300 via-gray-200 to-gray-300 shadow-[0_0_3px_rgba(0,0,0,0.25)] border border-gray-400/40" />
        </div>

        {door.shelves.map((shelf, shelfIdx) => (
          <ShelfRow key={shelf.id} shelf={shelf} doorIdx={doorIdx} shelfIdx={shelfIdx} readOnly={readOnly} {...shelfProps} />
        ))}
      </div>

      {!readOnly && (
        <button
          type="button"
          onClick={() => onAddShelfToDoor?.(doorIdx)}
          disabled={shelfCount >= (maxShelves || 10)}
          className={`flex items-center justify-center gap-1 h-12 border-0 border-t border-gray-200 text-sm font-medium transition-colors bg-white font-[inherit] ${
            shelfCount >= (maxShelves || 10) ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50 cursor-pointer'
          }`}
        >
          + Add shelf
        </button>
      )}
    </div>
  );
}
