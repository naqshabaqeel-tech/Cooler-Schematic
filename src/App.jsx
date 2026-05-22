import { useState } from 'react';
import { regionData } from './data/navigation';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import SubNav from './components/SubNav';
import ConfirmDialog from './components/ConfirmDialog';
import ToastHost from './components/ToastHost';
import YearsView from './components/views/YearsView';
import RegionsView from './components/views/RegionsView';
import PlanogramView from './components/views/PlanogramView';

export default function App() {
  const [view, setView] = useState('years');
  const [currentYear, setCurrentYear] = useState(null);
  const [planogramInfo, setPlanogramInfo] = useState({ doorSet: null, regionName: '' });
  const [pendingNav, setPendingNav] = useState(null);
  const [showArchivedYears, setShowArchivedYears] = useState(false);
  const [regions, setRegions] = useState(() =>
    regionData.map((r) => ({
      ...r,
      doorSets: r.doorSets.map((ds, i) => ({ ...ds, _id: ds._id || `${r.name}-${i}-${Date.now()}` })),
    }))
  );

  function doGoHome() {
    setView('years');
    setCurrentYear(null);
  }

  function doGoYear(year) {
    setCurrentYear(year);
    setView('regions');
  }

  function goHome() {
    if (view === 'planogram') {
      setPendingNav({ run: doGoHome });
      return;
    }
    doGoHome();
  }

  function goYear(year) {
    if (view === 'planogram') {
      setPendingNav({ run: () => doGoYear(year) });
      return;
    }
    doGoYear(year);
  }

  function goPlanogram(doorSet, regionName) {
    setPlanogramInfo({ doorSet, regionName });
    setView('planogram');
  }

  const breadcrumbs = [];
  if (view === 'years') {
    if (showArchivedYears) {
      breadcrumbs.push({ label: 'Cooler Schematic', onClick: () => setShowArchivedYears(false) });
      breadcrumbs.push({ label: 'Archived' });
    } else {
      breadcrumbs.push({ label: 'Cooler Schematic' });
    }
  } else if (view === 'regions') {
    breadcrumbs.push({ label: 'Cooler Schematic', onClick: goHome });
    breadcrumbs.push({ label: String(currentYear) });
  } else if (view === 'planogram') {
    breadcrumbs.push({ label: 'Cooler Schematic', onClick: goHome });
    breadcrumbs.push({ label: String(currentYear || 2026), onClick: () => goYear(currentYear || 2026) });
    breadcrumbs.push({ label: `${planogramInfo.doorSet?.doors || 0} Doors — ${planogramInfo.regionName}` });
  }

  return (
    <div className="flex w-full h-screen bg-background overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 min-h-0 p-2">
        <div className="flex-1 flex flex-col bg-background-primary border border-grey-200 rounded-lg overflow-hidden">
          <TopBar icon="/assets/GridNine.svg" breadcrumbs={breadcrumbs} />
          {view === 'years' && (
            <SubNav
              showArchived={showArchivedYears}
              onToggleArchived={() => setShowArchivedYears((v) => !v)}
            />
          )}

          {/* Content */}
          <div className={`flex-1 ${view === 'planogram' ? 'overflow-hidden min-h-0' : 'overflow-y-auto p-5'}`}>
            {view === 'years' && (
              <YearsView
                onSelectYear={goYear}
                showArchived={showArchivedYears}
                onExitArchived={() => setShowArchivedYears(false)}
              />
            )}
            {view === 'regions' && (
              <RegionsView
                year={currentYear}
                onEditPlanogram={goPlanogram}
                regions={regions}
                setRegions={setRegions}
              />
            )}
            {view === 'planogram' && (
              <PlanogramView
                doorSet={planogramInfo.doorSet}
                regionName={planogramInfo.regionName}
                onExit={doGoYear.bind(null, currentYear || 2026)}
              />
            )}
          </div>
        </div>
      </main>

      <ToastHost />

      <ConfirmDialog
        open={!!pendingNav}
        title="Are you sure you want to go back?"
        message="Please know that if you go back, all the changes you’ve made will be discarded."
        cancelLabel="Cancel"
        confirmLabel="Yes, Discard Changes"
        onCancel={() => setPendingNav(null)}
        onConfirm={() => {
          const run = pendingNav?.run;
          setPendingNav(null);
          run?.();
        }}
      />
    </div>
  );
}
