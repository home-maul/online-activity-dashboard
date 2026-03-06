"use client";

import { useState, useEffect, useCallback } from "react";
import MetricCard from "@/components/dashboard/metric-card";
import ChartCard from "@/components/dashboard/chart-card";
import DateRangeSelector from "@/components/dashboard/date-range-selector";
import { MetricCardSkeleton, ChartSkeleton } from "@/components/dashboard/loading-skeleton";
import LineChart from "@/components/charts/line-chart";
import BarChart from "@/components/charts/bar-chart";
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

function formatDuration(seconds) {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatWatchTime(minutes) {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours < 24) return `${hours}h ${mins}m`;
  const days = Math.floor(hours / 24);
  const remainHours = hours % 24;
  return `${days}d ${remainHours}h`;
}

export default function YouTubePage() {
  const [range, setRange] = useState("30");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { startDate, endDate } = getDateRange(range);

    try {
      const res = await fetch(`/api/youtube?startDate=${startDate}&endDate=${endDate}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to load YouTube data");
        setData(null);
      } else {
        setData(json);
        setError(null);
      }
    } catch {
      setError("Failed to connect to YouTube API");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const channel = data?.channel;
  const overview = data?.overview;
  const topVideos = data?.topVideos || [];
  const trafficSources = data?.trafficSources || [];
  const timeSeries = data?.timeSeries || [];

  return (
    <div className="space-y-6">
      {error && !loading && <MockBanner message={error} />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-navy tracking-tight">YouTube</h2>
          <p className="text-[12px] text-gray-muted mt-0.5">Channel performance, top videos, and audience insights</p>
        </div>
        <DateRangeSelector value={range} onChange={setRange} />
      </div>

      {/* Channel info */}
      {!loading && channel && (
        <div className="flex items-center gap-4 bg-surface rounded-2xl border border-border p-5">
          {channel.thumbnail && (
            <img src={channel.thumbnail} alt={channel.title} className="w-14 h-14 rounded-full" />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-semibold text-navy truncate">{channel.title}</h3>
            {channel.description && (
              <p className="text-[12px] text-gray-muted mt-0.5 line-clamp-1">{channel.description}</p>
            )}
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-[16px] font-semibold text-navy">{channel.subscribers.toLocaleString()}</p>
              <p className="text-[10px] text-gray-muted uppercase tracking-wider">Subscribers</p>
            </div>
            <div>
              <p className="text-[16px] font-semibold text-navy">{channel.totalViews.toLocaleString()}</p>
              <p className="text-[10px] text-gray-muted uppercase tracking-wider">Total Views</p>
            </div>
            <div>
              <p className="text-[16px] font-semibold text-navy">{channel.videoCount.toLocaleString()}</p>
              <p className="text-[10px] text-gray-muted uppercase tracking-wider">Videos</p>
            </div>
          </div>
        </div>
      )}

      {/* Period Overview KPIs */}
      {!loading && overview && (
        <div className="space-y-4">
          <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider px-1">Period Performance</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <MetricCard title="Views" value={overview.views} />
            <MetricCard title="Watch Time" value={formatWatchTime(overview.watchTimeMinutes)} />
            <MetricCard title="Avg Duration" value={formatDuration(overview.avgViewDuration)} />
            <MetricCard title="Likes" value={overview.likes} />
            <MetricCard title="Comments" value={overview.comments} />
            <MetricCard title="New Subscribers" value={overview.subscribersGained - overview.subscribersLost} />
          </div>
        </div>
      )}

      {/* Charts */}
      {!loading && timeSeries.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartCard title="Daily Views">
            <LineChart
              data={timeSeries}
              lines={[{ dataKey: "views", name: "Views" }]}
            />
          </ChartCard>
          <ChartCard title="Watch Time & Engagement">
            <LineChart
              data={timeSeries}
              lines={[
                { dataKey: "watchTimeMinutes", name: "Watch Time (min)" },
                { dataKey: "likes", name: "Likes" },
              ]}
            />
          </ChartCard>
        </div>
      )}

      {/* Traffic Sources */}
      {!loading && trafficSources.length > 0 && (
        <ChartCard title="Traffic Sources">
          <BarChart
            data={trafficSources.slice(0, 10).map((s) => ({ name: s.source, views: s.views }))}
            bars={[{ dataKey: "views", name: "Views" }]}
          />
        </ChartCard>
      )}

      {/* Top Videos */}
      {!loading && topVideos.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider px-1">
            Top Videos ({topVideos.length})
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {topVideos.map((video) => (
              <a
                key={video.videoId}
                href={`https://www.youtube.com/watch?v=${video.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-surface rounded-2xl border border-border overflow-hidden hover:shadow-[0_4px_24px_var(--hover-glow,rgba(43,124,233,0.08))] hover:border-blue/20 transition-all duration-300 group"
              >
                {/* Thumbnail */}
                {video.thumbnail && (
                  <div className="relative w-full h-44 bg-blue-sky/40">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      onError={(e) => { e.target.parentElement.style.display = "none"; }}
                    />
                    {/* Duration overlay */}
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[11px] font-medium px-1.5 py-0.5 rounded">
                      {formatDuration(video.avgViewDuration)} avg
                    </div>
                  </div>
                )}
                <div className="p-5">
                  <h4 className="text-[13px] font-semibold text-navy mb-1 line-clamp-2 group-hover:text-blue-mid transition-colors">{video.title}</h4>
                  {video.publishedAt && (
                    <p className="text-[11px] text-gray-muted mb-3">
                      {new Date(video.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  )}
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/50">
                    <div>
                      <p className="text-[10px] text-gray-muted uppercase tracking-wider">Views</p>
                      <p className="text-[14px] font-semibold text-navy">{video.views.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-muted uppercase tracking-wider">Watch Time</p>
                      <p className="text-[14px] font-semibold text-navy">{formatWatchTime(video.watchTimeMinutes)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-muted uppercase tracking-wider">Likes</p>
                      <p className="text-[14px] font-semibold text-navy">{video.likes.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <MetricCardSkeleton key={i} />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && !overview && (
        <div className="rounded-2xl border border-border bg-blue-sky/30 p-12 text-center">
          <p className="text-[13px] text-gray-muted">No YouTube data available for this period</p>
        </div>
      )}
    </div>
  );
}
