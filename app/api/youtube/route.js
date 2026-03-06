import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchYouTubeData } from "@/lib/connectors/youtube";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate") || "2024-01-01";
  const endDate = searchParams.get("endDate") || new Date().toISOString().split("T")[0];

  try {
    const data = await fetchYouTubeData(session.accessToken, { startDate, endDate });
    return Response.json(data);
  } catch (err) {
    console.error("[YouTube API]", err.message);

    if (err.message?.includes("insufficientPermissions") || err.message?.includes("forbidden")) {
      return Response.json(
        { error: "YouTube permissions not granted. Please sign out and sign in again to grant YouTube access." },
        { status: 403 }
      );
    }

    return Response.json(
      { error: err.message || "Failed to fetch YouTube data" },
      { status: 500 }
    );
  }
}
