import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchSearchConsole } from "@/lib/connectors/search-console";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!startDate || !endDate) {
    return Response.json({ error: "startDate and endDate are required" }, { status: 400 });
  }

  try {
    const data = await fetchSearchConsole(session.accessToken, { startDate, endDate });
    return Response.json(data);
  } catch (err) {
    console.error("Search Console API error:", err);
    return Response.json({ error: "Failed to fetch Search Console data" }, { status: 500 });
  }
}
