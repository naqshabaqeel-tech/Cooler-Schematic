// ─── Width Multiplier (GS1 / EDI logic) ───────────────────────────────────────
// Derives shelf-width multiplier from the GS1 product description and net content.
// Description is the standardised manufacturer-submitted field (e.g. "Coca-Cola Bottle, 20 fl oz").
// Container type is always present in GS1 descriptions because it legally differentiates GTINs.
//
// Reference unit: standard 12 oz can  = 1.0×
//   0.75× → slim / mini can   (≤ 8.4 oz can)
//   1.0×  → standard can      (any height — 12 oz, 16 oz tallboy, 19.2 oz stovepipe)
//   1.25× → single-serve bottle (16–24 oz)
//   1.5×  → liter bottle       (25–50 oz  /  ~1 L – 1.5 L)
//   1.75× → multi-serve bottle  (> 50 oz   /  2 L +)
export function getWidthMultiplier(productDescription, sizeStr) {
  const desc = (productDescription || '').toLowerCase();
  const oz   = parseSizeToOz(sizeStr);

  const isCan    = desc.includes('can');
  const isBottle = desc.includes('bottle') || desc.includes('glass');

  if (isCan) {
    return oz <= 8.4 ? 0.75 : 1.0;
  }

  if (isBottle) {
    if (oz <= 25) return 1.25;
    if (oz <= 50) return 1.5;
    return 1.75;
  }

  // Fallback: description doesn't name the container type — infer from oz alone.
  // Covers ~5 % of edge cases (pouches, cartons, etc.).
  if (oz <= 8.4)  return 0.75;
  if (oz <= 16)   return 1.0;
  if (oz <= 25)   return 1.25;
  if (oz <= 50)   return 1.5;
  return 1.75;
}

