import { useState, useEffect } from 'react';
import { LOCATION_DETAIL_TABS } from '../../data/locations';
import PlanogramView from './PlanogramView';
import { generateShelfLayout } from '../../data/planogram';

/* Inline icons — kept here so the file is self-contained. */
function FileTextIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      <path
        d="M12 1.5H4.5a1.5 1.5 0 0 0-1.5 1.5v12a1.5 1.5 0 0 0 1.5 1.5h9a1.5 1.5 0 0 0 1.5-1.5V4.5L12 1.5Z M12 1.5v3h3 M6 9h6 M6 12h6"
        stroke="#475467"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ChatsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      <path
        d="M6.5 11.5c-2.21 0-4-1.567-4-3.5s1.79-3.5 4-3.5 4 1.567 4 3.5c0 .47-.106.917-.298 1.323L11 11.5l-2.31-.45c-.65.29-1.4.45-2.19.45Z M9 14c.79 0 1.54-.16 2.19-.45L13.5 14l-.798-2.177c.192-.406.298-.853.298-1.323"
        stroke="#475467"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function MapPinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 14s5-3.5 5-8a5 5 0 0 0-10 0c0 4.5 5 8 5 8Z M8 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
        stroke="#475467"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function StackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 1.75L1.75 4.5 8 7.25 14.25 4.5 8 1.75Z M1.75 8L8 10.75 14.25 8 M1.75 11.5L8 14.25 14.25 11.5"
        stroke="#475467"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function UserCircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.25" stroke="#475467" strokeWidth="1.25" />
      <circle cx="8" cy="6.75" r="2" stroke="#475467" strokeWidth="1.25" />
      <path
        d="M3.5 13.25a5 5 0 0 1 9 0"
        stroke="#475467"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}
function CaretDownIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="#0C111D" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ActionIconButton({ children, title }) {
  return (
    <button
      type="button"
      title={title}
      className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:bg-gray-50 cursor-pointer"
    >
      {children}
    </button>
  );
}

/**
 * LocationDetailView — top section matches Figma node 25151:169097
 *   - Header row: name, status badge dropdown, action icons, Save Changes
 *   - Info bar: address, PSO, Sales Associate
 *   - Tabs: 12 tabs, Details selected by default
 *
 * The body below the tabs is intentionally lightweight for now — a Details
 * placeholder card. Other tabs render an empty-state stub that says "Coming soon."
 */
export default function LocationDetailView({ location, onBack, layout, onLayoutChange }) {
  const [activeTab, setActiveTab] = useState('Details');

  // Seed an empty layout for this location the first time the Cooler Schematic
  // tab is opened (and only if the parent hasn't already provided one).
  useEffect(() => {
    if (location && layout === undefined && onLayoutChange) {
      onLayoutChange(generateShelfLayout(6, 7));
    }
  }, [location, layout, onLayoutChange]);

  if (!location) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <p className="text-sm font-medium text-gray-900">No location selected.</p>
        <button
          onClick={onBack}
          className="mt-2 text-xs font-medium text-primary-blue-600 cursor-pointer bg-transparent border-none hover:underline font-[inherit]"
        >
          ← Back to Locations
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header row ‒ 50px */}
      <div className="flex items-center justify-between h-[50px] px-6 py-2 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <h1 className="text-base font-semibold text-black truncate">
            {location.id} - {location.name}
          </h1>
          <button
            type="button"
            className="flex items-center gap-1 px-1.5 py-1 bg-[#F2F4F7] rounded-lg cursor-pointer border-none"
          >
            <span className="text-xs font-medium text-[#0C111D] leading-none">{location.status}</span>
            <CaretDownIcon />
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ActionIconButton title="Marketing brochure">
            <FileTextIcon />
          </ActionIconButton>
          <ActionIconButton title="Add comment">
            <ChatsIcon />
          </ActionIconButton>
          <button
            type="button"
            className="flex items-center justify-center h-8 px-2.5 bg-primary-blue-500 hover:bg-primary-blue-600 text-white text-sm font-semibold rounded-lg cursor-pointer border-none font-[inherit]"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Info bar ‒ 40px, light gray */}
      <div className="flex items-center h-10 px-6 bg-[#F9FAFB] border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-3 text-xs font-medium text-[#475467]">
          <div className="flex items-center gap-1 py-1">
            <MapPinIcon />
            <span>{location.address}</span>
          </div>
          <div className="flex items-center gap-1 py-1">
            <StackIcon />
            <span>
              PSO: <span className="font-bold">{location.pso}</span>
            </span>
          </div>
          <button
            type="button"
            className="flex items-center gap-1 py-1 rounded-md cursor-pointer bg-transparent border-none font-[inherit]"
          >
            <UserCircleIcon />
            <span>
              Sales Associate: <span className="font-bold">{location.salesAssociate}</span>
            </span>
          </button>
        </div>
      </div>

      {/* Tabs ‒ 48px, horizontally scrollable to absorb the 12-item strip */}
      <div className="flex items-end h-12 px-6 border-b border-gray-200 bg-white overflow-x-auto shrink-0">
        <div className="flex items-center gap-[10px]">
          {LOCATION_DETAIL_TABS.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-2 py-2 cursor-pointer bg-transparent border-none font-[inherit] whitespace-nowrap transition-colors ${
                  isActive
                    ? 'text-primary-blue-600'
                    : 'text-[#475467] hover:text-gray-900'
                }`}
                style={isActive ? { boxShadow: 'inset 0 -2px 0 0 #266DF0' } : undefined}
              >
                <span className={`text-sm leading-5 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {tab}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Body — tab content. The Cooler Schematic PlanogramView stays mounted
          while inside this location so its layout, undo stack, picks, etc. survive
          tab-switching. Other tabs render simple stubs and only mount when active.
          Each LocationDetailView instance keeps its own PlanogramView state, so
          edits here never leak into the Tools → Cooler Schematic flow. */}
      <div
        className={`flex-1 min-h-0 bg-white ${activeTab === 'Cooler Schematic' ? 'flex flex-col overflow-hidden' : 'hidden'}`}
      >
        <PlanogramView
          doorSet={{
            title: `${location.id} - ${location.name}`,
            doors: 6,
            defaultShelf: 7,
            status: location.status?.toLowerCase() || 'active',
          }}
          regionName={location.region}
          onExit={() => setActiveTab('Details')}
          layout={layout}
          onLayoutChange={onLayoutChange}
          variant="location"
        />
      </div>

      {activeTab !== 'Cooler Schematic' && (
        <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB]">
          {activeTab === 'Details' ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
              <p className="text-sm font-medium">Already developed</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
              <p className="text-sm font-medium">{activeTab} — coming soon</p>
              <p className="text-xs mt-1">This tab will be implemented in a future iteration.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
