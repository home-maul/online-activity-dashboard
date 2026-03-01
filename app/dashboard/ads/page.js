"use client";

import { useState, useEffect, useCallback } from "react";
import MetricCard from "@/components/dashboard/metric-card";
import ChartCard from "@/components/dashboard/chart-card";
import DateRangeSelector from "@/components/dashboard/date-range-selector";
import { MetricCardSkeleton, ChartSkeleton } from "@/components/dashboard/loading-skeleton";
import LineChart from "@/components/charts/line-chart";
import BarChart from "@/components/charts/bar-chart";

function getDateRange(days) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - Number(days));
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

export default function AdsPage() {
  const [range, setRange] = useState("30");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { startDate, endDate } = getDateRange(range);

    try {
      const res = await fetch(`/api/ads?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) throw new Error("Failed to fetch ads data");
      setData(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-8 text-center">
        <p className="text-rose-600 font-medium text-[15px]">Error loading ads data</p>
        <p className="text-rose-400 text-sm mt-1">{error}</p>
        <button
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-navy/90 text-white text-sm rounded-xl hover:bg-navy transition-colors duration-200"
        >
          Retry
        </button>
      </div>
    );
  }

  const t = data?.totals;
  const costPerClick = t?.clicks ? (t.cost / t.clicks).toFixed(2) : null;
  const costPerConversion = t?.conversions ? (t.cost / t.conversions).toFixed(2) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-navy tracking-tight">Google Ads</h2>
        <DateRangeSelector value={range} onChange={setRange} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <MetricCardSkeleton key={i} />)
        ) : (
          <>
            <MetricCard title="Impressions" value={t?.impressions} />
            <MetricCard title="Clicks" value={t?.clicks} />
            <MetricCard title="CTR" value={t?.ctr} format="percent" />
            <MetricCard title="Cost" value={t?.cost} format="currency" />
            <MetricCard title="Conversions" value={t?.conversions} />
          </>
        )}
      </div>

      {/* Derived KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => <MetricCardSkeleton key={i} />)
        ) : (
          <>
            <MetricCard title="Cost / Click" value={costPerClick} format="currency" subtitle="avg CPC" />
            <MetricCard title="Cost / Conversion" value={costPerConversion} format="currency" subtitle="avg CPA" />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {loading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <ChartCard title="Clicks & Impressions Over Time">
              <LineChart
                data={data?.timeSeries ?? []}
                lines={[
                  { dataKey: "clicks", name: "Clicks" },
                  { dataKey: "impressions", name: "Impressions" },
                ]}
              />
            </ChartCard>
            <ChartCard title="Daily Ad Spend">
              <LineChart
                data={data?.timeSeries ?? []}
                lines={[{ dataKey: "cost", name: "Cost ($)" }]}
              />
            </ChartCard>
          </>
        )}
      </div>

      {/* Campaign table */}
      {!loading && data?.campaigns?.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider">Campaigns</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border bg-blue-sky/40">
                  <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Campaign</th>
                  <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Impressions</th>
                  <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Clicks</th>
                  <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">CTR</th>
                  <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Cost</th>
                  <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Conversions</th>
                </tr>
              </thead>
              <tbody>
                {data.campaigns.map((c) => (
                  <tr key={c.name} className="border-b border-border/50 hover:bg-blue-sky/30 transition-colors duration-150">
                    <td className="px-6 py-3 font-medium text-navy/80">{c.name}</td>
                    <td className="px-6 py-3 text-right text-gray-muted">{c.impressions.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right text-gray-muted">{c.clicks.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right text-gray-muted">{c.ctr}%</td>
                    <td className="px-6 py-3 text-right text-gray-muted">${c.cost.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right text-gray-muted">{c.conversions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
