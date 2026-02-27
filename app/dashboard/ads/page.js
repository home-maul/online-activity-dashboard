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

export default function AdsPage() {
  const [range, setRange] = useState("30");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { startDate, endDate } = getDateRange(range);

    try {
      const res = await fetch(`/api/ads?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) throw new Error("Failed to fetch ads data");
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
        <p className="text-red-700 font-medium">Error loading ads data</p>
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
        <h2 className="text-xl font-semibold text-gray-900">Google Ads</h2>
        <DateRangeSelector value={range} onChange={setRange} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <MetricCardSkeleton key={i} />)
        ) : (
          <>
            <MetricCard title="Impressions" value={data?.totals?.impressions} />
            <MetricCard title="Clicks" value={data?.totals?.clicks} />
            <MetricCard title="CTR" value={data?.totals?.ctr} format="percent" />
            <MetricCard title="Cost" value={data?.totals?.cost} format="currency" />
            <MetricCard title="Conversions" value={data?.totals?.conversions} />
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
            <ChartCard title="Clicks & Impressions Over Time">
              <LineChart
                data={data?.timeSeries ?? []}
                lines={[
                  { dataKey: "clicks", name: "Clicks" },
                  { dataKey: "impressions", name: "Impressions" },
                ]}
              />
            </ChartCard>
            <ChartCard title="Daily Ad Spend">
              <LineChart
                data={data?.timeSeries ?? []}
                lines={[{ dataKey: "cost", name: "Cost ($)" }]}
              />
            </ChartCard>
          </>
        )}
      </div>

      {/* Campaign table */}
      {!loading && data?.campaigns?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Campaigns</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Campaign</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Impressions</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Clicks</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">CTR</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Cost</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Conversions</th>
                </tr>
              </thead>
              <tbody>
                {data.campaigns.map((c) => (
                  <tr key={c.name} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-6 py-3 text-right text-gray-600">{c.impressions.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right text-gray-600">{c.clicks.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right text-gray-600">{c.ctr}%</td>
                    <td className="px-6 py-3 text-right text-gray-600">${c.cost.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right text-gray-600">{c.conversions}</td>
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
