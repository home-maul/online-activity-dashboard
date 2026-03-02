/**
 * LinkedIn OAuth callback — exchanges the authorization code for an access token
 * and displays it so the user can add it to Vercel env vars.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return new Response(
      `<html><body style="font-family:system-ui;padding:40px;max-width:600px;margin:0 auto">
        <h2 style="color:#e11d48">LinkedIn Authorization Failed</h2>
        <p>${searchParams.get("error_description") || error}</p>
        <a href="/dashboard">Back to dashboard</a>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  if (!code) {
    return new Response("Missing authorization code", { status: 400 });
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/linkedin/callback`;

  // Exchange code for token
  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok) {
    return new Response(
      `<html><body style="font-family:system-ui;padding:40px;max-width:600px;margin:0 auto">
        <h2 style="color:#e11d48">Token Exchange Failed</h2>
        <pre style="background:#f1f5f9;padding:16px;border-radius:8px;overflow:auto">${JSON.stringify(tokenData, null, 2)}</pre>
        <a href="/dashboard">Back to dashboard</a>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  const token = tokenData.access_token;
  const expiresIn = tokenData.expires_in; // seconds
  const expiresDate = new Date(Date.now() + expiresIn * 1000).toLocaleDateString();

  return new Response(
    `<html><body style="font-family:system-ui;padding:40px;max-width:700px;margin:0 auto">
      <h2 style="color:#070E1A">LinkedIn Connected!</h2>
      <p>Copy the access token below and add it to your Vercel environment variables as <code>LINKEDIN_ACCESS_TOKEN</code>.</p>
      <p style="font-size:13px;color:#8896A8">Token expires: ${expiresDate} (${Math.round(expiresIn / 86400)} days)</p>

      <div style="background:#f1f5f9;padding:16px;border-radius:8px;margin:16px 0">
        <label style="font-size:12px;color:#8896A8;display:block;margin-bottom:4px">LINKEDIN_ACCESS_TOKEN</label>
        <textarea id="token" readonly style="width:100%;height:80px;font-family:monospace;font-size:12px;border:1px solid #D8E1EB;border-radius:6px;padding:8px;resize:none">${token}</textarea>
        <button onclick="navigator.clipboard.writeText(document.getElementById('token').value);this.textContent='Copied!'" style="margin-top:8px;padding:6px 16px;background:#070E1A;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px">Copy Token</button>
      </div>

      <h3 style="color:#070E1A;margin-top:24px">Next steps:</h3>
      <ol style="line-height:1.8;color:#333">
        <li>Run: <code>vercel env add LINKEDIN_ACCESS_TOKEN</code></li>
        <li>Paste the token above</li>
        <li>Redeploy: <code>vercel --prod</code></li>
      </ol>

      <a href="/dashboard" style="display:inline-block;margin-top:16px;padding:8px 20px;background:#59A9FF;color:white;text-decoration:none;border-radius:8px;font-size:14px">Back to Dashboard</a>
    </body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
