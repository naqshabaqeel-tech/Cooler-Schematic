import Breadcrumb from './Breadcrumb';

export default function TopBar({ icon, breadcrumbs = [] }) {
  return (
    <header className="flex items-center justify-between h-[50px] px-4 lg:px-6 py-3.5 gap-3 border-b border-gray-100 bg-background-primary">
      <div className="min-w-0 flex-1 overflow-hidden"><Breadcrumb icon={icon} items={breadcrumbs} /></div>

      {/* Actions */}
      <div className="flex items-center gap-2 lg:gap-4 shrink-0">
        <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border-none bg-background-primary text-sm font-semibold text-gray-600 cursor-pointer font-[inherit] hover:bg-gray-100">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
            <line x1="8" y1="5" x2="8" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="5" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          New
        </button>
        <div className="w-8 h-8 rounded-full bg-primary-blue-150 text-text-primary text-sm font-medium flex items-center justify-center">
          RK
        </div>
      </div>
    </header>
  );
}
