import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import Badge from '../Badge';
import Button from '../Button';
import Input from '../Input';
import Select from '../Select';
import SidePanel from '../SidePanel';
import ConfirmDialog from '../ConfirmDialog';
import { yearCards } from '../../data/navigation';
import { showToast } from '../../lib/toast';

function DotsMenu({ items }) {
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
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="flex items-center justify-center w-6 h-6 rounded border border-gray-200 bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] cursor-pointer"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="3.5" r="1.25" fill="#0C111D" />
          <circle cx="8" cy="8" r="1.25" fill="#0C111D" />
          <circle cx="8" cy="12.5" r="1.25" fill="#0C111D" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-10 w-40 bg-white border border-gray-200 rounded-lg shadow-[0px_4px_12px_rgba(0,0,0,0.1)] py-1">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={(e) => { e.stopPropagation(); setOpen(false); item.onClick?.(); }}
              className={`flex items-center gap-2 w-full px-3 py-2 text-sm font-medium cursor-pointer bg-transparent border-none font-[inherit] hover:bg-gray-50 ${item.danger ? 'text-[#D92D20]' : 'text-gray-900'}`}
            >
              <img src={item.icon} alt="" className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CaretRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5.25 2.625L9.625 7L5.25 11.375" stroke="#1E57C0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function pad(n) {
  return String(n).padStart(2, '0');
}

