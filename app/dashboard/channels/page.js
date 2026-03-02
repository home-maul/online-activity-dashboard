"use client";

import { useState, useEffect, useCallback } from "react";
import MetricCard from "@/components/dashboard/metric-card";
import ChartCard from "@/components/dashboard/chart-card";
import DateRangeSelector from "@/components/dashboard/date-range-selector";
import { MetricCardSkeleton, ChartSkeleton } from "@/components/dashboard/loading-skeleton";
import LineChart from "@/components/charts/line-chart";
import DonutChart from "@/components/charts/donut-chart";
import ChannelBar from "@/components/charts/channel-bar";
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

export default function ChannelsPage() {
  const [range, setRange] = useState("30");
  const [data, setData] = useState(null);
  const [noData, setNoData] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { startDate, endDate } = getDateRange(range);

    try {
      const res = await fetch(`/api/channels?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) throw new Error("Channels data not available");
      const json = await res.json();

      if (json.channels?.length > 0) {
        setData(json);
        setNoData(false);
      } else {
        setNoData(true);
      }
    } catch (err) {
      console.warn("[Channels]", err.message);
      setNoData(true);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const t = data?.totals;

  return (
    <div className="space-y-6">
      {noData && !loading && <MockBanner message="Channels — not connected" />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-navy tracking-tight">Channels</h2>
          <p className="text-[12px] text-gray-muted mt-0.5">Cross-platform performance overview</p>
        </div>
        <DateRangeSelector value={range} onChange={setRange} />
      </div>

      {noData && !loading && (
        <div className="rounded-2xl border border-border bg-blue-sky/30 p-12 text-center">
          <p className="text-[13px] text-gray-muted">No channel data available for this period</p>
        </div>
      )}

      {loading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => <MetricCardSkeleton key={i} />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2"><ChartSkeleton /></div>
            <ChartSkeleton />
          </div>
        </>
      )}

      {data && !loading && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard title="Sessions" value={t.sessions} change={t.change?.sessions} />
            <MetricCard title="Users" value={t.users} change={t.change?.users} />
            <MetricCard title="Conversions" value={t.conversions} change={t.change?.conversions} />
            <MetricCard title="Conv. Rate" value={t.convRate} format="percent" />
            <MetricCard title="Ad Cost" value={t.adCost} format="currency" change={t.change?.adCost} invertChange />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <ChartCard title="Sessions by Channel Over Time" className="lg:col-span-2">
              <LineChart
                data={data.timeSeries}
                lines={[
                  { dataKey: "totalSessions", name: "Sessions" },
                  ...data.topChannels.map((ch) => ({ dataKey: ch, name: ch })),
                ]}
              />
            </ChartCard>
            <ChartCard title="Sessions by Channel">
              <DonutChart
                data={data.channelMix}
                dataKey="sessions"
                nameKey="name"
              />
            </ChartCard>
          </div>

          {/* Channel bars */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard title="Sessions by Channel">
              <ChannelBar data={data.channels} valueKey="sessions" />
            </ChartCard>
            <ChartCard title="Conversions by Channel">
              <ChannelBar data={data.channels} valueKey="conversions" />
            </ChartCard>
          </div>

          {/* Channel table */}
          <div className="bg-surface rounded-2xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider">Channel Performance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border bg-blue-sky/40">
                    <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Channel</th>
                    <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Sessions</th>
                    <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Users</th>
                    <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Conversions</th>
                    <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Conv. Rate</th>
                    <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Engagement</th>
                    <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Bounce Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.channels.map((c) => (
                    <tr key={c.channel} className="border-b border-border/50 hover:bg-blue-sky/30 transition-colors duration-150">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                          <span className="font-medium text-navy/80">{c.channel}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right text-gray-muted">{(c.sessions || 0).toLocaleString()}</td>
                      <td className="px-6 py-3 text-right text-gray-muted">{(c.users || 0).toLocaleString()}</td>
                      <td className="px-6 py-3 text-right font-medium text-navy/80">{c.conversions || 0}</td>
                      <td className="px-6 py-3 text-right text-gray-muted">{c.convRate || 0}%</td>
                      <td className="px-6 py-3 text-right text-gray-muted">{c.engagementRate || 0}%</td>
                      <td className="px-6 py-3 text-right text-gray-muted">{c.bounceRate || 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sources table */}
          {data.sources?.length > 0 && (
            <div className="bg-surface rounded-2xl border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider">Top Sources</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border bg-blue-sky/40">
                      <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Source</th>
                      <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Channel</th>
                      <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Sessions</th>
                      <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Users</th>
                      <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Conversions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sources.map((s, i) => (
                      <tr key={`${s.source}-${s.channel}-${i}`} className="border-b border-border/50 hover:bg-blue-sky/30 transition-colors duration-150">
                        <td className="px-6 py-3 font-medium text-navy/80">{s.source}</td>
                        <td className="px-6 py-3 text-gray-muted text-[12px]">{s.channel}</td>
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
        </>
      )}
    </div>
  );
}
