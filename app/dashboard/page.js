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

export default function DashboardOverview() {
  const [range, setRange] = useState("30");
  const [analytics, setAnalytics] = useState(null);
  const [ads, setAds] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { startDate, endDate } = getDateRange(range);
    const params = `startDate=${startDate}&endDate=${endDate}`;

    try {
      const analyticsRes = await fetch(`/api/analytics?${params}`);
      if (!analyticsRes.ok) throw new Error("Failed to fetch analytics data");
      setAnalytics(await analyticsRes.json());

      // Ads is optional — may fail if developer token is not configured
      try {
        const adsRes = await fetch(`/api/ads?${params}`);
        if (adsRes.ok) setAds(await adsRes.json());
      } catch {}
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
        <p className="text-red-700 font-medium">Error loading data</p>
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
        <h2 className="text-xl font-semibold text-gray-900">Overview</h2>
        <DateRangeSelector value={range} onChange={setRange} />
      </div>

      {/* Analytics KPIs */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3">Google Analytics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)
          ) : (
            <>
              <MetricCard title="Sessions" value={analytics?.totals?.sessions} />
              <MetricCard title="Users" value={analytics?.totals?.users} />
              <MetricCard title="Page Views" value={analytics?.totals?.pageViews} />
              <MetricCard title="Bounce Rate" value={analytics?.totals?.bounceRate} format="percent" />
            </>
          )}
        </div>
      </div>

      {/* Ads KPIs */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3">Google Ads</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)
          ) : (
            <>
              <MetricCard title="Impressions" value={ads?.totals?.impressions} />
              <MetricCard title="Clicks" value={ads?.totals?.clicks} />
              <MetricCard title="Cost" value={ads?.totals?.cost} format="currency" />
              <MetricCard title="Conversions" value={ads?.totals?.conversions} />
            </>
          )}
        </div>
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
            <ChartCard title="Sessions & Users Over Time">
              <LineChart
                data={analytics?.timeSeries ?? []}
                lines={[
                  { dataKey: "sessions", name: "Sessions" },
                  { dataKey: "users", name: "Users" },
                ]}
              />
            </ChartCard>
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
    </div>
  );
}
