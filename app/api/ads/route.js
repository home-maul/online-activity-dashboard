import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchAds } from "@/lib/connectors/google-ads";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate") || "2024-01-01";
  const endDate = searchParams.get("endDate") || new Date().toISOString().split("T")[0];

  try {
    const data = await fetchAds(session.accessToken, { startDate, endDate });
    return Response.json(data);
  } catch (error) {
    console.error("Ads API error:", error);
    return Response.json(
      { error: "Failed to fetch ads data", detail: error.message },
      { status: 500 }
    );
  }
}