// ─── Product catalogue ────────────────────────────────────────────────────────
// widthMultiplier is computed at definition time from the GS1 description + size,
// mirroring what would happen during an EDI / GS1 product import.
const _categories = [
  {
    name: 'Energy Drinks',
    color: '#EF4444',
    products: [
      { id: 'ed-1', name: 'Monster Java Mean Bean 15oz Can',         upc: '0708470008004',    size: '15 oz',   color: '#8B6914', vendor: 'Other', image: '/assets/monster-energy-drink-500ml-nazar-jan-s-supermarket.webp' },
      { id: 'ed-2', name: 'Red Bull Energy Drink 12oz Can',          upc: '06114100556008',   size: '12 oz',   color: '#1E40AF', vendor: 'Other', image: '/assets/monster-energy-drink-500ml-nazar-jan-s-supermarket.webp' },
      { id: 'ed-3', name: 'Monster Energy Original 16oz Can',        upc: '07084700001005',   size: '16 oz',   color: '#16A34A', vendor: 'Other', image: '/assets/monster-energy-drink-500ml-nazar-jan-s-supermarket.webp' },
      { id: 'ed-4', name: 'Celsius Sparkling Orange 12oz Can',       upc: '08897200702003',   size: '12 oz',   color: '#EA580C', vendor: 'Other', image: '/assets/monster-energy-drink-500ml-nazar-jan-s-supermarket.webp' },
      { id: 'ed-5', name: 'Reign Total Body Fuel Lemon 16oz Can',    upc: '08152700562009',   size: '16 oz',   color: '#FACC15', vendor: 'Other', image: '/assets/monster-energy-drink-500ml-nazar-jan-s-supermarket.webp' },
      { id: 'ed-6', name: 'Red Bull Sugarfree 8.4oz Can',            upc: '06114100603006',   size: '8.4 oz',  color: '#94A3B8', vendor: 'Other', image: '/assets/monster-energy-drink-500ml-nazar-jan-s-supermarket.webp' },
      { id: 'ed-7', name: 'Monster Ultra Zero 16oz Can',             upc: '07084700080509',   size: '16 oz',   color: '#E2E8F0', vendor: 'Other', image: '/assets/monster-energy-drink-500ml-nazar-jan-s-supermarket.webp' },
      { id: 'ed-8', name: 'Celsius Sparkling Watermelon 12oz Can',   upc: '08897200703000',   size: '12 oz',   color: '#DC2626', vendor: 'Other', image: '/assets/monster-energy-drink-500ml-nazar-jan-s-supermarket.webp' },
    ],
  },
  {
    name: 'Soft Drinks',
    color: '#3B82F6',
    products: [
      { id: 'sd-1', name: 'Coca-Cola Classic 12oz Can',              upc: '04900000143001',   size: '12 oz',   color: '#DC2626', vendor: 'Coca-Cola', image: '/assets/coke can.webp' },
      { id: 'sd-2', name: 'Pepsi Cola 12oz Can',                     upc: '01200000015004',   size: '12 oz',   color: '#1D4ED8', vendor: 'Pepsi', image: '/assets/coke can.webp' },
      { id: 'sd-3', name: 'Sprite Lemon-Lime 12oz Can',              upc: '04900000243008',   size: '12 oz',   color: '#16A34A', vendor: 'Coca-Cola', image: '/assets/coke can.webp' },
      { id: 'sd-4', name: 'Dr Pepper Original 12oz Can',             upc: '07800000845005',   size: '12 oz',   color: '#7C2D12', vendor: 'Keurig Dr Pepper', image: '/assets/coke can.webp' },
      { id: 'sd-5', name: 'Mountain Dew Original 12oz Can',          upc: '01200000049009',   size: '12 oz',   color: '#65A30D', vendor: 'Pepsi', image: '/assets/coke can.webp' },
      { id: 'sd-6', name: 'Coca-Cola Zero Sugar 12oz Can',           upc: '04900000252000',   size: '12 oz',   color: '#0F172A', vendor: 'Coca-Cola', image: '/assets/coke can.webp' },
      { id: 'sd-7', name: 'Fanta Orange 12oz Can',                   upc: '04900000544001',   size: '12 oz',   color: '#F97316', vendor: 'Coca-Cola', image: '/assets/coke can.webp' },
      { id: 'sd-8',  name: 'Coca-Cola Classic 20oz Bottle',          upc: '04900000167004',   size: '20 oz',   color: '#DC2626', vendor: 'Coca-Cola', image: '/assets/Coke Bottle.webp' },
      { id: 'sd-9',  name: 'Coca-Cola Classic 1L Bottle',            upc: '04900000168001',   size: '1 L',     color: '#DC2626', vendor: 'Coca-Cola', image: '/assets/coca-cola-bottle-500-ml-420982.webp' },
      { id: 'sd-10', name: 'Coca-Cola Classic 1.5L Bottle',          upc: '04900000169008',   size: '1.5 L',   color: '#DC2626', vendor: 'Coca-Cola', image: '/assets/coca-cola-bottle-500-ml-420982.webp' },
      { id: 'sd-11', name: 'Coca-Cola Classic 2L Bottle',            upc: '04900000170005',   size: '2 L',     color: '#DC2626', vendor: 'Coca-Cola', image: '/assets/coca-cola-bottle-500-ml-420982.webp' },
      { id: 'sd-12', name: 'Pepsi 4-pack 16oz Cans',                 upc: '01200000080002',   size: '4 × 16 oz', color: '#1D4ED8', vendor: 'Pepsi', image: '/assets/coke can.webp' },
      { id: 'sd-13', name: 'Pepsi 6-pack 16.9oz Bottles',            upc: '01200000081009',   size: '6 × 16.9 oz', color: '#1D4ED8', vendor: 'Pepsi', image: '/assets/Coke Bottle.webp' },
      { id: 'sd-14', name: 'Coca-Cola 12-pack 12oz Cans',            upc: '04900000180005',   size: '12 × 12 oz', color: '#DC2626', vendor: 'Coca-Cola', image: '/assets/coke can.webp' },
      { id: 'sd-15', name: 'Coca-Cola 24-pack 12oz Cans Case',       upc: '04900000190002',   size: '24 × 12 oz', color: '#DC2626', vendor: 'Coca-Cola', image: '/assets/coke can.webp' },
    ],
  },
  {
    name: 'Water',
    color: '#06B6D4',
    products: [
      { id: 'wt-1', name: 'Dasani Purified Water 16.9oz Bottle',          upc: '04900000491008',   size: '16.9 oz', color: '#0891B2', vendor: 'Coca-Cola', image: '/assets/coca-cola-bottle-500-ml-420982.webp' },
      { id: 'wt-2', name: 'Aquafina Purified Water 16.9oz Bottle',        upc: '01200000028004',   size: '16.9 oz', color: '#0284C7', vendor: 'Pepsi', image: '/assets/coca-cola-bottle-500-ml-420982.webp' },
      { id: 'wt-3', name: 'Smartwater Vapor Distilled 20oz Bottle',       upc: '07866300050003',   size: '20 oz',   color: '#7DD3FC', vendor: 'Coca-Cola', image: '/assets/coca-cola-bottle-500-ml-420982.webp' },
      { id: 'wt-4', name: 'Evian Natural Spring Water 16.9oz Bottle',     upc: '07981360526006',   size: '16.9 oz', color: '#EC4899', vendor: 'Other', image: '/assets/coca-cola-bottle-500-ml-420982.webp' },
      { id: 'wt-5', name: 'FIJI Natural Artesian Water 16.9oz Bottle',    upc: '06323800500004',   size: '16.9 oz', color: '#0EA5E9', vendor: 'Other', image: '/assets/coca-cola-bottle-500-ml-420982.webp' },
      { id: 'wt-6', name: 'Dasani Purified Water 1L Bottle',              upc: '04900000492005',   size: '1 L',     color: '#0891B2', vendor: 'Coca-Cola', image: '/assets/coca-cola-bottle-500-ml-420982.webp' },
      { id: 'wt-7', name: 'Smartwater Vapor Distilled 1.5L Bottle',       upc: '07866300051000',   size: '1.5 L',   color: '#7DD3FC', vendor: 'Coca-Cola', image: '/assets/coca-cola-bottle-500-ml-420982.webp' },
    ],
  },
  {
    name: 'Juice',
    color: '#F59E0B',
    products: [
      { id: 'jc-1', name: 'Tropicana Pure Premium OJ 12oz Bottle',        upc: '04800001100008',   size: '12 oz',   color: '#F59E0B', vendor: 'Pepsi', image: '/assets/Juice bottle.webp' },
      { id: 'jc-2', name: 'Minute Maid Apple Juice 12oz Bottle',          upc: '02500009903002',   size: '12 oz',   color: '#EF4444', vendor: 'Coca-Cola', image: '/assets/Juice bottle.webp' },
      { id: 'jc-3', name: 'Simply Lemonade 11.5oz Bottle',                upc: '02500009511009',   size: '11.5 oz', color: '#FCD34D', vendor: 'Coca-Cola', image: '/assets/Juice bottle.webp' },
      { id: 'jc-4', name: 'Ocean Spray Cranberry Juice 15.2oz Bottle',    upc: '03120000124005',   size: '15.2 oz', color: '#BE123C', vendor: 'Keurig Dr Pepper', image: '/assets/Juice bottle.webp' },
      { id: 'jc-5', name: 'Naked Green Machine Juice 15.2oz Bottle',      upc: '08254000070008',   size: '15.2 oz', color: '#15803D', vendor: 'Pepsi', image: '/assets/Juice bottle.webp' },
      { id: 'jc-6', name: 'Gatorade Thirst Quencher 28oz Bottle',         upc: '05200094321006',   size: '28 oz',   color: '#EA580C', vendor: 'Pepsi', image: '/assets/Juice bottle.webp' },
      { id: 'jc-7', name: 'Tropicana Pure Premium OJ 32oz Bottle',        upc: '04800001101005',   size: '32 oz',   color: '#F59E0B', vendor: 'Pepsi', image: '/assets/Juice bottle.webp' },
    ],
  },
  {
    name: 'Beer',
    color: '#A16207',
    products: [
      { id: 'br-1', name: 'Bud Light Lager 12oz Can',                     upc: '01820000121003',   size: '12 oz',   color: '#60A5FA', vendor: 'Other', image: '/assets/coke can.webp' },
      { id: 'br-2', name: 'Corona Extra 12oz Bottle',                     upc: '02810062710007',   size: '12 oz',   color: '#FCD34D', vendor: 'Other', image: '/assets/Coke Bottle.webp' },
      { id: 'br-3', name: 'Modelo Especial 12oz Can',                     upc: '02810001734003',   size: '12 oz',   color: '#D97706', vendor: 'Other', image: '/assets/coke can.webp' },
      { id: 'br-4', name: 'Heineken Original 12oz Bottle',                upc: '08152101240003',   size: '12 oz',   color: '#16A34A', vendor: 'Other', image: '/assets/Coke Bottle.webp' },
      { id: 'br-5', name: 'Michelob Ultra Light 12oz Can',                upc: '01820011392009',   size: '12 oz',   color: '#1E3A5F', vendor: 'Other', image: '/assets/coke can.webp' },
      { id: 'br-6', name: 'Coors Light Lager 12oz Can',                   upc: '07178000001009',   size: '12 oz',   color: '#CBD5E1', vendor: 'Other', image: '/assets/coke can.webp' },
    ],
  },
  {
    name: 'Tea & Coffee',
    color: '#78350F',
    products: [
      { id: 'tc-1', name: 'Gold Peak Sweet Tea 18.5oz Bottle',            upc: '04900006702001',   size: '18.5 oz', color: '#92400E', vendor: 'Coca-Cola', image: '/assets/Juice bottle.webp' },
      { id: 'tc-2', name: 'Arizona Green Tea 23oz Can',                   upc: '06132700001005',   size: '23 oz',   color: '#15803D', vendor: 'Other', image: '/assets/Juice Can.webp' },
      { id: 'tc-3', name: 'Starbucks Frappuccino Mocha 13.7oz Bottle',    upc: '01200010700008',   size: '13.7 oz', color: '#78350F', vendor: 'Pepsi', image: '/assets/Coke Bottle.webp' },
      { id: 'tc-4', name: 'Pure Leaf Unsweetened Tea 18.5oz Bottle',      upc: '01200045630007',   size: '18.5 oz', color: '#065F46', vendor: 'Pepsi', image: '/assets/Juice bottle.webp' },
    ],
  },
];

