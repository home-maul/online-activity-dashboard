"use client";

import PlatformPage from "@/components/dashboard/platform-page";

function getMockData() {
  const ts = [];
  const now = new Date();
  for (let i = 30; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    ts.push({
      date: d.toISOString().split("T")[0],
      sessions: Math.round(18 + Math.random() * 12),
      users: Math.round(14 + Math.random() * 10),
      conversions: Math.round(Math.random() * 3),
    });
  }
  return {
    paid: {
      totals: { sessions: 540, users: 420, conversions: 22, engagementRate: 58.6 },
      timeSeries: ts.map((d) => ({ ...d, sessions: d.sessions + Math.round(Math.random() * 8) })),
      campaigns: [
        { name: "Brand - Search", sessions: 210, users: 165, conversions: 10 },
        { name: "Delivery Solutions", sessions: 180, users: 140, conversions: 8 },
        { name: "Competitor - Search", sessions: 150, users: 115, conversions: 4 },
      ],
    },
    organic: {
      totals: { sessions: 380, users: 310, conversions: 8, engagementRate: 55.2, avgDuration: 120, bounceRate: 42.5 },
      timeSeries: ts,
    },
    landingPages: [
      { page: "/pricing", sessions: 95, users: 76, conversions: 4, bounceRate: 32.1 },
      { page: "/solutions/e-commerce", sessions: 68, users: 54, conversions: 2, bounceRate: 38.5 },
      { page: "/solutions/logistics", sessions: 52, users: 42, conversions: 1, bounceRate: 40.2 },
    ],
  };
}

export default function MicrosoftAdsPage() {
  return (
    <PlatformPage
      name="Microsoft Ads"
      subtitle="Bing paid and organic search traffic via GA4"
      apiPath="/api/microsoft-ads"
      mockData={getMockData()}
    />
  );
}
