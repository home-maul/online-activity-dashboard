/**
 * Meta Marketing API connector — direct access to Facebook/Instagram ad data.
 * Gives real impressions, spend, CPM, CPC, CTR — not filtered through GA4.
 *
 * Env vars:
 *   META_ACCESS_TOKEN  — System User or long-lived User access token
 *   META_AD_ACCOUNT_ID — Ad account ID (format: act_123456789)
 */

const GRAPH_API = "https://graph.facebook.com/v21.0";

async function fetchGraph(path, token, params = {}) {
  const url = new URL(`${GRAPH_API}${path}`);
  url.searchParams.set("access_token", token);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error?.message || `Meta API ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch Meta Ads data: totals, daily time series, campaigns, ad sets.
 */
export async function fetchMetaAds(token, { startDate, endDate }) {
  const accountId = process.env.META_AD_ACCOUNT_ID;
  if (!accountId) throw new Error("META_AD_ACCOUNT_ID is not configured");

  const timeRange = JSON.stringify({ since: startDate, until: endDate });
  const fields = "impressions,clicks,spend,cpc,cpm,ctr,actions,cost_per_action_type";

  // Fetch in parallel: account totals, daily breakdown, campaign breakdown
  const [totalsData, dailyData, campaignData] = await Promise.all([
    // Account-level totals
    fetchGraph(`/${accountId}/insights`, token, {
      fields,
      time_range: timeRange,
    }),
    // Daily time series
    fetchGraph(`/${accountId}/insights`, token, {
      fields: "impressions,clicks,spend,actions",
      time_range: timeRange,
      time_increment: 1,
    }),
    // By campaign
    fetchGraph(`/${accountId}/insights`, token, {
      fields: `campaign_name,${fields}`,
      time_range: timeRange,
      level: "campaign",
      limit: 50,
    }),
  ]);

  // Parse totals
  const t = totalsData.data?.[0] || {};
  const conversions = getConversions(t.actions);

  const totals = {
    impressions: Number(t.impressions || 0),
    clicks: Number(t.clicks || 0),
    spend: parseFloat(Number(t.spend || 0).toFixed(2)),
    cpc: parseFloat(Number(t.cpc || 0).toFixed(2)),
    cpm: parseFloat(Number(t.cpm || 0).toFixed(2)),
    ctr: parseFloat(Number(t.ctr || 0).toFixed(2)),
    conversions,
  };

  // Parse daily
  const timeSeries = (dailyData.data || []).map((d) => ({
    date: d.date_start,
    impressions: Number(d.impressions || 0),
    clicks: Number(d.clicks || 0),
    spend: parseFloat(Number(d.spend || 0).toFixed(2)),
    conversions: getConversions(d.actions),
  }));

  // Parse campaigns — handle pagination
  let allCampaignRows = campaignData.data || [];
  let nextPage = campaignData.paging?.next;
  while (nextPage) {
    const res = await fetch(nextPage);
    if (!res.ok) break;
    const page = await res.json();
    allCampaignRows = allCampaignRows.concat(page.data || []);
    nextPage = page.paging?.next;
  }

  // Aggregate by campaign name (multiple rows per campaign if date split)
  const campaignMap = {};
  for (const row of allCampaignRows) {
    const name = row.campaign_name || "Unknown";
    if (!campaignMap[name]) {
      campaignMap[name] = { name, impressions: 0, clicks: 0, spend: 0, conversions: 0 };
    }
    campaignMap[name].impressions += Number(row.impressions || 0);
    campaignMap[name].clicks += Number(row.clicks || 0);
    campaignMap[name].spend += Number(row.spend || 0);
    campaignMap[name].conversions += getConversions(row.actions);
  }

  const campaigns = Object.values(campaignMap)
    .map((c) => ({
      ...c,
      spend: parseFloat(c.spend.toFixed(2)),
      ctr: c.impressions > 0 ? parseFloat(((c.clicks / c.impressions) * 100).toFixed(2)) : 0,
      cpc: c.clicks > 0 ? parseFloat((c.spend / c.clicks).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.spend - a.spend);

  return { totals, timeSeries, campaigns };
}

/**
 * Extract conversion count from Meta's actions array.
 * Looks for common conversion action types.
 */
function getConversions(actions) {
  if (!Array.isArray(actions)) return 0;
  const convTypes = [
    "offsite_conversion.fb_pixel_purchase",
    "offsite_conversion.fb_pixel_lead",
    "offsite_conversion.fb_pixel_complete_registration",
    "lead",
    "purchase",
    "complete_registration",
    "omni_purchase",
    "omni_complete_registration",
  ];
  let total = 0;
  for (const a of actions) {
    if (convTypes.includes(a.action_type)) {
      total += Number(a.value || 0);
    }
  }
  // Fallback: if no specific conversions, check for any "offsite_conversion" prefix
  if (total === 0) {
    for (const a of actions) {
      if (a.action_type?.startsWith("offsite_conversion")) {
        total += Number(a.value || 0);
      }
    }
  }
  return total;
}
