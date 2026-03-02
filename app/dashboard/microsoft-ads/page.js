"use client";

import PlatformPage from "@/components/dashboard/platform-page";

export default function MicrosoftAdsPage() {
  return (
    <PlatformPage
      name="Microsoft Ads"
      subtitle="Bing paid and organic search traffic via GA4"
      apiPath="/api/microsoft-ads"
    />
  );
}
