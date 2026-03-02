import { fetchLinkedInAds, fetchLinkedInOrganic } from "@/lib/connectors/linkedin";

export async function GET(request) {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  if (!token) {
    return Response.json(
      { error: "Not configured", detail: "LINKEDIN_ACCESS_TOKEN is missing" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate") || "2024-01-01";
  const endDate = searchParams.get("endDate") || new Date().toISOString().split("T")[0];
  const type = searchParams.get("type"); // "ads", "organic", or both (default)

  try {
    const result = {};

    if (!type || type === "ads") {
      try {
        result.ads = await fetchLinkedInAds(token, { startDate, endDate });
      } catch (err) {
        console.warn("[LinkedIn Ads]", err.message);
        result.adsError = err.message;
      }
    }

    if (!type || type === "organic") {
      try {
        result.organic = await fetchLinkedInOrganic(token, { startDate, endDate });
      } catch (err) {
        console.warn("[LinkedIn Organic]", err.message);
        result.organicError = err.message;
      }
    }

    return Response.json(result);
  } catch (error) {
    console.error("LinkedIn API error:", error);
    return Response.json(
      { error: "Failed to fetch LinkedIn data", detail: error.message },
      { status: 500 }
    );
  }
}
