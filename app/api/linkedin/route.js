import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchLinkedInData } from "@/lib/connectors/linkedin";
import { fetchLinkedInOrganicPosts, fetchLinkedInAds, fetchLinkedInAdCreatives, fetchLinkedInFollowers } from "@/lib/connectors/linkedin-api";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate") || "2024-01-01";
  const endDate = searchParams.get("endDate") || new Date().toISOString().split("T")[0];

  const result = {};

  // Try LinkedIn native API for organic posts, ads, and followers
  const linkedInToken = process.env.LINKEDIN_ACCESS_TOKEN;
  const orgId = process.env.LINKEDIN_ORGANIZATION_ID;
  const adAccountId = process.env.LINKEDIN_AD_ACCOUNT_ID;

  if (linkedInToken && orgId) {
    // Organic posts + followers (always if token + orgId set)
    try {
      const [organicPosts, followers] = await Promise.all([
        fetchLinkedInOrganicPosts(linkedInToken, orgId, { startDate, endDate }),
        fetchLinkedInFollowers(linkedInToken, orgId),
      ]);
      result.organicPosts = organicPosts;
      result.followers = followers;
    } catch (err) {
      console.warn("[LinkedIn API] Organic/followers failed:", err.message);
    }

    // Native ads (if ad account configured)
    if (adAccountId) {
      try {
        const [ads, creatives] = await Promise.all([
          fetchLinkedInAds(linkedInToken, adAccountId, { startDate, endDate }),
          fetchLinkedInAdCreatives(linkedInToken, adAccountId).catch(() => []),
        ]);

        // Merge creative data into campaigns
        if (creatives.length && ads.campaigns?.length) {
          const creativeMap = {};
          for (const cr of creatives) {
            if (!creativeMap[cr.campaignName]) creativeMap[cr.campaignName] = cr;
          }
          ads.campaigns = ads.campaigns.map((c) => ({
            ...c,
            creative: creativeMap[c.name] || null,
          }));
        }
        ads.creatives = creatives;

        result.ads = ads;
        result.adsSource = "linkedin_api";
      } catch (err) {
        console.warn("[LinkedIn API] Ads failed, falling back to GA4:", err.message);
      }
    }
  }

  // Always try GA4 for session-level data
  if (process.env.GA4_PROPERTY_ID) {
    try {
      const ga4Data = await fetchLinkedInData(session.accessToken, { startDate, endDate });

      if (result.ads) {
        // Merge native ads with GA4 session data
        result.paid = {
          ...result.ads,
          totals: {
            ...result.ads.totals,
            sessions: ga4Data.paid?.totals?.sessions || 0,
            users: ga4Data.paid?.totals?.users || 0,
          },
        };
        result.organic = ga4Data.organic;
        result.landingPages = ga4Data.landingPages;
      } else {
        // No native ads — use GA4 for everything
        result.paid = ga4Data.paid;
        result.organic = ga4Data.organic;
        result.landingPages = ga4Data.landingPages;
      }
    } catch (err) {
      console.warn("[LinkedIn GA4] Failed:", err.message);
    }
  }

  if (!result.paid && !result.organic && !result.organicPosts) {
    return Response.json(
      { error: "No data sources configured" },
      { status: 503 }
    );
  }

  return Response.json(result);
}
