// Mock data for cross-channel dashboard views
// Replace with real API data when connectors are ready

function generateTimeSeries(days = 30) {
  const data = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const date = d.toISOString().split("T")[0];
    const base = 400 + Math.sin(i / 5) * 80;
    data.push({
      date,
      googleAds: Math.round(base * 0.42 + Math.random() * 40),
      metaAds: Math.round(base * 0.31 + Math.random() * 35),
      linkedin: Math.round(base * 0.15 + Math.random() * 20),
      organic: Math.round(base * 0.12 + Math.random() * 25),
      totalSpend: Math.round(280 + Math.random() * 140),
      totalLeads: Math.round(4 + Math.random() * 8),
    });
  }
  return data;
}

export function getChannelsOverview() {
  return {
    totals: {
      spend: 12400,
      leads: 186,
      costPerLead: 66.67,
      pipeline: 94000,
      roas: 7.6,
      qualifiedLeads: 112,
      customers: 34,
      spendChange: -4.2,
      leadsChange: 12.8,
      costPerLeadChange: -15.1,
      pipelineChange: 18.3,
      roasChange: 8.5,
    },
    channels: [
      { channel: "Google Ads", spend: 5200, clicks: 3400, impressions: 142000, leads: 78, qualified: 52, customers: 18, costPerLead: 66.67, roas: 8.2, color: "#070E1A" },
      { channel: "Meta Ads", spend: 3800, clicks: 8200, impressions: 312000, leads: 58, qualified: 31, customers: 9, costPerLead: 65.52, roas: 6.1, color: "#C6D2DF" },
      { channel: "LinkedIn Ads", spend: 2400, clicks: 1100, impressions: 86000, leads: 28, qualified: 22, customers: 5, costPerLead: 85.71, roas: 5.4, color: "#8896A8" },
      { channel: "Organic", spend: 0, clicks: 4600, impressions: 224000, leads: 22, qualified: 7, customers: 2, costPerLead: 0, roas: null, color: "#59A9FF" },
    ],
    timeSeries: generateTimeSeries(30),
    channelMix: [
      { name: "Google Ads", value: 42, leads: 78 },
      { name: "Meta Ads", value: 31, leads: 58 },
      { name: "LinkedIn", value: 15, leads: 28 },
      { name: "Organic", value: 12, leads: 22 },
    ],
  };
}

export function getCampaigns() {
  return {
    campaigns: [
      { name: "Brand - Search", platform: "Google Ads", status: "active", spend: 800, impressions: 24000, clicks: 1200, leads: 32, qualified: 25, costPerLead: 25.0, qualifiedRate: 78, conversionRate: 2.67 },
      { name: "Retargeting - DK", platform: "Meta Ads", status: "active", spend: 600, impressions: 48000, clicks: 1800, leads: 18, qualified: 11, costPerLead: 33.33, qualifiedRate: 62, conversionRate: 1.0 },
      { name: "Delivery Solutions", platform: "LinkedIn Ads", status: "active", spend: 900, impressions: 32000, clicks: 420, leads: 8, qualified: 7, costPerLead: 112.5, qualifiedRate: 88, conversionRate: 1.9 },
      { name: "Lookalike - EU", platform: "Meta Ads", status: "active", spend: 1200, impressions: 156000, clicks: 3200, leads: 14, qualified: 6, costPerLead: 85.71, qualifiedRate: 41, conversionRate: 0.44 },
      { name: "Generic - Logistics", platform: "Google Ads", status: "active", spend: 1400, impressions: 62000, clicks: 980, leads: 12, qualified: 4, costPerLead: 116.67, qualifiedRate: 33, conversionRate: 1.22 },
      { name: "Competitor - Search", platform: "Google Ads", status: "active", spend: 1100, impressions: 38000, clicks: 640, leads: 14, qualified: 9, costPerLead: 78.57, qualifiedRate: 64, conversionRate: 2.19 },
      { name: "Case Study Promo", platform: "LinkedIn Ads", status: "active", spend: 750, impressions: 28000, clicks: 380, leads: 12, qualified: 10, costPerLead: 62.5, qualifiedRate: 83, conversionRate: 3.16 },
      { name: "E-commerce Retarget", platform: "Meta Ads", status: "paused", spend: 480, impressions: 52000, clicks: 1400, leads: 8, qualified: 5, costPerLead: 60.0, qualifiedRate: 63, conversionRate: 0.57 },
      { name: "Video - Brand Awareness", platform: "Meta Ads", status: "active", spend: 920, impressions: 186000, clicks: 2800, leads: 6, qualified: 2, costPerLead: 153.33, qualifiedRate: 33, conversionRate: 0.07 },
      { name: "Decision Makers - DK", platform: "LinkedIn Ads", status: "active", spend: 650, impressions: 18000, clicks: 260, leads: 6, qualified: 5, costPerLead: 108.33, qualifiedRate: 83, conversionRate: 2.31 },
    ],
    platforms: ["All", "Google Ads", "Meta Ads", "LinkedIn Ads"],
  };
}

