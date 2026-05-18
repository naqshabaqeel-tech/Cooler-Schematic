export default function StatCard({ label, value, sub }) {
  return (
    <div className="bg-background-secondary rounded-lg px-4 py-3">
      <div className="text-[11px] text-text-secondary mb-1">{label}</div>
      <div className="text-[22px] font-medium text-text-primary">{value}</div>
      <div className="text-[11px] text-text-tertiary mt-0.5">{sub}</div>
    </div>
  );
}
