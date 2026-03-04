import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

async function fetchDashboardData(accessToken, startDate, endDate) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const params = `startDate=${startDate}&endDate=${endDate}`;

  const endpoints = [
    { key: "channels", path: `/api/channels?${params}` },
    { key: "campaigns", path: `/api/campaigns?${params}` },
    { key: "ads", path: `/api/ads?${params}` },
    { key: "searchConsole", path: `/api/search-console?${params}` },
    { key: "pipedrive" },
  ];

  const results = {};

  await Promise.all(
    endpoints.map(async ({ key, path }) => {
      try {
        // Import connectors directly to avoid HTTP round-trips
        if (key === "channels" && process.env.GA4_PROPERTY_ID) {
          const { fetchChannels } = await import("@/lib/connectors/channels");
          results[key] = await fetchChannels(accessToken, { startDate, endDate });
        } else if (key === "campaigns" && process.env.GA4_PROPERTY_ID) {
          const { fetchCampaigns } = await import("@/lib/connectors/campaigns");
          results[key] = await fetchCampaigns(accessToken, { startDate, endDate });
        } else if (key === "ads" && process.env.GA4_PROPERTY_ID) {
          const { fetchAds } = await import("@/lib/connectors/google-ads");
          results[key] = await fetchAds(accessToken, { startDate, endDate });
        } else if (key === "searchConsole") {
          const { fetchSearchConsole } = await import("@/lib/connectors/search-console");
          results[key] = await fetchSearchConsole(accessToken, { startDate, endDate });
        } else if (key === "pipedrive") {
          const { fetchPipedriveData } = await import("@/lib/connectors/pipedrive");
          const pd = await fetchPipedriveData({ startDate, endDate });
          if (!pd.mock) results[key] = pd;
        }
      } catch (err) {
        console.warn(`[Insights] Failed to fetch ${key}:`, err.message);
      }
    })
  );

  return results;
}

function buildDataSummary(data) {
  const parts = [];

  if (data.channels?.totals) {
    const t = data.channels.totals;
    parts.push(`CHANNELS OVERVIEW (period):
- Sessions: ${t.sessions}, Users: ${t.users}, Conversions: ${t.conversions}
- Conv. Rate: ${t.convRate}%, Ad Cost: $${t.adCost || 0}
- Period-over-period change: Sessions ${t.change?.sessions || 0}%, Users ${t.change?.users || 0}%, Conversions ${t.change?.conversions || 0}%`);

    if (data.channels.channels?.length) {
      parts.push(`Channel breakdown:\n${data.channels.channels.map((c) =>
        `  ${c.channel}: ${c.sessions} sessions, ${c.conversions} conv, ${c.convRate}% rate, ${c.bounceRate}% bounce`
      ).join("\n")}`);
    }
  }

  if (data.campaigns?.campaigns?.length) {
    const top = data.campaigns.campaigns.slice(0, 10);
    parts.push(`TOP CAMPAIGNS:\n${top.map((c) =>
      `  ${c.name} (${c.platform}): ${c.sessions} sessions, ${c.conversions} conv, ${c.convRate}% rate`
    ).join("\n")}`);
  }

  if (data.ads?.totals) {
    const t = data.ads.totals;
    parts.push(`GOOGLE ADS:
- Impressions: ${t.impressions}, Clicks: ${t.clicks}, CTR: ${t.ctr}%
- Cost: $${t.cost}, Conversions: ${t.conversions}`);
  }

  if (data.searchConsole?.totals) {
    const t = data.searchConsole.totals;
    parts.push(`SEARCH CONSOLE:
- Clicks: ${t.clicks}, Impressions: ${t.impressions}, CTR: ${t.ctr}%, Avg Position: ${t.position}`);

    if (data.searchConsole.queries?.length) {
      const topQ = data.searchConsole.queries.slice(0, 8);
      parts.push(`Top queries:\n${topQ.map((q) =>
        `  "${q.query}": ${q.clicks} clicks, pos ${q.position.toFixed(1)}, CTR ${q.ctr}%`
      ).join("\n")}`);
    }
  }

  if (data.pipedrive?.totals) {
    const pt = data.pipedrive.totals;
    parts.push(`PIPEDRIVE CRM PIPELINE:
- Total Deals: ${pt.deals}, Open: ${pt.open}, Won: ${pt.won}, Lost: ${pt.lost}
- Pipeline Value: $${pt.pipeline}, Won Value: $${pt.wonValue}
- Win Rate: ${pt.winRate}%, Avg Deal Size: $${pt.avgDealSize}
- Avg Sales Cycle: ${pt.avgSalesCycle} days, Active Leads: ${pt.leads}`);

    if (data.pipedrive.bySource?.length) {
      parts.push(`Deals by Source:\n${data.pipedrive.bySource.slice(0, 8).map((s) =>
        `  ${s.source}: ${s.deals} deals, ${s.won} won, ${s.lost} lost, $${s.wonValue} won value`
      ).join("\n")}`);
    }

    if (data.pipedrive.salesCycle?.length) {
      parts.push(`Sales Cycle by Source:\n${data.pipedrive.salesCycle.slice(0, 6).map((s) =>
        `  ${s.source}: ${s.avgDays} avg days (${s.deals} deals)`
      ).join("\n")}`);
    }

    if (data.pipedrive.byCampaign?.length) {
      const campaignDeals = data.pipedrive.byCampaign.filter((c) => c.campaign !== "No Campaign").slice(0, 8);
      if (campaignDeals.length) {
        parts.push(`Deals by Campaign:\n${campaignDeals.map((c) =>
          `  ${c.campaign} (${c.source}): ${c.deals} deals, ${c.won} won, $${c.wonValue} value`
        ).join("\n")}`);
      }
    }
  }

  return parts.join("\n\n");
}

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "AI insights not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const endDate = searchParams.get("endDate") || new Date().toISOString().split("T")[0];
  const startDate = searchParams.get("startDate") || (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  })();

  try {
    const data = await fetchDashboardData(session.accessToken, startDate, endDate);
    const summary = buildDataSummary(data);

    if (!summary.trim()) {
      return Response.json({ error: "No data available to analyze" }, { status: 404 });
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `You are a senior marketing analyst for Homerunner, a logistics/delivery platform with long B2B sales cycles. Analyze this marketing dashboard data and provide actionable insights that connect top-of-funnel activity to pipeline outcomes.

DATA (${startDate} to ${endDate}):
${summary}

Respond with a JSON array of 4-6 insight objects. Each object must have:
- "type": one of "opportunity", "warning", "trend", "action"
- "title": short headline (max 8 words)
- "body": 1-2 sentence actionable recommendation
- "metric": the key number or percentage driving this insight
- "priority": "high", "medium", or "low"

Focus on (prioritize pipeline insights when CRM data is available):
1. Which sources/campaigns produce leads that actually close (win rate by source)
2. Cost efficiency: cost per qualified lead, not just cost per click
3. Sales cycle optimization: which channels close faster
4. Pipeline velocity: where deals get stuck, which stages have drop-off
5. Budget allocation: shift spend toward sources with best deal-to-close ratio
6. Channel/campaign performance gaps between traffic and pipeline outcomes
7. SEO/content opportunities from search queries

Return ONLY the JSON array, no other text.`,
        },
      ],
    });

    const text = message.content[0]?.text || "[]";
    // Parse the JSON from Claude's response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const insights = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return Response.json({
      insights,
      period: { startDate, endDate },
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Insights API error:", err);
    return Response.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
