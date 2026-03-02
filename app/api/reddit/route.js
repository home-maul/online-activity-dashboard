import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchRedditData } from "@/lib/connectors/reddit";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.GA4_PROPERTY_ID) {
    return Response.json(
      { error: "Not configured" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate") || "2024-01-01";
  const endDate = searchParams.get("endDate") || new Date().toISOString().split("T")[0];

  try {
    const data = await fetchRedditData(session.accessToken, { startDate, endDate });
    return Response.json(data);
  } catch (error) {
    console.error("Reddit API error:", error);
    return Response.json(
      { error: "Failed to fetch Reddit data" },
      { status: 500 }
    );
  }
}
