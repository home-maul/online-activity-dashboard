/**
 * Fetch Google Ads campaign data via the REST API.
 * Uses the access token from the user's OAuth session directly.
 */

const ADS_API_VERSION = "v17";
const ADS_BASE = `https://googleads.googleapis.com/${ADS_API_VERSION}`;

export async function fetchAds(accessToken, { startDate, endDate }) {
  const customerId = (process.env.GOOGLE_ADS_CUSTOMER_ID || "").replace(/-/g, "");
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;

  if (!developerToken) {
    throw new Error("GOOGLE_ADS_DEVELOPER_TOKEN is not configured");
  }
  if (!customerId) {
    throw new Error("GOOGLE_ADS_CUSTOMER_ID is not configured");
  }

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

  const res = await fetch(
    `${ADS_BASE}/customers/${customerId}/googleAds:searchStream`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": developerToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail =
      body?.error?.message ||
      body?.[0]?.error?.message ||
      `Google Ads API ${res.status}`;
    throw new Error(detail);
  }

  const json = await res.json();

  // searchStream returns an array of result batches
  const rows = [];
  for (const batch of json) {
    if (batch.results) {
      rows.push(...batch.results);
    }
  }

  // Aggregate totals
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalCostMicros = 0;
  let totalConversions = 0;

  const dailyMap = {};
  const campaigns = {};

  for (const row of rows) {
    const date = row.segments.date;
    const impressions = Number(row.metrics.impressions || 0);
    const clicks = Number(row.metrics.clicks || 0);
    const costMicros = Number(row.metrics.costMicros || 0);
    const conversions = Number(row.metrics.conversions || 0);
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
