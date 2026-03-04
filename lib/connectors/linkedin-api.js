/**
 * LinkedIn Marketing API connector — direct access to organic posts, ads, and followers.
 * Gives real impressions, reactions, comments, shares, spend, CPC, CTR.
 *
 * Env vars:
 *   LINKEDIN_ACCESS_TOKEN   — OAuth2 access token
 *   LINKEDIN_ORGANIZATION_ID — Organization ID (numeric)
 *   LINKEDIN_AD_ACCOUNT_ID   — Sponsored account ID (numeric)
 */

const LINKEDIN_API = "https://api.linkedin.com/rest";

async function fetchLinkedIn(path, token, params = {}) {
  const url = new URL(`${LINKEDIN_API}${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "LinkedIn-Version": "202402",
      "X-Restli-Protocol-Version": "2.0.0",
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `LinkedIn API ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch organic post data: list of posts + per-post metrics + aggregate totals.
 */
export async function fetchLinkedInOrganicPosts(token, orgId, { startDate, endDate }) {
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime() + 86400000; // end of day

  // Fetch posts and aggregate stats in parallel
  const [postsData, statsData] = await Promise.all([
    fetchLinkedIn("/posts", token, {
      q: "author",
      author: `urn:li:organization:${orgId}`,
      count: "50",
    }),
    fetchLinkedIn("/organizationalEntityShareStatistics", token, {
      q: "organizationalEntity",
      organizationalEntity: `urn:li:organization:${orgId}`,
      "timeIntervals.timeGranularityType": "DAY",
      "timeIntervals.timeRange.start": String(startMs),
      "timeIntervals.timeRange.end": String(endMs),
    }),
  ]);

  // Parse aggregate totals from time-bucketed stats
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

  // Parse individual posts
  const rawPosts = postsData.elements || [];
  const posts = rawPosts
    .filter((p) => {
      const created = p.createdAt || p.publishedAt || 0;
      return created >= startMs && created <= endMs;
    })
    .map((p) => {
      const text = p.commentary || p.specificContent?.["com.linkedin.ugc.ShareContent"]?.shareCommentary?.text || "";
      const stats = p.statistics || {};

      // Extract preview: image, article, or video thumbnail
      const content = p.content || {};
      const media = content.media || content.multiImage?.images?.[0] || null;
      const article = content.article || null;
      const preview = {
        type: article ? "article" : media ? "media" : null,
        imageUrl: media?.id
          ? `https://media.licdn.com/dms/image/${media.id}`
          : article?.thumbnail
          || media?.thumbnailUrl
          || media?.originalUrl
          || null,
        title: article?.title || null,
        url: article?.source || null,
      };

      return {
        id: p.id || p.activity,
        text,
        publishedAt: p.createdAt || p.publishedAt || 0,
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
    totals: {
      impressions: totalImpressions,
      reactions: totalReactions,
      comments: totalComments,
      shares: totalShares,
      engagement,
    },
    posts,
  };
}

/**
 * Fetch LinkedIn Ads data: totals, daily time series, campaigns.
 */
export async function fetchLinkedInAds(token, adAccountId, { startDate, endDate }) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const dateRangeParams = {
    "dateRange.start.year": String(start.getFullYear()),
    "dateRange.start.month": String(start.getMonth() + 1),
    "dateRange.start.day": String(start.getDate()),
    "dateRange.end.year": String(end.getFullYear()),
    "dateRange.end.month": String(end.getMonth() + 1),
    "dateRange.end.day": String(end.getDate()),
  };

  const accountUrn = `urn:li:sponsoredAccount:${adAccountId}`;

  // Fetch analytics and campaign names in parallel
  const [analyticsData, campaignsData] = await Promise.all([
    fetchLinkedIn("/adAnalytics", token, {
      q: "analytics",
      pivot: "CAMPAIGN",
      timeGranularity: "DAILY",
      "accounts[0]": accountUrn,
      fields: "impressions,clicks,costInLocalCurrency,externalWebsiteConversions",
      ...dateRangeParams,
    }),
    fetchLinkedIn("/adCampaigns", token, {
      q: "search",
      "search.account.values[0]": accountUrn,
    }),
  ]);

  // Build campaign name lookup
  const campaignNameMap = {};
  for (const c of campaignsData.elements || []) {
    const urn = c.id || c["$URN"];
    const name = c.name || "Unknown Campaign";
    if (urn) campaignNameMap[String(urn)] = name;
    // Also map from full URN
    if (c["$URN"]) campaignNameMap[c["$URN"]] = name;
  }

  // Parse analytics rows
  const rows = analyticsData.elements || [];

  // Aggregate totals and daily time series
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalSpend = 0;
  let totalConversions = 0;
  const dailyMap = {};
  const campaignAgg = {};

  for (const row of rows) {
    const impressions = Number(row.impressions || 0);
    const clicks = Number(row.clicks || 0);
    const spend = parseFloat(Number(row.costInLocalCurrency || 0).toFixed(2)) / 100; // LinkedIn returns microcurrency
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

    // Campaign aggregation
    const pivotValue = row.pivotValue || row.pivot_value || "";
    const campaignId = pivotValue.replace("urn:li:sponsoredCampaign:", "");
    const campaignName = campaignNameMap[campaignId] || campaignNameMap[pivotValue] || `Campaign ${campaignId}`;
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

  const timeSeries = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date))
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
 * Fetch ad creatives with banner images for each campaign.
 * Returns a map of campaignName → { imageUrl, headline, description }.
 */
export async function fetchLinkedInAdCreatives(token, adAccountId) {
  const accountUrn = `urn:li:sponsoredAccount:${adAccountId}`;

  // Fetch creatives
  const creativesData = await fetchLinkedIn("/adCreatives", token, {
    q: "search",
    "search.account.values[0]": accountUrn,
    fields: "id,campaign,content,status",
  });

  // Fetch campaigns for name mapping
  const campaignsData = await fetchLinkedIn("/adCampaigns", token, {
    q: "search",
    "search.account.values[0]": accountUrn,
  });

  const campaignNameMap = {};
  for (const c of campaignsData.elements || []) {
    const urn = c["$URN"] || `urn:li:sponsoredCampaign:${c.id}`;
    campaignNameMap[urn] = c.name || "Unknown Campaign";
  }

  const creatives = [];
  for (const cr of creativesData.elements || []) {
    const campaignUrn = cr.campaign || "";
    const campaignName = campaignNameMap[campaignUrn] || "Unknown Campaign";

    // Extract creative content — LinkedIn stores it in various formats
    const content = cr.content || {};
    const singleImage = content.singleImage || {};
    const textAd = content.textAd || {};
    const videoAd = content.videoAd || {};

    // Try to get image URL from different creative types
    const imageUrl =
      singleImage.asset // single image ad
      || textAd.asset // text ad thumbnail
      || videoAd.thumbnail // video thumbnail
      || singleImage.croppedImage?.asset
      || null;

    // Headline and description from intro text or creative content
    const introText = content.reference?.shareContent?.commentary
      || content.htmlBody
      || "";
    const headline = content.title || textAd.headline || singleImage.headline?.text || "";
    const description = content.description || textAd.description || singleImage.description?.text || "";
    const ctaLabel = content.callToAction?.labelType || "";
    const landingUrl = content.landingUrl || textAd.landingUrl || "";

    creatives.push({
      id: cr.id,
      campaignUrn,
      campaignName,
      status: cr.status || "ACTIVE",
      imageUrl: imageUrl ? resolveLinkedInAsset(imageUrl) : null,
      headline,
      description,
      introText,
      ctaLabel,
      landingUrl,
    });
  }

  return creatives;
}

/**
 * Resolve a LinkedIn asset URN to a usable image URL.
 * LinkedIn assets come as URNs like "urn:li:digitalmediaAsset:C4D..." —
 * we construct the media URL from it.
 */
function resolveLinkedInAsset(asset) {
  if (!asset) return null;
  if (asset.startsWith("http")) return asset;
  // Strip URN prefix to get the asset ID
  const id = asset.replace("urn:li:digitalmediaAsset:", "").replace("urn:li:image:", "");
  if (!id) return null;
  return `https://media.licdn.com/dms/image/${id}/`;
}

/**
 * Fetch LinkedIn follower statistics for an organization.
 */
export async function fetchLinkedInFollowers(token, orgId) {
  const data = await fetchLinkedIn("/organizationalEntityFollowerStatistics", token, {
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
