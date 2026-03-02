"use client";

import { useState } from "react";

const RANGES = [
  { label: "7d", value: "7" },
  { label: "30d", value: "30" },
  { label: "90d", value: "90" },
  { label: "Custom", value: "custom" },
];

export default function DateRangeSelector({ value, onChange, customRange, onCustomRangeChange }) {
  const [showCustom, setShowCustom] = useState(false);
  const [from, setFrom] = useState(customRange?.startDate ?? "");
  const [to, setTo] = useState(customRange?.endDate ?? "");

  function handleClick(val) {
    if (val === "custom") {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      onChange(val);
    }
  }

  function applyCustom() {
    if (from && to) {
      onCustomRangeChange?.({ startDate: from, endDate: to });
      setShowCustom(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      {RANGES.map((range) => (
        <button
          key={range.value}
          onClick={() => handleClick(range.value)}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 ${
            (range.value === "custom" && value === "custom") || (range.value !== "custom" && value === range.value)
              ? "bg-blue-mid text-white shadow-sm"
              : "text-gray-muted hover:bg-blue-ice hover:text-navy"
          }`}
        >
          {range.label}
        </button>
      ))}
      {showCustom && (
        <div className="flex items-center gap-2 ml-2">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-border text-[12px] bg-surface text-navy"
          />
          <span className="text-gray-brand text-[12px]">to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-border text-[12px] bg-surface text-navy"
          />
          <button
            onClick={applyCustom}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-blue text-white hover:bg-blue/85 transition-colors duration-200"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
