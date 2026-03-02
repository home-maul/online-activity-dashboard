"use client";

const STAGE_COLORS = [
  "#070E1A",
  "#1E40AF",
  "#2B7CE9",
  "#4A6FA5",
  "#59A9FF",
  "#93C5FD",
];

export default function FunnelChart({ stages, rates }) {
  const maxValue = stages[0]?.value || 1;

  return (
    <div className="space-y-2.5">
      {stages.map((stage, i) => {
        const width = Math.max((stage.value / maxValue) * 100, 10);
        const color = STAGE_COLORS[i % STAGE_COLORS.length];
        const rate = rates?.[i];
        return (
          <div key={stage.stage} className="flex items-center gap-4">
            <div className="w-24 shrink-0 text-right">
              <p className="text-[11px] font-medium text-gray-muted uppercase tracking-wider">{stage.stage}</p>
            </div>
            <div className="flex-1 relative">
              <div
                className="h-11 rounded-xl flex items-center px-4 transition-all duration-700 ease-out relative overflow-hidden"
                style={{
                  width: `${width}%`,
                  background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
                }}
              >
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 40%, rgba(255,255,255,0.1) 100%)",
                  }}
                />
                <span className="text-[13px] font-semibold text-white whitespace-nowrap relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]">
                  {stage.value.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="w-20 shrink-0">
              {rate && (
                <div className="flex flex-col items-start">
                  <span className="text-[12px] font-semibold text-navy/80">{rate.value}%</span>
                  <span className="text-[9px] text-gray-muted uppercase tracking-wider">{rate.label}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
