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

export default function AnalyticsPage() {
  const [range, setRange] = useState("30");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { startDate, endDate } = getDateRange(range);

    try {
      const res = await fetch(`/api/analytics?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) throw new Error("Failed to fetch analytics data");
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
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700 font-medium">Error loading analytics</p>
        <p className="text-red-500 text-sm mt-1">{error}</p>
        <button
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Google Analytics</h2>
        <DateRangeSelector value={range} onChange={setRange} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)
        ) : (
          <>
            <MetricCard title="Sessions" value={data?.totals?.sessions} />
            <MetricCard title="Users" value={data?.totals?.users} />
            <MetricCard title="Page Views" value={data?.totals?.pageViews} />
            <MetricCard title="Bounce Rate" value={data?.totals?.bounceRate} format="percent" />
          </>
        )}
      </div>

      {/* Charts */}
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
            <ChartCard title="Page Views Over Time">
              <LineChart
                data={data?.timeSeries ?? []}
                lines={[{ dataKey: "pageViews", name: "Page Views" }]}
              />
            </ChartCard>
            <ChartCard title="Sessions by Channel">
              <BarChart
                data={data?.channels ?? []}
                bars={[{ dataKey: "sessions", name: "Sessions" }]}
                xKey="channel"
              />
            </ChartCard>
          </>
        )}
      </div>

      {/* Traffic Sources */}
      {!loading && data?.channels?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Traffic by Channel</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Channel</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Sessions</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Users</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Conversions</th>
                </tr>
              </thead>
              <tbody>
                {data.channels.map((c) => (
                  <tr key={c.channel} className="border-b border-gray-50 hover:bg-gray-50">
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

      {/* Source / Medium */}
      {!loading && data?.sources?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Top Sources / Medium</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Source</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Medium</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Sessions</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Users</th>
                </tr>
              </thead>
              <tbody>
                {data.sources.map((s) => (
                  <tr key={`${s.source}-${s.medium}`} className="border-b border-gray-50 hover:bg-gray-50">
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
    </div>
  );
}
