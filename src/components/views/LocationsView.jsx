import Badge from '../Badge';
import { locationRows } from '../../data/navigation';

function SearchIcon() {
  return (
    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export default function LocationsView({ doorSetTitle, doorSetMeta }) {
  return (
    <div>
      {/* Banner */}
      <div className="bg-background-secondary rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
        <div>
          <div className="text-[13px] font-medium text-text-primary">{doorSetTitle}</div>
          <div className="text-[11px] text-text-secondary mt-0.5">{doorSetMeta}</div>
        </div>
        <div className="flex gap-2 items-center">
          <button className="flex items-center gap-[5px] py-[5px] px-3 rounded-lg border border-border-secondary bg-background-primary text-xs text-text-secondary cursor-pointer font-[inherit] hover:bg-background-secondary">
            Export list
          </button>
          <button className="flex items-center gap-[5px] py-[5px] px-3 rounded-lg border border-[#2563eb] bg-[#2563eb] text-xs text-white font-medium cursor-pointer font-[inherit] hover:bg-[#1d4ed8]">
            Edit template
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5 py-1.5 px-2.5 border border-border-secondary rounded-lg bg-background-secondary text-xs text-text-tertiary w-[220px]">
          <SearchIcon />
          Search locations...
        </div>
        <div className="flex items-center gap-1 py-1 px-2.5 rounded-lg border border-border-secondary text-xs text-text-secondary cursor-pointer bg-background-primary hover:bg-background-secondary">
          <svg className="w-[11px] h-[11px] opacity-60" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /></svg>
          Override status
        </div>
        <div className="flex items-center gap-1 py-1 px-2.5 rounded-lg border border-border-secondary text-xs text-text-secondary cursor-pointer bg-background-primary hover:bg-background-secondary">
          <svg className="w-[11px] h-[11px] opacity-60" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4" /></svg>
          Schematic status
        </div>
        <div className="ml-auto text-xs text-text-secondary">94 locations</div>
      </div>

      {/* Table */}
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {['PBD no.', 'Location name', 'Region', 'Resettable doors', 'Overrides', 'Schematic', 'Last updated', ''].map((h) => (
              <th key={h} className="text-left text-[11px] font-medium text-text-secondary px-3 py-2 border-b border-border-tertiary bg-background-secondary">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {locationRows.map((row) => (
            <tr key={row.pbd} className="hover:bg-background-secondary">
              <td className="text-[12.5px] text-text-secondary px-3 py-2.5 border-b border-border-tertiary">{row.pbd}</td>
              <td className="text-[12.5px] text-text-primary px-3 py-2.5 border-b border-border-tertiary">{row.name}</td>
              <td className="text-[12.5px] text-text-secondary px-3 py-2.5 border-b border-border-tertiary">{row.region}</td>
              <td className="text-[12.5px] text-text-secondary px-3 py-2.5 border-b border-border-tertiary">{row.doors}</td>
              <td className="text-[12.5px] px-3 py-2.5 border-b border-border-tertiary">
                {row.overrides ? (
                  <Badge state="Inactive">{row.overrides}</Badge>
                ) : (
                  <Badge state="Default">No overrides</Badge>
                )}
              </td>
              <td className="text-[12.5px] px-3 py-2.5 border-b border-border-tertiary">
                <Badge state={row.schematic === 'active' ? 'Active' : 'Inactive'}>
                  {row.schematic === 'active' ? 'Active' : 'Draft'}
                </Badge>
              </td>
              <td className="text-[12.5px] text-text-secondary px-3 py-2.5 border-b border-border-tertiary">{row.updated}</td>
              <td className="text-[11px] text-text-info px-3 py-2.5 border-b border-border-tertiary cursor-pointer hover:underline">
                Edit schematic
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
