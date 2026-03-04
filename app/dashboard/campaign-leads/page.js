"use client";

import { useState, useEffect, useCallback } from "react";
import MetricCard from "@/components/dashboard/metric-card";
import ChartCard from "@/components/dashboard/chart-card";
import DateRangeSelector from "@/components/dashboard/date-range-selector";
import { MetricCardSkeleton, ChartSkeleton } from "@/components/dashboard/loading-skeleton";
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

export default function CampaignLeadsPage() {
  const [range, setRange] = useState("90");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [platformFilter, setPlatformFilter] = useState("All");
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { startDate, endDate } = getDateRange(range);

    try {
      const res = await fetch(`/api/campaign-leads?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) {
        setData(null);
      } else {
        setData(await res.json());
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const campaigns = data?.campaigns || [];
  const platforms = data?.platforms || [];
  const pipedriveConnected = data?.pipedriveConnected;
  const hasAttribution = data?.hasAttribution;
  const summary = data?.pipelineSummary;
  const salesCycle = data?.salesCycle || [];

  const filtered = platformFilter === "All" ? campaigns : campaigns.filter((c) => c.platform === platformFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-navy tracking-tight">Campaign → Leads</h2>
          <p className="text-[12px] text-gray-muted mt-0.5">Which campaigns produce leads that close?</p>
        </div>
        <DateRangeSelector value={range} onChange={setRange} />
      </div>

      {/* Setup guide when Pipedrive not connected or no attribution */}
      {!loading && !hasAttribution && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5">
          <h4 className="text-[13px] font-semibold text-amber-800 mb-2">
            {!pipedriveConnected ? "Connect Pipedrive for Full Attribution" : "Set Up Campaign Attribution"}
          </h4>
          <p className="text-[12px] text-amber-700 leading-relaxed mb-3">
            {!pipedriveConnected
              ? "Add PIPEDRIVE_DOMAIN and PIPEDRIVE_API_TOKEN to your environment to see deal data alongside campaigns."
              : "Create custom fields in Pipedrive for UTM Source and UTM Campaign, then set PIPEDRIVE_SOURCE_FIELD and PIPEDRIVE_CAMPAIGN_FIELD in your environment."}
          </p>
          <div className="text-[11px] text-amber-600 space-y-1">
            <p>1. In Pipedrive, go to Settings → Data fields → Deal fields</p>
            <p>2. Create text fields: "UTM Source" and "UTM Campaign"</p>
            <p>3. Copy the field keys (40-char hashes) from the /api/pipedrive/fields endpoint</p>
            <p>4. Set them as PIPEDRIVE_SOURCE_FIELD and PIPEDRIVE_CAMPAIGN_FIELD</p>
          </div>
        </div>
      )}

      {/* Pipeline Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)
          ) : (
            <>
              <MetricCard title="Total Deals" value={summary.totalDeals} subtitle={`${summary.openDeals} open`} />
              <MetricCard title="Won Value" value={summary.wonValue} format="currency" subtitle={`${summary.wonDeals} deals`} />
              <MetricCard title="Win Rate" value={summary.winRate} format="percent" />
              <MetricCard title="Avg Sales Cycle" value={summary.avgSalesCycle ? `${summary.avgSalesCycle}d` : null} subtitle="days to close" />
            </>
          )}
        </div>
      )}

      {/* Platform filter */}
      {!loading && platforms.length > 1 && (
        <div className="flex gap-1 flex-wrap">
          {platforms.map((p) => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              className={`px-3 py-1.5 text-[11px] font-medium rounded-lg transition-all duration-200 ${
                platformFilter === p
                  ? "bg-navy text-white"
                  : "bg-blue-sky/60 text-gray-muted hover:text-navy"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Campaign Table */}
      {!loading && filtered.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider">
              Campaign Attribution {hasAttribution ? "" : "(GA4 only — connect Pipedrive fields for deal data)"}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border bg-blue-sky/40">
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Campaign</th>
                  <th className="text-left px-3 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Platform</th>
                  <th className="text-right px-3 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Sessions</th>
                  <th className="text-right px-3 py-3 text-[11px] font-medium text-gray-muted tracking-wide">GA4 Conv.</th>
                  {hasAttribution && (
                    <>
                      <th className="text-right px-3 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Leads</th>
                      <th className="text-right px-3 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Open</th>
                      <th className="text-right px-3 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Won</th>
                      <th className="text-right px-3 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Lost</th>
                      <th className="text-right px-3 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Win Rate</th>
                      <th className="text-right px-3 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Value</th>
                      <th className="text-right px-3 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Avg Days</th>
                      <th className="text-right px-3 py-3 text-[11px] font-medium text-gray-muted tracking-wide">Quality</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <CampaignRow
                    key={c.name}
                    campaign={c}
                    hasAttribution={hasAttribution}
                    expanded={expandedRow === c.name}
                    onToggle={() => setExpandedRow(expandedRow === c.name ? null : c.name)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sales Cycle by Source chart */}
      {!loading && salesCycle.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartCard title="Sales Cycle by Source (Avg Days)">
            <BarChart
              data={salesCycle.slice(0, 8)}
              bars={[{ dataKey: "avgDays", name: "Avg Days" }]}
              xKey="source"
            />
          </ChartCard>
          <ChartCard title="Deals Won by Source">
            <BarChart
              data={(data?.bySource || []).filter((s) => s.won > 0).slice(0, 8)}
              bars={[{ dataKey: "won", name: "Won" }, { dataKey: "lost", name: "Lost" }]}
              xKey="source"
            />
          </ChartCard>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)}
          </div>
          <ChartSkeleton />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="rounded-2xl border border-border bg-blue-sky/30 p-12 text-center">
          <p className="text-[13px] text-gray-muted">No campaign data found for this period</p>
        </div>
      )}
    </div>
  );
}

function CampaignRow({ campaign: c, hasAttribution, expanded, onToggle }) {
  const qualityColor =
    c.qualityScore >= 70 ? "text-emerald-600 bg-emerald-50" :
    c.qualityScore >= 40 ? "text-amber-600 bg-amber-50" :
    "text-rose-500 bg-rose-50";

  return (
    <>
      <tr
        className="border-b border-border/50 hover:bg-blue-sky/30 transition-colors duration-150 cursor-pointer"
        onClick={onToggle}
      >
        <td className="px-5 py-3 font-medium text-navy/80">
          <div className="flex items-center gap-2">
            {hasAttribution && (
              <svg
                className={`w-3.5 h-3.5 text-gray-muted transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
                fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            )}
            <span className="truncate max-w-[200px]" title={c.name}>{c.name}</span>
          </div>
        </td>
        <td className="px-3 py-3 text-gray-muted text-[12px]">{c.platform}</td>
        <td className="px-3 py-3 text-right text-gray-muted">{c.sessions.toLocaleString()}</td>
        <td className="px-3 py-3 text-right text-gray-muted">{c.ga4Conversions}</td>
        {hasAttribution && (
          <>
            <td className="px-3 py-3 text-right text-gray-muted">{c.pipedriveLeads || "—"}</td>
            <td className="px-3 py-3 text-right text-gray-muted">{c.open || "—"}</td>
            <td className="px-3 py-3 text-right text-emerald-600 font-medium">{c.won || "—"}</td>
            <td className="px-3 py-3 text-right text-rose-500">{c.lost || "—"}</td>
            <td className="px-3 py-3 text-right text-gray-muted">{c.winRate ? `${c.winRate}%` : "—"}</td>
            <td className="px-3 py-3 text-right text-gray-muted">{c.pipelineValue ? `$${c.pipelineValue.toLocaleString()}` : "—"}</td>
            <td className="px-3 py-3 text-right text-gray-muted">{c.avgDays ?? "—"}</td>
            <td className="px-3 py-3 text-right">
              {c.pipedriveLeads > 0 ? (
                <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-medium ${qualityColor}`}>
                  {c.qualityScore}
                </span>
              ) : (
                <span className="text-gray-muted">—</span>
              )}
            </td>
          </>
        )}
      </tr>
      {expanded && hasAttribution && c.pipedriveLeads > 0 && (
        <tr className="bg-blue-sky/20">
          <td colSpan={12} className="px-8 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[12px]">
              <div>
                <p className="text-gray-muted text-[10px] uppercase tracking-wider mb-1">Lead-to-Deal Rate</p>
                <p className="text-navy font-semibold">
                  {c.ga4Conversions > 0 ? Math.round((c.pipedriveLeads / c.ga4Conversions) * 100) : 0}%
                </p>
              </div>
              <div>
                <p className="text-gray-muted text-[10px] uppercase tracking-wider mb-1">Revenue per Lead</p>
                <p className="text-navy font-semibold">
                  {c.pipedriveLeads > 0 && c.pipelineValue > 0
                    ? `$${Math.round(c.pipelineValue / c.pipedriveLeads).toLocaleString()}`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-gray-muted text-[10px] uppercase tracking-wider mb-1">Pipeline Stage</p>
                <p className="text-navy font-semibold">
                  {c.open > 0 ? `${c.open} open` : ""}{c.open > 0 && c.won > 0 ? ", " : ""}{c.won > 0 ? `${c.won} won` : ""}{!c.open && !c.won ? "—" : ""}
                </p>
              </div>
              <div>
                <p className="text-gray-muted text-[10px] uppercase tracking-wider mb-1">Sales Velocity</p>
                <p className="text-navy font-semibold">{c.avgDays ? `${c.avgDays} days avg` : "—"}</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
