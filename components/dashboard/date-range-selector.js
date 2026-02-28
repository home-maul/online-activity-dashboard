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
    <div className="flex items-center gap-2">
      {RANGES.map((range) => (
        <button
          key={range.value}
          onClick={() => handleClick(range.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            (range.value === "custom" && value === "custom") || (range.value !== "custom" && value === range.value)
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
            className="px-2 py-1.5 rounded-lg border border-gray-200 text-sm bg-white text-gray-700"
          />
          <span className="text-gray-400 text-sm">to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="px-2 py-1.5 rounded-lg border border-gray-200 text-sm bg-white text-gray-700"
          />
          <button
            onClick={applyCustom}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