/* ─── Multi-select regions dropdown ─── */
function RegionsMultiSelect({ regions, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const listRef = useRef(null);
  const btnRef = useRef(null);
  const [pos, setPos] = useState(null);

  // Bring the opened list fully into view inside the side panel so touch users
  // can reach it without first scrolling the panel behind it.
  // The list is portaled to <body> with fixed positioning so the side panel's
  // own scroll container can't clip it or steal touch scrolling from it.
  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const r = btnRef.current?.getBoundingClientRect();
      if (!r) return;
      const below = window.innerHeight - r.bottom - 12;
      const above = r.top - 12;
      const flip = below < 160 && above > below;
      const maxHeight = Math.min(260, Math.max(120, flip ? above : below));
      setPos({ left: r.left, width: r.width, maxHeight, ...(flip ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }) });
    }
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target) && !listRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [open]);

  const allSelected = regions.length > 0 && selected.length === regions.length;
  const someSelected = selected.length > 0 && !allSelected;

  function toggleOne(name) {
    onChange(selected.includes(name) ? selected.filter((n) => n !== name) : [...selected, name]);
  }
  function toggleAll() {
    onChange(allSelected ? [] : regions.map((r) => r.name));
  }

  const display =
    selected.length === 0
      ? 'Select regions…'
      : allSelected
      ? `All ${regions.length} regions`
      : selected.length === 1
      ? selected[0]
      : `${selected.length} regions selected`;

  return (
    <div className="relative" ref={ref}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between gap-1.5 w-full h-10 px-3 bg-white border rounded-lg shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors font-[inherit] ${
          selected.length === 0 ? 'border-gray-200 text-gray-500' : 'border-gray-200 text-gray-900'
        }`}
      >
        <span className="truncate">{display}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={`shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>
          <path d="M1 1L5 5L9 1" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && pos && createPortal(
        <div
          ref={listRef}
          style={{ position: 'fixed', zIndex: 70, ...pos, touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
          className="bg-white border border-gray-200 rounded-lg shadow-[0px_4px_12px_rgba(0,0,0,0.1)] py-1 overflow-y-auto overscroll-contain">
          <label className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => { if (el) el.indeterminate = someSelected; }}
              onChange={toggleAll}
              className="w-4 h-4 cursor-pointer accent-primary-blue-500"
            />
            Select all
          </label>
          {regions.map((r) => {
            const isOn = selected.includes(r.name);
            return (
              <label
                key={r.name}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium cursor-pointer hover:bg-gray-50 text-gray-900"
              >
                <input
                  type="checkbox"
                  checked={isOn}
                  onChange={() => toggleOne(r.name)}
                  className="w-4 h-4 cursor-pointer accent-primary-blue-500"
                />
                <span className="truncate">{r.name}</span>
              </label>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}

export default function YearsView({
  onSelectYear,
  showArchived = false,
  onExitArchived,
  newSchematicOpen = false,
  onCloseNewSchematic,
  regions = [],
  onCloneSchematic,
}) {
  const [cards, setCards] = useState(yearCards);

  // ─── New Schematic side panel ───────────────────────────────────────
  // Pre-populate the year input with max(existing)+1 each time the panel opens.
  // Pre-fill regions with the union of regions present in the chosen base
  // year — or all regions when starting from scratch.
  const [newSchematicForm, setNewSchematicForm] = useState({ year: '', baseYear: 'empty', regions: [] });
  const [newSchematicError, setNewSchematicError] = useState('');

  // Find which regions actually have door sets in a given year — used by the
  // base-year pre-fill so the multi-select reflects that year's footprint.
  function regionsInYear(targetYear) {
    if (!targetYear) return regions.map((r) => r.name);
    return regions
      .filter((r) => (r.doorSets || []).some((ds) => (ds.year || 2026) === targetYear))
      .map((r) => r.name);
  }

  useEffect(() => {
    if (!newSchematicOpen) return;
    const maxYear = cards.reduce((m, c) => Math.max(m, c.year), new Date().getFullYear());
    setNewSchematicForm({
      year: String(maxYear + 1),
      baseYear: 'empty',
      regions: regions.map((r) => r.name), // default: all regions selected
    });
    setNewSchematicError('');
  }, [newSchematicOpen, cards, regions]);

  function handleBaseYearChange(value) {
    setNewSchematicError('');
    if (value === 'empty') {
      setNewSchematicForm((f) => ({ ...f, baseYear: 'empty', regions: regions.map((r) => r.name) }));
      return;
    }
    const baseYearNum = Number(value);
    setNewSchematicForm((f) => ({ ...f, baseYear: value, regions: regionsInYear(baseYearNum) }));
  }

  function submitNewSchematic() {
    const y = parseInt(newSchematicForm.year, 10);
    if (!y || y < 2000 || y > 2100) {
      setNewSchematicError('Enter a valid year between 2000 and 2100');
      return;
    }
    if (cards.some((c) => c.year === y)) {
      setNewSchematicError(`Year ${y} already exists`);
      return;
    }
    if (newSchematicForm.regions.length === 0) {
      setNewSchematicError('Pick at least one region');
      return;
    }
    // If a base year was chosen, clone every door set from it into the new year
    // for the selected regions. Returns the count of door sets cloned.
    let cloned = 0;
    if (newSchematicForm.baseYear !== 'empty' && onCloneSchematic) {
      cloned = onCloneSchematic(Number(newSchematicForm.baseYear), y, newSchematicForm.regions) || 0;
    }
    const newCard = {
      year: y,
      stats: { regions: newSchematicForm.regions.length, locations: 0, doorSets: cloned },
      statuses: cloned > 0
        ? [{ count: cloned, label: 'Draft', variant: 'draft' }]
        : [
            { count: 0, label: 'Active', variant: 'active' },
            { count: 0, label: 'Draft', variant: 'draft' },
          ],
    };
    setCards((prev) => [newCard, ...prev].sort((a, b) => b.year - a.year));
    if (cloned > 0) {
      showToast(`Created ${y} schematic — cloned ${cloned} door set${cloned === 1 ? '' : 's'} from ${newSchematicForm.baseYear}`);
    } else {
      showToast(`Created ${y} schematic`);
    }
    onCloseNewSchematic?.();
    onSelectYear?.(y);
  }

  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ year: '', notes: '' });
  const [editError, setEditError] = useState('');

  const [duplicateTarget, setDuplicateTarget] = useState(null);
  const [duplicateYear, setDuplicateYear] = useState('');
  const [duplicateError, setDuplicateError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);

  function openEdit(card) {
    setEditTarget(card);
    setEditForm({ year: String(card.year), notes: card.notes || '' });
    setEditError('');
  }

  function saveEdit() {
    const y = parseInt(editForm.year, 10);
    if (!y || y < 2000 || y > 2100) {
      setEditError('Enter a valid year between 2000 and 2100');
      return;
    }
    if (y !== editTarget.year && cards.some((c) => c.year === y)) {
      setEditError(`Year ${y} already exists`);
      return;
    }
    setCards((prev) => prev.map((c) => c.year === editTarget.year ? { ...c, year: y, notes: editForm.notes } : c));
    showToast(`${editTarget.year} updated`);
    setEditTarget(null);
  }

  function openDuplicate(card) {
    setDuplicateTarget(card);
    setDuplicateYear(String(card.year + 1));
    setDuplicateError('');
  }

  function confirmDuplicate() {
    const y = parseInt(duplicateYear, 10);
    if (!y || y < 2000 || y > 2100) {
      setDuplicateError('Enter a valid year between 2000 and 2100');
      return;
    }
    if (cards.some((c) => c.year === y)) {
      setDuplicateError(`Year ${y} already exists`);
      return;
    }
    const source = duplicateTarget;
    const duplicated = {
      ...source,
      year: y,
      stats: { ...source.stats },
      statuses: [
        { count: 0, label: 'Active', variant: 'active' },
        { count: source.stats.doorSets, label: 'Draft', variant: 'draft' },
      ],
    };
    setCards((prev) => [duplicated, ...prev].sort((a, b) => b.year - a.year));
    showToast(`Duplicated ${source.year} to ${y}`);
    setDuplicateTarget(null);
  }

  function getMenuItems(card) {
    if (card.archived) {
      return [
        { label: 'Restore', icon: '/assets/Edit.svg', onClick: () => {
          setCards((prev) => prev.map((c) => c.year === card.year ? { ...c, archived: false } : c));
          showToast(`${card.year} restored`);
        } },
        { label: 'Delete', icon: '/assets/Delete.svg', danger: true, onClick: () => setDeleteTarget(card) },
      ];
    }
    return [
      { label: 'Edit', icon: '/assets/Edit.svg', onClick: () => openEdit(card) },
      { label: 'Duplicate', icon: '/assets/Duplicate.svg', onClick: () => openDuplicate(card) },
      { label: 'Archive', icon: '/assets/Archive 2.svg', onClick: () => {
        setCards((prev) => prev.map((c) => c.year === card.year ? { ...c, archived: true } : c));
        showToast(`${card.year} archived`);
      } },
      { label: 'Delete', icon: '/assets/Delete.svg', danger: true, onClick: () => setDeleteTarget(card) },
    ];
  }

  const visibleCards = cards.filter((c) => showArchived ? c.archived : !c.archived);

  return (
    <div>
      {showArchived && visibleCards.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <img src="/assets/Archive 2.svg" alt="" className="w-8 h-8 mb-3 opacity-40" />
          <p className="text-sm font-medium text-gray-900">No archived years</p>
          <p className="text-xs text-gray-500 mt-1">Archive a year from its three-dot menu to see it here.</p>
        </div>
      )}
      <div className="grid grid-cols-2 min-[1440px]:grid-cols-3 gap-4">
        {visibleCards.map((card) => (
          <div
            key={card.year}
            className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-4 transition-all hover:shadow-[0px_4px_12px_rgba(0,0,0,0.08)]"
          >
            <div className="flex items-start justify-between">
              <span className="text-[36px] font-medium leading-10 text-gray-950">{card.year}</span>
              <DotsMenu items={getMenuItems(card)} />
            </div>

            <div className="flex gap-2.5">
              <div className="flex-1 bg-gray-50 rounded-lg px-3 py-1.5 overflow-hidden">
                <div className="text-base font-medium leading-6 text-gray-900">{card.stats.regions}</div>
                <div className="text-xs font-normal leading-4 text-gray-500">regions</div>
              </div>
              <div className="flex-1 bg-gray-50 rounded-lg px-3 py-1.5 overflow-hidden">
                <div className="text-base font-medium leading-6 text-gray-900">{card.stats.locations}</div>
                <div className="text-xs font-normal leading-4 text-gray-500">locations</div>
              </div>
              <div className="flex-1 bg-gray-50 rounded-lg px-3 py-1.5 overflow-hidden">
                <div className="text-base font-medium leading-6 text-gray-900">{card.stats.doorSets}</div>
                <div className="text-xs font-normal leading-4 text-gray-500">door sets</div>
              </div>
            </div>

            <div className="border-t border-gray-200" />

            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <div className="flex flex-wrap gap-2">
                {card.statuses.map((s) => (
                  <Badge key={s.label} state={s.variant === 'active' ? 'Active' : s.variant === 'draft' ? 'Inactive' : 'Default'}>
                    {pad(s.count)} {s.label}
                  </Badge>
                ))}
              </div>
              <button
                onClick={() => onSelectYear(card.year)}
                className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-primary-blue-600 cursor-pointer bg-transparent border-none font-[inherit] hover:underline"
              >
                View Detail
                <CaretRight />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Schematic side panel — opens from SubNav's "+ New Schematic" button. */}
      <SidePanel
        open={newSchematicOpen}
        title="New Schematic"
        onClose={() => onCloseNewSchematic?.()}
        footer={
          <>
            <Button type="Outline" size="sm" onClick={() => onCloseNewSchematic?.()}>Cancel</Button>
            <Button type="Default" size="sm" onClick={submitNewSchematic}>Create Schematic</Button>
          </>
        }
      >
        <div className="flex flex-col gap-6">
          {/* Start from year — picking a base year auto-fills the regions
              multi-select with that year's footprint, and on create every
              door set from that year is cloned into the new year. */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium leading-5 text-gray-700">Start from</label>
            <Select
              value={newSchematicForm.baseYear}
              onChange={handleBaseYearChange}
              options={[
                { value: 'empty', label: 'Empty (start from scratch)' },
                ...cards.filter((c) => !c.archived).map((c) => ({ value: String(c.year), label: String(c.year) })),
              ]}
            />
          </div>

          <Input
            label="Year"
            required
            type="number"
            min={2000}
            max={2100}
            value={newSchematicForm.year}
            onChange={(v) => { setNewSchematicForm((f) => ({ ...f, year: v })); if (newSchematicError) setNewSchematicError(''); }}
            error={newSchematicError && newSchematicError.toLowerCase().includes('year') ? newSchematicError : undefined}
          />

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium leading-5 text-gray-700">
              Regions <span className="text-[#D92D20] ml-0.5">*</span>
            </label>
            <RegionsMultiSelect
              regions={regions}
              selected={newSchematicForm.regions}
              onChange={(next) => { setNewSchematicForm((f) => ({ ...f, regions: next })); if (newSchematicError) setNewSchematicError(''); }}
            />
            {newSchematicError && newSchematicError.includes('region') && (
              <p className="text-sm font-medium leading-5 text-[#D92D20]">{newSchematicError}</p>
            )}
          </div>
        </div>
      </SidePanel>

      <SidePanel
        open={!!editTarget}
        title={editTarget ? `Edit ${editTarget.year}` : ''}
        onClose={() => setEditTarget(null)}
        footer={
          <>
            <Button type="Outline" size="sm" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button type="Default" size="sm" onClick={saveEdit}>Save Changes</Button>
          </>
        }
      >
        <div className="flex flex-col gap-6">
          <Input
            label="Year"
            required
            type="number"
            min={2000}
            max={2100}
            value={editForm.year}
            onChange={(v) => { setEditForm((f) => ({ ...f, year: v })); if (editError) setEditError(''); }}
            error={editError}
          />
          <Input
            label="Notes (optional)"
            placeholder="Internal notes about this year"
            value={editForm.notes}
            onChange={(v) => setEditForm((f) => ({ ...f, notes: v }))}
          />
        </div>
      </SidePanel>

      <SidePanel
        open={!!duplicateTarget}
        title={duplicateTarget ? `Duplicate ${duplicateTarget.year}` : ''}
        onClose={() => setDuplicateTarget(null)}
        width={420}
        footer={
          <>
            <Button type="Outline" size="sm" onClick={() => setDuplicateTarget(null)}>Cancel</Button>
            <Button type="Default" size="sm" onClick={confirmDuplicate}>Duplicate</Button>
          </>
        }
      >
        <div className="flex flex-col gap-6">
          <p className="text-sm text-gray-600">
            This will copy all regions, locations, and door sets from{' '}
            <span className="font-semibold text-gray-900">{duplicateTarget?.year}</span>{' '}
            into a new year. The duplicated entry will start as Draft.
          </p>
          <Input
            label="New year"
            required
            type="number"
            min={2000}
            max={2100}
            value={duplicateYear}
            onChange={(v) => { setDuplicateYear(v); setDuplicateError(''); }}
            error={duplicateError}
          />
        </div>
      </SidePanel>

      <ConfirmDialog
        open={!!deleteTarget}
        title={deleteTarget ? `Delete ${deleteTarget.year}?` : ''}
        message="This will permanently remove the year and all of its regions, locations, and door sets."
        cancelLabel="Cancel"
        confirmLabel="Yes, Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          setCards((prev) => prev.filter((c) => c.year !== deleteTarget.year));
          showToast(`${deleteTarget.year} deleted`);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
