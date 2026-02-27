import { GoogleAdsApi } from "google-ads-api";

/**
 * Fetch Google Ads campaign-level data via GAQL.
 */
export async function fetchAds(accessToken, { startDate, endDate }) {
  const client = new GoogleAdsApi({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
  });

  const customer = client.Customer({
    customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
    refresh_token: "", // not used — we set the access_token directly
    login_customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
  });

  // Override the access token for this request
  customer.credentials = { access_token: accessToken };

  const query = `
    SELECT
      campaign.name,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      segments.date
    FROM campaign
    WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
    ORDER BY segments.date ASC
  `;

  const rows = await customer.query(query);

  // Aggregate totals
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalCostMicros = 0;
  let totalConversions = 0;

  const dailyMap = {};
  const campaigns = {};

  for (const row of rows) {
    const date = row.segments.date;
    const impressions = Number(row.metrics.impressions);
    const clicks = Number(row.metrics.clicks);
    const costMicros = Number(row.metrics.cost_micros);
    const conversions = Number(row.metrics.conversions);
    const campaignName = row.campaign.name;

    totalImpressions += impressions;
    totalClicks += clicks;
    totalCostMicros += costMicros;
    totalConversions += conversions;

    // Daily aggregation
    if (!dailyMap[date]) {
      dailyMap[date] = { date, impressions: 0, clicks: 0, cost: 0, conversions: 0 };
    }
    dailyMap[date].impressions += impressions;
    dailyMap[date].clicks += clicks;
    dailyMap[date].cost += costMicros / 1_000_000;
    dailyMap[date].conversions += conversions;

    // Per-campaign aggregation
    if (!campaigns[campaignName]) {
      campaigns[campaignName] = { name: campaignName, impressions: 0, clicks: 0, cost: 0, conversions: 0 };
    }
    campaigns[campaignName].impressions += impressions;
    campaigns[campaignName].clicks += clicks;
    campaigns[campaignName].cost += costMicros / 1_000_000;
    campaigns[campaignName].conversions += conversions;
  }

  const totals = {
    impressions: totalImpressions,
    clicks: totalClicks,
    cost: parseFloat((totalCostMicros / 1_000_000).toFixed(2)),
    conversions: totalConversions,
    ctr: totalImpressions > 0
      ? parseFloat(((totalClicks / totalImpressions) * 100).toFixed(2))
      : 0,
  };

  const timeSeries = Object.values(dailyMap).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  // Round cost in timeSeries
  for (const day of timeSeries) {
    day.cost = parseFloat(day.cost.toFixed(2));
  }

  const campaignList = Object.values(campaigns).map((c) => ({
    ...c,
    cost: parseFloat(c.cost.toFixed(2)),
    ctr: c.impressions > 0
      ? parseFloat(((c.clicks / c.impressions) * 100).toFixed(2))
      : 0,
  }));

  return { totals, timeSeries, campaigns: campaignList };
}