// ─── Glide-based shelf model ──────────────────────────────────────────────────
// Each shelf is SHELF_WIDTH_INCHES wide. A product occupies a "glide" (lane)
// equal to its glideWidth in inches. One glide = one facing. Adjacent glides of
// the same product render as N identical thumbnails side-by-side.
export const SHELF_WIDTH_INCHES = 30;

// Pack-type categorisation — drives the size filter in the product library and
// keys into the glide-width table. Single source of truth for both.
// Order matters: multipack first, then containers by oz.
// Vendors — the big-three beverage producers plus an "Other" catch-all.
// Order here is the order rendered in the Vendor mix side-panel.
export const VENDORS = ['Coca-Cola', 'Pepsi', 'Keurig Dr Pepper', 'Other'];

export const VENDOR_COLORS = {
  'Coca-Cola':         '#DC2626', // brand red
  'Pepsi':             '#1D4ED8', // brand blue
  'Keurig Dr Pepper':  '#9F1239', // burgundy
  'Other':             '#6B7280', // neutral gray
};

export const PACK_TYPES = [
  'Slim can',
  'Standard can',
  'Standard bottle',
  'Large bottle',
  '1L bottle',
  'Share-size bottle',
  '4-pack',
  '6-pack',
  '12-pack',
  '24-pack',
];

