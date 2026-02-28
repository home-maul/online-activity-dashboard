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
 * Compute previous period date range for comparison.
 */
function getPreviousPeriod(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = end - start;
  const prevEnd = new Date(start.getTime() - 86400000); // day before start
  const prevStart = new Date(prevEnd.getTime() - diff);
  return {
    startDate: prevStart.toISOString().split("T")[0],
    endDate: prevEnd.toISOString().split("T")[0],
  };
}

function pctChange(current, previous) {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return parseFloat((((current - previous) / previous) * 100).toFixed(1));
}

/**
 * Fetch comprehensive GA4 data.
 */
export async function fetchAnalytics(accessToken, { startDate, endDate }) {
  const auth = createOAuth2Client(accessToken);
  const analyticsData = google.analyticsdata({ version: "v1beta", auth });

  const prev = getPreviousPeriod(startDate, endDate);

  // Run all reports in parallel
  const [
    totalsRes,
    prevTotalsRes,
    timeSeriesRes,
    channelRes,
    sourceRes,
    deviceRes,
    countryRes,
    pagesRes,
    userTypeRes,
  ] = await Promise.all([
    // Current period KPIs
    runReport(analyticsData, {
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "screenPageViews" },
        { name: "bounceRate" },
        { name: "averageSessionDuration" },
        { name: "engagementRate" },
        { name: "newUsers" },
        { name: "conversions" },
      ],
    }),
    // Previous period KPIs (for comparison)
    runReport(analyticsData, {
      dateRanges: [{ startDate: prev.startDate, endDate: prev.endDate }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "screenPageViews" },
        { name: "bounceRate" },
        { name: "averageSessionDuration" },
        { name: "engagementRate" },
        { name: "newUsers" },
        { name: "conversions" },
      ],
    }),
    // Daily time series
    runReport(analyticsData, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "screenPageViews" },
      ],
      orderBys: [{ dimension: { dimensionName: "date" } }],
    }),
    // Traffic by channel
    runReport(analyticsData, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "conversions" },
      ],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    }),
    // Traffic by source/medium
    runReport(analyticsData, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
      metrics: [{ name: "sessions" }, { name: "totalUsers" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 15,
    }),
    // Device breakdown
    runReport(analyticsData, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "deviceCategory" }],
      metrics: [{ name: "sessions" }, { name: "totalUsers" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    }),
    // Country breakdown
    runReport(analyticsData, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "country" }],
      metrics: [{ name: "sessions" }, { name: "totalUsers" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10,
    }),
    // Top pages
    runReport(analyticsData, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "pagePath" }],
      metrics: [
        { name: "screenPageViews" },
        { name: "totalUsers" },
        { name: "averageSessionDuration" },
      ],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 15,
    }),
    // New vs returning users
    runReport(analyticsData, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "newVsReturning" }],
      metrics: [{ name: "sessions" }, { name: "totalUsers" }],
    }),
  ]);

  // Parse KPI totals
  const row = totalsRes.data.rows?.[0]?.metricValues ?? [];
  const prevRow = prevTotalsRes.data.rows?.[0]?.metricValues ?? [];

  const parse = (r, i) => Number(r[i]?.value ?? 0);

  const totals = {
    sessions: parse(row, 0),
    users: parse(row, 1),
    pageViews: parse(row, 2),
    bounceRate: parseFloat((parse(row, 3) * 100).toFixed(1)),
    avgSessionDuration: parseFloat(parse(row, 4).toFixed(0)),
    engagementRate: parseFloat((parse(row, 5) * 100).toFixed(1)),
    newUsers: parse(row, 6),
    conversions: parse(row, 7),
    // Previous period for comparison
    prev: {
      sessions: parse(prevRow, 0),
      users: parse(prevRow, 1),
      pageViews: parse(prevRow, 2),
      bounceRate: parseFloat((parse(prevRow, 3) * 100).toFixed(1)),
      avgSessionDuration: parseFloat(parse(prevRow, 4).toFixed(0)),
      engagementRate: parseFloat((parse(prevRow, 5) * 100).toFixed(1)),
      newUsers: parse(prevRow, 6),
      conversions: parse(prevRow, 7),
    },
    // % change
    change: {
      sessions: pctChange(parse(row, 0), parse(prevRow, 0)),
      users: pctChange(parse(row, 1), parse(prevRow, 1)),
      pageViews: pctChange(parse(row, 2), parse(prevRow, 2)),
      bounceRate: pctChange(parse(row, 3) * 100, parse(prevRow, 3) * 100),
      avgSessionDuration: pctChange(parse(row, 4), parse(prevRow, 4)),
      engagementRate: pctChange(parse(row, 5) * 100, parse(prevRow, 5) * 100),
      newUsers: pctChange(parse(row, 6), parse(prevRow, 6)),
      conversions: pctChange(parse(row, 7), parse(prevRow, 7)),
    },
  };

  // Parse time series
  const timeSeries = (timeSeriesRes.data.rows ?? []).map((r) => ({
    date: r.dimensionValues[0].value.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"),
    sessions: Number(r.metricValues[0].value),
    users: Number(r.metricValues[1].value),
    pageViews: Number(r.metricValues[2].value),
  }));

  // Parse channels
  const channels = (channelRes.data.rows ?? []).map((r) => ({
    channel: r.dimensionValues[0].value,
    sessions: Number(r.metricValues[0].value),
    users: Number(r.metricValues[1].value),
    conversions: Number(r.metricValues[2].value),
  }));

  // Parse sources
  const sources = (sourceRes.data.rows ?? []).map((r) => ({
    source: r.dimensionValues[0].value,
    medium: r.dimensionValues[1].value,
    sessions: Number(r.metricValues[0].value),
    users: Number(r.metricValues[1].value),
  }));

  // Parse devices
  const devices = (deviceRes.data.rows ?? []).map((r) => ({
    device: r.dimensionValues[0].value,
    sessions: Number(r.metricValues[0].value),
    users: Number(r.metricValues[1].value),
  }));

  // Parse countries
  const countries = (countryRes.data.rows ?? []).map((r) => ({
    country: r.dimensionValues[0].value,
    sessions: Number(r.metricValues[0].value),
    users: Number(r.metricValues[1].value),
  }));

  // Parse top pages
  const pages = (pagesRes.data.rows ?? []).map((r) => ({
    path: r.dimensionValues[0].value,
    views: Number(r.metricValues[0].value),
    users: Number(r.metricValues[1].value),
    avgDuration: parseFloat(Number(r.metricValues[2].value).toFixed(0)),
  }));

  // Parse new vs returning
  const userTypes = (userTypeRes.data.rows ?? []).map((r) => ({
    type: r.dimensionValues[0].value === "new" ? "New" : "Returning",
    sessions: Number(r.metricValues[0].value),
    users: Number(r.metricValues[1].value),
  }));

  return { totals, timeSeries, channels, sources, devices, countries, pages, userTypes };
}
