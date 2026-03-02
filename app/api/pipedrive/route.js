import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchPipedriveData } from "@/lib/connectors/pipedrive";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  try {
    const data = await fetchPipedriveData({ startDate, endDate });

    if (data.mock) {
      return Response.json({ mock: true });
    }

    return Response.json(data);
  } catch (err) {
    console.error("Pipedrive API error:", err);
    return Response.json({ error: "Failed to fetch Pipedrive data" }, { status: 500 });
  }
}
