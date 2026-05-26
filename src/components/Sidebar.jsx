import { useState } from 'react';
import { mainNavItems, toolsSubItems } from '../data/navigation';

function NavItem({ icon, label, active = false, sub = false, collapsed = false, onClick }) {
  const base = sub
    ? `flex items-center gap-2.5 h-9 rounded-lg cursor-pointer no-underline ${collapsed ? 'justify-center px-0' : 'pl-5 pr-2.5'} text-xs font-medium`
    : `flex items-center gap-2.5 h-9 rounded-lg cursor-pointer no-underline ${collapsed ? 'justify-center px-0' : 'px-2.5'} text-sm font-medium`;

  const state = active
    ? 'bg-primary-blue-50 text-primary-blue-500'
    : 'text-text-primary hover:bg-gray-100';

  const iconSize = sub ? 'w-4 h-4 shrink-0' : 'w-[18px] h-[18px] shrink-0';

  return (
    <a className={`${base} ${state}`} title={collapsed ? label : undefined} onClick={onClick}>
      <img src={icon} alt="" className={iconSize} />
      {!collapsed && label}
    </a>
  );
}

function CollapseIcon({ collapsed }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      {collapsed ? (
        <path d="M6 3L11 8L6 13" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      ) : (
        <path d="M10 3L5 8L10 13" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      )}
    </svg>
  );
}

export default function Sidebar({ activeRoute, onNavigate }) {
  const [toolsOpen, setToolsOpen] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  // Map main-nav labels to the routes the App.jsx state machine understands.
  // Only Locations and the Tools → Cooler Schematic items are wired today;
  // every other label is a no-op (toast-like console hint).
  const routeFor = {
    Locations: 'locations',
  };

  function handleMainNavClick(label) {
    const route = routeFor[label];
    if (route) onNavigate?.(route);
  }

  return (
    <aside
      className={`${collapsed ? 'w-[56px] min-w-[56px]' : 'w-[200px] min-w-[200px]'} flex flex-col gap-[30px] bg-background py-5 ${collapsed ? 'px-2' : 'pl-3 pr-2'} overflow-y-auto transition-all duration-200`}
    >
      {/* Logo + Collapse toggle */}
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between pl-2.5'}`}>
        {!collapsed && (
          <div className="h-7 flex items-center shrink-0">
            <img src="/assets/Logo.svg" alt="PBD" className="h-7 w-auto" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-gray-100 cursor-pointer bg-transparent border-none shrink-0"
        >
          <CollapseIcon collapsed={collapsed} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2 flex-1 justify-between">
        {/* Main group */}
        <div className="flex flex-col gap-1">
          {mainNavItems.map((item) => (
            <NavItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              collapsed={collapsed}
              active={routeFor[item.label] && activeRoute === routeFor[item.label]}
              onClick={() => handleMainNavClick(item.label)}
            />
          ))}

          {/* Tools section */}
          <div className="flex flex-col">
            <button
              onClick={() => collapsed ? null : setToolsOpen(!toolsOpen)}
              className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} h-9 ${collapsed ? 'px-0' : 'px-2.5'} rounded-lg cursor-pointer hover:bg-gray-100 border-none bg-transparent`}
              title={collapsed ? 'Tools' : undefined}
            >
              <div className={`flex items-center ${collapsed ? '' : 'gap-2.5'}`}>
                <img src="/assets/Shapes.svg" alt="" className="w-[18px] h-[18px]" />
                {!collapsed && <span className="text-sm font-medium text-text-primary">Tools</span>}
              </div>
              {!collapsed && (
                <img
                  src="/assets/CaretUp.svg"
                  alt=""
                  className={`w-4 h-4 transition-transform duration-200 ${!toolsOpen ? 'rotate-180' : ''}`}
                />
              )}
            </button>
            {toolsOpen && !collapsed && (
              <div>
                {toolsSubItems.map((item) => (
                  <NavItem
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    // Highlight Cooler Schematic when we're inside the planogram flow.
                    active={item.label === 'Cooler Schematic' ? (activeRoute === 'years' || activeRoute == null) : item.active}
                    sub
                    collapsed={collapsed}
                    onClick={() => {
                      if (item.label === 'Cooler Schematic') onNavigate?.('years');
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <NavItem icon="/assets/Buildings.svg" label="Companies" collapsed={collapsed} />
        </div>

        {/* Settings */}
        <div className="flex flex-col gap-1">
          <div className="h-px bg-gray-200 mx-2.5" />
          <NavItem icon="/assets/Gear.svg" label="Settings" collapsed={collapsed} />
        </div>
      </nav>
    </aside>
  );
}
