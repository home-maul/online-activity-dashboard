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
 * Fetch LinkedIn data via GA4 — both paid and organic.
 * Filters GA4 sessions by source containing "linkedin".
 * No LinkedIn API credentials needed.
 */
export async function fetchLinkedInData(accessToken, { startDate, endDate }) {
  if (!PROPERTY_ID) throw new Error("GA4_PROPERTY_ID is not configured");

  const auth = createOAuth2Client(accessToken);
  const analyticsData = google.analyticsdata({ version: "v1beta", auth });

  const linkedinFilter = {
    filter: {
      fieldName: "sessionSource",
      stringFilter: { matchType: "CONTAINS", value: "linkedin", caseSensitive: false },
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
    // ── Paid: totals ──
    runReport(analyticsData, {
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "conversions" },
        { name: "advertiserAdImpressions" },
        { name: "advertiserAdClicks" },
        { name: "advertiserAdCost" },
      ],
      dimensionFilter: {
        andGroup: {
          expressions: [
            linkedinFilter,
            {
              filter: {
                fieldName: "sessionDefaultChannelGroup",
                stringFilter: { matchType: "EXACT", value: "Paid Social" },
              },
            },
          ],
        },
      },
    }),
    // ── Paid: daily time series ──
    runReport(analyticsData, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "conversions" },
      ],
      dimensionFilter: {
        andGroup: {
          expressions: [
            linkedinFilter,
            {
              filter: {
                fieldName: "sessionDefaultChannelGroup",
                stringFilter: { matchType: "EXACT", value: "Paid Social" },
              },
            },
          ],
        },
      },
      orderBys: [{ dimension: { dimensionName: "date" } }],
    }),
    // ── Paid: by campaign (UTM) ──
    runReport(analyticsData, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "sessionCampaignName" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "conversions" },
      ],
      dimensionFilter: {
        andGroup: {
          expressions: [
            linkedinFilter,
            {
              filter: {
                fieldName: "sessionDefaultChannelGroup",
                stringFilter: { matchType: "EXACT", value: "Paid Social" },
              },
            },
          ],
        },
      },
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 20,
    }),
    // ── Organic: totals ──
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
      dimensionFilter: {
        andGroup: {
          expressions: [
            linkedinFilter,
            {
              filter: {
                fieldName: "sessionDefaultChannelGroup",
                stringFilter: { matchType: "EXACT", value: "Organic Social" },
              },
            },
          ],
        },
      },
    }),
    // ── Organic: daily time series ──
    runReport(analyticsData, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "conversions" },
      ],
      dimensionFilter: {
        andGroup: {
          expressions: [
            linkedinFilter,
            {
              filter: {
                fieldName: "sessionDefaultChannelGroup",
                stringFilter: { matchType: "EXACT", value: "Organic Social" },
              },
            },
          ],
        },
      },
      orderBys: [{ dimension: { dimensionName: "date" } }],
    }),
    // ── All LinkedIn: top landing pages ──
    runReport(analyticsData, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "landingPagePlusQueryString" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "conversions" },
        { name: "bounceRate" },
      ],
      dimensionFilter: linkedinFilter,
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10,
    }),
  ]);

  const parse = (r, i) => Number(r[i]?.value ?? 0);

  // ── Parse paid ──
  const paidRow = paidTotalsRes.data.rows?.[0]?.metricValues ?? [];
  const paid = {
    totals: {
      sessions: parse(paidRow, 0),
      users: parse(paidRow, 1),
      conversions: parse(paidRow, 2),
      impressions: parse(paidRow, 3),
      clicks: parse(paidRow, 4),
      cost: parseFloat(parse(paidRow, 5).toFixed(2)),
    },
    timeSeries: (paidTimeSeriesRes.data.rows ?? []).map((r) => ({
      date: r.dimensionValues[0].value.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"),
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

  // ── Parse organic ──
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
      date: r.dimensionValues[0].value.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"),
      sessions: Number(r.metricValues[0].value),
      users: Number(r.metricValues[1].value),
      conversions: Number(r.metricValues[2].value),
    })),
  };

  // ── Parse landing pages ──
  const landingPages = (landingPagesRes.data.rows ?? []).map((r) => ({
    page: r.dimensionValues[0].value,
    sessions: Number(r.metricValues[0].value),
    users: Number(r.metricValues[1].value),
    conversions: Number(r.metricValues[2].value),
    bounceRate: parseFloat((Number(r.metricValues[3].value) * 100).toFixed(1)),
  }));

  return { paid, organic, landingPages };
}
