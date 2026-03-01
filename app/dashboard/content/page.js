"use client";

import ChartCard from "@/components/dashboard/chart-card";
import LineChart from "@/components/charts/line-chart";
import BarChart from "@/components/charts/bar-chart";
import { getContentData } from "@/lib/mock-data";

function formatDuration(seconds) {
  if (!seconds) return "0s";
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

export default function ContentPage() {
  const data = getContentData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-navy tracking-tight">Content & Organic</h2>
          <p className="text-[12px] text-gray-muted mt-0.5">SEO, landing pages, and organic social performance</p>
        </div>
        <span className="text-[11px] text-gray-brand px-3 py-1.5 bg-surface rounded-lg border border-border">
          Mock data
        </span>
      </div>

      {/* Organic vs Paid */}
      <ChartCard title="Organic vs Paid Sessions">
        <LineChart
          data={data.organicVsPaid}
          lines={[
            { dataKey: "organic", name: "Organic" },
            { dataKey: "paid", name: "Paid" },
          ]}
        />
      </ChartCard>

      {/* Landing pages table */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider">Landing Pages by Lead Conversion</h3>
          <p className="text-[11px] text-gray-brand mt-0.5">Which pages turn visitors into leads?</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-blue-sky/40">
                <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Page</th>
                <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Sessions</th>
                <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Leads</th>
                <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">CVR</th>
                <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Avg Time</th>
                <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Bounce</th>
              </tr>
            </thead>
            <tbody>
              {data.landingPages.map((p) => (
                <tr key={p.page} className="border-b border-border/50 hover:bg-blue-sky/30 transition-colors duration-150">
                  <td className="px-6 py-3 font-mono text-xs text-navy/80">{p.page}</td>
                  <td className="px-6 py-3 text-right text-gray-muted">{p.sessions.toLocaleString()}</td>
                  <td className="px-6 py-3 text-right font-medium text-navy/80">{p.leads}</td>
                  <td className="px-6 py-3 text-right">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium ${
                      p.conversionRate >= 2.5 ? "bg-emerald-50 text-emerald-700" : p.conversionRate >= 1.5 ? "bg-amber-50 text-amber-700" : "bg-blue-sky text-gray-muted"
                    }`}>
                      {p.conversionRate}%
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right text-gray-muted">{formatDuration(p.avgTime)}</td>
                  <td className="px-6 py-3 text-right text-gray-muted">{p.bounceRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Search queries */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider">Search Queries</h3>
          <p className="text-[11px] text-gray-brand mt-0.5">Google Search Console — queries driving traffic and leads</p>
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
                <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Leads</th>
              </tr>
            </thead>
            <tbody>
              {data.searchQueries.map((q) => (
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
                  <td className="px-6 py-3 text-right font-medium text-navy/80">{q.leads}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Organic social */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider">Organic Social</h3>
          <p className="text-[11px] text-gray-brand mt-0.5">Unpaid social media performance</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-blue-sky/40">
                <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Platform</th>
                <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Followers</th>
                <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Impressions</th>
                <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Engagement</th>
                <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Clicks</th>
                <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Leads</th>
              </tr>
            </thead>
            <tbody>
              {data.socialOrganic.map((s) => (
                <tr key={s.platform} className="border-b border-border/50 hover:bg-blue-sky/30 transition-colors duration-150">
                  <td className="px-6 py-3 font-medium text-navy/80">{s.platform}</td>
                  <td className="px-6 py-3 text-right text-gray-muted">{s.followers.toLocaleString()}</td>
                  <td className="px-6 py-3 text-right text-gray-muted">{s.impressions.toLocaleString()}</td>
                  <td className="px-6 py-3 text-right text-gray-muted">{s.engagement}%</td>
                  <td className="px-6 py-3 text-right text-gray-muted">{s.clicks.toLocaleString()}</td>
                  <td className="px-6 py-3 text-right font-medium text-navy/80">{s.leads}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
