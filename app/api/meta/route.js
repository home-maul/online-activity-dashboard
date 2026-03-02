import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchMetaData } from "@/lib/connectors/meta";
import { fetchMetaAds } from "@/lib/connectors/meta-api";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate") || "2024-01-01";
  const endDate = searchParams.get("endDate") || new Date().toISOString().split("T")[0];

  const result = {};

  // Try Meta Marketing API first (real impressions, spend, CPC)
  const metaToken = process.env.META_ACCESS_TOKEN;
  if (metaToken && process.env.META_AD_ACCOUNT_ID) {
    try {
      result.ads = await fetchMetaAds(metaToken, { startDate, endDate });
      result.adsSource = "meta_api";
    } catch (err) {
      console.warn("[Meta API] Failed, falling back to GA4:", err.message);
    }
  }

  // Always try GA4 for session-level data (organic + paid traffic to site)
  if (process.env.GA4_PROPERTY_ID) {
    try {
      const ga4Data = await fetchMetaData(session.accessToken, { startDate, endDate });
      // If we have direct Meta API data, use GA4 only for organic + landing pages
      if (result.ads) {
        result.paid = {
          ...result.ads,
          totals: {
            ...result.ads.totals,
            // Merge GA4 session data
            sessions: ga4Data.paid?.totals?.sessions || 0,
            users: ga4Data.paid?.totals?.users || 0,
          },
        };
        result.organic = ga4Data.organic;
        result.landingPages = ga4Data.landingPages;
        result.sourceBreakdown = ga4Data.sourceBreakdown;
      } else {
        // No Meta API — use GA4 for everything
        result.paid = ga4Data.paid;
        result.organic = ga4Data.organic;
        result.landingPages = ga4Data.landingPages;
        result.sourceBreakdown = ga4Data.sourceBreakdown;
      }
    } catch (err) {
      console.warn("[Meta GA4] Failed:", err.message);
    }
  }

  if (!result.paid && !result.organic) {
    return Response.json(
      { error: "No data sources configured" },
      { status: 503 }
    );
  }

  return Response.json(result);
}
