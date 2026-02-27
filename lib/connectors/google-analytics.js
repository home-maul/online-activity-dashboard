import { google } from "googleapis";
import { createOAuth2Client } from "@/lib/google";

const PROPERTY_ID = process.env.GA4_PROPERTY_ID;

/**
 * Fetch GA4 overview metrics + daily time series.
 */
export async function fetchAnalytics(accessToken, { startDate, endDate }) {
  const auth = createOAuth2Client(accessToken);
  const analyticsData = google.analyticsdata({ version: "v1beta", auth });

  // KPI totals
  const totalsRes = await analyticsData.properties.runReport({
    property: `properties/${PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "screenPageViews" },
        { name: "bounceRate" },
      ],
    },
  });

  const row = totalsRes.data.rows?.[0]?.metricValues ?? [];
  const totals = {
    sessions: Number(row[0]?.value ?? 0),
    users: Number(row[1]?.value ?? 0),
    pageViews: Number(row[2]?.value ?? 0),
    bounceRate: parseFloat((Number(row[3]?.value ?? 0) * 100).toFixed(1)),
  };

  // Daily time series
  const timeSeriesRes = await analyticsData.properties.runReport({
    property: `properties/${PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "screenPageViews" },
      ],
      orderBys: [{ dimension: { dimensionName: "date" } }],
    },
  });

  const timeSeries = (timeSeriesRes.data.rows ?? []).map((r) => ({
    date: r.dimensionValues[0].value.replace(
      /(\d{4})(\d{2})(\d{2})/,
      "$1-$2-$3"
    ),
    sessions: Number(r.metricValues[0].value),
    users: Number(r.metricValues[1].value),
    pageViews: Number(r.metricValues[2].value),
  }));

  // Traffic sources by channel group
  const channelRes = await analyticsData.properties.runReport({
    property: `properties/${PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "conversions" },
      ],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    },
  });

  const channels = (channelRes.data.rows ?? []).map((r) => ({
    channel: r.dimensionValues[0].value,
    sessions: Number(r.metricValues[0].value),
    users: Number(r.metricValues[1].value),
    conversions: Number(r.metricValues[2].value),
  }));

  // Traffic sources by source/medium
  const sourceRes = await analyticsData.properties.runReport({
    property: `properties/${PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
      ],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 15,
    },
  });

  const sources = (sourceRes.data.rows ?? []).map((r) => ({
    source: r.dimensionValues[0].value,
    medium: r.dimensionValues[1].value,
    sessions: Number(r.metricValues[0].value),
    users: Number(r.metricValues[1].value),
  }));

  return { totals, timeSeries, channels, sources };
}
