"use client";

import { useState, useEffect, useCallback } from "react";
import MetricCard from "@/components/dashboard/metric-card";
import ChartCard from "@/components/dashboard/chart-card";
import DateRangeSelector from "@/components/dashboard/date-range-selector";
import { MetricCardSkeleton, ChartSkeleton } from "@/components/dashboard/loading-skeleton";
import LineChart from "@/components/charts/line-chart";
import MockBanner from "@/components/dashboard/mock-banner";

function getDateRange(days) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - Number(days));
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

/**
 * Reusable platform page layout for LinkedIn, Meta, Reddit, etc.
 * All pull data from GA4 with the same structure:
 *   { paid, organic, landingPages, sourceBreakdown? }
 */
export default function PlatformPage({ name, subtitle, apiPath, mockData }) {
  const [range, setRange] = useState("30");
  const [data, setData] = useState(null);
  const [isMock, setIsMock] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { startDate, endDate } = getDateRange(range);

    try {
      const res = await fetch(`${apiPath}?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) throw new Error(`${name} data not available`);
      const json = await res.json();

      if (json.paid || json.organic) {
        setData(json);
        setIsMock(false);
      } else {
        setIsMock(true);
      }
    } catch (err) {
      console.warn(`[${name}] Falling back to mock:`, err.message);
      setIsMock(true);
    } finally {
      setLoading(false);
    }
  }, [range, apiPath, name]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const d = isMock ? mockData : data;
  const paid = d?.paid;
  const organic = d?.organic;
  const pages = d?.landingPages || [];
  const sources = d?.sourceBreakdown || [];

  return (
    <div className="space-y-6">
      {isMock && <MockBanner />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-navy tracking-tight">{name}</h2>
          <p className="text-[12px] text-gray-muted mt-0.5">{subtitle}</p>
        </div>
        <DateRangeSelector value={range} onChange={setRange} />
      </div>

      {/* ── Paid Section ── */}
      {paid && (
        <div className="space-y-4">
          <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider px-1">Paid — {name} Ads</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)
            ) : (
              <>
                <MetricCard title="Sessions" value={paid.totals.sessions} />
                <MetricCard title="Users" value={paid.totals.users} />
                <MetricCard title="Conversions" value={paid.totals.conversions} />
                <MetricCard
                  title="Conv. Rate"
                  value={paid.totals.sessions > 0 ? parseFloat(((paid.totals.conversions / paid.totals.sessions) * 100).toFixed(1)) : 0}
                  format="percent"
                />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {loading ? (
              <>
                <ChartSkeleton />
                <ChartSkeleton />
              </>
            ) : (
              <>
                <ChartCard title="Paid Sessions & Users">
                  <LineChart
                    data={paid.timeSeries}
                    lines={[
                      { dataKey: "sessions", name: "Sessions" },
                      { dataKey: "users", name: "Users" },
                    ]}
                  />
                </ChartCard>
                <ChartCard title="Paid Conversions">
                  <LineChart
                    data={paid.timeSeries}
                    lines={[{ dataKey: "conversions", name: "Conversions" }]}
                  />
                </ChartCard>
              </>
            )}
          </div>

          {!loading && paid.campaigns?.length > 0 && (
            <div className="bg-surface rounded-2xl border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider">Campaigns (UTM)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border bg-blue-sky/40">
                      <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Campaign</th>
                      <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Sessions</th>
                      <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Users</th>
                      <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Conversions</th>
                      <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Conv. Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paid.campaigns.map((c) => (
                      <tr key={c.name} className="border-b border-border/50 hover:bg-blue-sky/30 transition-colors duration-150">
                        <td className="px-6 py-3 font-medium text-navy/80">{c.name}</td>
                        <td className="px-6 py-3 text-right text-gray-muted">{c.sessions.toLocaleString()}</td>
                        <td className="px-6 py-3 text-right text-gray-muted">{c.users.toLocaleString()}</td>
                        <td className="px-6 py-3 text-right text-gray-muted">{c.conversions}</td>
                        <td className="px-6 py-3 text-right text-gray-muted">
                          {c.sessions > 0 ? ((c.conversions / c.sessions) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Organic Section ── */}
      {organic && (
        <div className="space-y-4 pt-2">
          <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider px-1">Organic — {name} Traffic</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)
            ) : (
              <>
                <MetricCard title="Sessions" value={organic.totals.sessions} />
                <MetricCard title="Users" value={organic.totals.users} />
                <MetricCard title="Engagement" value={organic.totals.engagementRate} format="percent" />
                <MetricCard title="Bounce Rate" value={organic.totals.bounceRate} format="percent" />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => <MetricCardSkeleton key={i} />)
            ) : (
              <>
                <MetricCard title="Conversions" value={organic.totals.conversions} />
                <MetricCard title="Avg Duration" value={`${organic.totals.avgDuration}s`} />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {loading ? (
              <>
                <ChartSkeleton />
                <ChartSkeleton />
              </>
            ) : (
              <>
                <ChartCard title="Organic Sessions & Users">
                  <LineChart
                    data={organic.timeSeries}
                    lines={[
                      { dataKey: "sessions", name: "Sessions" },
                      { dataKey: "users", name: "Users" },
                    ]}
                  />
                </ChartCard>
                <ChartCard title="Organic Conversions">
                  <LineChart
                    data={organic.timeSeries}
                    lines={[{ dataKey: "conversions", name: "Conversions" }]}
                  />
                </ChartCard>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Source Breakdown (Meta only: Facebook vs Instagram) ── */}
      {!loading && sources.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider">Traffic by Source</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border bg-blue-sky/40">
                  <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Source</th>
                  <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Sessions</th>
                  <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Users</th>
                  <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Conversions</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.source} className="border-b border-border/50 hover:bg-blue-sky/30 transition-colors duration-150">
                    <td className="px-6 py-3 font-medium text-navy/80">{s.source}</td>
                    <td className="px-6 py-3 text-right text-gray-muted">{s.sessions.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right text-gray-muted">{s.users.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right text-gray-muted">{s.conversions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Landing Pages ── */}
      {!loading && pages.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider">Top Landing Pages from {name}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border bg-blue-sky/40">
                  <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Page</th>
                  <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Sessions</th>
                  <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Users</th>
                  <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Conversions</th>
                  <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Bounce Rate</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((p) => (
                  <tr key={p.page} className="border-b border-border/50 hover:bg-blue-sky/30 transition-colors duration-150">
                    <td className="px-6 py-3 font-mono text-xs text-navy/80">{p.page}</td>
                    <td className="px-6 py-3 text-right text-gray-muted">{p.sessions.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right text-gray-muted">{p.users.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right text-gray-muted">{p.conversions}</td>
                    <td className="px-6 py-3 text-right text-gray-muted">{p.bounceRate}%</td>
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