export function getFunnelData() {
  return {
    overall: [
      { stage: "Impressions", value: 824000 },
      { stage: "Clicks", value: 17300 },
      { stage: "Sessions", value: 14200 },
      { stage: "Leads", value: 186 },
      { stage: "Qualified", value: 112 },
      { stage: "Customers", value: 34 },
    ],
    rates: [
      { label: "CTR", value: 2.1 },
      { label: "Landing", value: 82.1 },
      { label: "CVR", value: 1.31 },
      { label: "QLR", value: 60.2 },
      { label: "Close", value: 30.4 },
    ],
    byChannel: [
      { channel: "Google Ads", impressions: 142000, clicks: 3400, sessions: 2900, leads: 78, qualified: 52, customers: 18 },
      { channel: "Meta Ads", impressions: 312000, clicks: 8200, sessions: 6400, leads: 58, qualified: 31, customers: 9 },
      { channel: "LinkedIn Ads", impressions: 86000, clicks: 1100, sessions: 920, leads: 28, qualified: 22, customers: 5 },
      { channel: "Organic", impressions: 224000, clicks: 4600, sessions: 3980, leads: 22, qualified: 7, customers: 2 },
    ],
    leadTimeline: generateTimeSeries(30).map((d) => ({
      date: d.date,
      leads: d.totalLeads,
      qualified: Math.round(d.totalLeads * 0.6),
      closed: Math.round(d.totalLeads * 0.18),
    })),
  };
}

export function getAdsData() {
  const timeSeries = generateTimeSeries(30).map((d) => ({
    date: d.date,
    impressions: Math.round(d.googleAds * 42 + Math.random() * 800),
    clicks: d.googleAds,
    cost: parseFloat((d.googleAds * 1.52 + Math.random() * 20).toFixed(2)),
    conversions: Math.round(d.googleAds * 0.04 + Math.random() * 3),
  }));

  const totalImpressions = timeSeries.reduce((s, d) => s + d.impressions, 0);
  const totalClicks = timeSeries.reduce((s, d) => s + d.clicks, 0);
  const totalCost = parseFloat(timeSeries.reduce((s, d) => s + d.cost, 0).toFixed(2));
  const totalConversions = timeSeries.reduce((s, d) => s + d.conversions, 0);

  return {
    totals: {
      impressions: totalImpressions,
      clicks: totalClicks,
      cost: totalCost,
      conversions: totalConversions,
      ctr: parseFloat(((totalClicks / totalImpressions) * 100).toFixed(2)),
    },
    timeSeries,
    campaigns: [
      { name: "Brand - Search", impressions: 24000, clicks: 1200, cost: 1820, conversions: 48, ctr: 5.0 },
      { name: "Generic - Logistics", impressions: 62000, clicks: 980, cost: 2240, conversions: 14, ctr: 1.58 },
      { name: "Competitor - Search", impressions: 38000, clicks: 640, cost: 1680, conversions: 18, ctr: 1.68 },
      { name: "Retargeting - DK", impressions: 18200, clicks: 580, cost: 460, conversions: 22, ctr: 3.19 },
    ],
  };
}

export function getContentData() {
  return {
    organicVsPaid: generateTimeSeries(30).map((d) => ({
      date: d.date,
      organic: d.organic + Math.round(Math.random() * 60),
      paid: d.googleAds + d.metaAds + d.linkedin,
    })),
    landingPages: [
      { page: "/pricing", sessions: 2840, leads: 119, conversionRate: 4.19, avgTime: 185, bounceRate: 32 },
      { page: "/solutions/e-commerce", sessions: 1920, leads: 54, conversionRate: 2.81, avgTime: 210, bounceRate: 38 },
      { page: "/case-studies/fashion-brand", sessions: 980, leads: 21, conversionRate: 2.14, avgTime: 264, bounceRate: 28 },
      { page: "/solutions/logistics", sessions: 1640, leads: 33, conversionRate: 2.01, avgTime: 195, bounceRate: 41 },
      { page: "/integrations", sessions: 1280, leads: 18, conversionRate: 1.41, avgTime: 142, bounceRate: 48 },
      { page: "/blog/delivery-optimization", sessions: 3200, leads: 38, conversionRate: 1.19, avgTime: 312, bounceRate: 22 },
      { page: "/about", sessions: 860, leads: 4, conversionRate: 0.47, avgTime: 98, bounceRate: 62 },
    ],
    searchQueries: [
      { query: "homerunner", impressions: 18400, clicks: 4200, ctr: 22.8, position: 1.2, leads: 12 },
      { query: "e-commerce delivery denmark", impressions: 8600, clicks: 680, ctr: 7.91, position: 3.4, leads: 8 },
      { query: "logistics software", impressions: 12400, clicks: 420, ctr: 3.39, position: 6.8, leads: 4 },
      { query: "shipping api integration", impressions: 6200, clicks: 340, ctr: 5.48, position: 4.2, leads: 6 },
      { query: "best delivery platform", impressions: 9800, clicks: 280, ctr: 2.86, position: 8.1, leads: 3 },
      { query: "homerunner pricing", impressions: 4200, clicks: 1800, ctr: 42.86, position: 1.0, leads: 9 },
      { query: "parcel delivery solution", impressions: 7400, clicks: 310, ctr: 4.19, position: 5.6, leads: 2 },
      { query: "multi-carrier shipping", impressions: 5600, clicks: 220, ctr: 3.93, position: 7.2, leads: 3 },
    ],
    socialOrganic: [
      { platform: "LinkedIn", followers: 4800, impressions: 86000, engagement: 3.2, clicks: 1200, leads: 8 },
      { platform: "Instagram", followers: 2100, impressions: 124000, engagement: 4.8, clicks: 860, leads: 3 },
      { platform: "Facebook", followers: 3400, impressions: 42000, engagement: 1.4, clicks: 380, leads: 2 },
    ],
  };
}
