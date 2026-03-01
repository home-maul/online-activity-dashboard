"use client";

export default function FunnelChart({ stages, rates }) {
  const maxValue = stages[0]?.value || 1;

  return (
    <div className="space-y-3">
      {stages.map((stage, i) => {
        const width = Math.max((stage.value / maxValue) * 100, 8);
        const rate = rates?.[i];
        return (
          <div key={stage.stage} className="flex items-center gap-4">
            <div className="w-24 shrink-0 text-right">
              <p className="text-[11px] font-medium text-gray-muted uppercase tracking-wider">{stage.stage}</p>
            </div>
            <div className="flex-1 relative">
              <div
                className="h-10 rounded-lg flex items-center px-4 transition-all duration-500"
                style={{
                  width: `${width}%`,
                  background: i === 0
                    ? "#070E1A"
                    : i === stages.length - 1
                    ? "#59A9FF"
                    : `color-mix(in srgb, #070E1A ${100 - (i / (stages.length - 1)) * 80}%, #C6D2DF)`,
                }}
              >
                <span className="text-[13px] font-semibold text-white whitespace-nowrap">
                  {stage.value.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="w-16 shrink-0">
              {rate && (
                <span className="text-[11px] text-gray-muted">
                  {rate.value}% {rate.label}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
