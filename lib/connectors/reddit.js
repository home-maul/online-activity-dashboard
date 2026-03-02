import { google } from "googleapis";
import { createOAuth2Client } from "@/lib/google";

const PROPERTY_ID = process.env.GA4_PROPERTY_ID;

function runReport(analyticsData, requestBody) {
  return analyticsData.properties.runReport({
    property: `properties/${PROPERTY_ID}`,
    requestBody,
  });
}

/**
 * Fetch Reddit data via GA4.
 * Filters by source containing "reddit".
 */
export async function fetchRedditData(accessToken, { startDate, endDate }) {
  if (!PROPERTY_ID) throw new Error("GA4_PROPERTY_ID is not configured");

  const auth = createOAuth2Client(accessToken);
  const analyticsData = google.analyticsdata({ version: "v1beta", auth });

  const redditFilter = {
    filter: {
      fieldName: "sessionSource",
      stringFilter: { matchType: "CONTAINS", value: "reddit", caseSensitive: false },
    },
  };

  const paidFilter = {
    andGroup: {
      expressions: [
        redditFilter,
        { filter: { fieldName: "sessionDefaultChannelGroup", stringFilter: { matchType: "EXACT", value: "Paid Social" } } },
      ],
    },
  };

  const organicFilter = {
    andGroup: {
      expressions: [
        redditFilter,
        { filter: { fieldName: "sessionDefaultChannelGroup", stringFilter: { matchType: "EXACT", value: "Organic Social" } } },
      ],
    },
  };

  const [
    paidTotalsRes,
    paidTimeSeriesRes,
    paidCampaignsRes,
    organicTotalsRes,
    organicTimeSeriesRes,
    landingPagesRes,
  ] = await Promise.all([
    runReport(analyticsData, {
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "conversions" },
        { name: "engagementRate" },
      ],
      dimensionFilter: paidFilter,
    }),
    runReport(analyticsData, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "conversions" },
      ],
      dimensionFilter: paidFilter,
      orderBys: [{ dimension: { dimensionName: "date" } }],
    }),
    runReport(analyticsData, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "sessionCampaignName" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "conversions" },
      ],
      dimensionFilter: paidFilter,
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 20,
    }),
    runReport(analyticsData, {
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "conversions" },
        { name: "engagementRate" },
        { name: "averageSessionDuration" },
        { name: "bounceRate" },
      ],
      dimensionFilter: organicFilter,
    }),
    runReport(analyticsData, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "conversions" },
      ],
      dimensionFilter: organicFilter,
      orderBys: [{ dimension: { dimensionName: "date" } }],
    }),
    runReport(analyticsData, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "landingPagePlusQueryString" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "conversions" },
        { name: "bounceRate" },
      ],
      dimensionFilter: redditFilter,
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10,
    }),
  ]);

  const parse = (r, i) => Number(r[i]?.value ?? 0);
  const fmtDate = (v) => v.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");

  const paidRow = paidTotalsRes.data.rows?.[0]?.metricValues ?? [];
  const paid = {
    totals: {
      sessions: parse(paidRow, 0),
      users: parse(paidRow, 1),
      conversions: parse(paidRow, 2),
      engagementRate: parseFloat((parse(paidRow, 3) * 100).toFixed(1)),
    },
    timeSeries: (paidTimeSeriesRes.data.rows ?? []).map((r) => ({
      date: fmtDate(r.dimensionValues[0].value),
      sessions: Number(r.metricValues[0].value),
      users: Number(r.metricValues[1].value),
      conversions: Number(r.metricValues[2].value),
    })),
    campaigns: (paidCampaignsRes.data.rows ?? [])
      .filter((r) => r.dimensionValues[0].value !== "(not set)")
      .map((r) => ({
        name: r.dimensionValues[0].value,
        sessions: Number(r.metricValues[0].value),
        users: Number(r.metricValues[1].value),
        conversions: Number(r.metricValues[2].value),
      })),
  };

  const orgRow = organicTotalsRes.data.rows?.[0]?.metricValues ?? [];
  const organic = {
    totals: {
      sessions: parse(orgRow, 0),
      users: parse(orgRow, 1),
      conversions: parse(orgRow, 2),
      engagementRate: parseFloat((parse(orgRow, 3) * 100).toFixed(1)),
      avgDuration: parseFloat(parse(orgRow, 4).toFixed(0)),
      bounceRate: parseFloat((parse(orgRow, 5) * 100).toFixed(1)),
    },
    timeSeries: (organicTimeSeriesRes.data.rows ?? []).map((r) => ({
      date: fmtDate(r.dimensionValues[0].value),
      sessions: Number(r.metricValues[0].value),
      users: Number(r.metricValues[1].value),
      conversions: Number(r.metricValues[2].value),
    })),
  };

  const landingPages = (landingPagesRes.data.rows ?? []).map((r) => ({
    page: r.dimensionValues[0].value,
    sessions: Number(r.metricValues[0].value),
    users: Number(r.metricValues[1].value),
    conversions: Number(r.metricValues[2].value),
    bounceRate: parseFloat((Number(r.metricValues[3].value) * 100).toFixed(1)),
  }));

  return { paid, organic, landingPages };
}
