"use client";

import ChartCard from "@/components/dashboard/chart-card";
import FunnelChart from "@/components/charts/funnel-chart";
import LineChart from "@/components/charts/line-chart";
import { getFunnelData } from "@/lib/mock-data";

const CHANNEL_COLORS = {
  "Google Ads": "#070E1A",
  "Meta Ads": "#C6D2DF",
  "LinkedIn Ads": "#8896A8",
  Organic: "#59A9FF",
};

export default function FunnelPage() {
  const data = getFunnelData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-navy tracking-tight">Lead Funnel</h2>
          <p className="text-[12px] text-gray-muted mt-0.5">From impression to customer — where are leads dropping off?</p>
        </div>
        <span className="text-[11px] text-gray-brand px-3 py-1.5 bg-surface rounded-lg border border-border">
          Mock data
        </span>
      </div>

      {/* Overall funnel */}
      <ChartCard title="Overall Conversion Funnel">
        <FunnelChart stages={data.overall} rates={data.rates} />
      </ChartCard>

      {/* Leads over time */}
      <ChartCard title="Leads, Qualified & Closed Over Time">
        <LineChart
          data={data.leadTimeline}
          lines={[
            { dataKey: "leads", name: "Leads" },
            { dataKey: "qualified", name: "Qualified" },
            { dataKey: "closed", name: "Closed" },
          ]}
        />
      </ChartCard>

      {/* By channel breakdown */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider">Funnel by Channel</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-blue-sky/40">
                <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Channel</th>
                <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Impressions</th>
                <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Clicks</th>
                <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Sessions</th>
                <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Leads</th>
                <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Qualified</th>
                <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Customers</th>
                <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">QLR</th>
                <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Close Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.byChannel.map((c) => {
                const qlr = c.leads > 0 ? ((c.qualified / c.leads) * 100).toFixed(0) : 0;
                const closeRate = c.qualified > 0 ? ((c.customers / c.qualified) * 100).toFixed(0) : 0;
                return (
                  <tr key={c.channel} className="border-b border-border/50 hover:bg-blue-sky/30 transition-colors duration-150">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHANNEL_COLORS[c.channel] }} />
                        <span className="font-medium text-navy/80">{c.channel}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right text-gray-muted">{c.impressions.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right text-gray-muted">{c.clicks.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right text-gray-muted">{c.sessions.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right font-medium text-navy/80">{c.leads}</td>
                    <td className="px-6 py-3 text-right font-medium text-navy/80">{c.qualified}</td>
                    <td className="px-6 py-3 text-right font-medium text-navy/80">{c.customers}</td>
                    <td className="px-6 py-3 text-right text-gray-muted">{qlr}%</td>
                    <td className="px-6 py-3 text-right text-gray-muted">{closeRate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Channel funnel bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {data.byChannel.map((c) => {
          const stages = [
            { stage: "Clicks", value: c.clicks },
            { stage: "Sessions", value: c.sessions },
            { stage: "Leads", value: c.leads },
            { stage: "Qualified", value: c.qualified },
            { stage: "Customers", value: c.customers },
          ];
          return (
            <ChartCard key={c.channel} title={c.channel}>
              <FunnelChart stages={stages} />
            </ChartCard>
          );
        })}
      </div>
    </div>
  );
}
