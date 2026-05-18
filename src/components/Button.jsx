const typeStyles = {
  Default: {
    base: 'bg-primary-blue-500 text-white border border-primary-blue-500 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]',
    hover: 'hover:bg-primary-blue-600',
    disabled: 'opacity-50 cursor-not-allowed',
  },
  Outline: {
    base: 'bg-white text-gray-900 border border-gray-200 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]',
    hover: 'hover:bg-gray-50',
    disabled: 'opacity-50 cursor-not-allowed',
  },
  Plain: {
    base: 'bg-transparent text-gray-600 border border-transparent',
    hover: 'hover:bg-gray-50',
    disabled: 'opacity-50 cursor-not-allowed',
  },
};

const sizeStyles = {
  xs: 'h-7 px-2 text-xs gap-1 rounded-md',
  sm: 'h-8 px-2.5 text-xs gap-1.5 rounded-lg',
  base: 'h-9 px-3 text-sm gap-2 rounded-lg',
  l: 'h-10 px-3.5 text-sm gap-2 rounded-lg',
  xl: 'h-11 px-4 text-base gap-2 rounded-lg',
};

export default function Button({
  children,
  type = 'Default',
  size = 'sm',
  state = 'Default',
  leadingIcon,
  trailingIcon,
  onClick,
  className = '',
}) {
  const variant = typeStyles[type] || typeStyles.Default;
  const sizeClass = sizeStyles[size] || sizeStyles.sm;
  const isDisabled = state === 'Disabled';

  return (
    <button
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center font-semibold font-[inherit] cursor-pointer whitespace-nowrap ${sizeClass} ${variant.base} ${isDisabled ? variant.disabled : variant.hover} ${className}`}
    >
      {leadingIcon && <span className="flex items-center justify-center w-4 h-4 shrink-0">{leadingIcon}</span>}
      {children}
      {trailingIcon && <span className="flex items-center justify-center w-4 h-4 shrink-0">{trailingIcon}</span>}
    </button>
  );
}
