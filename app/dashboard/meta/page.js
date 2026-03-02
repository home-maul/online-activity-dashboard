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

export default function MetaPage() {
  const [range, setRange] = useState("30");
  const [data, setData] = useState(null);
  const [noData, setNoData] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { startDate, endDate } = getDateRange(range);

    try {
      const res = await fetch(`/api/meta?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) throw new Error("Meta data not available");
      const json = await res.json();

      if (json.paid || json.organic) {
        setData(json);
        setNoData(false);
      } else {
        setNoData(true);
      }
    } catch (err) {
      console.warn("[Meta]", err.message);
      setNoData(true);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const paid = data?.paid;
  const organic = data?.organic;
  const pages = data?.landingPages || [];
  const sources = data?.sourceBreakdown || [];
  const hasMetaApi = data?.adsSource === "meta_api";

  return (
    <div className="space-y-6">
      {noData && !loading && <MockBanner message="Meta — not connected" />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-navy tracking-tight">Meta</h2>
          <p className="text-[12px] text-gray-muted mt-0.5">
            Facebook & Instagram — {hasMetaApi ? "direct Meta API + GA4" : "via GA4"}
          </p>
        </div>
        <DateRangeSelector value={range} onChange={setRange} />
      </div>

      {noData && !loading && (
        <div className="rounded-2xl border border-border bg-blue-sky/30 p-12 text-center">
          <p className="text-[13px] text-gray-muted">No Meta data available for this period</p>
        </div>
      )}

      {loading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => <MetricCardSkeleton key={i} />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </>
      )}

      {data && !loading && (
        <>
          {/* ── Paid Section ── */}
          {paid && (
            <div className="space-y-4">
              <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider px-1">Paid — Meta Ads</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <MetricCard title="Impressions" value={paid.totals.impressions} />
                <MetricCard title="Clicks" value={paid.totals.clicks || paid.totals.sessions} />
                <MetricCard title="Spend" value={paid.totals.spend} format="currency" />
                <MetricCard title="CTR" value={paid.totals.ctr || (paid.totals.impressions > 0 ? parseFloat(((paid.totals.clicks / paid.totals.impressions) * 100).toFixed(2)) : 0)} format="percent" />
                <MetricCard title="Conversions" value={paid.totals.conversions} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricCard title="CPC" value={paid.totals.cpc || (paid.totals.clicks > 0 ? parseFloat((paid.totals.spend / paid.totals.clicks).toFixed(2)) : 0)} format="currency" subtitle="cost per click" />
                <MetricCard title="CPM" value={paid.totals.cpm || (paid.totals.impressions > 0 ? parseFloat((paid.totals.spend / paid.totals.impressions * 1000).toFixed(2)) : 0)} format="currency" subtitle="cost per 1k impressions" />
                <MetricCard title="CPA" value={paid.totals.conversions > 0 ? parseFloat((paid.totals.spend / paid.totals.conversions).toFixed(2)) : 0} format="currency" subtitle="cost per conversion" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <ChartCard title="Impressions & Clicks">
                  <LineChart
                    data={paid.timeSeries}
                    lines={[
                      { dataKey: paid.timeSeries?.[0]?.impressions !== undefined ? "impressions" : "sessions", name: paid.timeSeries?.[0]?.impressions !== undefined ? "Impressions" : "Sessions" },
                      { dataKey: paid.timeSeries?.[0]?.clicks !== undefined ? "clicks" : "users", name: paid.timeSeries?.[0]?.clicks !== undefined ? "Clicks" : "Users" },
                    ]}
                  />
                </ChartCard>
                <ChartCard title="Daily Ad Spend">
                  <LineChart
                    data={paid.timeSeries}
                    lines={[
                      { dataKey: paid.timeSeries?.[0]?.spend !== undefined ? "spend" : "conversions", name: paid.timeSeries?.[0]?.spend !== undefined ? "Spend ($)" : "Conversions" },
                    ]}
                  />
                </ChartCard>
              </div>

              {paid.campaigns?.length > 0 && (
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
                          <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Spend</th>
                          <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">CPC</th>
                          <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Conv.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paid.campaigns.map((c) => (
                          <tr key={c.name} className="border-b border-border/50 hover:bg-blue-sky/30 transition-colors duration-150">
                            <td className="px-6 py-3 font-medium text-navy/80">{c.name}</td>
                            <td className="px-6 py-3 text-right text-gray-muted">{(c.impressions || 0).toLocaleString()}</td>
                            <td className="px-6 py-3 text-right text-gray-muted">{(c.clicks || c.sessions || 0).toLocaleString()}</td>
                            <td className="px-6 py-3 text-right text-gray-muted">{c.ctr || 0}%</td>
                            <td className="px-6 py-3 text-right text-gray-muted">${(c.spend || 0).toLocaleString()}</td>
                            <td className="px-6 py-3 text-right text-gray-muted">${c.cpc || 0}</td>
                            <td className="px-6 py-3 text-right text-gray-muted">{c.conversions || 0}</td>
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
              <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider px-1">Organic — Facebook & Instagram Traffic</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard title="Sessions" value={organic.totals.sessions} />
                <MetricCard title="Users" value={organic.totals.users} />
                <MetricCard title="Engagement" value={organic.totals.engagementRate} format="percent" />
                <MetricCard title="Bounce Rate" value={organic.totals.bounceRate} format="percent" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
              </div>
            </div>
          )}

          {/* ── Source Breakdown ── */}
          {sources.length > 0 && (
            <div className="bg-surface rounded-2xl border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider">Facebook vs Instagram</h3>
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
          {pages.length > 0 && (
            <div className="bg-surface rounded-2xl border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider">Top Landing Pages from Meta</h3>
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
        </>
      )}
    </div>
  );
}
