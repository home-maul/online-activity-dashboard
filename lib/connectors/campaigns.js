import { google } from "googleapis";
import { createOAuth2Client } from "@/lib/google";

const PROPERTY_ID = process.env.GA4_PROPERTY_ID;

function runReport(analyticsData, requestBody) {
  return analyticsData.properties.runReport({
    property: `properties/${PROPERTY_ID}`,
    requestBody,
  });
}

function inferPlatform(source, medium) {
  const s = (source || "").toLowerCase();
  const m = (medium || "").toLowerCase();
  if (s.includes("google") && (m === "cpc" || m === "ppc" || m === "paid")) return "Google Ads";
  if (s.includes("facebook") || s.includes("fb") || s.includes("instagram") || s.includes("meta")) {
    return m === "cpc" || m === "paid" || m === "paid_social" ? "Meta Ads" : "Meta Organic";
  }
  if (s.includes("linkedin")) return m === "cpc" || m === "paid" || m === "paid_social" ? "LinkedIn Ads" : "LinkedIn Organic";
  if (s.includes("reddit")) return m === "cpc" || m === "paid" || m === "paid_social" ? "Reddit Ads" : "Reddit Organic";
  if (m === "cpc" || m === "paid") return `${source} (Paid)`;
  if (m === "organic") return "Organic Search";
  if (m === "referral") return "Referral";
  if (m === "email") return "Email";
  return source || "(direct)";
}

/**
 * Fetch all campaigns from GA4 — across all platforms.
 * Uses sessionCampaignName + sessionSource + sessionMedium.
 */
export async function fetchCampaigns(accessToken, { startDate, endDate }) {
  if (!PROPERTY_ID) throw new Error("GA4_PROPERTY_ID is not configured");

  const auth = createOAuth2Client(accessToken);
  const analyticsData = google.analyticsdata({ version: "v1beta", auth });

  const [campaignsRes, platformSummaryRes] = await Promise.all([
    // All campaigns with source/medium
    runReport(analyticsData, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: "sessionCampaignName" },
        { name: "sessionSource" },
        { name: "sessionMedium" },
      ],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "conversions" },
        { name: "engagementRate" },
        { name: "bounceRate" },
      ],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 50,
    }),
    // Summary by source/medium (for platform cards)
    runReport(analyticsData, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "conversions" },
      ],
      dimensionFilter: {
        orGroup: {
          expressions: [
            { filter: { fieldName: "sessionMedium", stringFilter: { matchType: "EXACT", value: "cpc" } } },
            { filter: { fieldName: "sessionMedium", stringFilter: { matchType: "EXACT", value: "paid" } } },
            { filter: { fieldName: "sessionMedium", stringFilter: { matchType: "EXACT", value: "paid_social" } } },
            { filter: { fieldName: "sessionMedium", stringFilter: { matchType: "EXACT", value: "ppc" } } },
          ],
        },
      },
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    }),
  ]);

  // Parse campaigns
  const campaigns = (campaignsRes.data.rows ?? [])
    .filter((r) => {
      const name = r.dimensionValues[0].value;
      return name && name !== "(not set)" && name !== "(direct)";
    })
    .map((r) => {
      const name = r.dimensionValues[0].value;
      const source = r.dimensionValues[1].value;
      const medium = r.dimensionValues[2].value;
      const sessions = Number(r.metricValues[0].value);
      const users = Number(r.metricValues[1].value);
      const conversions = Number(r.metricValues[2].value);
      return {
        name,
        platform: inferPlatform(source, medium),
        source,
        medium,
        sessions,
        users,
        conversions,
        engagementRate: parseFloat((Number(r.metricValues[3].value) * 100).toFixed(1)),
        bounceRate: parseFloat((Number(r.metricValues[4].value) * 100).toFixed(1)),
        convRate: sessions > 0 ? parseFloat(((conversions / sessions) * 100).toFixed(2)) : 0,
      };
    });

  // Aggregate platform summary for paid campaigns
  const platformMap = {};
  for (const r of platformSummaryRes.data.rows ?? []) {
    const source = r.dimensionValues[0].value;
    const medium = r.dimensionValues[1].value;
    const platform = inferPlatform(source, medium);
    if (!platformMap[platform]) {
      platformMap[platform] = { platform, campaigns: 0, sessions: 0, users: 0, conversions: 0 };
    }
    platformMap[platform].sessions += Number(r.metricValues[0].value);
    platformMap[platform].users += Number(r.metricValues[1].value);
    platformMap[platform].conversions += Number(r.metricValues[2].value);
  }

  // Count campaigns per platform
  for (const c of campaigns) {
    if (platformMap[c.platform]) {
      platformMap[c.platform].campaigns++;
    }
  }

  const platforms = Object.values(platformMap).sort((a, b) => b.sessions - a.sessions);

  // Unique platform names for filter
  const allPlatforms = ["All", ...new Set(campaigns.map((c) => c.platform))];

  return { campaigns, platforms, allPlatforms };
}
