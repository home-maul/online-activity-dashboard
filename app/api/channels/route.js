import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchChannels } from "@/lib/connectors/channels";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.GA4_PROPERTY_ID) {
    return Response.json(
      { error: "Not configured", detail: "GA4_PROPERTY_ID is missing" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate") || "2024-01-01";
  const endDate = searchParams.get("endDate") || new Date().toISOString().split("T")[0];

  try {
    const data = await fetchChannels(session.accessToken, { startDate, endDate });
    return Response.json(data);
  } catch (error) {
    console.error("Channels API error:", error);
    return Response.json(
      { error: "Failed to fetch channels data", detail: error.message },
      { status: 500 }
    );
  }
}
