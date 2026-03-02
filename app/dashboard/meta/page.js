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
      sessions: Math.round(45 + Math.random() * 25),
      users: Math.round(35 + Math.random() * 20),
      conversions: Math.round(Math.random() * 5),
    });
  }
  return {
    paid: {
      totals: { sessions: 1240, users: 980, conversions: 42, engagementRate: 54.2 },
      timeSeries: ts.map((d) => ({ ...d, sessions: d.sessions + Math.round(Math.random() * 15) })),
      campaigns: [
        { name: "Retargeting - DK", sessions: 380, users: 290, conversions: 18 },
        { name: "Lookalike - EU", sessions: 320, users: 260, conversions: 8 },
        { name: "E-commerce Retarget", sessions: 280, users: 210, conversions: 9 },
        { name: "Video - Brand Awareness", sessions: 260, users: 220, conversions: 7 },
      ],
    },
    organic: {
      totals: { sessions: 620, users: 480, conversions: 8, engagementRate: 48.6, avgDuration: 95, bounceRate: 52.3 },
      timeSeries: ts,
    },
    landingPages: [
      { page: "/pricing", sessions: 180, users: 140, conversions: 6, bounceRate: 34.2 },
      { page: "/solutions/e-commerce", sessions: 120, users: 95, conversions: 3, bounceRate: 41.8 },
      { page: "/blog/delivery-optimization", sessions: 95, users: 72, conversions: 1, bounceRate: 28.5 },
      { page: "/case-studies/fashion-brand", sessions: 68, users: 54, conversions: 2, bounceRate: 32.0 },
    ],
    sourceBreakdown: [
      { source: "facebook", sessions: 1420, users: 1100, conversions: 38 },
      { source: "instagram", sessions: 440, users: 360, conversions: 12 },
    ],
  };
}

export default function MetaPage() {
  return (
    <PlatformPage
      name="Meta"
      subtitle="Facebook & Instagram — paid and organic traffic via GA4"
      apiPath="/api/meta"
      mockData={getMockData()}
    />
  );
}
