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

function getMockData() {
  const ts = [];
  const now = new Date();
  for (let i = 30; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    ts.push({
      date: d.toISOString().split("T")[0],
      sessions: Math.round(45 + Math.random() * 25),
      users: Math.round(35 + Math.random() * 20),
      conversions: Math.round(Math.random() * 5),
      impressions: Math.round(8000 + Math.random() * 3000),
      clicks: Math.round(120 + Math.random() * 60),
      spend: parseFloat((85 + Math.random() * 40).toFixed(2)),
    });
  }
  return {
    paid: {
      totals: { sessions: 1240, users: 980, conversions: 42, impressions: 312000, clicks: 8200, spend: 3800, cpc: 0.46, cpm: 12.18, ctr: 2.63 },
      timeSeries: ts,
      campaigns: [
        { name: "Retargeting - DK", impressions: 48000, clicks: 1800, spend: 600, conversions: 18, ctr: 3.75, cpc: 0.33 },
        { name: "Lookalike - EU", impressions: 156000, clicks: 3200, spend: 1200, conversions: 8, ctr: 2.05, cpc: 0.38 },
        { name: "E-commerce Retarget", impressions: 52000, clicks: 1400, spend: 480, conversions: 9, ctr: 2.69, cpc: 0.34 },
        { name: "Video - Brand Awareness", impressions: 186000, clicks: 2800, spend: 920, conversions: 7, ctr: 1.51, cpc: 0.33 },
      ],
    },
    organic: {
      totals: { sessions: 620, users: 480, conversions: 8, engagementRate: 48.6, avgDuration: 95, bounceRate: 52.3 },
      timeSeries: ts.map((d) => ({ date: d.date, sessions: Math.round(d.sessions * 0.5), users: Math.round(d.users * 0.5), conversions: Math.round(d.conversions * 0.2) })),
    },
    landingPages: [
      { page: "/pricing", sessions: 180, users: 140, conversions: 6, bounceRate: 34.2 },
      { page: "/solutions/e-commerce", sessions: 120, users: 95, conversions: 3, bounceRate: 41.8 },
      { page: "/blog/delivery-optimization", sessions: 95, users: 72, conversions: 1, bounceRate: 28.5 },
    ],
    sourceBreakdown: [
      { source: "facebook", sessions: 1420, users: 1100, conversions: 38 },
      { source: "instagram", sessions: 440, users: 360, conversions: 12 },
    ],
    adsSource: null,
  };
}

export default function MetaPage() {
  const [range, setRange] = useState("30");
  const [data, setData] = useState(null);
  const [isMock, setIsMock] = useState(true);
  const [loading, setLoading] = useState(true);

  const mock = getMockData();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { startDate, endDate } = getDateRange(range);

    try {
      const res = await fetch(`/api/meta?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) throw new Error("Meta data not available");
      const json = await res.json();

      if (json.paid || json.organic) {
        setData(json);
        setIsMock(false);
      } else {
        setIsMock(true);
      }
    } catch (err) {
      console.warn("[Meta] Falling back to mock:", err.message);
      setIsMock(true);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const d = isMock ? mock : data;
  const paid = d?.paid;
  const organic = d?.organic;
  const pages = d?.landingPages || [];
  const sources = d?.sourceBreakdown || [];
  const hasMetaApi = d?.adsSource === "meta_api";

  return (
    <div className="space-y-6">
      {isMock && <MockBanner />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-navy tracking-tight">Meta</h2>
          <p className="text-[12px] text-gray-muted mt-0.5">
            Facebook & Instagram — {hasMetaApi ? "direct Meta API + GA4" : "via GA4"}
          </p>
        </div>
        <DateRangeSelector value={range} onChange={setRange} />
      </div>

      {/* ── Paid Section ── */}
      {paid && (
        <div className="space-y-4">
          <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider px-1">Paid — Meta Ads</h3>

          {/* Main KPIs — show richer data when Meta API is connected */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <MetricCardSkeleton key={i} />)
            ) : (
              <>
                <MetricCard title="Impressions" value={paid.totals.impressions} />
                <MetricCard title="Clicks" value={paid.totals.clicks || paid.totals.sessions} />
                <MetricCard title="Spend" value={paid.totals.spend} format="currency" />
                <MetricCard title="CTR" value={paid.totals.ctr || (paid.totals.impressions > 0 ? parseFloat(((paid.totals.clicks / paid.totals.impressions) * 100).toFixed(2)) : 0)} format="percent" />
                <MetricCard title="Conversions" value={paid.totals.conversions} />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <MetricCardSkeleton key={i} />)
            ) : (
              <>
                <MetricCard title="CPC" value={paid.totals.cpc || (paid.totals.clicks > 0 ? parseFloat((paid.totals.spend / paid.totals.clicks).toFixed(2)) : 0)} format="currency" subtitle="cost per click" />
                <MetricCard title="CPM" value={paid.totals.cpm || (paid.totals.impressions > 0 ? parseFloat((paid.totals.spend / paid.totals.impressions * 1000).toFixed(2)) : 0)} format="currency" subtitle="cost per 1k impressions" />
                <MetricCard title="CPA" value={paid.totals.conversions > 0 ? parseFloat((paid.totals.spend / paid.totals.conversions).toFixed(2)) : 0} format="currency" subtitle="cost per conversion" />
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
              </>
            )}
          </div>

          {!loading && paid.campaigns?.length > 0 && (
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

      {/* ── Source Breakdown ── */}
      {!loading && sources.length > 0 && (
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
      {!loading && pages.length > 0 && (
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
    </div>
  );
}