// Human-readable labels for the size filter — keeps the internal pack-type key
// but surfaces the actual oz/L range so users don't need to know jargon.
export const PACK_TYPE_LABELS = {
  'Slim can':          '8–12 oz · slim can',
  'Standard can':      '12–16 oz · standard can',
  'Standard bottle':   '16–20 oz · standard bottle',
  'Large bottle':      '21–32 oz · large bottle',
  '1L bottle':         '1 L (33.8 oz) · 1L bottle',
  'Share-size bottle': '1.25–2 L · share-size bottle',
  '4-pack':            '4-pack',
  '6-pack':            '6-pack',
  '12-pack':           '12-pack',
  '24-pack':           'Case (24-pack)',
};

// Parse a size string into ounces. Accepts "12 oz", "16.9 oz", "1 L", "1.5 L",
// "2 L", "1.25 L" — anything with an L/liter suffix is converted (1 L ≈ 33.814 oz).
// Multipack-style strings like "12 × 12 oz" parse the first number found.
export function parseSizeToOz(sizeStr) {
  if (!sizeStr) return 0;
  const s = String(sizeStr).toLowerCase();
  const num = parseFloat(s.replace(/[^\d.]/g, '')) || 0;
  if (/\d\s*l\b|liter|litre/.test(s)) return num * 33.814;
  return num;
}

