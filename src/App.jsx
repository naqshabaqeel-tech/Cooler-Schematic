import { useState } from 'react';
import { regionData } from './data/navigation';
import { generateShelfLayout } from './data/planogram';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import SubNav from './components/SubNav';
import ConfirmDialog from './components/ConfirmDialog';
import ToastHost from './components/ToastHost';
import YearsView from './components/views/YearsView';
import RegionsView from './components/views/RegionsView';
import PlanogramView from './components/views/PlanogramView';
import LocationsView from './components/views/LocationsView';
import LocationDetailView from './components/views/LocationDetailView';

export default function App() {
  const [view, setView] = useState('years');
  const [currentYear, setCurrentYear] = useState(null);
  const [planogramInfo, setPlanogramInfo] = useState({ doorSet: null, regionName: '' });
  const [selectedLocation, setSelectedLocation] = useState(null);
  // Per-location planogram layouts. Each location keeps its own draft so edits
  // survive navigating away and back. Tools → Cooler Schematic is intentionally
  // *not* in this map — it keeps its own ephemeral editor state.
  const [locationLayouts, setLocationLayouts] = useState({});
  // Per door-set planogram layouts (Tools flow). Keyed by doorSet._id so each
  // door set keeps its own edits and can serve as a "base" when creating new ones.
  const [doorSetLayouts, setDoorSetLayouts] = useState({});

  function setLocationLayout(locationId, updater) {
    setLocationLayouts((prev) => {
      const current = prev[locationId];
      const next = typeof updater === 'function' ? updater(current) : updater;
      return { ...prev, [locationId]: next };
    });
  }

  function setDoorSetLayout(doorSetId, updater) {
    setDoorSetLayouts((prev) => {
      const current = prev[doorSetId];
      const next = typeof updater === 'function' ? updater(current) : updater;
      return { ...prev, [doorSetId]: next };
    });
  }
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

  function goPlanogram(doorSet, regionName, initialLayout) {
    setPlanogramInfo({ doorSet, regionName });
    // Seed the door set's layout the first time it's opened. Re-opens keep
    // their saved edits. An explicit `initialLayout` overrides — used when
    // creating a new door set from a base.
    if (doorSet?._id) {
      setDoorSetLayouts((prev) => {
        if (initialLayout) return { ...prev, [doorSet._id]: initialLayout };
        if (prev[doorSet._id]) return prev;
        return { ...prev, [doorSet._id]: generateShelfLayout(doorSet.doors || 6, doorSet.defaultShelf || 7) };
      });
    }
    setView('planogram');
  }

  // Sidebar navigation entry point — used by the Locations item and the
  // Tools → Cooler Schematic sub-item.
  function navigateTo(route) {
    if (route === 'locations') {
      setSelectedLocation(null);
      setView('locations');
      return;
    }
    if (route === 'years') {
      if (view === 'planogram') {
        setPendingNav({ run: doGoHome });
        return;
      }
      doGoHome();
    }
  }

  function goLocationDetail(location) {
    setSelectedLocation(location);
    setView('location-detail');
  }
  function goLocationsList() {
    setSelectedLocation(null);
    setView('locations');
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
  } else if (view === 'locations') {
    breadcrumbs.push({ label: 'Locations' });
  } else if (view === 'location-detail') {
    breadcrumbs.push({ label: 'Locations', onClick: goLocationsList });
    breadcrumbs.push({ label: selectedLocation ? `${selectedLocation.id} - ${selectedLocation.name}` : '—' });
  }

  // Pick the right top-bar icon: building for Locations, the GridNine for the schematic flow.
  const topIcon = view === 'locations' || view === 'location-detail' ? '/assets/MapPin.svg' : '/assets/GridNine.svg';

  return (
    <div className="flex w-full h-screen bg-background overflow-hidden">
      <Sidebar activeRoute={view} onNavigate={navigateTo} />

      <main className="flex-1 flex flex-col min-w-0 min-h-0 p-2">
        <div className="flex-1 flex flex-col bg-background-primary border border-grey-200 rounded-lg overflow-hidden">
          <TopBar icon={topIcon} breadcrumbs={breadcrumbs} />
          {view === 'years' && (
            <SubNav
              showArchived={showArchivedYears}
              onToggleArchived={() => setShowArchivedYears((v) => !v)}
            />
          )}

          {/* Content */}
          <div className={`flex-1 ${view === 'planogram' || view === 'location-detail' ? 'overflow-hidden min-h-0' : 'overflow-y-auto p-5'}`}>
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
                doorSetLayouts={doorSetLayouts}
              />
            )}
            {view === 'planogram' && (
              <PlanogramView
                doorSet={planogramInfo.doorSet}
                regionName={planogramInfo.regionName}
                onExit={doGoYear.bind(null, currentYear || 2026)}
                layout={planogramInfo.doorSet?._id ? doorSetLayouts[planogramInfo.doorSet._id] : undefined}
                onLayoutChange={(updater) => planogramInfo.doorSet?._id && setDoorSetLayout(planogramInfo.doorSet._id, updater)}
              />
            )}
            {view === 'locations' && (
              <LocationsView onSelectLocation={goLocationDetail} />
            )}
            {view === 'location-detail' && (
              <LocationDetailView
                location={selectedLocation}
                onBack={goLocationsList}
                layout={selectedLocation ? locationLayouts[selectedLocation.id] : undefined}
                onLayoutChange={(updater) => selectedLocation && setLocationLayout(selectedLocation.id, updater)}
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
