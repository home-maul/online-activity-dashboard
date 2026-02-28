"use client";

import { useState, useEffect, useCallback } from "react";
import MetricCard from "@/components/dashboard/metric-card";
import ChartCard from "@/components/dashboard/chart-card";
import DateRangeSelector from "@/components/dashboard/date-range-selector";
import { MetricCardSkeleton, ChartSkeleton } from "@/components/dashboard/loading-skeleton";
import LineChart from "@/components/charts/line-chart";
import BarChart from "@/components/charts/bar-chart";
import DonutChart from "@/components/charts/donut-chart";

function getDateRange(days) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - Number(days));
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

function formatDuration(seconds) {
  if (!seconds) return "0s";
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

export default function AnalyticsPage() {
  const [range, setRange] = useState("30");
  const [customRange, setCustomRange] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { startDate, endDate } =
      range === "custom" && customRange ? customRange : getDateRange(range);

    try {
      const res = await fetch(`/api/analytics?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Failed to fetch analytics data");
      }
      setData(await res.json());
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

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700 font-medium">Error loading analytics</p>
        <p className="text-red-500 text-sm mt-1">{error}</p>
        <button
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const t = data?.totals;
  const c = t?.change;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Google Analytics</h2>
        <DateRangeSelector
          value={range}
          onChange={setRange}
          customRange={customRange}
          onCustomRangeChange={handleCustomRange}
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <MetricCardSkeleton key={i} />)
        ) : (
          <>
            <MetricCard title="Sessions" value={t?.sessions} change={c?.sessions} />
            <MetricCard title="Users" value={t?.users} change={c?.users} />
            <MetricCard title="Page Views" value={t?.pageViews} change={c?.pageViews} />
            <MetricCard title="New Users" value={t?.newUsers} change={c?.newUsers} />
            <MetricCard title="Engagement Rate" value={t?.engagementRate} format="percent" change={c?.engagementRate} />
            <MetricCard title="Bounce Rate" value={t?.bounceRate} format="percent" change={c?.bounceRate} invertChange />
            <MetricCard title="Avg Duration" value={t?.avgSessionDuration} format="duration" change={c?.avgSessionDuration} />
            <MetricCard title="Conversions" value={t?.conversions} change={c?.conversions} />
          </>
        )}
      </div>

      {/* Time series charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <ChartCard title="Sessions Over Time">
              <LineChart
                data={data?.timeSeries ?? []}
                lines={[{ dataKey: "sessions", name: "Sessions" }]}
              />
            </ChartCard>
            <ChartCard title="Users Over Time">
              <LineChart
                data={data?.timeSeries ?? []}
                lines={[{ dataKey: "users", name: "Users" }]}
              />
            </ChartCard>
          </>
        )}
      </div>

      {/* Breakdown charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {loading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <ChartCard title="Sessions by Channel">
              <BarChart
                data={data?.channels ?? []}
                bars={[{ dataKey: "sessions", name: "Sessions" }]}
                xKey="channel"
              />
            </ChartCard>
            <ChartCard title="Devices">
              <DonutChart
                data={data?.devices ?? []}
                dataKey="sessions"
                nameKey="device"
              />
            </ChartCard>
            <ChartCard title="New vs Returning">
              <DonutChart
                data={data?.userTypes ?? []}
                dataKey="users"
                nameKey="type"
              />
            </ChartCard>
          </>
        )}
      </div>

      {/* Traffic by Channel table */}
      {!loading && data?.channels?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Traffic by Channel</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Channel</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Sessions</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Users</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Conversions</th>
                </tr>
              </thead>
              <tbody>
                {data.channels.map((c) => (
                  <tr key={c.channel} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-900">{c.channel}</td>
                    <td className="px-6 py-3 text-right text-gray-600">{c.sessions.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right text-gray-600">{c.users.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right text-gray-600">{c.conversions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Source / Medium table */}
      {!loading && data?.sources?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Top Sources / Medium</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Source</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Medium</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Sessions</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Users</th>
                </tr>
              </thead>
              <tbody>
                {data.sources.map((s) => (
                  <tr key={`${s.source}-${s.medium}`} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-900">{s.source}</td>
                    <td className="px-6 py-3 text-gray-600">{s.medium}</td>
                    <td className="px-6 py-3 text-right text-gray-600">{s.sessions.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right text-gray-600">{s.users.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Pages table */}
      {!loading && data?.pages?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Top Pages</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Page</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Views</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Users</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Avg Duration</th>
                </tr>
              </thead>
              <tbody>
                {data.pages.map((p) => (
                  <tr key={p.path} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs text-gray-900">{p.path}</td>
                    <td className="px-6 py-3 text-right text-gray-600">{p.views.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right text-gray-600">{p.users.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right text-gray-600">{formatDuration(p.avgDuration)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Countries table */}
      {!loading && data?.countries?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Top Countries</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Country</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Sessions</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Users</th>
                </tr>
              </thead>
              <tbody>
                {data.countries.map((c) => (
                  <tr key={c.country} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-900">{c.country}</td>
                    <td className="px-6 py-3 text-right text-gray-600">{c.sessions.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right text-gray-600">{c.users.toLocaleString()}</td>
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
