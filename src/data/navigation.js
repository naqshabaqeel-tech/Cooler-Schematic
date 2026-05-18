export const mainNavItems = [
  { label: 'Dashboard', icon: '/assets/SquaresFour.svg' },
  { label: 'Locations', icon: '/assets/MapPin.svg' },
  { label: 'People', icon: '/assets/UsersThree.svg' },
  { label: 'Reporting', icon: '/assets/ChartBar.svg' },
  { label: 'Payments', icon: '/assets/Wallet.svg' },
  { label: 'Orders', icon: '/assets/Files.svg' },
  { label: 'Promotions', icon: '/assets/Megaphone.svg' },
  { label: 'Compliance', icon: '/assets/ListChecks.svg' },
  { label: 'Programs', icon: '/assets/SealPercent.svg' },
  { label: 'Vendors', icon: '/assets/Storefront.svg' },
];

export const toolsSubItems = [
  { label: 'CPC', icon: '/assets/Cigarette.svg' },
  { label: 'Cooler Schematic', icon: '/assets/GridNine.svg', active: true },
  { label: 'EDI', icon: '/assets/Swap.svg' },
  { label: 'EMS Syncing', icon: '/assets/EnvelopeSimple.svg' },
  { label: 'QBO', icon: '/assets/Table.svg' },
  { label: 'SMC Assignment', icon: '/assets/Users.svg' },
  { label: 'Marketing Brochure', icon: '/assets/FileText.svg' },
];

export const yearCards = [
  {
    year: 2026,
    stats: { regions: 9, locations: 200, doorSets: 9 },
    statuses: [
      { count: 3, label: 'Active', variant: 'active' },
      { count: 4, label: 'Draft', variant: 'draft' },
      { count: 1, label: 'Archive', variant: 'archived' },
    ],
  },
  {
    year: 2025,
    stats: { regions: 7, locations: 240, doorSets: 8 },
    statuses: [{ count: 8, label: 'Archive', variant: 'archived' }],
  },
  {
    year: 2024,
    stats: { regions: 6, locations: 218, doorSets: 7 },
    statuses: [{ count: 7, label: 'Archive', variant: 'archived' }],
  },
];

export const regionData = [
  {
    name: 'Southern California',
    doorSets: [
      { doors: 6, status: 'active', defaultShelf: 7, activeDoors: 4, locations: 1212, overrides: 12 },
      { doors: 8, status: 'active', defaultShelf: 7, activeDoors: 5, locations: 1212, overrides: 12 },
      { doors: 10, status: 'active', defaultShelf: 7, activeDoors: 6, locations: 1212, overrides: 12 },
      { doors: 12, status: 'draft', defaultShelf: 7, activeDoors: 4, locations: 1212, overrides: 12 },
    ],
  },
  {
    name: 'Central California',
    doorSets: [
      { doors: 6, status: 'active', defaultShelf: 7, activeDoors: 3, locations: 890, overrides: 8 },
      { doors: 7, status: 'draft', defaultShelf: 7, activeDoors: 4, locations: 890, overrides: 8 },
    ],
  },
  {
    name: 'Las Vegas',
    doorSets: [
      { doors: 7, status: 'active', defaultShelf: 7, activeDoors: 4, locations: 640, overrides: 5 },
      { doors: 9, status: 'archive', defaultShelf: 7, activeDoors: 5, locations: 640, overrides: 5 },
      { doors: 11, status: 'active', defaultShelf: 7, activeDoors: 7, locations: 640, overrides: 5 },
    ],
  },
  {
    name: 'Arizona',
    doorSets: [
      { doors: 6, status: 'active', defaultShelf: 7, activeDoors: 3, locations: 420, overrides: 3 },
      { doors: 8, status: 'draft', defaultShelf: 7, activeDoors: 4, locations: 420, overrides: 3 },
    ],
  },
  {
    name: 'New Mexico',
    doorSets: [
      { doors: 6, status: 'active', defaultShelf: 7, activeDoors: 3, locations: 310, overrides: 2 },
    ],
  },
  {
    name: 'Northern California',
    doorSets: [
      { doors: 7, status: 'draft', defaultShelf: 7, activeDoors: 4, locations: 520, overrides: 6 },
      { doors: 9, status: 'active', defaultShelf: 7, activeDoors: 5, locations: 520, overrides: 6 },
    ],
  },
  {
    name: 'Colorado',
    doorSets: [
      { doors: 6, status: 'active', defaultShelf: 7, activeDoors: 3, locations: 280, overrides: 1 },
    ],
  },
];

export const locationRows = [
  { pbd: '10191', name: 'Beverly Center Mobil', region: 'SoCal', doors: 8, overrides: '12 overrides', schematic: 'active', updated: 'Apr 28, 2026' },
  { pbd: '20234', name: 'Westside Euromart', region: 'SoCal', doors: 8, overrides: '5 overrides', schematic: 'active', updated: 'Apr 25, 2026' },
  { pbd: '30345', name: 'Kims Mobil', region: 'SoCal', doors: 8, overrides: null, schematic: 'active', updated: 'Apr 22, 2026' },
  { pbd: '40456', name: "Charlie's Vehicle Vault", region: 'Las Vegas', doors: 8, overrides: '3 overrides', schematic: 'active', updated: 'Apr 20, 2026' },
  { pbd: '50567', name: "Daisy's Drive-In", region: 'Las Vegas', doors: 8, overrides: null, schematic: 'draft', updated: 'Apr 18, 2026' },
  { pbd: '60678', name: "Ethan's Engine Exchange", region: 'SoCal', doors: 8, overrides: '8 overrides', schematic: 'active', updated: 'Apr 15, 2026' },
  { pbd: '70789', name: "Fiona's Fleet Center", region: 'SoCal', doors: 8, overrides: null, schematic: 'active', updated: 'Apr 14, 2026' },
];
