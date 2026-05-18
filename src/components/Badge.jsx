const stateStyles = {
  Default: 'bg-[#F2F4F7] text-[#0C111D]',
  Hover: 'bg-[#EAECF0] text-[#0C111D]',
  Active: 'bg-[#EEF9F0] border border-[#CEEBD3] text-[#067647]',
  Inactive: 'bg-[#FFFAEB] border border-[#F2E3BB] text-[#DC6803]',
  Category: 'bg-[#E9F0FD] border border-[#D4E2FC] text-[#174190]',
  Error: 'bg-[#FEF3F2] border border-[#FEE4E2] text-[#D92D20]',
};

export default function Badge({ children, state = 'Default', leftIcon, rightIcon, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs font-medium leading-4 whitespace-nowrap ${stateStyles[state] || stateStyles.Default} ${className}`}
    >
      {leftIcon && <span className="w-3 h-3 shrink-0 flex items-center justify-center">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="w-3 h-3 shrink-0 flex items-center justify-center">{rightIcon}</span>}
    </span>
  );
}
