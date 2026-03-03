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

function truncate(text, max = 80) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + "…" : text;
}

function formatDate(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function LinkedInPage() {
  const [range, setRange] = useState("30");
  const [data, setData] = useState(null);
  const [noData, setNoData] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { startDate, endDate } = getDateRange(range);

    try {
      const res = await fetch(`/api/linkedin?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) throw new Error("LinkedIn data not available");
      const json = await res.json();

      if (json.paid || json.organic || json.organicPosts) {
        setData(json);
        setNoData(false);
      } else {
        setNoData(true);
      }
    } catch (err) {
      console.warn("[LinkedIn]", err.message);
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
  const organicPosts = data?.organicPosts;
  const followers = data?.followers;

  return (
    <div className="space-y-6">
      {noData && !loading && <MockBanner message="LinkedIn — not connected" />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-navy tracking-tight">LinkedIn</h2>
          <p className="text-[12px] text-gray-muted mt-0.5">Paid and organic traffic from LinkedIn</p>
        </div>
        <DateRangeSelector value={range} onChange={setRange} />
      </div>

      {noData && !loading && (
        <div className="rounded-2xl border border-border bg-blue-sky/30 p-12 text-center">
          <p className="text-[13px] text-gray-muted">No LinkedIn data available for this period</p>
        </div>
      )}

      {/* ── Followers ── */}
      {!loading && followers && (
        <div className="space-y-4">
          <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider px-1">Followers</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard title="Total Followers" value={followers.total} />
            <MetricCard title="Organic Followers" value={followers.organic} />
            <MetricCard title="Paid Followers" value={followers.paid} />
          </div>
        </div>
      )}

      {/* ── Paid Section ── */}
      {paid && (
        <div className="space-y-4">
          <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider px-1">Paid — LinkedIn Ads</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)
            ) : (
              <>
                <MetricCard title="Sessions" value={paid.totals.sessions} />
                <MetricCard title="Users" value={paid.totals.users} />
                <MetricCard title="Conversions" value={paid.totals.conversions} />
                <MetricCard
                  title="Conv. Rate"
                  value={paid.totals.sessions > 0 ? parseFloat(((paid.totals.conversions / paid.totals.sessions) * 100).toFixed(1)) : 0}
                  format="percent"
                />
              </>
            )}
          </div>

          {/* Native ad metrics — only when LinkedIn API provides them */}
          {!loading && paid.totals.spend != null && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard title="Impressions" value={paid.totals.impressions} />
              <MetricCard title="Spend" value={paid.totals.spend} format="currency" />
              <MetricCard title="CPC" value={paid.totals.cpc} format="currency" />
              <MetricCard title="CTR" value={paid.totals.ctr} format="percent" />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {loading ? (
              <>
                <ChartSkeleton />
                <ChartSkeleton />
              </>
            ) : (
              <>
                <ChartCard title="Paid Sessions & Users">
                  <LineChart
                    data={paid.timeSeries}
                    lines={[
                      { dataKey: "sessions", name: "Sessions" },
                      { dataKey: "users", name: "Users" },
                    ]}
                  />
                </ChartCard>
                <ChartCard title="Paid Conversions">
                  <LineChart
                    data={paid.timeSeries}
                    lines={[{ dataKey: "conversions", name: "Conversions" }]}
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
                      <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Sessions</th>
                      <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Users</th>
                      <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Conversions</th>
                      <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Conv. Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paid.campaigns.map((c) => (
                      <tr key={c.name} className="border-b border-border/50 hover:bg-blue-sky/30 transition-colors duration-150">
                        <td className="px-6 py-3 font-medium text-navy/80">{c.name}</td>
                        <td className="px-6 py-3 text-right text-gray-muted">{(c.sessions || 0).toLocaleString()}</td>
                        <td className="px-6 py-3 text-right text-gray-muted">{(c.users || 0).toLocaleString()}</td>
                        <td className="px-6 py-3 text-right text-gray-muted">{c.conversions}</td>
                        <td className="px-6 py-3 text-right text-gray-muted">
                          {c.sessions > 0 ? ((c.conversions / c.sessions) * 100).toFixed(1) : c.ctr || 0}%
                        </td>
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
          <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider px-1">Organic — LinkedIn Traffic</h3>

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => <MetricCardSkeleton key={i} />)
            ) : (
              <>
                <MetricCard title="Conversions" value={organic.totals.conversions} />
                <MetricCard title="Avg Duration" value={`${organic.totals.avgDuration}s`} />
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

      {/* ── Landing Pages ── */}
      {!loading && pages.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider">Top Landing Pages from LinkedIn</h3>
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

      {/* ── Organic Posts ── */}
      {!loading && organicPosts && (
        <div className="space-y-4 pt-2">
          <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider px-1">Organic Posts</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard title="Impressions" value={organicPosts.totals.impressions} />
            <MetricCard title="Reactions" value={organicPosts.totals.reactions} />
            <MetricCard title="Comments" value={organicPosts.totals.comments} />
            <MetricCard title="Shares" value={organicPosts.totals.shares} />
            <MetricCard title="Engagement" value={organicPosts.totals.engagement} format="percent" />
          </div>

          {organicPosts.posts?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider px-1">Recent Posts</h3>
              {organicPosts.posts.map((post) => (
                <div key={post.id} className="bg-surface rounded-2xl border border-border p-5 hover:shadow-[0_4px_24px_var(--hover-glow,rgba(43,124,233,0.08))] hover:border-blue/20 transition-all duration-300">
                  <div className="flex gap-4">
                    {/* Preview thumbnail */}
                    {post.preview?.imageUrl && (
                      <div className="flex-shrink-0">
                        <img
                          src={post.preview.imageUrl}
                          alt=""
                          className="w-20 h-20 rounded-lg object-cover bg-blue-sky/40"
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                      </div>
                    )}
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[13px] text-navy/80 leading-relaxed" title={post.text}>
                          {truncate(post.text, 150)}
                        </p>
                        <span className="text-[11px] text-gray-muted whitespace-nowrap flex-shrink-0">{formatDate(post.publishedAt)}</span>
                      </div>
                      {/* Article link preview */}
                      {post.preview?.title && post.preview?.url && (
                        <a href={post.preview.url} target="_blank" rel="noopener noreferrer" className="inline-block mt-1.5 text-[11px] text-blue-mid hover:underline truncate max-w-md">
                          {post.preview.title}
                        </a>
                      )}
                      {/* Metrics row */}
                      <div className="flex items-center gap-5 mt-3 text-[12px] text-gray-muted">
                        <span>{post.impressions.toLocaleString()} impressions</span>
                        <span>{post.reactions.toLocaleString()} reactions</span>
                        <span>{post.comments.toLocaleString()} comments</span>
                        <span>{post.shares.toLocaleString()} shares</span>
                        {post.clicks > 0 && <span>{post.clicks.toLocaleString()} clicks</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </div>
      )}
    </div>
  );
}
