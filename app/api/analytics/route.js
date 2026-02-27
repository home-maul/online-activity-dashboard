import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchAnalytics } from "@/lib/connectors/google-analytics";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate") || "30daysAgo";
  const endDate = searchParams.get("endDate") || "today";

  try {
    const data = await fetchAnalytics(session.accessToken, { startDate, endDate });
    return Response.json(data);
  } catch (error) {
    console.error("Analytics API error:", error);
    return Response.json(
      { error: "Failed to fetch analytics data", detail: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}
