import { useState } from 'react';
import { VENDORS, VENDOR_COLORS } from '../../data/planogram';
import { PlusIcon, MinusIcon, CustomAreaIcon, CloseIcon } from './Icons';

function Field({ label, value }) {
  return (
    <div className="flex items-center justify-between h-10 px-3 rounded-md bg-gray-50 border border-gray-100">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-semibold text-gray-950">{value}</span>
    </div>
  );
}

function Stepper({ value, onMinus, onPlus, minusDisabled, plusDisabled }) {
  const btn = 'flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white text-gray-700 cursor-pointer hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed';
  return (
    <div className="flex items-center gap-2">
      <button type="button" aria-label="Decrease" className={btn} onClick={onMinus} disabled={minusDisabled}><MinusIcon /></button>
      <span className="min-w-[2.5rem] text-center text-base font-semibold text-gray-950">{value}</span>
      <button type="button" aria-label="Increase" className={btn} onClick={onPlus} disabled={plusDisabled}><PlusIcon /></button>
    </div>
  );
}

// Note field commits on blur / Enter so typing doesn't flood the undo stack.
function NoteField({ initial, onCommit }) {
  const [draft, setDraft] = useState(initial || '');
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-gray-700">Note</span>
      <input
        type="text"
        value={draft}
        maxLength={60}
        placeholder="e.g. Promo display"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { if (draft.trim() !== (initial || '')) onCommit(draft.trim()); }}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
        className="h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:border-primary-blue-500 focus:ring-2 focus:ring-primary-blue-150 font-[inherit]"
      />
    </label>
  );
}

export default function SelectedPanel({
  hideVendor = false,
  info,                 // null | see PlanogramView.selectionInfo
  onPlus, onMinus, onFill, onRemove, onToggleStack, onNote, onClose,
  vendorMix, totalFacings,
}) {
  return (
    <div className="flex flex-col gap-3" data-tour="selected-panel">
      <section className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-950 m-0">Selected Product</h2>
          {info && onClose && (
            <button type="button" onClick={onClose} aria-label="Clear selection" className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg border-none bg-transparent text-gray-600 cursor-pointer hover:bg-gray-100">
              <CloseIcon />
            </button>
          )}
        </div>

        {!info ? (
          <div className="flex flex-col items-center text-center gap-2 py-6">
            <div className="w-12 h-12 rounded-xl bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
              <CustomAreaIcon />
            </div>
            <p className="text-sm text-gray-600 leading-snug m-0 max-w-[220px]">
              Select a product from the library or the shelf. Your selected product will show here.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <div className="w-12 h-14 rounded-md bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center text-gray-400">
                {info.isCustom ? <CustomAreaIcon /> : <img src={info.product.image} alt="" className="w-full h-full object-contain" onError={(e) => { e.target.style.display = 'none'; }} />}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-950 leading-snug">{info.isCustom ? 'Custom area' : info.product.name}</div>
                <div className="text-sm text-gray-600 mt-0.5">{info.isCustom ? 'Space left for the store' : info.product.upc}</div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {info.placed && <Field label="Door" value={String(info.door).padStart(2, '0')} />}
              {info.placed && <Field label="Shelf" value={String(info.shelf).padStart(2, '0')} />}
              <Field label="Width" value={`${info.widthIn}″`} />
            </div>

            {info.isCustom && info.placed && <NoteField key={info.noteKey} initial={info.note} onCommit={onNote} />}

            {info.placed && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-950">{info.isCustom ? 'Width' : 'Facings'}</span>
                <Stepper
                  value={info.isCustom ? `${info.widthIn}″` : String(info.facings).padStart(2, '0')}
                  onMinus={onMinus}
                  onPlus={onPlus}
                  plusDisabled={!info.canAdd}
                />
              </div>
            )}

            {info.canStack && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-gray-700">Slim cans</span>
                <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
                  {[['Stacked ×2', false], ['Single', true]].map(([label, single]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => onToggleStack(single)}
                      className={`h-10 px-3 text-sm font-semibold border-none cursor-pointer font-[inherit] ${
                        info.single === single ? 'bg-primary-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!info.placed && (
              <p className="text-sm text-primary-blue-600 leading-snug m-0">
                {info.isCustom
                  ? `Click a shelf to reserve ${info.widthIn}″ for the store.`
                  : `Click a shelf to place one facing (${info.widthIn}″ wide, max ${info.maxPerShelf} per 30″ shelf).`}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onFill}
                disabled={!info.placed}
                title={info.placed ? 'Fill the rest of this shelf' : 'Place it on a shelf first'}
                className="h-10 px-4 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-950 cursor-pointer hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-[inherit]"
              >
                Fill Shelf
              </button>
              {info.placed && (
                <button
                  type="button"
                  onClick={onRemove}
                  className="flex-1 h-10 px-4 rounded-lg border border-red-100 bg-red-50 text-sm font-semibold text-red-600 cursor-pointer hover:bg-red-100 font-[inherit]"
                >
                  Remove Block
                </button>
              )}
            </div>
          </>
        )}
      </section>

      {!hideVendor && (
      <section className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3" data-tour="vendor-mix">
        <h2 className="text-base font-semibold text-gray-950 m-0">Vendor Mix</h2>
        {totalFacings === 0 ? (
          <p className="text-sm text-gray-600 m-0">No facings placed yet.</p>
        ) : (
          VENDORS.map((v) => {
            const count = vendorMix[v] || 0;
            const pct = totalFacings > 0 ? (count / totalFacings) * 100 : 0;
            return (
              <div key={v}>
                <div className="flex items-center justify-between text-sm text-gray-700">
                  <span className="font-medium">{v}</span>
                  <span className="font-semibold text-gray-950">{pct < 1 && count > 0 ? '<1' : Math.round(pct)}%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: VENDOR_COLORS[v] }} />
                </div>
              </div>
            );
          })
        )}
      </section>
      )}
    </div>
  );
}
