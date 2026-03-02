import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Redirects the user to LinkedIn's OAuth authorization page.
 * After authorization, LinkedIn redirects back to /api/linkedin/callback.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) {
    return Response.json(
      { error: "LINKEDIN_CLIENT_ID is not configured" },
      { status: 503 }
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/linkedin/callback`;

  const scopes = [
    "r_ads_reporting",
    "r_ads",
    "r_organization_social",
    "rw_organization_admin",
    "r_basicprofile",
  ].join(" ");

  const state = crypto.randomUUID();

  const url = new URL("https://www.linkedin.com/oauth/v2/authorization");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", scopes);
  url.searchParams.set("state", state);

  return Response.redirect(url.toString());
}
