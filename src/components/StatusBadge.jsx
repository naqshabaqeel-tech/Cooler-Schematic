const variants = {
  active: 'bg-background-success text-text-success',
  draft: 'bg-background-warning text-text-warning',
  archived: 'bg-background-secondary text-text-secondary',
};

export default function StatusBadge({ label, variant = 'active' }) {
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${variants[variant]}`}>
      {label}
    </span>
  );
}
