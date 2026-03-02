export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*", "/api/analytics/:path*", "/api/ads/:path*", "/api/channels/:path*", "/api/campaigns/:path*", "/api/search-console/:path*", "/api/linkedin/:path*", "/api/meta/:path*", "/api/reddit/:path*", "/api/microsoft-ads/:path*", "/api/pipedrive/:path*"],
};
