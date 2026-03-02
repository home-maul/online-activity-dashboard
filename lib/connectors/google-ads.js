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
 * Fetch Google Ads data via the GA4 Data API.
 * This uses GA4's built-in Google Ads dimensions/metrics,
 * so no separate developer token or API approval is needed.
 * Requires Google Ads to be linked to the GA4 property.
 */
export async function fetchAds(accessToken, { startDate, endDate }) {
  if (!PROPERTY_ID) {
    throw new Error("GA4_PROPERTY_ID is not configured");
  }

  const auth = createOAuth2Client(accessToken);
  const analyticsData = google.analyticsdata({ version: "v1beta", auth });

  const [totalsRes, timeSeriesRes, campaignRes] = await Promise.all([
    // Overall totals
    runReport(analyticsData, {
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: "advertiserAdImpressions" },
        { name: "advertiserAdClicks" },
        { name: "advertiserAdCost" },
        { name: "conversions" },
      ],
      dimensionFilter: {
        filter: {
          fieldName: "sessionDefaultChannelGroup",
          stringFilter: { matchType: "EXACT", value: "Paid Search" },
        },
      },
    }),
    // Daily time series
    runReport(analyticsData, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "advertiserAdImpressions" },
        { name: "advertiserAdClicks" },
        { name: "advertiserAdCost" },
        { name: "conversions" },
      ],
      dimensionFilter: {
        filter: {
          fieldName: "sessionDefaultChannelGroup",
          stringFilter: { matchType: "EXACT", value: "Paid Search" },
        },
      },
      orderBys: [{ dimension: { dimensionName: "date" } }],
    }),
    // By campaign
    runReport(analyticsData, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "sessionGoogleAdsCampaignName" }],
      metrics: [
        { name: "advertiserAdImpressions" },
        { name: "advertiserAdClicks" },
        { name: "advertiserAdCost" },
        { name: "conversions" },
      ],
      orderBys: [{ metric: { metricName: "advertiserAdClicks" }, desc: true }],
      limit: 20,
    }),
  ]);

  const parse = (r, i) => Number(r[i]?.value ?? 0);

  // Totals
  const row = totalsRes.data.rows?.[0]?.metricValues ?? [];
  const impressions = parse(row, 0);
  const clicks = parse(row, 1);
  const cost = parseFloat(parse(row, 2).toFixed(2));
  const conversions = parse(row, 3);

  const totals = {
    impressions,
    clicks,
    cost,
    conversions,
    ctr: impressions > 0 ? parseFloat(((clicks / impressions) * 100).toFixed(2)) : 0,
  };

  // Time series
  const timeSeries = (timeSeriesRes.data.rows ?? []).map((r) => ({
    date: r.dimensionValues[0].value.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"),
    impressions: Number(r.metricValues[0].value),
    clicks: Number(r.metricValues[1].value),
    cost: parseFloat(Number(r.metricValues[2].value).toFixed(2)),
    conversions: Number(r.metricValues[3].value),
  }));

  // Campaigns
  const campaigns = (campaignRes.data.rows ?? [])
    .filter((r) => r.dimensionValues[0].value !== "(not set)")
    .map((r) => {
      const imp = Number(r.metricValues[0].value);
      const cl = Number(r.metricValues[1].value);
      return {
        name: r.dimensionValues[0].value,
        impressions: imp,
        clicks: cl,
        cost: parseFloat(Number(r.metricValues[2].value).toFixed(2)),
        conversions: Number(r.metricValues[3].value),
        ctr: imp > 0 ? parseFloat(((cl / imp) * 100).toFixed(2)) : 0,
      };
    });

  return { totals, timeSeries, campaigns };
}
