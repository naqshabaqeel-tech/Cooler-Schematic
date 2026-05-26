import { useState } from 'react';
import { locations } from '../../data/locations';

function StatusPill({ status }) {
  const tone =
    status === 'Active'
      ? 'bg-green-50 text-green-700 border-green-200'
      : status === 'Inactive'
      ? 'bg-gray-50 text-gray-600 border-gray-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-medium ${tone}`}>
      {status}
    </span>
  );
}

/**
 * LocationsView — minimal table for picking a location.
 * Clicking a row opens LocationDetailView via `onSelectLocation(location)`.
 */
export default function LocationsView({ onSelectLocation }) {
  const [search, setSearch] = useState('');

  const q = search.trim().toLowerCase();
  const visible = q
    ? locations.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.id.includes(q) ||
          l.address.toLowerCase().includes(q) ||
          l.region.toLowerCase().includes(q)
      )
    : locations;

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-950">Locations</h1>
          <p className="text-xs text-gray-500 mt-0.5">{locations.length} total — select a location to view details.</p>
        </div>
        <div className="flex items-center gap-1.5 h-8 px-2 rounded-md border border-gray-200 bg-white w-[280px]">
          <img src="/assets/MagnifyingGlass.svg" alt="" className="w-4 h-4 shrink-0 opacity-60" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, ID, region…"
            className="flex-1 bg-transparent border-none outline-none text-xs font-medium text-gray-900 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto bg-white border border-gray-200 rounded-lg">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
            <tr className="text-left text-gray-500 font-medium">
              <th className="px-4 py-2.5">ID</th>
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Region</th>
              <th className="px-4 py-2.5">PSO</th>
              <th className="px-4 py-2.5">Sales Associate</th>
              <th className="px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((loc) => (
              <tr
                key={loc.id}
                onClick={() => onSelectLocation?.(loc)}
                className="border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-primary-blue-50/40 text-gray-900"
              >
                <td className="px-4 py-3 font-mono text-gray-500">{loc.id}</td>
                <td className="px-4 py-3 font-semibold">{loc.name}</td>
                <td className="px-4 py-3 text-gray-600">{loc.region}</td>
                <td className="px-4 py-3 text-gray-600">{loc.pso}</td>
                <td className="px-4 py-3 text-gray-600">{loc.salesAssociate}</td>
                <td className="px-4 py-3"><StatusPill status={loc.status} /></td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan="6" className="px-4 py-12 text-center text-gray-400">
                  No locations match “{search}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
