"use client";

import { useState, useEffect, useCallback } from "react";
import MetricCard from "@/components/dashboard/metric-card";
import ChartCard from "@/components/dashboard/chart-card";
import DateRangeSelector from "@/components/dashboard/date-range-selector";
import { MetricCardSkeleton, ChartSkeleton } from "@/components/dashboard/loading-skeleton";
import MockBanner from "@/components/dashboard/mock-banner";
import FunnelChart from "@/components/charts/funnel-chart";
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

export default function FunnelPage() {
  const [range, setRange] = useState("90");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notConnected, setNotConnected] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { startDate, endDate } = getDateRange(range);

    try {
      const res = await fetch(`/api/pipedrive?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) throw new Error("Pipedrive not available");
      const json = await res.json();

      if (json.mock) {
        setNotConnected(true);
        setData(null);
      } else {
        setNotConnected(false);
        setData(json);
      }
    } catch {
      setNotConnected(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!loading && notConnected) {
    return (
      <div className="space-y-6">
        <MockBanner message="Lead Funnel — not connected (requires Pipedrive)" />
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-navy tracking-tight">Lead Funnel</h2>
            <p className="text-[12px] text-gray-muted mt-0.5">From first touch to closed deal — where are leads dropping off?</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-blue-sky/30 p-12 text-center">
          <p className="text-[13px] text-gray-muted">
            Connect Pipedrive to see your full lead funnel — set <code className="bg-blue-sky px-1.5 py-0.5 rounded text-[12px]">PIPEDRIVE_DOMAIN</code> and <code className="bg-blue-sky px-1.5 py-0.5 rounded text-[12px]">PIPEDRIVE_API_TOKEN</code> in your environment.
          </p>
        </div>
      </div>
    );
  }

  const stages = data?.stages || [];
  const bySource = data?.bySource || [];
  const salesCycle = data?.salesCycle || [];
  const stageTime = data?.stageTime || [];
  const totals = data?.totals;

  // Build funnel stages for the chart
  const funnelStages = stages.map((s) => ({
    stage: s.name,
    value: s.deals,
  }));

  // Add total deals as first bar and won as last if not already there
  if (funnelStages.length > 0 && totals) {
    funnelStages.unshift({ stage: "Total Leads", value: totals.deals });
    funnelStages.push({ stage: "Won", value: totals.won });
  }

  // Calculate conversion rates between stages
  const funnelRates = funnelStages.map((s, i) => {
    if (i === 0) return null;
    const prev = funnelStages[i - 1].value;
    return prev > 0 ? { value: Math.round((s.value / prev) * 100), label: "conv." } : null;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-navy tracking-tight">Lead Funnel</h2>
          <p className="text-[12px] text-gray-muted mt-0.5">From first touch to closed deal — pipeline stage analysis</p>
        </div>
        <DateRangeSelector value={range} onChange={setRange} />
      </div>

      {/* Pipeline KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <MetricCardSkeleton key={i} />)
        ) : (
          <>
            <MetricCard title="Total Deals" value={totals?.deals} />
            <MetricCard title="Open" value={totals?.open} subtitle="in pipeline" />
            <MetricCard title="Won" value={totals?.won} />
            <MetricCard title="Win Rate" value={totals?.winRate} format="percent" />
            <MetricCard title="Pipeline Value" value={totals?.pipeline} format="currency" />
          </>
        )}
      </div>

      {/* Funnel Visualization */}
      {!loading && funnelStages.length > 0 && (
        <ChartCard title="Pipeline Funnel">
          <FunnelChart stages={funnelStages} rates={funnelRates} />
        </ChartCard>
      )}

      {/* Stage KPIs */}
      {!loading && stages.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider">Deals by Stage</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border bg-blue-sky/40">
                  <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Stage</th>
                  <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Deals</th>
                  <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Value</th>
                  <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Avg Days in Stage</th>
                </tr>
              </thead>
              <tbody>
                {stages.map((s) => {
                  const time = stageTime.find((st) => st.name === s.name);
                  return (
                    <tr key={s.name} className="border-b border-border/50 hover:bg-blue-sky/30 transition-colors duration-150">
                      <td className="px-6 py-3 font-medium text-navy/80">{s.name}</td>
                      <td className="px-6 py-3 text-right text-gray-muted">{s.deals}</td>
                      <td className="px-6 py-3 text-right text-gray-muted">${(s.value || 0).toLocaleString()}</td>
                      <td className="px-6 py-3 text-right text-gray-muted">{time?.avgDays ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sales Cycle by Source */}
      {!loading && salesCycle.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartCard title="Avg Days to Close by Source">
            <BarChart
              data={salesCycle.slice(0, 10)}
              bars={[{ dataKey: "avgDays", name: "Avg Days" }]}
              xKey="source"
            />
          </ChartCard>

          {/* Win/Loss by Source */}
          <div className="bg-surface rounded-2xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider">Win Rate by Source</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border bg-blue-sky/40">
                    <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Source</th>
                    <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Deals</th>
                    <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Won</th>
                    <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Lost</th>
                    <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Win Rate</th>
                    <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Won Value</th>
                  </tr>
                </thead>
                <tbody>
                  {bySource.slice(0, 10).map((s) => (
                    <tr key={s.source} className="border-b border-border/50 hover:bg-blue-sky/30 transition-colors duration-150">
                      <td className="px-6 py-3 font-medium text-navy/80">{s.source}</td>
                      <td className="px-6 py-3 text-right text-gray-muted">{s.deals}</td>
                      <td className="px-6 py-3 text-right text-emerald-600 font-medium">{s.won}</td>
                      <td className="px-6 py-3 text-right text-rose-500">{s.lost}</td>
                      <td className="px-6 py-3 text-right text-gray-muted">
                        {s.deals > 0 ? Math.round((s.won / s.deals) * 100) : 0}%
                      </td>
                      <td className="px-6 py-3 text-right text-gray-muted">${(s.wonValue || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          <ChartSkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </div>
      )}
    </div>
  );
}
