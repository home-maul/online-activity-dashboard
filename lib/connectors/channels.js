import { google } from "googleapis";
import { createOAuth2Client } from "@/lib/google";

const PROPERTY_ID = process.env.GA4_PROPERTY_ID;

function runReport(analyticsData, requestBody) {
  return analyticsData.properties.runReport({
    property: `properties/${PROPERTY_ID}`,
    requestBody,
  });
}

const CHANNEL_COLORS = {
  "Paid Search": "#070E1A",
  "Paid Social": "#8896A8",
  "Organic Search": "#59A9FF",
  "Organic Social": "#C6D2DF",
  "Direct": "#4A6FA5",
  "Referral": "#1a2540",
  "Email": "#3D7BD9",
  "Display": "#000055",
};

/**
 * Fetch cross-channel overview from GA4.
 * Groups by sessionDefaultChannelGroup.
 */
export async function fetchChannels(accessToken, { startDate, endDate }) {
  if (!PROPERTY_ID) throw new Error("GA4_PROPERTY_ID is not configured");

  const auth = createOAuth2Client(accessToken);
  const analyticsData = google.analyticsdata({ version: "v1beta", auth });

  // Compute previous period
  const s = new Date(startDate);
  const e = new Date(endDate);
  const diff = e - s;
  const prevEnd = new Date(s.getTime() - 86400000);
  const prevStart = new Date(prevEnd.getTime() - diff);
  const prev = {
    startDate: prevStart.toISOString().split("T")[0],
    endDate: prevEnd.toISOString().split("T")[0],
  };

  const [
    totalsRes,
    prevTotalsRes,
    channelsRes,
    timeSeriesRes,
    sourceChannelRes,
  ] = await Promise.all([
    // Current totals
    runReport(analyticsData, {
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "conversions" },
        { name: "engagementRate" },
        { name: "advertiserAdCost" },
      ],
    }),
    // Previous totals for comparison
    runReport(analyticsData, {
      dateRanges: [{ startDate: prev.startDate, endDate: prev.endDate }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "conversions" },
        { name: "engagementRate" },
        { name: "advertiserAdCost" },
      ],
    }),
    // By channel group
    runReport(analyticsData, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "conversions" },
        { name: "engagementRate" },
        { name: "bounceRate" },
      ],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 12,
    }),
    // Daily time series by channel
    runReport(analyticsData, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "date" }, { name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }, { name: "conversions" }],
      orderBys: [{ dimension: { dimensionName: "date" } }],
    }),
    // Source + channel for more detail
    runReport(analyticsData, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "sessionSource" }, { name: "sessionDefaultChannelGroup" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "conversions" },
      ],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 20,
    }),
  ]);

  const parse = (r, i) => Number(r[i]?.value ?? 0);
  const pctChange = (curr, prev) => {
    if (!prev || prev === 0) return curr > 0 ? 100 : 0;
    return parseFloat((((curr - prev) / prev) * 100).toFixed(1));
  };

  // Totals
  const row = totalsRes.data.rows?.[0]?.metricValues ?? [];
  const prevRow = prevTotalsRes.data.rows?.[0]?.metricValues ?? [];
  const sessions = parse(row, 0);
  const prevSessions = parse(prevRow, 0);
  const users = parse(row, 1);
  const prevUsers = parse(prevRow, 1);
  const conversions = parse(row, 2);
  const prevConversions = parse(prevRow, 2);
  const adCost = parseFloat(parse(row, 4).toFixed(2));
  const prevAdCost = parseFloat(parse(prevRow, 4).toFixed(2));

  const totals = {
    sessions,
    users,
    conversions,
    adCost,
    convRate: sessions > 0 ? parseFloat(((conversions / sessions) * 100).toFixed(1)) : 0,
    change: {
      sessions: pctChange(sessions, prevSessions),
      users: pctChange(users, prevUsers),
      conversions: pctChange(conversions, prevConversions),
      adCost: pctChange(adCost, prevAdCost),
    },
  };

  // Channels
  const channels = (channelsRes.data.rows ?? []).map((r) => {
    const ch = r.dimensionValues[0].value;
    const sess = Number(r.metricValues[0].value);
    const usr = Number(r.metricValues[1].value);
    const conv = Number(r.metricValues[2].value);
    return {
      channel: ch,
      sessions: sess,
      users: usr,
      conversions: conv,
      engagementRate: parseFloat((Number(r.metricValues[3].value) * 100).toFixed(1)),
      bounceRate: parseFloat((Number(r.metricValues[4].value) * 100).toFixed(1)),
      convRate: sess > 0 ? parseFloat(((conv / sess) * 100).toFixed(2)) : 0,
      color: CHANNEL_COLORS[ch] || "#8896A8",
    };
  });

  // Time series — aggregate daily, keeping top channels separate
  const topChannels = channels.slice(0, 4).map((c) => c.channel);
  const dailyMap = {};
  for (const r of timeSeriesRes.data.rows ?? []) {
    const date = r.dimensionValues[0].value.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
    const ch = r.dimensionValues[1].value;
    const sess = Number(r.metricValues[0].value);
    const conv = Number(r.metricValues[1].value);

    if (!dailyMap[date]) {
      dailyMap[date] = { date, totalSessions: 0, totalConversions: 0 };
      for (const tc of topChannels) {
        dailyMap[date][tc] = 0;
      }
    }
    dailyMap[date].totalSessions += sess;
    dailyMap[date].totalConversions += conv;
    if (topChannels.includes(ch)) {
      dailyMap[date][ch] += sess;
    }
  }
  const timeSeries = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

  // Channel mix for donut
  const totalSessions = channels.reduce((s, c) => s + c.sessions, 0);
  const channelMix = channels.slice(0, 6).map((c) => ({
    name: c.channel,
    value: totalSessions > 0 ? Math.round((c.sessions / totalSessions) * 100) : 0,
    sessions: c.sessions,
  }));

  // Source details
  const sources = (sourceChannelRes.data.rows ?? []).map((r) => ({
    source: r.dimensionValues[0].value,
    channel: r.dimensionValues[1].value,
    sessions: Number(r.metricValues[0].value),
    users: Number(r.metricValues[1].value),
    conversions: Number(r.metricValues[2].value),
  }));

  return { totals, channels, timeSeries, topChannels, channelMix, sources };
}
