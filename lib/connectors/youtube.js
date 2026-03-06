/**
 * YouTube connector — channel stats, video performance, and traffic sources.
 * Uses YouTube Data API v3 + YouTube Analytics API via the user's Google OAuth token.
 *
 * Env vars (optional):
 *   YOUTUBE_CHANNEL_ID — override auto-detected channel
 */

import { google } from "googleapis";
import { createOAuth2Client } from "../google";

/**
 * Fetch YouTube data: channel stats, top videos, traffic sources, time series.
 */
export async function fetchYouTubeData(accessToken, { startDate, endDate }) {
  const auth = createOAuth2Client(accessToken);
  const youtube = google.youtube({ version: "v3", auth });
  const youtubeAnalytics = google.youtubeAnalytics({ version: "v2", auth });

  // Resolve channel ID
  const channelId = process.env.YOUTUBE_CHANNEL_ID || await getOwnChannelId(youtube);
  if (!channelId) {
    throw new Error("No YouTube channel found for this account");
  }

  // Fetch everything in parallel
  const [channelStats, analyticsOverview, topVideos, trafficSources, dailyData] = await Promise.all([
    fetchChannelStats(youtube, channelId),
    fetchAnalyticsOverview(youtubeAnalytics, startDate, endDate),
    fetchTopVideos(youtubeAnalytics, youtube, startDate, endDate),
    fetchTrafficSources(youtubeAnalytics, startDate, endDate),
    fetchDailyTimeSeries(youtubeAnalytics, startDate, endDate),
  ]);

  return {
    channel: channelStats,
    overview: analyticsOverview,
    topVideos,
    trafficSources,
    timeSeries: dailyData,
  };
}

async function getOwnChannelId(youtube) {
  const res = await youtube.channels.list({
    part: "id",
    mine: true,
  });
  return res.data.items?.[0]?.id || null;
}

async function fetchChannelStats(youtube, channelId) {
  const res = await youtube.channels.list({
    part: "snippet,statistics,brandingSettings",
    id: channelId,
  });
  const ch = res.data.items?.[0];
  if (!ch) return null;

  const stats = ch.statistics || {};
  return {
    id: ch.id,
    title: ch.snippet?.title || "",
    description: ch.snippet?.description || "",
    thumbnail: ch.snippet?.thumbnails?.medium?.url || ch.snippet?.thumbnails?.default?.url || null,
    subscribers: Number(stats.subscriberCount || 0),
    totalViews: Number(stats.viewCount || 0),
    videoCount: Number(stats.videoCount || 0),
    hiddenSubscribers: stats.hiddenSubscriberCount || false,
  };
}

async function fetchAnalyticsOverview(youtubeAnalytics, startDate, endDate) {
  const res = await youtubeAnalytics.reports.query({
    ids: "channel==MINE",
    startDate,
    endDate,
    metrics: "views,estimatedMinutesWatched,averageViewDuration,likes,comments,shares,subscribersGained,subscribersLost,annotationClickThroughRate",
  });

  const row = res.data.rows?.[0] || [];
  return {
    views: Number(row[0] || 0),
    watchTimeMinutes: Number(row[1] || 0),
    avgViewDuration: Number(row[2] || 0),
    likes: Number(row[3] || 0),
    comments: Number(row[4] || 0),
    shares: Number(row[5] || 0),
    subscribersGained: Number(row[6] || 0),
    subscribersLost: Number(row[7] || 0),
    ctr: parseFloat(Number(row[8] || 0).toFixed(2)),
  };
}

async function fetchTopVideos(youtubeAnalytics, youtube, startDate, endDate) {
  const res = await youtubeAnalytics.reports.query({
    ids: "channel==MINE",
    startDate,
    endDate,
    metrics: "views,estimatedMinutesWatched,averageViewDuration,likes,comments,shares",
    dimensions: "video",
    sort: "-views",
    maxResults: 20,
  });

  const rows = res.data.rows || [];
  if (rows.length === 0) return [];

  // Get video details (title, thumbnail) from Data API
  const videoIds = rows.map((r) => r[0]);
  const videoDetails = await fetchVideoDetails(youtube, videoIds);

  return rows.map((row) => {
    const videoId = row[0];
    const detail = videoDetails[videoId] || {};
    return {
      videoId,
      title: detail.title || videoId,
      thumbnail: detail.thumbnail || null,
      publishedAt: detail.publishedAt || null,
      views: Number(row[1] || 0),
      watchTimeMinutes: Number(row[2] || 0),
      avgViewDuration: Number(row[3] || 0),
      likes: Number(row[4] || 0),
      comments: Number(row[5] || 0),
      shares: Number(row[6] || 0),
    };
  });
}

async function fetchVideoDetails(youtube, videoIds) {
  if (videoIds.length === 0) return {};

  const res = await youtube.videos.list({
    part: "snippet,statistics",
    id: videoIds.join(","),
  });

  const map = {};
  for (const item of res.data.items || []) {
    map[item.id] = {
      title: item.snippet?.title || "",
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || null,
      publishedAt: item.snippet?.publishedAt || null,
    };
  }
  return map;
}

async function fetchTrafficSources(youtubeAnalytics, startDate, endDate) {
  const res = await youtubeAnalytics.reports.query({
    ids: "channel==MINE",
    startDate,
    endDate,
    metrics: "views,estimatedMinutesWatched",
    dimensions: "insightTrafficSourceType",
    sort: "-views",
  });

  return (res.data.rows || []).map((row) => ({
    source: formatTrafficSource(row[0]),
    sourceKey: row[0],
    views: Number(row[1] || 0),
    watchTimeMinutes: Number(row[2] || 0),
  }));
}

async function fetchDailyTimeSeries(youtubeAnalytics, startDate, endDate) {
  const res = await youtubeAnalytics.reports.query({
    ids: "channel==MINE",
    startDate,
    endDate,
    metrics: "views,estimatedMinutesWatched,likes,subscribersGained",
    dimensions: "day",
    sort: "day",
  });

  return (res.data.rows || []).map((row) => ({
    date: row[0],
    views: Number(row[1] || 0),
    watchTimeMinutes: Number(row[2] || 0),
    likes: Number(row[3] || 0),
    subscribersGained: Number(row[4] || 0),
  }));
}

function formatTrafficSource(key) {
  const map = {
    YT_SEARCH: "YouTube Search",
    SUGGESTED: "Suggested Videos",
    EXT_URL: "External Websites",
    YT_OTHER_PAGE: "YouTube (Other)",
    NOTIFICATION: "Notifications",
    SUBSCRIBER: "Subscriptions",
    PLAYLIST: "Playlists",
    YT_CHANNEL: "Channel Page",
    ADVERTISING: "YouTube Ads",
    SHORTS: "Shorts Feed",
    NO_LINK_OTHER: "Direct / Unknown",
    END_SCREEN: "End Screens",
    ANNOTATION: "Cards & Annotations",
    CAMPAIGN_CARD: "Campaign Cards",
    HASHTAGS: "Hashtags",
    LIVE_REDIRECT: "Live Redirect",
    SOUND_PAGE: "Sound Page",
    PRODUCT_PAGE: "Product Page",
    RELATED_VIDEO: "Related Videos",
  };
  return map[key] || key.replace(/_/g, " ");
}
