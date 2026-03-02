/**
 * LinkedIn connector — fetches both Ads and Organic page data.
 *
 * Env vars needed:
 *   LINKEDIN_ACCESS_TOKEN   — OAuth 2.0 access token
 *   LINKEDIN_ORGANIZATION_ID — numeric org ID (for organic page stats)
 *   LINKEDIN_AD_ACCOUNT_ID  — numeric ad account ID (for ads reporting)
 *
 * LinkedIn API docs:
 *   https://learn.microsoft.com/en-us/linkedin/marketing/
 */

const API_BASE = "https://api.linkedin.com/rest";
const API_VERSION = "202401";

function headers(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "LinkedIn-Version": API_VERSION,
    "X-Restli-Protocol-Version": "2.0.0",
  };
}

function toDateRange(startDate, endDate) {
  const s = new Date(startDate);
  const e = new Date(endDate);
  return `(start:(year:${s.getFullYear()},month:${s.getMonth() + 1},day:${s.getDate()}),end:(year:${e.getFullYear()},month:${e.getMonth() + 1},day:${e.getDate()}))`;
}

function toEpoch(dateStr) {
  return new Date(dateStr).getTime();
}

// ─── Ads ────────────────────────────────────────────────

export async function fetchLinkedInAds(accessToken, { startDate, endDate }) {
  const accountId = process.env.LINKEDIN_AD_ACCOUNT_ID;
  if (!accountId) throw new Error("LINKEDIN_AD_ACCOUNT_ID is not configured");

  const dateRange = toDateRange(startDate, endDate);
  const accountUrn = `urn:li:sponsoredAccount:${accountId}`;

  // Fetch daily totals
  const dailyUrl = `${API_BASE}/adAnalytics?q=analytics&dateRange=${dateRange}&timeGranularity=DAILY&accounts=List(${encodeURIComponent(accountUrn)})&pivot=CAMPAIGN`;

  const res = await fetch(dailyUrl, { headers: headers(accessToken) });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `LinkedIn Ads API ${res.status}`);
  }
  const json = await res.json();
  const elements = json.elements || [];

  // Aggregate by date and campaign
  const dailyMap = {};
  const campaignMap = {};
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalCost = 0;
  let totalConversions = 0;

  for (const el of elements) {
    const dr = el.dateRange?.start;
    const date = dr
      ? `${dr.year}-${String(dr.month).padStart(2, "0")}-${String(dr.day).padStart(2, "0")}`
      : null;

    const impressions = Number(el.impressions || 0);
    const clicks = Number(el.clicks || 0);
    const cost = Number(el.costInLocalCurrency || 0) / 100; // LinkedIn reports in cents
    const conversions = Number(el.externalWebsiteConversions || 0);

    totalImpressions += impressions;
    totalClicks += clicks;
    totalCost += cost;
    totalConversions += conversions;

    if (date) {
      if (!dailyMap[date]) {
        dailyMap[date] = { date, impressions: 0, clicks: 0, cost: 0, conversions: 0 };
      }
      dailyMap[date].impressions += impressions;
      dailyMap[date].clicks += clicks;
      dailyMap[date].cost += cost;
      dailyMap[date].conversions += conversions;
    }

    const campaignUrn = el.pivotValues?.[0] || "Unknown";
    if (!campaignMap[campaignUrn]) {
      campaignMap[campaignUrn] = { urn: campaignUrn, impressions: 0, clicks: 0, cost: 0, conversions: 0 };
    }
    campaignMap[campaignUrn].impressions += impressions;
    campaignMap[campaignUrn].clicks += clicks;
    campaignMap[campaignUrn].cost += cost;
    campaignMap[campaignUrn].conversions += conversions;
  }

  // Resolve campaign names
  const campaignUrns = Object.keys(campaignMap);
  const campaignNames = await resolveCampaignNames(accessToken, campaignUrns);

  const campaigns = Object.values(campaignMap).map((c) => ({
    name: campaignNames[c.urn] || c.urn,
    impressions: c.impressions,
    clicks: c.clicks,
    cost: parseFloat(c.cost.toFixed(2)),
    conversions: c.conversions,
    ctr: c.impressions > 0 ? parseFloat(((c.clicks / c.impressions) * 100).toFixed(2)) : 0,
  }));

  const timeSeries = Object.values(dailyMap)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({ ...d, cost: parseFloat(d.cost.toFixed(2)) }));

  return {
    totals: {
      impressions: totalImpressions,
      clicks: totalClicks,
      cost: parseFloat(totalCost.toFixed(2)),
      conversions: totalConversions,
      ctr: totalImpressions > 0
        ? parseFloat(((totalClicks / totalImpressions) * 100).toFixed(2))
        : 0,
    },
    timeSeries,
    campaigns,
  };
}

