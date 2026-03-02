"use client";

import { useState } from "react";
import ChartCard from "@/components/dashboard/chart-card";
import MockBanner from "@/components/dashboard/mock-banner";
import { getCampaigns } from "@/lib/mock-data";

const PLATFORM_COLORS = {
  "Google Ads": "#070E1A",
  "Meta Ads": "#C6D2DF",
  "LinkedIn Ads": "#8896A8",
};

function QLRBadge({ value }) {
  const bg = value >= 75 ? "bg-emerald-50 text-emerald-700" : value >= 50 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-500";
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium ${bg}`}>
      {value}%
    </span>
  );
}

function StatusDot({ status }) {
  return (
    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${status === "active" ? "bg-emerald-400" : "bg-gray-brand"}`} />
  );
}

export default function CampaignsPage() {
  const data = getCampaigns();
  const [platform, setPlatform] = useState("All");
  const [sort, setSort] = useState("spend");
  const [sortDir, setSortDir] = useState("desc");

  const filtered = platform === "All"
    ? data.campaigns
    : data.campaigns.filter((c) => c.platform === platform);

  const sorted = [...filtered].sort((a, b) => {
    const diff = a[sort] - b[sort];
    return sortDir === "desc" ? -diff : diff;
  });

  function handleSort(key) {
    if (sort === key) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSort(key);
      setSortDir("desc");
    }
  }

  const SortIcon = ({ col }) => (
    <span className="ml-1 opacity-40">{sort === col ? (sortDir === "desc" ? "↓" : "↑") : ""}</span>
  );

  // Summary by platform
  const platformSummary = data.platforms.filter((p) => p !== "All").map((p) => {
    const camps = data.campaigns.filter((c) => c.platform === p);
    return {
      platform: p,
      campaigns: camps.length,
      spend: camps.reduce((s, c) => s + c.spend, 0),
      leads: camps.reduce((s, c) => s + c.leads, 0),
      qualified: camps.reduce((s, c) => s + c.qualified, 0),
      avgQLR: camps.length ? Math.round(camps.reduce((s, c) => s + c.qualifiedRate, 0) / camps.length) : 0,
    };
  });

  return (
    <div className="space-y-6">
      <MockBanner />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-navy tracking-tight">Campaigns</h2>
          <p className="text-[12px] text-gray-muted mt-0.5">Drill into individual campaign performance</p>
        </div>
      </div>

      {/* Platform summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {platformSummary.map((p) => (
          <div key={p.platform} className="bg-surface rounded-2xl border border-border p-5 hover:shadow-[0_2px_20px_rgba(0,0,0,0.04)] transition-all duration-300">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[p.platform] }} />
              <p className="text-[13px] font-medium text-navy/80">{p.platform}</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] text-gray-muted uppercase tracking-wider">Spend</p>
                <p className="text-[15px] font-semibold text-navy mt-0.5">${p.spend.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-muted uppercase tracking-wider">Leads</p>
                <p className="text-[15px] font-semibold text-navy mt-0.5">{p.leads}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-muted uppercase tracking-wider">Avg QLR</p>
                <p className="text-[15px] font-semibold text-navy mt-0.5">{p.avgQLR}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1">
        {data.platforms.map((p) => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 ${
              platform === p
                ? "bg-navy/90 text-white shadow-sm"
                : "text-gray-muted hover:bg-black/[0.03] hover:text-navy"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Campaign table */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-blue-sky/40">
                <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Campaign</th>
                <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Platform</th>
                <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide cursor-pointer select-none" onClick={() => handleSort("spend")}>
                  Spend<SortIcon col="spend" />
                </th>
                <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide cursor-pointer select-none" onClick={() => handleSort("clicks")}>
                  Clicks<SortIcon col="clicks" />
                </th>
                <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide cursor-pointer select-none" onClick={() => handleSort("leads")}>
                  Leads<SortIcon col="leads" />
                </th>
                <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide cursor-pointer select-none" onClick={() => handleSort("costPerLead")}>
                  CPL<SortIcon col="costPerLead" />
                </th>
                <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide cursor-pointer select-none" onClick={() => handleSort("qualifiedRate")}>
                  QLR<SortIcon col="qualifiedRate" />
                </th>
                <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide cursor-pointer select-none" onClick={() => handleSort("conversionRate")}>
                  CVR<SortIcon col="conversionRate" />
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => (
                <tr key={c.name} className="border-b border-border/50 hover:bg-blue-sky/30 transition-colors duration-150">
                  <td className="px-6 py-3">
                    <div className="flex items-center">
                      <StatusDot status={c.status} />
                      <span className="font-medium text-navy/80">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[c.platform] }} />
                      <span className="text-gray-muted text-[12px]">{c.platform}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-right text-gray-muted">${c.spend.toLocaleString()}</td>
                  <td className="px-6 py-3 text-right text-gray-muted">{c.clicks.toLocaleString()}</td>
                  <td className="px-6 py-3 text-right font-medium text-navy/80">{c.leads}</td>
                  <td className="px-6 py-3 text-right text-gray-muted">${c.costPerLead.toFixed(0)}</td>
                  <td className="px-6 py-3 text-right"><QLRBadge value={c.qualifiedRate} /></td>
                  <td className="px-6 py-3 text-right text-gray-muted">{c.conversionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
