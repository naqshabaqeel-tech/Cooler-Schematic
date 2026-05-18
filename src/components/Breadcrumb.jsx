export default function Breadcrumb({ icon, items = [] }) {
  return (
    <div className="flex items-center gap-[7px]">
      {icon && (
        <div className="flex items-center p-1 bg-primary-blue-50 rounded shrink-0">
          <img src={icon} alt="" className="w-3 h-3 block" />
        </div>
      )}
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-[7px]">
          {i > 0 && (
            <span className="text-sm font-medium text-gray-500 select-none">/</span>
          )}
          {i < items.length - 1 ? (
            <span
              className="text-sm font-medium text-gray-500 cursor-pointer hover:underline truncate"
              onClick={item.onClick}
            >
              {item.label}
            </span>
          ) : (
            <span className="text-sm font-medium text-gray-950 truncate">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
