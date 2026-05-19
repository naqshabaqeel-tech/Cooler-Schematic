export default function Input({
  label,
  helperText,
  error,
  leadingIcon,
  trailingIcon,
  type = 'text',
  value,
  onChange,
  placeholder,
  min,
  max,
  step,
  required,
  disabled,
  readOnly,
  className = '',
}) {
  const hasError = !!error;
  const message = error || helperText;

  let backplateClass =
    'flex items-center h-10 w-full px-3 py-1.5 rounded-lg transition-colors border bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]';
  if (disabled) {
    backplateClass += ' bg-gray-50 border-gray-200 cursor-not-allowed';
  } else if (hasError) {
    backplateClass += ' border-[#FDA29B] focus-within:border-[#D92D20] focus-within:ring-2 focus-within:ring-[#FEE4E2]';
  } else {
    backplateClass +=
      ' border-gray-200 focus-within:border-primary-blue-500 focus-within:ring-2 focus-within:ring-primary-blue-150';
  }

  const labelClass = `text-sm font-medium leading-5 ${disabled ? 'text-gray-400' : 'text-gray-700'}`;
  const messageClass = `text-sm font-medium leading-5 ${
    hasError ? 'text-[#D92D20]' : disabled ? 'text-gray-400' : 'text-gray-500'
  }`;
  const inputClass = `flex-1 min-w-0 h-6 text-sm font-medium bg-transparent outline-none border-none font-[inherit] p-0 ${
    disabled ? 'text-gray-400 cursor-not-allowed placeholder:text-gray-300' : 'text-gray-900 placeholder:text-gray-500'
  }`;
  const iconClass = `flex items-center justify-center w-4 h-4 shrink-0 ${
    hasError ? 'text-[#D92D20]' : disabled ? 'text-gray-300' : 'text-gray-500'
  }`;

  return (
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      {label && (
        <label className={labelClass}>
          {label}
          {required && <span className="text-[#D92D20] ml-0.5">*</span>}
        </label>
      )}
      <div className={backplateClass}>
        {leadingIcon && <span className={`${iconClass} mr-2`}>{leadingIcon}</span>}
        <input
          type={type}
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={hasError || undefined}
          className={inputClass}
        />
        {hasError ? (
          <span className={`${iconClass} ml-2`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 5.5v3M8 10.5h.005M14 8A6 6 0 1 1 2 8a6 6 0 0 1 12 0Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        ) : (
          trailingIcon && <span className={`${iconClass} ml-2`}>{trailingIcon}</span>
        )}
      </div>
      {message && <p className={messageClass}>{message}</p>}
    </div>
  );
}
