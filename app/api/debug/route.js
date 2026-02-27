export async function GET() {
  return Response.json({
    hasClientId: !!process.env.GOOGLE_CLIENT_ID,
    clientIdPrefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 10) ?? "MISSING",
    hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    nextAuthUrl: process.env.NEXTAUTH_URL ?? "MISSING",
  });
}
