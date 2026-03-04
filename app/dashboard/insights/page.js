"use client";

import { useState } from "react";
import DateRangeSelector from "@/components/dashboard/date-range-selector";
import InsightsPanel from "@/components/dashboard/insights-panel";

function getDateRange(days) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - Number(days));
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

export default function InsightsPage() {
  const [range, setRange] = useState("30");
  const [customRange, setCustomRange] = useState(null);

  const { startDate, endDate } =
    range === "custom" && customRange ? customRange : getDateRange(range);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-navy tracking-tight">AI Insights</h2>
          <p className="text-[12px] text-gray-muted mt-0.5">AI-powered analysis of your marketing & pipeline data</p>
        </div>
        <DateRangeSelector
          value={range}
          onChange={setRange}
          customRange={customRange}
          onCustomRangeChange={(cr) => {
            setCustomRange(cr);
            setRange("custom");
          }}
        />
      </div>

      <InsightsPanel startDate={startDate} endDate={endDate} />
    </div>
  );
}
