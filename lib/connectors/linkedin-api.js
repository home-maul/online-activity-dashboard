/**
 * LinkedIn Marketing API connector — direct access to organic posts, ads, and followers.
 * Uses the REST API with LinkedIn-Version: 202503.
 *
 * Key API changes (2025+):
 *   - Campaigns: GET /rest/adAccounts/{id}/adCampaigns?q=search
 *   - Analytics: GET /rest/adAnalytics?q=analytics&accounts=List(urn:li:sponsoredAccount:{id})
 *              dateRange=(start:(year:Y,month:M,day:D),end:(year:Y,month:M,day:D))
 *   - Creatives: GET /rest/adAccounts/{id}/creatives?q=criteria
 *   - Organic posts/followers: v2 endpoints (require Community Management API)
 *
 * Env vars:
 *   LINKEDIN_ACCESS_TOKEN   — OAuth2 access token
 *   LINKEDIN_ORGANIZATION_ID — Organization ID (numeric)
 *   LINKEDIN_AD_ACCOUNT_ID   — Sponsored account ID (numeric)
 */

const LINKEDIN_REST = "https://api.linkedin.com/rest";
const LINKEDIN_V2 = "https://api.linkedin.com/v2";
const LINKEDIN_VERSION = "202503";

/**
 * Encode a LinkedIn REST API parameter value.
 * Preserves structural chars ( ) , : used in List() and dateRange() syntax,
 * but encodes colons inside URNs (urn:li:...) to %3A.
 */
function encodeRestValue(val) {
  // Encode URN colons: replace urn:li:... patterns with encoded colons
  const encoded = val.replace(/urn:li:([^,)]+)/g, (match) => match.replace(/:/g, "%3A"));
  return encoded;
}

/**
 * Fetch from the REST API (versioned).
 * The url parameter should be the full path including any account nesting.
 */
