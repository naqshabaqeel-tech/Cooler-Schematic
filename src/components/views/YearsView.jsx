import { useState, useRef, useEffect } from 'react';
import Badge from '../Badge';
import { yearCards } from '../../data/navigation';

const menuItems = [
  { label: 'Edit', icon: '/assets/Edit.svg' },
  { label: 'Duplicate', icon: '/assets/Duplicate.svg' },
  { label: 'Archive', icon: '/assets/Archive 2.svg' },
  { label: 'Delete', icon: '/assets/Delete.svg', danger: true },
];

function DotsMenu() {
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
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={(e) => { e.stopPropagation(); setOpen(false); }}
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

export default function YearsView({ onSelectYear }) {
  return (
    <div>
      <div className="grid grid-cols-3 gap-4">
        {yearCards.map((card) => (
          <div
            key={card.year}
            className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-4 transition-all hover:shadow-[0px_4px_12px_rgba(0,0,0,0.08)]"
          >
            <div className="flex items-start justify-between">
              <span className="text-[36px] font-medium leading-10 text-gray-950">{card.year}</span>
              <DotsMenu />
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

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {card.statuses.map((s) => (
                  <Badge key={s.label} state={s.variant === 'active' ? 'Active' : s.variant === 'draft' ? 'Inactive' : 'Default'}>
                    {pad(s.count)} {s.label}
                  </Badge>
                ))}
              </div>
              <button
                onClick={() => onSelectYear(card.year)}
                className="flex items-center gap-1 text-xs font-medium text-primary-blue-600 cursor-pointer bg-transparent border-none font-[inherit] hover:underline"
              >
                View Detail
                <CaretRight />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
