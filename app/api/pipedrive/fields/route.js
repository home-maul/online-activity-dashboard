import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchPipedriveData } from "@/lib/connectors/pipedrive";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await fetchPipedriveData();
    if (data.mock) {
      return Response.json({ mock: true });
    }
    return Response.json({ fields: data.dealFields });
  } catch (err) {
    return Response.json({ error: "Failed to fetch fields" }, { status: 500 });
  }
}
