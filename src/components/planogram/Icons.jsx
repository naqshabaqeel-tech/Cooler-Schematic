const S = { stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' };

export const BackIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" {...S}><path d="M18 11H4M10 5l-6 6 6 6" /></svg>
);
export const UndoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" {...S}><path d="M4 6h5.5a3.5 3.5 0 010 7H6M4 6l2.5-2.5M4 6l2.5 2.5" /></svg>
);
export const RedoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" {...S}><path d="M12 6H6.5a3.5 3.5 0 000 7H10M12 6l-2.5-2.5M12 6l-2.5 2.5" /></svg>
);
export const ZoomOutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" {...S}><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14M5 7h4" /></svg>
);
export const ZoomInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" {...S}><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14M5 7h4M7 5v4" /></svg>
);
export const HelpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" {...S}><circle cx="8" cy="8" r="6" /><path d="M6.2 6.4a1.8 1.8 0 113 1.2c-.6.5-1.2.8-1.2 1.6M8 11.2v.1" /></svg>
);
export const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" {...S}><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></svg>
);
export const CaretIcon = ({ open }) => (
  <svg width="12" height="12" viewBox="0 0 16 16" {...S} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}><path d="M3 6l5 5 5-5" /></svg>
);
export const CopyIcon = () => (
  <svg width="12" height="12" viewBox="0 0 18 18" {...S}>
    <rect x="6" y="6" width="9" height="9" rx="1.5" />
    <path d="M12 6V4.5C12 3.7 11.3 3 10.5 3H4.5C3.7 3 3 3.7 3 4.5V10.5C3 11.3 3.7 12 4.5 12H6" />
  </svg>
);
export const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" {...S}><path d="M8 3v10M3 8h10" /></svg>
);
export const MinusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" {...S}><path d="M3 8h10" /></svg>
);
export const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" {...S}><path d="M3 3l8 8M11 3l-8 8" /></svg>
);
export const ProductsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" {...S}><rect x="2.5" y="2.5" width="4.5" height="4.5" rx="1" /><rect x="9" y="2.5" width="4.5" height="4.5" rx="1" /><rect x="2.5" y="9" width="4.5" height="4.5" rx="1" /><rect x="9" y="9" width="4.5" height="4.5" rx="1" /></svg>
);
export const CustomAreaIcon = () => (
  <svg width="20" height="20" viewBox="0 0 16 16" {...S} strokeDasharray="2 2"><rect x="2.5" y="2.5" width="11" height="11" rx="2" /></svg>
);
