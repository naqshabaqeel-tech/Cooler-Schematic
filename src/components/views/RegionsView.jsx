import { useState, useRef, useEffect } from 'react';
import Badge from '../Badge';
import Button from '../Button';
import Input from '../Input';
import SidePanel from '../SidePanel';
import ConfirmDialog from '../ConfirmDialog';
import { showToast } from '../../lib/toast';
import { seedLayoutFromBase } from '../../data/planogram';

function pad(n) {
  return String(n).padStart(2, '0');
}

function DoorStrip({ total, active }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`w-[26px] h-[30px] rounded-md border-[1.5px] ${
            i < active
              ? 'bg-primary-blue-50 border-primary-blue-150'
              : 'bg-gray-50 border-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

function CardDotsMenu({ items }) {
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
        className="flex items-center justify-center w-6 h-6 rounded border border-gray-200 bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] cursor-pointer shrink-0"
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

function LocationIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1.75C5.14 1.75 3.5 3.14 3.5 5.25C3.5 8.31 7 12.25 7 12.25C7 12.25 10.5 8.31 10.5 5.25C10.5 3.14 8.86 1.75 7 1.75Z" stroke="#667085" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="7" cy="5.25" r="1.5" stroke="#667085" strokeWidth="1.2"/>
    </svg>
  );
}

function OverrideIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M10.5 5.25L3.5 5.25" stroke="#667085" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M10.5 8.75L3.5 8.75" stroke="#667085" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M8.75 3.5L10.5 5.25L8.75 7" stroke="#667085" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5.25 7L3.5 8.75L5.25 10.5" stroke="#667085" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function DoorSetCard({ ds, onEditPlanogram, menuItems }) {
  const statusMap = { active: 'Active', draft: 'Inactive', archive: 'Default' };
  const labelMap = { active: 'Active', draft: 'Draft', archive: 'Archive' };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className="text-lg font-semibold text-gray-950">{ds.doors} Doors</span>
        <CardDotsMenu items={menuItems} />
      </div>

      <div className="flex items-center gap-2">
        <Badge state={statusMap[ds.status]}>{labelMap[ds.status]}</Badge>
        <Badge state="Default">Default shelf: {pad(ds.defaultShelf)}</Badge>
      </div>

      <DoorStrip total={ds.doors} active={ds.activeDoors} />

      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <LocationIcon />
            Location: <span className="font-medium text-gray-900">{ds.locations}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <OverrideIcon />
            Overrides: <span className="font-medium text-gray-900">{ds.overrides}</span>
          </div>
        </div>
        <button
          onClick={() => onEditPlanogram?.(ds)}
          className="flex items-center gap-1 text-xs font-medium text-primary-blue-600 cursor-pointer bg-transparent border-none font-[inherit] hover:underline"
        >
          Edit Planogram
          <CaretRight />
        </button>
      </div>
    </div>
  );
}

export default function RegionsView({ year, onEditPlanogram, regions, setRegions, doorSetLayouts = {} }) {
  const [activeRegion, setActiveRegion] = useState(regions[0]?.name);
  const [panelMode, setPanelMode] = useState(null); // null | 'create' | 'edit'
  const [editingDs, setEditingDs] = useState(null);
  const [form, setForm] = useState({ name: '', doors: '6', shelves: '7', notes: '', baseDoorSetId: 'empty' });
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [publishAllConfirm, setPublishAllConfirm] = useState(null);

  // Build the "Start from" picker options once per regions update — Empty +
  // every existing door set across every region for this year.
  const baseOptions = [
    { value: 'empty', label: 'Empty (start from scratch)' },
    ...regions.flatMap((r) =>
      r.doorSets.map((ds) => ({
        value: ds._id,
        label: `${r.name} · ${ds.title || `${ds.doors} Doors`}`,
        regionName: r.name,
        doors: ds.doors,
        defaultShelf: ds.defaultShelf,
      }))
    ),
  ];

  const selectedBase = baseOptions.find((o) => o.value === form.baseDoorSetId);

  function updateDoorSet(regionName, dsId, updater) {
    setRegions((prev) => prev.map((r) =>
      r.name !== regionName ? r : {
        ...r,
        doorSets: r.doorSets.map((ds) => ds._id === dsId ? updater(ds) : ds),
      }
    ));
  }

  function removeDoorSet(regionName, dsId) {
    setRegions((prev) => prev.map((r) =>
      r.name !== regionName ? r : { ...r, doorSets: r.doorSets.filter((ds) => ds._id !== dsId) }
    ));
  }

  function resetForm(defaultDoors = '6') {
    setForm({ name: '', doors: defaultDoors, shelves: '7', notes: '', baseDoorSetId: 'empty' });
    setErrors({});
  }

  function openCreate() {
    setEditingDs(null);
    const region = regions.find((r) => r.name === activeRegion);
    const taken = new Set(region?.doorSets.map((ds) => ds.doors) || []);
    const nextAvailable = [6, 7, 8, 9, 10, 11, 12].find((d) => !taken.has(d));
    resetForm(String(nextAvailable ?? 6));
    setPanelMode('create');
  }

  function openEdit(ds) {
    setEditingDs(ds);
    setForm({
      name: ds.title || `${ds.doors} Doors`,
      doors: String(ds.doors),
      shelves: String(ds.defaultShelf),
      notes: ds.notes || '',
    });
    setErrors({});
    setPanelMode('edit');
  }

  function closePanel() {
    setPanelMode(null);
    setEditingDs(null);
    resetForm();
  }

  function validateForm() {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required';
    const doorsN = parseInt(form.doors, 10);
    if (!doorsN || doorsN < 6 || doorsN > 12) {
      next.doors = 'Enter a number between 6 and 12';
    } else {
      const region = regions.find((r) => r.name === activeRegion);
      const conflict = region?.doorSets.some((ds) => ds.doors === doorsN && ds._id !== editingDs?._id);
      if (conflict) next.doors = `A ${doorsN}-door set already exists in this region`;
    }
    const shelvesN = parseInt(form.shelves, 10);
    if (!shelvesN || shelvesN < 1 || shelvesN > 12) next.shelves = 'Enter a number between 1 and 12';
    setErrors(next);
    return Object.keys(next).length === 0 ? { doorsN, shelvesN } : null;
  }

  function submitPanel() {
    const valid = validateForm();
    if (!valid) return;
    if (panelMode === 'create') {
      const doorSet = {
        _id: `ds-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: form.name.trim(),
        doors: valid.doorsN,
        defaultShelf: valid.shelvesN,
        status: 'draft',
        activeDoors: 0,
        locations: 0,
        overrides: 0,
        notes: form.notes.trim() || undefined,
      };
      setRegions((prev) => prev.map((r) =>
        r.name !== activeRegion ? r : { ...r, doorSets: [...r.doorSets, doorSet] }
      ));
      // If a base was chosen, seed the new door set's layout from it
      // (adapted to the new dimensions). Otherwise the planogram editor
      // starts with the default empty layout.
      let seededLayout;
      if (form.baseDoorSetId !== 'empty') {
        const baseLayout = doorSetLayouts[form.baseDoorSetId];
        if (baseLayout) {
          seededLayout = seedLayoutFromBase(baseLayout, valid.doorsN, valid.shelvesN);
        }
      }
      closePanel();
      onEditPlanogram?.(doorSet, activeRegion, seededLayout);
    } else if (panelMode === 'edit') {
      const name = form.name.trim();
      updateDoorSet(activeRegion, editingDs._id, (ds) => ({
        ...ds,
        title: name,
        doors: valid.doorsN,
        defaultShelf: valid.shelvesN,
        notes: form.notes.trim() || undefined,
      }));
      showToast(`${name} updated`);
      closePanel();
    }
  }

  const currentRegion = regions.find((r) => r.name === activeRegion) || regions[0];

  // Door set capacity check
  const allAllowedDoors = [6, 7, 8, 9, 10, 11, 12];
  const existingDoors = currentRegion.doorSets.map((ds) => ds.doors);
  const isRegionFull = allAllowedDoors.every((d) => existingDoors.includes(d));

  // Summary stats
  const allDoorSets = regions.flatMap((r) => r.doorSets);
  const activeCount = allDoorSets.filter((d) => d.status === 'active').length;
  const draftCount = allDoorSets.filter((d) => d.status === 'draft').length;
  const archiveCount = allDoorSets.filter((d) => d.status === 'archive').length;
  const totalLocations = new Set(regions.map((r) => r.doorSets[0]?.locations)).size * 20; // approximate
  const totalRegions = regions.length;
  const totalDoorSets = allDoorSets.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between h-[56px] shrink-0 -mx-5 -mt-5 px-6 border-b border-gray-200">
        <h1 className="text-base font-semibold text-gray-950">{year || 2026}</h1>
        <Button
          type="Outline"
          size="sm"
          onClick={() => {
            const draftCount = regions.reduce(
              (acc, r) => acc + r.doorSets.filter((ds) => ds.status === 'draft').length,
              0
            );
            const regionsMissing = regions.filter((r) =>
              r.doorSets.some((ds) => ds.status === 'draft')
            ).length;
            if (draftCount === 0) {
              showToast('No draft door sets to publish', 'error');
              return;
            }
            setPublishAllConfirm({ draftCount, regionsMissing });
          }}
        >
          Publish all
        </Button>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-3 -mx-5 px-5 py-3 mb-6 bg-gray-50 border-y border-gray-200 flex-wrap">
        <Badge state="Active">{pad(activeCount)} Active</Badge>
        <Badge state="Inactive">{pad(draftCount)} Draft</Badge>
        <Badge state="Default">{pad(archiveCount)} Archive</Badge>

        <div className="flex items-center gap-4 ml-2 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <img src="/assets/MapPin filled.svg" alt="" className="w-3.5 h-3.5 opacity-60" />
            Active Locations: <span className="font-semibold text-gray-900">200</span>
          </div>
          <div className="flex items-center gap-1">
            <img src="/assets/MapPinArea.svg" alt="" className="w-3.5 h-3.5 opacity-60" />
            Regions: <span className="font-semibold text-gray-900">{pad(totalRegions)}</span>
          </div>
          <div className="flex items-center gap-1">
            <img src="/assets/GridFour.svg" alt="" className="w-3.5 h-3.5 opacity-60" />
            Door-set: <span className="font-semibold text-gray-900">{pad(totalDoorSets)}</span>
          </div>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex gap-0 flex-1">
        {/* Region sidebar */}
        <div className="w-[200px] shrink-0 pr-4 border-r border-gray-200 self-stretch">
          <div className="flex flex-col">
            {regions.map((region) => (
              <button
                key={region.name}
                onClick={() => setActiveRegion(region.name)}
                className={`text-left px-3 py-2.5 text-sm font-medium rounded-lg cursor-pointer border-none bg-transparent font-[inherit] transition-colors ${
                  region.name === activeRegion
                    ? 'text-primary-blue-500 bg-primary-blue-50'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {region.name}
              </button>
            ))}
          </div>
        </div>

        {/* Door set cards grid */}
        <div className="flex-1 pl-5">
          <div className="flex justify-end mb-4 min-h-8">
            <Button
              type="Default"
              size="sm"
              state={isRegionFull ? 'Disabled' : 'Default'}
              onClick={() => { if (!isRegionFull) openCreate(); }}
              title={isRegionFull ? 'All door sets (6–12) already exist in this region' : undefined}
              leadingIcon={
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M12.25 7C12.25 7.13261 12.1973 7.25979 12.1036 7.35355C12.0098 7.44732 11.8826 7.5 11.75 7.5H7.5V11.75C7.5 11.8826 7.44732 12.0098 7.35355 12.1036C7.25979 12.1973 7.13261 12.25 7 12.25C6.86739 12.25 6.74021 12.1973 6.64645 12.1036C6.55268 12.0098 6.5 11.8826 6.5 11.75V7.5H2.25C2.11739 7.5 1.99021 7.44732 1.89645 7.35355C1.80268 7.25979 1.75 7.13261 1.75 7C1.75 6.86739 1.80268 6.74021 1.89645 6.64645C1.99021 6.55268 2.11739 6.5 2.25 6.5H6.5V2.25C6.5 2.11739 6.55268 1.99021 6.64645 1.89645C6.74021 1.80268 6.86739 1.75 7 1.75C7.13261 1.75 7.25979 1.80268 7.35355 1.89645C7.44732 1.99021 7.5 2.11739 7.5 2.25V6.5H11.75C11.8826 6.5 12.0098 6.55268 12.1036 6.64645C12.1973 6.74021 12.25 6.86739 12.25 7Z" fill="white"/>
                </svg>
              }
            >
              New Door
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {currentRegion.doorSets.map((ds, i) => {
              const label = ds.title || `${ds.doors} Doors`;
              const menuItems = [
                ds.status === 'active'
                  ? {
                      label: 'Mark Inactive', icon: '/assets/CheckCircle.svg',
                      onClick: () => {
                        updateDoorSet(currentRegion.name, ds._id, (d) => ({ ...d, status: 'draft' }));
                        showToast(`${label} marked Inactive`);
                      },
                    }
                  : {
                      label: 'Mark Active', icon: '/assets/CheckCircle.svg',
                      onClick: () => {
                        updateDoorSet(currentRegion.name, ds._id, (d) => ({ ...d, status: 'active' }));
                        showToast(`${label} marked Active`);
                      },
                    },
                { label: 'Edit', icon: '/assets/Edit.svg', onClick: () => openEdit(ds) },
                {
                  label: 'Archive', icon: '/assets/Archive 2.svg',
                  onClick: () => {
                    updateDoorSet(currentRegion.name, ds._id, (d) => ({ ...d, status: 'archive' }));
                    showToast(`${label} archived`);
                  },
                },
                { label: 'Delete', icon: '/assets/Delete.svg', danger: true, onClick: () => setDeleteTarget(ds) },
              ];
              return (
                <DoorSetCard
                  key={i}
                  ds={ds}
                  onEditPlanogram={(doorSet) => onEditPlanogram?.(doorSet, currentRegion.name)}
                  menuItems={menuItems}
                />
              );
            })}
          </div>
        </div>
      </div>

      <SidePanel
        open={!!panelMode}
        title={panelMode === 'edit' ? 'Edit Door Set' : 'Create Planogram'}
        onClose={closePanel}
        footer={
          <>
            <Button type="Outline" size="sm" onClick={closePanel}>
              {panelMode === 'edit' ? 'Cancel' : 'Discard'}
            </Button>
            <Button type="Default" size="sm" onClick={submitPanel}>
              {panelMode === 'edit' ? 'Save Changes' : 'Create Planogram'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-6">
          {panelMode === 'create' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium leading-5 text-gray-700">Start from</label>
              <div className="relative">
                <select
                  value={form.baseDoorSetId}
                  onChange={(e) => setForm((f) => ({ ...f, baseDoorSetId: e.target.value }))}
                  className="w-full h-10 px-3 pr-9 bg-white border border-gray-200 rounded-lg shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] text-sm font-medium text-gray-900 outline-none focus:border-primary-blue-500 focus:ring-2 focus:ring-primary-blue-150 cursor-pointer appearance-none font-[inherit]"
                >
                  {baseOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <path d="M1 1L5 5L9 1" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-[11px] text-gray-500 leading-tight">
                {form.baseDoorSetId === 'empty'
                  ? 'Builds an empty planogram with the dimensions you choose below.'
                  : selectedBase
                  ? `Copies the layout from ${selectedBase.label} (${selectedBase.doors}×${selectedBase.defaultShelf}). Glides outside the new dimensions are dropped, extra doors/shelves stay empty.`
                  : ''}
              </p>
            </div>
          )}
          <Input
            label="Door set name"
            required
            placeholder="e.g. 6 Doors — Beachside"
            value={form.name}
            onChange={(v) => { setForm((f) => ({ ...f, name: v })); if (errors.name) setErrors((e) => ({ ...e, name: undefined })); }}
            helperText={`Region: ${activeRegion}`}
            error={errors.name}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Number of doors"
              required
              type="number"
              min={6}
              max={12}
              value={form.doors}
              onChange={(v) => { setForm((f) => ({ ...f, doors: v })); if (errors.doors) setErrors((e) => ({ ...e, doors: undefined })); }}
              helperText="Between 6 and 12 (unique per region)"
              error={errors.doors}
            />
            <Input
              label="Shelves per door"
              required
              type="number"
              min={1}
              max={12}
              value={form.shelves}
              onChange={(v) => { setForm((f) => ({ ...f, shelves: v })); if (errors.shelves) setErrors((e) => ({ ...e, shelves: undefined })); }}
              helperText="Between 1 and 12"
              error={errors.shelves}
            />
          </div>
          <Input
            label="Notes (optional)"
            placeholder="Anything reps should know about this layout"
            value={form.notes}
            onChange={(v) => setForm((f) => ({ ...f, notes: v }))}
          />
        </div>
      </SidePanel>

      <ConfirmDialog
        open={!!deleteTarget}
        title={deleteTarget ? `Delete ${deleteTarget.title || `${deleteTarget.doors} Doors`}?` : ''}
        message="This will permanently remove the door set and its planogram layout."
        cancelLabel="Cancel"
        confirmLabel="Yes, Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          const label = deleteTarget.title || `${deleteTarget.doors} Doors`;
          removeDoorSet(currentRegion.name, deleteTarget._id);
          showToast(`${label} deleted`);
          setDeleteTarget(null);
        }}
      />

      <ConfirmDialog
        open={publishAllConfirm != null}
        title="Publish all drafts?"
        message={
          publishAllConfirm
            ? `${publishAllConfirm.draftCount} draft door set${publishAllConfirm.draftCount === 1 ? '' : 's'} across ${publishAllConfirm.regionsMissing} state${publishAllConfirm.regionsMissing === 1 ? '' : 's'} with missing planograms for ${year || 2026} will be marked Active.`
            : ''
        }
        cancelLabel="Cancel"
        confirmLabel="Yes, Publish All"
        onCancel={() => setPublishAllConfirm(null)}
        onConfirm={() => {
          const { draftCount } = publishAllConfirm;
          setRegions((prev) => prev.map((r) => ({
            ...r,
            doorSets: r.doorSets.map((ds) => ds.status === 'draft' ? { ...ds, status: 'active' } : ds),
          })));
          showToast(`Published ${draftCount} door set${draftCount === 1 ? '' : 's'}`);
          setPublishAllConfirm(null);
        }}
      />
    </div>
  );
}
