import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchPipedriveData } from "@/lib/connectors/pipedrive";

// Helper endpoint: lists all deal fields so you can find the custom field key
// for your source/campaign tracking fields.
// Usage: GET /api/pipedrive/fields
// Look for your "Lead Source", "UTM Source", "Campaign" etc. field
// and copy its `key` value into PIPEDRIVE_SOURCE_FIELD / PIPEDRIVE_CAMPAIGN_FIELD

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await fetchPipedriveData();
    if (data.mock) {
      return Response.json({ mock: true, error: data.error });
    }
    return Response.json({
      fields: data.dealFields,
      hint: "Find your source/campaign field and set its 'key' as PIPEDRIVE_SOURCE_FIELD or PIPEDRIVE_CAMPAIGN_FIELD in .env",
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
