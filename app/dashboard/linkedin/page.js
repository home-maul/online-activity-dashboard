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

// Mock data for when LinkedIn is not connected
function getMockAds() {
  const timeSeries = [];
  const now = new Date();
  for (let i = 30; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    timeSeries.push({
      date: d.toISOString().split("T")[0],
      impressions: Math.round(2800 + Math.random() * 600),
      clicks: Math.round(42 + Math.random() * 18),
      cost: parseFloat((75 + Math.random() * 30).toFixed(2)),
      conversions: Math.round(Math.random() * 4),
    });
  }
  return {
    totals: { impressions: 86000, clicks: 1100, cost: 2400, conversions: 28, ctr: 1.28 },
    timeSeries,
    campaigns: [
      { name: "Delivery Solutions - Decision Makers", impressions: 32000, clicks: 420, cost: 900, conversions: 12, ctr: 1.31 },
      { name: "Case Study Promo", impressions: 28000, clicks: 380, cost: 750, conversions: 10, ctr: 1.36 },
      { name: "Decision Makers - DK", impressions: 18000, clicks: 260, cost: 650, conversions: 6, ctr: 1.44 },
    ],
  };
}

function getMockOrganic() {
  const timeSeries = [];
  const now = new Date();
  for (let i = 30; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    timeSeries.push({
      date: d.toISOString().split("T")[0],
      impressions: Math.round(2400 + Math.random() * 800),
      clicks: Math.round(38 + Math.random() * 20),
      likes: Math.round(12 + Math.random() * 10),
      comments: Math.round(2 + Math.random() * 4),
      shares: Math.round(1 + Math.random() * 3),
    });
  }
  return {
    totals: { followers: 4800, impressions: 86000, clicks: 1200, likes: 420, comments: 86, shares: 52, engagement: 3.2 },
    timeSeries,
  };
}

export default function LinkedInPage() {
  const [range, setRange] = useState("30");
  const [ads, setAds] = useState(null);
  const [organic, setOrganic] = useState(null);
  const [isMock, setIsMock] = useState(true);
  const [loading, setLoading] = useState(true);

  const mockAds = getMockAds();
  const mockOrganic = getMockOrganic();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { startDate, endDate } = getDateRange(range);

    try {
      const res = await fetch(`/api/linkedin?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) {
        throw new Error("LinkedIn not configured");
      }
      const json = await res.json();

      if (json.ads || json.organic) {
        setAds(json.ads || null);
        setOrganic(json.organic || null);
        setIsMock(!json.ads && !json.organic);
      } else {
        setIsMock(true);
      }
    } catch (err) {
      console.warn("[LinkedIn] Falling back to mock:", err.message);
      setIsMock(true);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const a = isMock ? mockAds : (ads || mockAds);
  const o = isMock ? mockOrganic : (organic || mockOrganic);
  const showMockAds = isMock || !ads;
  const showMockOrganic = isMock || !organic;

  const cpc = a.totals.clicks ? (a.totals.cost / a.totals.clicks).toFixed(2) : null;
  const cpa = a.totals.conversions ? (a.totals.cost / a.totals.conversions).toFixed(2) : null;

  return (
    <div className="space-y-6">
      {(showMockAds || showMockOrganic) && <MockBanner />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-navy tracking-tight">LinkedIn</h2>
          <p className="text-[12px] text-gray-muted mt-0.5">Ads performance and organic page analytics</p>
        </div>
        <DateRangeSelector value={range} onChange={setRange} />
      </div>

      {/* ── Ads Section ── */}
      <div className="space-y-4">
        <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider px-1">Paid — LinkedIn Ads</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <MetricCardSkeleton key={i} />)
          ) : (
            <>
              <MetricCard title="Impressions" value={a.totals.impressions} />
              <MetricCard title="Clicks" value={a.totals.clicks} />
              <MetricCard title="CTR" value={a.totals.ctr} format="percent" />
              <MetricCard title="Cost" value={a.totals.cost} format="currency" />
              <MetricCard title="Conversions" value={a.totals.conversions} />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => <MetricCardSkeleton key={i} />)
          ) : (
            <>
              <MetricCard title="Cost / Click" value={cpc} format="currency" subtitle="avg CPC" />
              <MetricCard title="Cost / Conversion" value={cpa} format="currency" subtitle="avg CPA" />
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
              <ChartCard title="Ad Clicks & Impressions">
                <LineChart
                  data={a.timeSeries}
                  lines={[
                    { dataKey: "clicks", name: "Clicks" },
                    { dataKey: "impressions", name: "Impressions" },
                  ]}
                />
              </ChartCard>
              <ChartCard title="Daily Ad Spend">
                <LineChart
                  data={a.timeSeries}
                  lines={[{ dataKey: "cost", name: "Cost ($)" }]}
                />
              </ChartCard>
            </>
          )}
        </div>

        {/* Campaign table */}
        {!loading && a.campaigns?.length > 0 && (
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
                  {a.campaigns.map((c) => (
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

      {/* ── Organic Section ── */}
      <div className="space-y-4 pt-2">
        <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider px-1">Organic — Company Page</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)
          ) : (
            <>
              <MetricCard title="Followers" value={o.totals.followers} />
              <MetricCard title="Impressions" value={o.totals.impressions} />
              <MetricCard title="Engagement" value={o.totals.engagement} format="percent" />
              <MetricCard title="Clicks" value={o.totals.clicks} />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <MetricCardSkeleton key={i} />)
          ) : (
            <>
              <MetricCard title="Likes" value={o.totals.likes} />
              <MetricCard title="Comments" value={o.totals.comments} />
              <MetricCard title="Shares" value={o.totals.shares} />
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
              <ChartCard title="Organic Impressions & Clicks">
                <LineChart
                  data={o.timeSeries}
                  lines={[
                    { dataKey: "impressions", name: "Impressions" },
                    { dataKey: "clicks", name: "Clicks" },
                  ]}
                />
              </ChartCard>
              <ChartCard title="Engagement (Likes, Comments, Shares)">
                <LineChart
                  data={o.timeSeries}
                  lines={[
                    { dataKey: "likes", name: "Likes" },
                    { dataKey: "comments", name: "Comments" },
                    { dataKey: "shares", name: "Shares" },
                  ]}
                />
              </ChartCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
