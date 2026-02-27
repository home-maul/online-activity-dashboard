import { google } from "googleapis";

/**
 * Create an OAuth2 client pre-loaded with the user's tokens.
 * Shared by all Google connectors.
 */
export function createOAuth2Client(accessToken) {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2.setCredentials({ access_token: accessToken });
  return oauth2;
}
