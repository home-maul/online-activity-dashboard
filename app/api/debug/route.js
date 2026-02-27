export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
  return Response.json({
    clientIdFull: clientId,
    clientIdLength: clientId.length,
    clientIdEndsNewline: clientId.endsWith("\n"),
    clientSecretLength: clientSecret.length,
    clientSecretPrefix: clientSecret.substring(0, 10),
    clientSecretEndsNewline: clientSecret.endsWith("\n"),
    nextAuthUrl: process.env.NEXTAUTH_URL ?? "MISSING",
  });
}
