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
      sessions: Math.round(14 + Math.random() * 10),
      users: Math.round(10 + Math.random() * 8),
      conversions: Math.round(Math.random() * 3),
    });
  }
  return {
    paid: {
      totals: { sessions: 320, users: 260, conversions: 28, engagementRate: 62.8 },
      timeSeries: ts.map((d) => ({ ...d, sessions: d.sessions + Math.round(Math.random() * 8) })),
      campaigns: [
        { name: "Delivery Solutions - Decision Makers", sessions: 120, users: 95, conversions: 12 },
        { name: "Case Study Promo", sessions: 98, users: 78, conversions: 10 },
        { name: "Decision Makers - DK", sessions: 62, users: 50, conversions: 6 },
      ],
    },
    organic: {
      totals: { sessions: 480, users: 390, conversions: 12, engagementRate: 62.4, avgDuration: 145, bounceRate: 38.2 },
      timeSeries: ts,
    },
    landingPages: [
      { page: "/pricing", sessions: 120, users: 95, conversions: 8, bounceRate: 28.4 },
      { page: "/solutions/e-commerce", sessions: 86, users: 68, conversions: 4, bounceRate: 35.1 },
      { page: "/case-studies/fashion-brand", sessions: 64, users: 52, conversions: 3, bounceRate: 24.8 },
      { page: "/solutions/logistics", sessions: 48, users: 38, conversions: 2, bounceRate: 42.0 },
    ],
  };
}

export default function LinkedInPage() {
  return (
    <PlatformPage
      name="LinkedIn"
      subtitle="Paid and organic traffic from LinkedIn via GA4"
      apiPath="/api/linkedin"
      mockData={getMockData()}
    />
  );
}
