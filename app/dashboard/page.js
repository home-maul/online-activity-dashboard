"use client";

import { useState, useEffect, useCallback } from "react";
import MetricCard from "@/components/dashboard/metric-card";
import ChartCard from "@/components/dashboard/chart-card";
import DateRangeSelector from "@/components/dashboard/date-range-selector";
import { MetricCardSkeleton, ChartSkeleton } from "@/components/dashboard/loading-skeleton";
import LineChart from "@/components/charts/line-chart";
import BarChart from "@/components/charts/bar-chart";
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

export default function DashboardOverview() {
  const [range, setRange] = useState("30");
  const [customRange, setCustomRange] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [pipedrive, setPipedrive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { startDate, endDate } =
      range === "custom" && customRange ? customRange : getDateRange(range);
    const params = `startDate=${startDate}&endDate=${endDate}`;

    try {
      const [analyticsRes, pipedriveRes] = await Promise.allSettled([
        fetch(`/api/analytics?${params}`).then(async (r) => {
          if (!r.ok) return null;
          return r.json();
        }),
        fetch(`/api/pipedrive?${params}`).then(async (r) => {
          if (!r.ok) return null;
          return r.json();
        }),
      ]);

      const analyticsData = analyticsRes.status === "fulfilled" ? analyticsRes.value : null;
      const pipedriveData = pipedriveRes.status === "fulfilled" ? pipedriveRes.value : null;

      setAnalytics(analyticsData);
      setPipedrive(pipedriveData && !pipedriveData.mock ? pipedriveData : null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [range, customRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCustomRange = (cr) => {
    setCustomRange(cr);
    setRange("custom");
  };

  const t = analytics?.totals;
  const c = t?.change;
  const p = pipedrive?.totals;

  const conversionRate = t?.conversions && t?.sessions ? ((t.conversions / t.sessions) * 100).toFixed(2) : null;

  // Build blended sources table from Pipedrive bySource + GA4 sources
  const bestSources = buildBestSources(analytics?.sources, pipedrive?.bySource, pipedrive?.salesCycle);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-navy tracking-tight">Overview</h2>
        <DateRangeSelector
          value={range}
          onChange={setRange}
          customRange={customRange}
          onCustomRangeChange={handleCustomRange}
        />
      </div>

      {/* Connection status */}
      {!loading && !analytics && !pipedrive && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 px-5 py-4 text-[12px] text-amber-700">
          {error
            ? <><span className="font-medium">Could not load data:</span> {error}. <button onClick={fetchData} className="underline font-medium">Retry</button></>
            : "No data sources connected yet. Sign in with Google for GA4 data, and set up Pipedrive for pipeline metrics."
          }
        </div>
      )}

      {/* Row 1 — Pipeline KPIs */}
      {pipedrive ? (
        <div>
          <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider px-1 mb-3">Pipeline</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)
            ) : (
              <>
                <MetricCard title="Open Deals" value={p?.open} subtitle={`${p?.deals || 0} total`} />
                <MetricCard title="Pipeline Value" value={p?.pipeline} format="currency" />
                <MetricCard title="Win Rate" value={p?.winRate} format="percent" subtitle={`${p?.won || 0} won`} />
                <MetricCard title="Avg Sales Cycle" value={p?.avgSalesCycle ? `${p.avgSalesCycle}d` : null} subtitle="days to close" />
              </>
            )}
          </div>
        </div>
      ) : !loading ? (
        <div className="rounded-xl border border-blue/10 bg-blue-sky/40 px-5 py-3 text-[12px] text-gray-muted">
          Connect Pipedrive to see pipeline KPIs — open deals, win rate, and sales cycle metrics.
        </div>
      ) : null}

      {/* Row 2 — Acquisition KPIs */}
      <div>
        <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider px-1 mb-3">Acquisition</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)
          ) : (
            <>
              <MetricCard title="Sessions" value={t?.sessions} change={c?.sessions} />
              <MetricCard title="Conversions (GA4)" value={t?.conversions} change={c?.conversions} />
              <MetricCard
                title="Conversion Rate"
                value={conversionRate}
                format="percent"
                subtitle="sessions → conversions"
              />
              <MetricCard
                title="New Leads"
                value={p?.leads ?? t?.newUsers}
                subtitle={p ? "from Pipedrive" : "new users (GA4)"}
              />
            </>
          )}
        </div>
      </div>

      {/* Row 3 — Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {loading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            {pipedrive?.timeline?.length > 0 ? (
              <ChartCard title="Deals Added Over Time">
                <LineChart
                  data={pipedrive.timeline}
                  lines={[
                    { dataKey: "added", name: "Deals Added" },
                    { dataKey: "won", name: "Won" },
                  ]}
                />
              </ChartCard>
            ) : (
              <ChartCard title="Sessions & Users Over Time">
                <LineChart
                  data={analytics?.timeSeries ?? []}
                  lines={[
                    { dataKey: "sessions", name: "Sessions" },
                    { dataKey: "users", name: "Users" },
                  ]}
                />
              </ChartCard>
            )}
            <ChartCard title="Traffic by Channel">
              <BarChart
                data={analytics?.channels ?? []}
                bars={[{ dataKey: "sessions", name: "Sessions" }]}
                xKey="channel"
              />
            </ChartCard>
          </>
        )}
      </div>

      {/* Row 4 — Best Performing Sources */}
      {!loading && bestSources.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider">Best Performing Sources</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border bg-blue-sky/40">
                  <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Source</th>
                  <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Sessions</th>
                  <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">GA4 Conv.</th>
                  {pipedrive && (
                    <>
                      <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Deals</th>
                      <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Won</th>
                      <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Win Rate</th>
                      <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Avg Days</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {bestSources.map((s, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-blue-sky/30 transition-colors duration-150">
                    <td className="px-6 py-3 font-medium text-navy/80">{s.source}</td>
                    <td className="px-6 py-3 text-right text-gray-muted">{(s.sessions || 0).toLocaleString()}</td>
                    <td className="px-6 py-3 text-right text-gray-muted">{s.ga4Conversions ?? "—"}</td>
                    {pipedrive && (
                      <>
                        <td className="px-6 py-3 text-right text-gray-muted">{s.deals || "—"}</td>
                        <td className="px-6 py-3 text-right text-gray-muted">{s.won || "—"}</td>
                        <td className="px-6 py-3 text-right text-gray-muted">{s.winRate ? `${s.winRate}%` : "—"}</td>
                        <td className="px-6 py-3 text-right text-gray-muted">{s.avgDays ?? "—"}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Insights */}
      {!loading && analytics && (
        <InsightsPanel
          startDate={range === "custom" && customRange ? customRange.startDate : getDateRange(range).startDate}
          endDate={range === "custom" && customRange ? customRange.endDate : getDateRange(range).endDate}
        />
      )}
    </div>
  );
}

function buildBestSources(ga4Sources, pipedriveBySource, salesCycle) {
  if (!ga4Sources?.length) return [];

  const sourceMap = {};

  for (const s of ga4Sources.slice(0, 15)) {
    const key = s.source?.toLowerCase();
    if (!key) continue;
    sourceMap[key] = {
      source: s.source,
      sessions: s.sessions || 0,
      ga4Conversions: s.conversions ?? null,
      deals: 0,
      won: 0,
      winRate: 0,
      avgDays: null,
    };
  }

  if (pipedriveBySource?.length) {
    for (const ps of pipedriveBySource) {
      const key = ps.source?.toLowerCase();
      if (sourceMap[key]) {
        sourceMap[key].deals = ps.deals;
        sourceMap[key].won = ps.won;
        sourceMap[key].winRate = ps.deals > 0 ? Math.round((ps.won / ps.deals) * 100) : 0;
      } else {
        sourceMap[key] = {
          source: ps.source,
          sessions: 0,
          ga4Conversions: null,
          deals: ps.deals,
          won: ps.won,
          winRate: ps.deals > 0 ? Math.round((ps.won / ps.deals) * 100) : 0,
          avgDays: null,
        };
      }
    }
  }

  if (salesCycle?.length) {
    for (const sc of salesCycle) {
      const key = sc.source?.toLowerCase();
      if (sourceMap[key]) {
        sourceMap[key].avgDays = sc.avgDays;
      }
    }
  }

  return Object.values(sourceMap)
    .sort((a, b) => (b.sessions + b.deals * 10) - (a.sessions + a.deals * 10))
    .slice(0, 10);
}