export function getPackType(productDescription, sizeStr) {
  const desc = (productDescription || '').toLowerCase();
  const oz   = parseSizeToOz(sizeStr);

  if (/\b24[\s-]?pack\b|\bcase\b/.test(desc)) return '24-pack';
  if (/\b12[\s-]?pack\b/.test(desc))           return '12-pack';
  if (/\b6[\s-]?pack\b/.test(desc))            return '6-pack';
  if (/\b4[\s-]?pack\b/.test(desc))            return '4-pack';

  const isCan    = desc.includes('can');
  const isBottle = desc.includes('bottle') || desc.includes('glass');

  if (isCan) {
    if (oz <= 8.4) return 'Slim can';
    return 'Standard can';
  }
  if (isBottle) {
    if (oz <= 20) return 'Standard bottle';
    if (oz <= 32) return 'Large bottle';
    if (oz <= 40) return '1L bottle';
    return 'Share-size bottle';
  }
  // Fallback by oz only
  if (oz <= 8.4) return 'Slim can';
  if (oz <= 16)  return 'Standard can';
  if (oz <= 25)  return 'Standard bottle';
  if (oz <= 32)  return 'Large bottle';
  if (oz <= 40)  return '1L bottle';
  return 'Share-size bottle';
}

// Glide-width lookup (inches per facing).
const GLIDE_WIDTH_BY_PACK_TYPE = {
  'Slim can':           2.5,
  'Standard can':       2.875,
  'Standard bottle':    3.125,
  'Large bottle':       4.0,
  '1L bottle':          5.0,
  'Share-size bottle':  6.0,
  '4-pack':             5.5,
  '6-pack':             7.5,
  '12-pack':            9.0,
  '24-pack':            11.0,
};

export function getGlideWidth(productDescription, sizeStr) {
  return GLIDE_WIDTH_BY_PACK_TYPE[getPackType(productDescription, sizeStr)] || 2.875;
}

// Apply widthMultiplier + packType + glideWidth at import time.
export const productCategories = _categories.map((cat) => ({
  ...cat,
  products: cat.products.map((p) => {
    const packType = getPackType(p.name, p.size);
    return {
      ...p,
      widthMultiplier: getWidthMultiplier(p.name, p.size),
      packType,
      glideWidth: GLIDE_WIDTH_BY_PACK_TYPE[packType] || 2.875,
    };
  }),
}));

// Max facings for a product on a single 30" shelf.
export function getMaxFacings(product) {
  if (!product?.glideWidth) return 0;
  return Math.floor(SHELF_WIDTH_INCHES / product.glideWidth);
}

// Generate initial empty shelf layout for a door set.
export function generateShelfLayout(doorCount, shelfCount) {
  return Array.from({ length: doorCount }, (_, doorIdx) => ({
    id: `door-${doorIdx + 1}`,
    label: `Door ${doorIdx + 1}`,
    shelves: Array.from({ length: shelfCount }, (_, shelfIdx) => ({
      id: `door-${doorIdx + 1}-shelf-${shelfIdx + 1}`,
      label: `Shelf ${shelfIdx + 1}`,
      glides: [], // each entry: { product }
    })),
  }));
}

/**
 * Seed a fresh layout of the target dimensions, copying glides from a base
 * layout where the shapes overlap. Doors / shelves that exist in the base but
 * not the target are dropped; the reverse get empty shelves. Used by
 * RegionsView's "Start from" picker when creating a new door set.
 */
export function seedLayoutFromBase(baseLayout, doorCount, shelfCount) {
  const target = generateShelfLayout(doorCount, shelfCount);
  if (!Array.isArray(baseLayout) || baseLayout.length === 0) return target;
  const doorsToCopy = Math.min(doorCount, baseLayout.length);
  for (let d = 0; d < doorsToCopy; d++) {
    const baseDoor = baseLayout[d];
    if (!baseDoor?.shelves) continue;
    const shelvesToCopy = Math.min(target[d].shelves.length, baseDoor.shelves.length);
    for (let s = 0; s < shelvesToCopy; s++) {
      const baseGlides = baseDoor.shelves[s]?.glides || [];
      target[d].shelves[s].glides = JSON.parse(JSON.stringify(baseGlides));
    }
  }
  return target;
}
