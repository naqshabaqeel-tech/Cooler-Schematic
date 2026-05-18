export default function Input({
  label,
  helperText,
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
  className = '',
}) {
  return (
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      {label && (
        <label className="text-sm font-medium leading-5 text-gray-700">
          {label}
        </label>
      )}
      <div className="flex items-center h-10 w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] focus-within:border-primary-blue-500 transition-colors">
        {leadingIcon && (
          <span className="flex items-center justify-center w-4 h-4 shrink-0 text-gray-500 mr-2">
            {leadingIcon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(type === 'number' ? e.target.value : e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          required={required}
          className="flex-1 min-w-0 h-6 text-sm font-medium text-gray-900 placeholder:text-gray-500 bg-transparent outline-none border-none font-[inherit] p-0"
        />
        {trailingIcon && (
          <span className="flex items-center justify-center w-4 h-4 shrink-0 text-gray-500 ml-2">
            {trailingIcon}
          </span>
        )}
      </div>
      {helperText && (
        <p className="text-sm font-medium leading-5 text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