async function resolveCampaignNames(accessToken, urns) {
  const map = {};
  // Batch fetch campaign details
  for (const urn of urns) {
    try {
      const id = urn.split(":").pop();
      const res = await fetch(`${API_BASE}/adCampaigns/${id}`, {
        headers: headers(accessToken),
      });
      if (res.ok) {
        const data = await res.json();
        map[urn] = data.name || urn;
      }
    } catch {
      // Skip — will use URN as fallback name
    }
  }
  return map;
}

// ─── Organic ────────────────────────────────────────────

export async function fetchLinkedInOrganic(accessToken, { startDate, endDate }) {
  const orgId = process.env.LINKEDIN_ORGANIZATION_ID;
  if (!orgId) throw new Error("LINKEDIN_ORGANIZATION_ID is not configured");

  const orgUrn = `urn:li:organization:${orgId}`;

  // Fetch follower count
  const followersRes = await fetch(
    `${API_BASE}/networkSizes/${encodeURIComponent(orgUrn)}?edgeType=CompanyFollowedByMember`,
    { headers: headers(accessToken) }
  );
  let followers = 0;
  if (followersRes.ok) {
    const fData = await followersRes.json();
    followers = fData.firstDegreeSize || 0;
  }

  // Fetch page statistics (share stats over time)
  const timeRange = `(start:${toEpoch(startDate)},end:${toEpoch(endDate)})`;
  const statsUrl = `${API_BASE}/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${encodeURIComponent(orgUrn)}&timeIntervals=(timeRange:${timeRange},timeGranularityType:DAY)`;

  const statsRes = await fetch(statsUrl, { headers: headers(accessToken) });
  if (!statsRes.ok) {
    const body = await statsRes.json().catch(() => ({}));
    throw new Error(body.message || `LinkedIn Organic API ${statsRes.status}`);
  }
  const statsJson = await statsRes.json();
  const elements = statsJson.elements || [];

  let totalImpressions = 0;
  let totalClicks = 0;
  let totalLikes = 0;
  let totalComments = 0;
  let totalShares = 0;
  let totalEngagement = 0;
  const timeSeries = [];

  for (const el of elements) {
    const stats = el.totalShareStatistics || {};
    const impressions = Number(stats.impressionCount || 0);
    const clicks = Number(stats.clickCount || 0);
    const likes = Number(stats.likeCount || 0);
    const comments = Number(stats.commentCount || 0);
    const shares = Number(stats.shareCount || 0);
    const engagement = Number(stats.engagement || 0);

    totalImpressions += impressions;
    totalClicks += clicks;
    totalLikes += likes;
    totalComments += comments;
    totalShares += shares;
    totalEngagement += engagement;

    // Extract date from timeRange
    const start = el.timeRange?.start;
    if (start) {
      const d = new Date(start);
      timeSeries.push({
        date: d.toISOString().split("T")[0],
        impressions,
        clicks,
        likes,
        comments,
        shares,
        engagement: parseFloat((engagement * 100).toFixed(2)),
      });
    }
  }

  return {
    totals: {
      followers,
      impressions: totalImpressions,
      clicks: totalClicks,
      likes: totalLikes,
      comments: totalComments,
      shares: totalShares,
      engagement: totalImpressions > 0
        ? parseFloat((((totalLikes + totalComments + totalShares + totalClicks) / totalImpressions) * 100).toFixed(2))
        : 0,
    },
    timeSeries: timeSeries.sort((a, b) => a.date.localeCompare(b.date)),
  };
}
