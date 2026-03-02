import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(request) {
  const token = await getToken({ req: request });

  if (!token) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/analytics/:path*",
    "/api/ads/:path*",
    "/api/channels/:path*",
    "/api/campaigns/:path*",
    "/api/search-console/:path*",
    "/api/linkedin/:path*",
    "/api/meta/:path*",
    "/api/reddit/:path*",
    "/api/microsoft-ads/:path*",
    "/api/pipedrive/:path*",
    "/api/insights/:path*",
  ],
};
