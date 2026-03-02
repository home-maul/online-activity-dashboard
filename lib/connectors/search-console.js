// Google Search Console connector
// Uses the same Google OAuth token as GA4/Ads (webmasters.readonly scope)
//
// Required env var:
//   SEARCH_CONSOLE_SITE_URL — Your property URL in Search Console
//   e.g. "https://www.homerunner.com" or "sc-domain:homerunner.com"

import { getOAuth2Client } from "@/lib/google";

const API_BASE = "https://www.googleapis.com/webmasters/v3";

async function searchAnalyticsQuery(accessToken, siteUrl, body) {
  const encoded = encodeURIComponent(siteUrl);
  const res = await fetch(`${API_BASE}/sites/${encoded}/searchAnalytics/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Search Console API ${res.status}: ${err}`);
  }
  return res.json();
}

export async function fetchSearchConsole(accessToken, { startDate, endDate }) {
  const siteUrl = process.env.SEARCH_CONSOLE_SITE_URL;
  if (!siteUrl) {
    throw new Error("SEARCH_CONSOLE_SITE_URL is not configured");
  }

  // Run all queries in parallel
  const [byQuery, byPage, byDate, byDevice, byCountry] = await Promise.all([
    // Top queries
    searchAnalyticsQuery(accessToken, siteUrl, {
      startDate,
      endDate,
      dimensions: ["query"],
      rowLimit: 25,
      type: "web",
    }),

    // Top pages
    searchAnalyticsQuery(accessToken, siteUrl, {
      startDate,
      endDate,
      dimensions: ["page"],
      rowLimit: 25,
      type: "web",
    }),

    // Daily time series
    searchAnalyticsQuery(accessToken, siteUrl, {
      startDate,
      endDate,
      dimensions: ["date"],
      type: "web",
    }),

    // By device
    searchAnalyticsQuery(accessToken, siteUrl, {
      startDate,
      endDate,
      dimensions: ["device"],
      type: "web",
    }),

    // By country
    searchAnalyticsQuery(accessToken, siteUrl, {
      startDate,
      endDate,
      dimensions: ["country"],
      rowLimit: 15,
      type: "web",
    }),
  ]);

  // Calculate totals from the date series
  const timeSeries = (byDate.rows || []).map((r) => ({
    date: r.keys[0],
    clicks: Math.round(r.clicks),
    impressions: Math.round(r.impressions),
    ctr: Math.round(r.ctr * 10000) / 100,
    position: Math.round(r.position * 10) / 10,
  }));

  const totalClicks = timeSeries.reduce((s, d) => s + d.clicks, 0);
  const totalImpressions = timeSeries.reduce((s, d) => s + d.impressions, 0);
  const avgCtr = totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0;
  const avgPosition =
    timeSeries.length > 0
      ? Math.round((timeSeries.reduce((s, d) => s + d.position, 0) / timeSeries.length) * 10) / 10
      : 0;

  return {
    totals: {
      clicks: totalClicks,
      impressions: totalImpressions,
      ctr: avgCtr,
      position: avgPosition,
    },
    queries: (byQuery.rows || []).map((r) => ({
      query: r.keys[0],
      clicks: Math.round(r.clicks),
      impressions: Math.round(r.impressions),
      ctr: Math.round(r.ctr * 10000) / 100,
      position: Math.round(r.position * 10) / 10,
    })),
    pages: (byPage.rows || []).map((r) => {
      // Strip the domain from page URLs for cleaner display
      let page = r.keys[0];
      try {
        page = new URL(r.keys[0]).pathname;
      } catch {}
      return {
        page,
        clicks: Math.round(r.clicks),
        impressions: Math.round(r.impressions),
        ctr: Math.round(r.ctr * 10000) / 100,
        position: Math.round(r.position * 10) / 10,
      };
    }),
    timeSeries,
    devices: (byDevice.rows || []).map((r) => ({
      device: r.keys[0],
      clicks: Math.round(r.clicks),
      impressions: Math.round(r.impressions),
      ctr: Math.round(r.ctr * 10000) / 100,
    })),
    countries: (byCountry.rows || []).map((r) => ({
      country: r.keys[0].toUpperCase(),
      clicks: Math.round(r.clicks),
      impressions: Math.round(r.impressions),
      ctr: Math.round(r.ctr * 10000) / 100,
      position: Math.round(r.position * 10) / 10,
    })),
  };
}
