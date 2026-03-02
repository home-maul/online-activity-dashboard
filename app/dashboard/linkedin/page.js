"use client";

import PlatformPage from "@/components/dashboard/platform-page";

export default function LinkedInPage() {
  return (
    <PlatformPage
      name="LinkedIn"
      subtitle="Paid and organic traffic from LinkedIn via GA4"
      apiPath="/api/linkedin"
    />
  );
}
