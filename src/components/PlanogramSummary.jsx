import { useEffect } from 'react';
import { VENDORS, VENDOR_COLORS } from '../data/planogram';

/**
 * PlanogramSummary — shown after Save Draft and before Publish. Gives the
 * user a plain-language recap (doors, facings, vendor mix) of what they built.
 *
 *   mode "draft"   → already saved; single "Done" button.
 *   mode "publish" → confirmation; "Cancel" + "Publish".
 */
export default function PlanogramSummary({
  open,
  mode = 'draft',
  doorCount,
  facings,
  vendorMix,
  regionName,
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

  const isPublish = mode === 'publish';
  const rows = VENDORS.filter((v) => (vendorMix?.[v] || 0) > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onCancel}>
      <div
        className="bg-white border border-gray-200 rounded-xl shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] p-6 w-full max-w-md flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-1">
          <p className="text-base font-semibold text-black">{isPublish ? 'Ready to publish?' : 'Draft saved'}</p>
          <p className="text-sm font-medium text-gray-600">
            {isPublish
              ? `Here’s what will be published${regionName ? ` to ${regionName}` : ''}.`
              : 'Your changes are saved. Here’s a summary of this planogram.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg px-4 py-3">
            <div className="text-xl font-semibold text-gray-950">{doorCount}</div>
            <div className="text-sm text-gray-600">{doorCount === 1 ? 'Door' : 'Doors'}</div>
          </div>
          <div className="bg-gray-50 rounded-lg px-4 py-3">
            <div className="text-xl font-semibold text-gray-950">{facings}</div>
            <div className="text-sm text-gray-600">{facings === 1 ? 'Facing' : 'Facings'}</div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-900">Vendor mix</p>
          {rows.length === 0 ? (
            <p className="text-sm text-gray-600">No facings placed yet.</p>
          ) : (
            rows.map((v) => {
              const count = vendorMix[v];
              const pct = facings > 0 ? (count / facings) * 100 : 0;
              return (
                <div key={v}>
                  <div className="flex items-center justify-between text-sm text-gray-700">
                    <span className="font-medium">{v}</span>
                    <span>
                      <span className="font-semibold text-gray-900">{count}</span>
                      <span className="text-gray-600"> · {pct < 1 ? '<1' : Math.round(pct)}%</span>
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: VENDOR_COLORS[v] }} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          {isPublish && (
            <button
              onClick={onCancel}
              className="flex items-center justify-center h-10 px-4 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-black cursor-pointer hover:bg-gray-50 font-[inherit]"
            >
              Cancel
            </button>
          )}
          <button
            onClick={onConfirm}
            className="flex items-center justify-center h-10 px-4 rounded-lg text-sm font-semibold text-white cursor-pointer hover:opacity-90 font-[inherit] border-none"
            style={{ backgroundColor: '#266DF0' }}
          >
            {isPublish ? 'Yes, Publish' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
}
