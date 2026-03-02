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
      sessions: Math.round(8 + Math.random() * 12),
      users: Math.round(6 + Math.random() * 10),
      conversions: Math.round(Math.random() * 2),
    });
  }
  return {
    paid: {
      totals: { sessions: 180, users: 140, conversions: 6, engagementRate: 58.4 },
      timeSeries: ts.map((d) => ({ ...d, sessions: d.sessions + Math.round(Math.random() * 6) })),
      campaigns: [
        { name: "r/ecommerce - Delivery Solutions", sessions: 85, users: 68, conversions: 3 },
        { name: "r/logistics - Brand Awareness", sessions: 52, users: 40, conversions: 2 },
        { name: "r/smallbusiness - Retarget", sessions: 43, users: 32, conversions: 1 },
      ],
    },
    organic: {
      totals: { sessions: 240, users: 195, conversions: 4, engagementRate: 72.1, avgDuration: 210, bounceRate: 34.8 },
      timeSeries: ts,
    },
    landingPages: [
      { page: "/blog/delivery-optimization", sessions: 82, users: 68, conversions: 2, bounceRate: 24.5 },
      { page: "/pricing", sessions: 45, users: 36, conversions: 1, bounceRate: 38.2 },
      { page: "/solutions/e-commerce", sessions: 38, users: 30, conversions: 1, bounceRate: 32.0 },
    ],
  };
}

export default function RedditPage() {
  return (
    <PlatformPage
      name="Reddit"
      subtitle="Paid and organic traffic from Reddit via GA4"
      apiPath="/api/reddit"
      mockData={getMockData()}
    />
  );
}
