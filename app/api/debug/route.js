export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
  const ga4 = process.env.GA4_PROPERTY_ID ?? "";
  const adsCustomer = process.env.GOOGLE_ADS_CUSTOMER_ID ?? "";
  return Response.json({
    clientIdOk: !clientId.includes("\n") && clientId.length > 0,
    clientSecretOk: !clientSecret.includes("\n") && clientSecret.length > 0,
    ga4PropertyId: ga4,
    ga4EndsNewline: ga4.endsWith("\n"),
    adsCustomerId: adsCustomer,
    adsEndsNewline: adsCustomer.endsWith("\n"),
    nextAuthUrl: process.env.NEXTAUTH_URL ?? "MISSING",
  });
}
