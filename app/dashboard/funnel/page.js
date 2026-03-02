"use client";

import MockBanner from "@/components/dashboard/mock-banner";

export default function FunnelPage() {
  return (
    <div className="space-y-6">
      <MockBanner message="Lead Funnel — not connected (requires Pipedrive)" />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-navy tracking-tight">Lead Funnel</h2>
          <p className="text-[12px] text-gray-muted mt-0.5">From impression to customer — where are leads dropping off?</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-blue-sky/30 p-12 text-center">
        <p className="text-[13px] text-gray-muted">
          Connect Pipedrive to see your full lead funnel — from impressions to closed customers
        </p>
      </div>
    </div>
  );
}
