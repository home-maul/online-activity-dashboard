export default function ChartCard({ title, children, className = "" }) {
  return (
    <div className={`bg-surface rounded-2xl border border-border p-6 hover:shadow-[0_4px_24px_var(--hover-glow,rgba(43,124,233,0.08))] hover:border-blue/20 transition-all duration-300 ${className}`}>
      <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider mb-5">{title}</h3>
      {children}
    </div>
  );
}