async function fetchRest(path, token, params = {}) {
  // Build URL manually to avoid double-encoding of List() and dateRange() syntax
  const base = `${LINKEDIN_REST}${path}`;
  const parts = [];
  for (const [k, v] of Object.entries(params)) {
    parts.push(`${encodeURIComponent(k)}=${encodeRestValue(v)}`);
  }
  const url = parts.length ? `${base}?${parts.join("&")}` : base;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "LinkedIn-Version": LINKEDIN_VERSION,
      "X-Restli-Protocol-Version": "2.0.0",
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `LinkedIn REST API ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch from the v2 API (unversioned, used for organic/follower endpoints).
 */
async function fetchV2(path, token, params = {}) {
  const url = new URL(`${LINKEDIN_V2}${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Restli-Protocol-Version": "2.0.0",
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `LinkedIn v2 API ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch organic post data: list of posts + per-post metrics + aggregate totals.
 * Requires Community Management API approval.
 */
export async function fetchLinkedInOrganicPosts(token, orgId, { startDate, endDate }) {
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime() + 86400000;

  const [postsData, statsData] = await Promise.all([
    fetchV2("/ugcPosts", token, {
      q: "authors",
      authors: `List(urn:li:organization:${orgId})`,
      count: "50",
    }),
    fetchV2("/organizationalEntityShareStatistics", token, {
      q: "organizationalEntity",
      organizationalEntity: `urn:li:organization:${orgId}`,
      "timeIntervals.timeGranularityType": "DAY",
      "timeIntervals.timeRange.start": String(startMs),
      "timeIntervals.timeRange.end": String(endMs),
    }),
  ]);

  const elements = statsData.elements || [];
  let totalImpressions = 0;
  let totalReactions = 0;
  let totalComments = 0;
  let totalShares = 0;
  let totalClicks = 0;

  for (const el of elements) {
    const stats = el.totalShareStatistics || {};
    totalImpressions += Number(stats.impressionCount || 0);
    totalReactions += Number(stats.likeCount || 0);
    totalComments += Number(stats.commentCount || 0);
    totalShares += Number(stats.shareCount || 0);
    totalClicks += Number(stats.clickCount || 0);
  }

  const totalEngagements = totalReactions + totalComments + totalShares + totalClicks;
  const engagement = totalImpressions > 0
    ? parseFloat(((totalEngagements / totalImpressions) * 100).toFixed(2))
    : 0;

  const rawPosts = postsData.elements || [];
  const posts = rawPosts
    .filter((p) => {
      const created = p.created?.time || p.firstPublishedAt || 0;
      return created >= startMs && created <= endMs;
    })
    .map((p) => {
      const text = p.specificContent?.["com.linkedin.ugc.ShareContent"]?.shareCommentary?.text
        || p.commentary || "";
      const shareMedia = p.specificContent?.["com.linkedin.ugc.ShareContent"]?.media || [];
      const stats = p.statistics || {};

      const firstMedia = shareMedia[0] || {};
      const preview = {
        type: firstMedia.mediaType || null,
        imageUrl: firstMedia.thumbnails?.[0]?.url || firstMedia.originalUrl || null,
        title: firstMedia.title?.text || null,
        url: firstMedia.originalUrl || null,
      };

      return {
        id: p.id || p.activity,
        text,
        publishedAt: p.created?.time || p.firstPublishedAt || 0,
        impressions: Number(stats.impressionCount || 0),
        reactions: Number(stats.likeCount || 0),
        comments: Number(stats.commentCount || 0),
        shares: Number(stats.shareCount || 0),
        clicks: Number(stats.clickCount || 0),
        preview: preview.imageUrl || preview.title ? preview : null,
      };
    })
    .sort((a, b) => b.publishedAt - a.publishedAt);

  return {
    totals: { impressions: totalImpressions, reactions: totalReactions, comments: totalComments, shares: totalShares, engagement },
    posts,
  };
}

/**
 * Build a dateRange parameter in LinkedIn REST format:
 * (start:(year:Y,month:M,day:D),end:(year:Y,month:M,day:D))
 */
function buildDateRange(startDate, endDate) {
  const s = new Date(startDate);
  const e = new Date(endDate);
  return `(start:(year:${s.getFullYear()},month:${s.getMonth() + 1},day:${s.getDate()}),end:(year:${e.getFullYear()},month:${e.getMonth() + 1},day:${e.getDate()}))`;
}

/**
 * Fetch LinkedIn Ads data: totals, daily time series, campaigns.
 */
export async function fetchLinkedInAds(token, adAccountId, { startDate, endDate }) {
  const accountUrn = `urn:li:sponsoredAccount:${adAccountId}`;
  const dateRange = buildDateRange(startDate, endDate);

  // Fetch analytics and campaign names in parallel
  const [analyticsData, campaignsData] = await Promise.all([
    fetchRest("/adAnalytics", token, {
      q: "analytics",
      pivot: "CAMPAIGN",
      timeGranularity: "DAILY",
      accounts: `List(${accountUrn})`,
      dateRange,
      fields: "impressions,clicks,costInLocalCurrency,externalWebsiteConversions,dateRange,pivotValues",
    }),
    fetchRest(`/adAccounts/${adAccountId}/adCampaigns`, token, {
      q: "search",
      count: "100",
    }),
  ]);

  // Build campaign name lookup from URN → name
  const campaignNameMap = {};
  for (const c of campaignsData.elements || []) {
    const id = c.id;
    const name = c.name || "Unknown Campaign";
    if (id) {
      campaignNameMap[String(id)] = name;
      campaignNameMap[`urn:li:sponsoredCampaign:${id}`] = name;
    }
  }

  const rows = analyticsData.elements || [];
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalSpend = 0;
  let totalConversions = 0;
  const dailyMap = {};
  const campaignAgg = {};

  for (const row of rows) {
    const impressions = Number(row.impressions || 0);
    const clicks = Number(row.clicks || 0);
    // costInLocalCurrency is now a string in microcurrency
    const rawCost = parseFloat(row.costInLocalCurrency || "0");
    const spend = rawCost / 100;
    const conversions = Number(row.externalWebsiteConversions || 0);

    totalImpressions += impressions;
    totalClicks += clicks;
    totalSpend += spend;
    totalConversions += conversions;

    // Daily aggregation
    const dr = row.dateRange?.start;
    if (dr) {
      const dateKey = `${dr.year}-${String(dr.month).padStart(2, "0")}-${String(dr.day).padStart(2, "0")}`;
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { date: dateKey, impressions: 0, clicks: 0, spend: 0, conversions: 0 };
      }
      dailyMap[dateKey].impressions += impressions;
      dailyMap[dateKey].clicks += clicks;
      dailyMap[dateKey].spend += spend;
      dailyMap[dateKey].conversions += conversions;
    }

    // Campaign aggregation — pivotValues is now an array
    const pivotValues = row.pivotValues || [];
    const campaignUrn = pivotValues[0] || "";
    const campaignId = campaignUrn.replace("urn:li:sponsoredCampaign:", "");
    const campaignName = campaignNameMap[campaignUrn] || campaignNameMap[campaignId] || `Campaign ${campaignId}`;
    if (!campaignAgg[campaignName]) {
      campaignAgg[campaignName] = { name: campaignName, impressions: 0, clicks: 0, spend: 0, conversions: 0 };
    }
    campaignAgg[campaignName].impressions += impressions;
    campaignAgg[campaignName].clicks += clicks;
    campaignAgg[campaignName].spend += spend;
    campaignAgg[campaignName].conversions += conversions;
  }

  totalSpend = parseFloat(totalSpend.toFixed(2));

  const totals = {
    impressions: totalImpressions,
    clicks: totalClicks,
    spend: totalSpend,
    cpc: totalClicks > 0 ? parseFloat((totalSpend / totalClicks).toFixed(2)) : 0,
    ctr: totalImpressions > 0 ? parseFloat(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0,
    conversions: totalConversions,
  };

  const timeSeries = Object.values(dailyMap)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({ ...d, spend: parseFloat(d.spend.toFixed(2)) }));

  const campaigns = Object.values(campaignAgg)
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
 * Fetch ad creatives for each campaign.
 * Returns creative metadata (name, campaign, status, content reference).
 * Note: Full creative content (images, headlines) requires resolving UGC post references,
 * which needs the Community Management API.
 */
export async function fetchLinkedInAdCreatives(token, adAccountId) {
  // Fetch creatives and campaigns in parallel
  const [creativesData, campaignsData] = await Promise.all([
    fetchRest(`/adAccounts/${adAccountId}/creatives`, token, {
      q: "criteria",
      sortOrder: "ASCENDING",
    }),
    fetchRest(`/adAccounts/${adAccountId}/adCampaigns`, token, {
      q: "search",
      count: "100",
    }),
  ]);

  const campaignNameMap = {};
  for (const c of campaignsData.elements || []) {
    const urn = `urn:li:sponsoredCampaign:${c.id}`;
    campaignNameMap[urn] = c.name || "Unknown Campaign";
  }

  const creatives = [];
  for (const cr of creativesData.elements || []) {
    const campaignUrn = cr.campaign || "";
    const campaignName = campaignNameMap[campaignUrn] || "Unknown Campaign";

    const content = cr.content || {};
    // New API: creatives reference ugcPosts or have eventAd/textAd content
    const reference = content.reference || null;
    const eventAd = content.eventAd || null;
    const textAd = content.textAd || null;

    creatives.push({
      id: cr.id,
      name: cr.name || "",
      campaignUrn,
      campaignName,
      status: cr.intendedStatus || "ACTIVE",
      isServing: cr.isServing || false,
      contentReference: reference,
      contentType: eventAd ? "event" : textAd ? "text" : reference ? "sponsored" : "unknown",
      headline: textAd?.headline || cr.name || "",
      description: textAd?.description || "",
      landingUrl: textAd?.landingUrl || "",
      imageUrl: null, // Would need to resolve ugcPost reference for images
    });
  }

  return creatives;
}

/**
 * Fetch LinkedIn follower statistics for an organization.
 * Uses v2 API (requires Community Management API scope).
 */
export async function fetchLinkedInFollowers(token, orgId) {
  const data = await fetchV2("/organizationalEntityFollowerStatistics", token, {
    q: "organizationalEntity",
    organizationalEntity: `urn:li:organization:${orgId}`,
  });

  const el = data.elements?.[0] || {};
  const followerCounts = el.followerCounts || {};

  return {
    total: Number(followerCounts.organicFollowerCount || 0) + Number(followerCounts.paidFollowerCount || 0),
    organic: Number(followerCounts.organicFollowerCount || 0),
    paid: Number(followerCounts.paidFollowerCount || 0),
  };
}
