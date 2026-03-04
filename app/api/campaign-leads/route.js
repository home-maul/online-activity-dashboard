import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchCampaigns } from "@/lib/connectors/campaigns";
import { fetchPipedriveData } from "@/lib/connectors/pipedrive";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!startDate || !endDate) {
    return Response.json({ error: "startDate and endDate are required" }, { status: 400 });
  }

  try {
    // Fetch GA4 campaigns and Pipedrive data in parallel
    const [ga4Result, pipedriveResult] = await Promise.allSettled([
      process.env.GA4_PROPERTY_ID
        ? fetchCampaigns(session.accessToken, { startDate, endDate })
        : Promise.resolve(null),
      fetchPipedriveData({ startDate, endDate }),
    ]);

    const ga4 = ga4Result.status === "fulfilled" ? ga4Result.value : null;
    const pipedrive = pipedriveResult.status === "fulfilled" ? pipedriveResult.value : null;

    const ga4Campaigns = ga4?.campaigns || [];
    const pipedriveConnected = pipedrive && !pipedrive.mock;
    const hasAttribution = pipedriveConnected && pipedrive.hasCampaignField;

    // Build merged campaign table
    const merged = ga4Campaigns.map((campaign) => {
      const row = {
        name: campaign.name,
        platform: campaign.platform,
        source: campaign.source,
        medium: campaign.medium,
        sessions: campaign.sessions,
        users: campaign.users,
        ga4Conversions: campaign.conversions,
        engagementRate: campaign.engagementRate,
        convRate: campaign.convRate,
        // Pipedrive fields (defaults)
        pipedriveLeads: 0,
        open: 0,
        won: 0,
        lost: 0,
        winRate: 0,
        pipelineValue: 0,
        avgDays: null,
        costPerLead: null,
        costPerDeal: null,
      };

      // Merge Pipedrive data if attribution is available
      if (hasAttribution) {
        const matchingDeals = pipedrive.byCampaign.filter(
          (d) => d.campaign.toLowerCase() === campaign.name.toLowerCase()
        );
        if (matchingDeals.length > 0) {
          const totals = matchingDeals.reduce(
            (acc, d) => ({
              deals: acc.deals + d.deals,
              won: acc.won + d.won,
              lost: acc.lost + d.lost,
              open: acc.open + d.open,
              value: acc.value + d.value,
              wonValue: acc.wonValue + d.wonValue,
            }),
            { deals: 0, won: 0, lost: 0, open: 0, value: 0, wonValue: 0 }
          );
          row.pipedriveLeads = totals.deals;
          row.open = totals.open;
          row.won = totals.won;
          row.lost = totals.lost;
          row.winRate = totals.deals > 0 ? Math.round((totals.won / totals.deals) * 100) : 0;
          row.pipelineValue = totals.value;

          // Find sales cycle for this campaign
          const cycleMatch = pipedrive.salesCycleByCampaign?.find(
            (c) => c.campaign.toLowerCase() === campaign.name.toLowerCase()
          );
          row.avgDays = cycleMatch?.avgDays ?? null;
        }
      }

      return row;
    });

    // Calculate lead quality scores
    const avgWinRate = merged.reduce((s, r) => s + r.winRate, 0) / (merged.length || 1);
    const avgDays = merged.filter((r) => r.avgDays).reduce((s, r) => s + r.avgDays, 0) /
      (merged.filter((r) => r.avgDays).length || 1);

    for (const row of merged) {
      let score = 50; // neutral baseline
      if (row.winRate > 0) score += (row.winRate - avgWinRate) * 0.5;
      if (row.avgDays && avgDays > 0) score += (avgDays - row.avgDays) * 0.3; // faster = better
      if (row.pipedriveLeads > 0) score += 10;
      row.qualityScore = Math.max(0, Math.min(100, Math.round(score)));
    }

    // Overall pipeline summary (always included when Pipedrive is connected)
    const pipelineSummary = pipedriveConnected
      ? {
          totalDeals: pipedrive.totals.deals,
          openDeals: pipedrive.totals.open,
          wonDeals: pipedrive.totals.won,
          pipeline: pipedrive.totals.pipeline,
          wonValue: pipedrive.totals.wonValue,
          winRate: pipedrive.totals.winRate,
          avgSalesCycle: pipedrive.totals.avgSalesCycle,
        }
      : null;

    return Response.json({
      campaigns: merged.sort((a, b) => b.sessions - a.sessions),
      platforms: ga4?.allPlatforms || [],
      pipedriveConnected,
      hasAttribution,
      pipelineSummary,
      bySource: pipedriveConnected ? pipedrive.bySource : [],
      salesCycle: pipedriveConnected ? pipedrive.salesCycle : [],
    });
  } catch (err) {
    console.error("Campaign-leads API error:", err);
    return Response.json({ error: "Failed to fetch campaign-leads data" }, { status: 500 });
  }
}
