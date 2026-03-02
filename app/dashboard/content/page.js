"use client";

import { useState, useEffect, useCallback } from "react";
import MetricCard from "@/components/dashboard/metric-card";
import ChartCard from "@/components/dashboard/chart-card";
import DateRangeSelector from "@/components/dashboard/date-range-selector";
import { MetricCardSkeleton, ChartSkeleton } from "@/components/dashboard/loading-skeleton";
import LineChart from "@/components/charts/line-chart";
import DonutChart from "@/components/charts/donut-chart";
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

export default function ContentPage() {
  const [range, setRange] = useState("30");
  const [customRange, setCustomRange] = useState(null);
  const [gsc, setGsc] = useState(null);
  const [noData, setNoData] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const { startDate, endDate } =
      range === "custom" && customRange ? customRange : getDateRange(range);

    try {
      const res = await fetch(`/api/search-console?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) throw new Error("Search Console not configured");
      const json = await res.json();
      if (json.totals) {
        setGsc(json);
        setNoData(false);
      } else {
        setNoData(true);
      }
    } catch (err) {
      console.warn("[Search Console]", err.message);
      setNoData(true);
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

  const t = gsc?.totals;

  return (
    <div className="space-y-6">
      {noData && !loading && <MockBanner message="Search Console — not connected" />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-navy tracking-tight">Content & SEO</h2>
          <p className="text-[12px] text-gray-muted mt-0.5">Search Console, landing pages, and organic performance</p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeSelector
            value={range}
            onChange={setRange}
            customRange={customRange}
            onCustomRangeChange={handleCustomRange}
          />
        </div>
      </div>

      {noData && !loading && (
        <div className="rounded-2xl border border-border bg-blue-sky/30 p-12 text-center">
          <p className="text-[13px] text-gray-muted">No Search Console data available for this period</p>
        </div>
      )}

      {loading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)}
          </div>
          <ChartSkeleton />
        </>
      )}

      {gsc && !loading && (
        <>
          {/* Search Console KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="Organic Clicks" value={t.clicks} />
            <MetricCard title="Impressions" value={t.impressions} />
            <MetricCard title="Avg CTR" value={t.ctr} format="percent" />
            <MetricCard title="Avg Position" value={t.position} format="decimal" />
          </div>

          {/* Clicks & Impressions over time */}
          <ChartCard title="Organic Clicks & Impressions Over Time">
            <LineChart
              data={gsc.timeSeries}
              lines={[
                { dataKey: "clicks", name: "Clicks" },
                { dataKey: "impressions", name: "Impressions" },
              ]}
            />
          </ChartCard>

          {/* Device breakdown */}
          {gsc.devices?.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <ChartCard title="Clicks by Device">
                <DonutChart data={gsc.devices} dataKey="clicks" nameKey="device" />
              </ChartCard>
              <ChartCard title="Impressions by Device">
                <DonutChart data={gsc.devices} dataKey="impressions" nameKey="device" />
              </ChartCard>
            </div>
          )}

          {/* Search queries table */}
          {gsc.queries?.length > 0 && (
            <div className="bg-surface rounded-2xl border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider">Search Queries</h3>
                <p className="text-[11px] text-gray-brand mt-0.5">Google Search Console — queries driving organic traffic</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border bg-blue-sky/40">
                      <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Query</th>
                      <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Impressions</th>
                      <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Clicks</th>
                      <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">CTR</th>
                      <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Avg Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gsc.queries.map((q) => (
                      <tr key={q.query} className="border-b border-border/50 hover:bg-blue-sky/30 transition-colors duration-150">
                        <td className="px-6 py-3 font-medium text-navy/80">{q.query}</td>
                        <td className="px-6 py-3 text-right text-gray-muted">{q.impressions.toLocaleString()}</td>
                        <td className="px-6 py-3 text-right text-gray-muted">{q.clicks.toLocaleString()}</td>
                        <td className="px-6 py-3 text-right text-gray-muted">{q.ctr}%</td>
                        <td className="px-6 py-3 text-right">
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium ${
                            q.position <= 3 ? "bg-emerald-50 text-emerald-700" : q.position <= 6 ? "bg-amber-50 text-amber-700" : "bg-blue-sky text-gray-muted"
                          }`}>
                            {q.position.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top pages */}
          {gsc.pages?.length > 0 && (
            <div className="bg-surface rounded-2xl border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider">Top Pages by Organic Traffic</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border bg-blue-sky/40">
                      <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Page</th>
                      <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Clicks</th>
                      <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Impressions</th>
                      <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">CTR</th>
                      <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Avg Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gsc.pages.map((p) => (
                      <tr key={p.page} className="border-b border-border/50 hover:bg-blue-sky/30 transition-colors duration-150">
                        <td className="px-6 py-3 font-mono text-xs text-navy/80">{p.page}</td>
                        <td className="px-6 py-3 text-right text-gray-muted">{p.clicks.toLocaleString()}</td>
                        <td className="px-6 py-3 text-right text-gray-muted">{p.impressions.toLocaleString()}</td>
                        <td className="px-6 py-3 text-right text-gray-muted">{p.ctr}%</td>
                        <td className="px-6 py-3 text-right">
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium ${
                            p.position <= 3 ? "bg-emerald-50 text-emerald-700" : p.position <= 6 ? "bg-amber-50 text-amber-700" : "bg-blue-sky text-gray-muted"
                          }`}>
                            {p.position.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Countries */}
          {gsc.countries?.length > 0 && (
            <div className="bg-surface rounded-2xl border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider">Top Countries by Organic Search</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border bg-blue-sky/40">
                      <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Country</th>
                      <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Clicks</th>
                      <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Impressions</th>
                      <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">CTR</th>
                      <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Avg Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gsc.countries.map((c) => (
                      <tr key={c.country} className="border-b border-border/50 hover:bg-blue-sky/30 transition-colors duration-150">
                        <td className="px-6 py-3 font-medium text-navy/80">{c.country}</td>
                        <td className="px-6 py-3 text-right text-gray-muted">{c.clicks.toLocaleString()}</td>
                        <td className="px-6 py-3 text-right text-gray-muted">{c.impressions.toLocaleString()}</td>
                        <td className="px-6 py-3 text-right text-gray-muted">{c.ctr}%</td>
                        <td className="px-6 py-3 text-right">
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium ${
                            c.position <= 3 ? "bg-emerald-50 text-emerald-700" : c.position <= 6 ? "bg-amber-50 text-amber-700" : "bg-blue-sky text-gray-muted"
                          }`}>
                            {c.position.toFixed(1)}
                          </span>
                        </td>
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
