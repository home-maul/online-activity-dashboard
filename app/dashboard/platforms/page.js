"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const LinkedInPage = dynamic(() => import("@/app/dashboard/linkedin/page"), { ssr: false });
const MetaPage = dynamic(() => import("@/app/dashboard/meta/page"), { ssr: false });
const YouTubePage = dynamic(() => import("@/app/dashboard/youtube/page"), { ssr: false });
const RedditPage = dynamic(() => import("@/app/dashboard/reddit/page"), { ssr: false });
const MicrosoftAdsPage = dynamic(() => import("@/app/dashboard/microsoft-ads/page"), { ssr: false });

const TABS = [
  { key: "linkedin", label: "LinkedIn", component: LinkedInPage },
  { key: "meta", label: "Meta", component: MetaPage },
  { key: "youtube", label: "YouTube", component: YouTubePage },
  { key: "reddit", label: "Reddit", component: RedditPage },
  { key: "microsoft", label: "Microsoft Ads", component: MicrosoftAdsPage },
];

export default function PlatformsPage() {
  const [activeTab, setActiveTab] = useState("linkedin");
  const ActiveComponent = TABS.find((t) => t.key === activeTab)?.component;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-navy tracking-tight">Platforms</h2>
        <p className="text-[12px] text-gray-muted mt-0.5">Ad platform performance across all channels</p>
      </div>

      <div className="flex gap-1 bg-blue-sky/60 p-1 rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-[12px] font-medium rounded-lg transition-all duration-200 ${
              activeTab === tab.key
                ? "bg-surface text-navy shadow-sm"
                : "text-gray-muted hover:text-navy"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
}
