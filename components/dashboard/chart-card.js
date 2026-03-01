export default function ChartCard({ title, children, className = "" }) {
  return (
    <div className={`bg-surface rounded-2xl border border-border p-6 hover:shadow-[0_2px_20px_rgba(0,0,0,0.04)] transition-all duration-300 ${className}`}>
      <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider mb-5">{title}</h3>
      {children}
    </div>
  );
}
