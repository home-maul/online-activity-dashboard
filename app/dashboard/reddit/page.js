"use client";

import PlatformPage from "@/components/dashboard/platform-page";

export default function RedditPage() {
  return (
    <PlatformPage
      name="Reddit"
      subtitle="Paid and organic traffic from Reddit via GA4"
      apiPath="/api/reddit"
    />
  );
}
