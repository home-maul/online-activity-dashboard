"use client";

const RANGES = [
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
];

export default function DateRangeSelector({ value, onChange }) {
  return (
    <div className="flex gap-2">
      {RANGES.map((range) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            value === range.value
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
