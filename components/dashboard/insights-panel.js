"use client";

import { useState, useCallback } from "react";

const TYPE_STYLES = {
  opportunity: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600", label: "Opportunity" },
  warning: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600", label: "Warning" },
  trend: { bg: "bg-blue-ice", border: "border-blue/20", icon: "text-blue-mid", label: "Trend" },
  action: { bg: "bg-violet-50", border: "border-violet-200", icon: "text-violet-600", label: "Action" },
};

const PRIORITY_DOT = {
  high: "bg-rose-400",
  medium: "bg-amber-400",
  low: "bg-gray-brand",
};

const TYPE_ICONS = {
  opportunity: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  ),
  warning: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  trend: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
    </svg>
  ),
  action: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
};

export default function InsightsPanel({ startDate, endDate }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const res = await fetch(`/api/insights?${params}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load insights");
      }
      const data = await res.json();
      setInsights(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  if (!insights && !loading && !error) {
    return (
      <div className="bg-surface rounded-2xl border border-border p-8 text-center hover:shadow-[0_4px_24px_rgba(43,124,233,0.08)] hover:border-blue/20 transition-all duration-300">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-ice mb-4">
          <svg className="w-6 h-6 text-blue-mid" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
        </div>
        <h3 className="text-[13px] font-semibold text-navy mb-1">AI-Powered Insights</h3>
        <p className="text-[12px] text-gray-muted mb-4">Analyze your marketing data and get actionable recommendations</p>
        <button
          onClick={fetchInsights}
          className="px-5 py-2 bg-navy text-white text-[12px] font-medium rounded-xl hover:bg-navy-light transition-colors duration-200"
        >
          Generate Insights
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-surface rounded-2xl border border-border p-8 text-center">
        <div className="inline-flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue/30 border-t-blue rounded-full animate-spin" />
          <span className="text-[13px] text-gray-muted">Analyzing your marketing data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-gray-muted">{error}</p>
          <button
            onClick={fetchInsights}
            className="text-[12px] text-blue font-medium hover:text-blue-mid transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const sorted = [...(insights?.insights || [])].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-mid" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          <h3 className="text-[11px] font-medium text-gray-muted uppercase tracking-wider">AI Insights</h3>
        </div>
        <button
          onClick={fetchInsights}
          disabled={loading}
          className="text-[11px] text-blue font-medium hover:text-blue-mid transition-colors disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sorted.map((insight, i) => {
          const style = TYPE_STYLES[insight.type] || TYPE_STYLES.trend;
          return (
            <div key={i} className={`${style.bg} border ${style.border} rounded-xl p-4 transition-all duration-200 hover:shadow-sm`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={style.icon}>{TYPE_ICONS[insight.type] || TYPE_ICONS.trend}</span>
                  <span className={`text-[10px] font-medium uppercase tracking-wider ${style.icon}`}>{style.label}</span>
                </div>
                <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[insight.priority] || PRIORITY_DOT.low}`} title={`${insight.priority} priority`} />
              </div>
              <h4 className="text-[13px] font-semibold text-navy mb-1">{insight.title}</h4>
              <p className="text-[12px] text-navy/70 leading-relaxed">{insight.body}</p>
              {insight.metric && (
                <p className="mt-2 text-[11px] font-medium text-gray-muted">
                  Key metric: <span className="text-navy font-semibold">{insight.metric}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>

      {insights?.generatedAt && (
        <p className="text-[10px] text-gray-brand px-1">
          Generated {new Date(insights.generatedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
      )}
    </div>
  );
}
