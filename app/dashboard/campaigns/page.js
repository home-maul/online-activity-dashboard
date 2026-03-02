"use client";

import { useState, useEffect, useCallback } from "react";
import DateRangeSelector from "@/components/dashboard/date-range-selector";
import MockBanner from "@/components/dashboard/mock-banner";
import { MetricCardSkeleton } from "@/components/dashboard/loading-skeleton";

const PLATFORM_COLORS = {
  "Google Ads": "#070E1A",
  "Meta Ads": "#C6D2DF",
  "Meta Organic": "#C6D2DF",
  "LinkedIn Ads": "#8896A8",
  "LinkedIn Organic": "#8896A8",
  "Reddit Ads": "#59A9FF",
  "Reddit Organic": "#59A9FF",
  "Organic Search": "#4A6FA5",
  "Referral": "#1a2540",
  "Email": "#3D7BD9",
};

function getDateRange(days) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - Number(days));
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

export default function CampaignsPage() {
  const [range, setRange] = useState("30");
  const [data, setData] = useState(null);
  const [noData, setNoData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState("All");
  const [sort, setSort] = useState("sessions");
  const [sortDir, setSortDir] = useState("desc");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { startDate, endDate } = getDateRange(range);

    try {
      const res = await fetch(`/api/campaigns?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) throw new Error("Campaigns data not available");
      const json = await res.json();

      if (json.campaigns?.length > 0) {
        setData(json);
        setNoData(false);
      } else {
        setNoData(true);
      }
    } catch (err) {
      console.warn("[Campaigns]", err.message);
      setNoData(true);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  return (
    <div className="space-y-6">
      {noData && !loading && <MockBanner message="Campaigns — not connected" />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-navy tracking-tight">Campaigns</h2>
          <p className="text-[12px] text-gray-muted mt-0.5">All campaigns across platforms</p>
        </div>
        <DateRangeSelector value={range} onChange={setRange} />
      </div>

      {noData && !loading && (
        <div className="rounded-2xl border border-border bg-blue-sky/30 p-12 text-center">
          <p className="text-[13px] text-gray-muted">No campaign data available for this period</p>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <MetricCardSkeleton key={i} />)}
        </div>
      )}

      {data && !loading && (
        <>
          {/* Platform summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.platforms.map((p) => (
              <div key={p.platform} className="bg-surface rounded-2xl border border-border p-5 hover:shadow-[0_2px_20px_rgba(0,0,0,0.04)] transition-all duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[p.platform] || "#8896A8" }} />
                  <p className="text-[13px] font-medium text-navy/80">{p.platform}</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] text-gray-muted uppercase tracking-wider">Campaigns</p>
                    <p className="text-[15px] font-semibold text-navy mt-0.5">{p.campaigns}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-muted uppercase tracking-wider">Sessions</p>
                    <p className="text-[15px] font-semibold text-navy mt-0.5">{(p.sessions || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-muted uppercase tracking-wider">Conv.</p>
                    <p className="text-[15px] font-semibold text-navy mt-0.5">{p.conversions || 0}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="flex items-center gap-1 flex-wrap">
            {data.allPlatforms.map((p) => (
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
                    <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide cursor-pointer select-none" onClick={() => handleSort("sessions")}>
                      Sessions<SortIcon col="sessions" />
                    </th>
                    <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide cursor-pointer select-none" onClick={() => handleSort("users")}>
                      Users<SortIcon col="users" />
                    </th>
                    <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide cursor-pointer select-none" onClick={() => handleSort("conversions")}>
                      Conv.<SortIcon col="conversions" />
                    </th>
                    <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide cursor-pointer select-none" onClick={() => handleSort("convRate")}>
                      Conv. Rate<SortIcon col="convRate" />
                    </th>
                    <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide cursor-pointer select-none" onClick={() => handleSort("engagementRate")}>
                      Engagement<SortIcon col="engagementRate" />
                    </th>
                    <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-muted tracking-wide cursor-pointer select-none" onClick={() => handleSort("bounceRate")}>
                      Bounce<SortIcon col="bounceRate" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...(platform === "All" ? data.campaigns : data.campaigns.filter((c) => c.platform === platform))]
                    .sort((a, b) => {
                      const av = a[sort] ?? 0;
                      const bv = b[sort] ?? 0;
                      return sortDir === "desc" ? bv - av : av - bv;
                    })
                    .map((c, i) => (
                      <tr key={`${c.name}-${i}`} className="border-b border-border/50 hover:bg-blue-sky/30 transition-colors duration-150">
                        <td className="px-6 py-3 font-medium text-navy/80">{c.name}</td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[c.platform] || "#8896A8" }} />
                            <span className="text-gray-muted text-[12px]">{c.platform}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-right text-gray-muted">{(c.sessions || 0).toLocaleString()}</td>
                        <td className="px-6 py-3 text-right text-gray-muted">{(c.users || 0).toLocaleString()}</td>
                        <td className="px-6 py-3 text-right font-medium text-navy/80">{c.conversions || 0}</td>
                        <td className="px-6 py-3 text-right text-gray-muted">{c.convRate || 0}%</td>
                        <td className="px-6 py-3 text-right text-gray-muted">{c.engagementRate || "—"}{c.engagementRate ? "%" : ""}</td>
                        <td className="px-6 py-3 text-right text-gray-muted">{c.bounceRate || "—"}{c.bounceRate ? "%" : ""}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
