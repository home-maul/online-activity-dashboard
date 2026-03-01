"use client";

import { useState } from "react";
import MetricCard from "@/components/dashboard/metric-card";
import ChartCard from "@/components/dashboard/chart-card";
import LineChart from "@/components/charts/line-chart";
import DonutChart from "@/components/charts/donut-chart";
import ChannelBar from "@/components/charts/channel-bar";
import { getChannelsOverview } from "@/lib/mock-data";

export default function ChannelsPage() {
  const [period] = useState("30d");
  const data = getChannelsOverview();
  const t = data.totals;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-navy tracking-tight">Channels</h2>
          <p className="text-[12px] text-gray-muted mt-0.5">Cross-platform performance overview</p>
        </div>
        <span className="text-[11px] text-gray-brand px-3 py-1.5 bg-surface rounded-lg border border-border">
          Mock data — connect APIs to go live
        </span>
      </div>

      {/* Top-level KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard title="Total Spend" value={t.spend} format="currency" change={t.spendChange} invertChange />
        <MetricCard title="Total Leads" value={t.leads} change={t.leadsChange} />
        <MetricCard title="Cost / Lead" value={t.costPerLead} format="currency" change={t.costPerLeadChange} invertChange />
        <MetricCard title="Pipeline Value" value={t.pipeline} format="currency" change={t.pipelineChange} />
        <MetricCard title="ROAS" value={t.roas} format="decimal" change={t.roasChange} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ChartCard title="Spend vs Leads Over Time" className="lg:col-span-2">
          <LineChart
            data={data.timeSeries}
            lines={[
              { dataKey: "totalSpend", name: "Spend ($)" },
              { dataKey: "totalLeads", name: "Leads" },
            ]}
          />
        </ChartCard>
        <ChartCard title="Lead Share by Channel">
          <DonutChart
            data={data.channelMix}
            dataKey="leads"
            nameKey="name"
          />
        </ChartCard>
      </div>

      {/* Channel bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Spend by Channel">
          <ChannelBar data={data.channels} valueKey="spend" format="currency" />
        </ChartCard>
        <ChartCard title="Leads by Channel">
          <ChannelBar data={data.channels} valueKey="leads" />
        </ChartCard>
      </div>

      {/* Channel comparison table */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider">Channel Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-blue-sky/40">
                <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Channel</th>
                <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Spend</th>
                <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Impressions</th>
                <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Clicks</th>
                <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Leads</th>
                <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Qualified</th>
                <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Customers</th>
                <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Cost/Lead</th>
                <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">ROAS</th>
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
                  <td className="px-6 py-3 text-right text-gray-muted">{c.spend ? `$${c.spend.toLocaleString()}` : "—"}</td>
                  <td className="px-6 py-3 text-right text-gray-muted">{c.impressions.toLocaleString()}</td>
                  <td className="px-6 py-3 text-right text-gray-muted">{c.clicks.toLocaleString()}</td>
                  <td className="px-6 py-3 text-right text-navy/80 font-medium">{c.leads}</td>
                  <td className="px-6 py-3 text-right text-navy/80 font-medium">{c.qualified}</td>
                  <td className="px-6 py-3 text-right text-navy/80 font-medium">{c.customers}</td>
                  <td className="px-6 py-3 text-right text-gray-muted">{c.costPerLead ? `$${c.costPerLead.toFixed(2)}` : "—"}</td>
                  <td className="px-6 py-3 text-right text-gray-muted">{c.roas ? `${c.roas}x` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
