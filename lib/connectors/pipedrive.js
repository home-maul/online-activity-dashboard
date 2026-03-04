// Pipedrive CRM connector
// Fetches deals, leads, pipelines, and stages to power the marketing dashboard
//
// Required env vars:
//   PIPEDRIVE_API_TOKEN  — Personal API token from Pipedrive settings
//   PIPEDRIVE_DOMAIN     — Your Pipedrive company domain (e.g. "homerunner")
//
// Optional env vars:
//   PIPEDRIVE_SOURCE_FIELD — Custom field key for lead/deal source tracking
//                            (the 40-char hash for your "UTM Source" or "Lead Source" field)
//   PIPEDRIVE_CAMPAIGN_FIELD — Custom field key for campaign name tracking

const BASE = (domain) => `https://${domain}.pipedrive.com`;

async function pipedriveGet(path, domain, token, params = {}) {
  const url = new URL(path, BASE(domain));
  url.searchParams.set("api_token", token);
  for (const [k, v] of Object.entries(params)) {
    if (v != null) url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Pipedrive API ${res.status}: ${body}`);
  }
  return res.json();
}

async function paginateAll(path, domain, token, params = {}) {
  const items = [];
  let start = 0;
  const limit = 500;

  while (true) {
    const data = await pipedriveGet(path, domain, token, { ...params, start, limit });
    if (data.data) items.push(...data.data);
    if (!data.additional_data?.pagination?.more_items_in_collection) break;
    start = data.additional_data.pagination.next_start;
  }
  return items;
}

// ---- Pipelines & Stages ----

async function fetchPipelines(domain, token) {
  const res = await pipedriveGet("/api/v1/pipelines", domain, token);
  return res.data || [];
}

async function fetchStages(domain, token, pipelineId) {
  const res = await pipedriveGet("/api/v1/stages", domain, token, {
    pipeline_id: pipelineId,
  });
  return res.data || [];
}

// ---- Deals ----

async function fetchDealsByStatus(domain, token, status) {
  return paginateAll("/api/v1/deals", domain, token, { status });
}

async function fetchAllDeals(domain, token) {
  const [open, won, lost] = await Promise.all([
    fetchDealsByStatus(domain, token, "open"),
    fetchDealsByStatus(domain, token, "won"),
    fetchDealsByStatus(domain, token, "lost"),
  ]);
  return [...open, ...won, ...lost];
}

// ---- Deal Fields (to resolve custom field keys) ----

async function fetchDealFields(domain, token) {
  const res = await pipedriveGet("/api/v1/dealFields", domain, token);
  return res.data || [];
}

// ---- Leads ----

async function fetchLeads(domain, token) {
  return paginateAll("/api/v1/leads", domain, token);
}

// ---- Pipeline conversion stats ----

async function fetchConversionStats(domain, token, pipelineId, startDate, endDate) {
  const res = await pipedriveGet(
    `/v1/pipelines/${pipelineId}/conversion_statistics`,
    domain,
    token,
    { start_date: startDate, end_date: endDate }
  );
  return res.data || {};
}

// ---- Main aggregation function ----

export async function fetchPipedriveData({ startDate, endDate } = {}) {
  const domain = process.env.PIPEDRIVE_DOMAIN;
  const token = process.env.PIPEDRIVE_API_TOKEN;

  if (!domain || !token) {
    return { mock: true, error: "PIPEDRIVE_DOMAIN and PIPEDRIVE_API_TOKEN are required" };
  }

  const sourceField = process.env.PIPEDRIVE_SOURCE_FIELD || null;
  const campaignField = process.env.PIPEDRIVE_CAMPAIGN_FIELD || null;

  // Fetch everything in parallel
  const [pipelines, allDeals, dealFields, leads] = await Promise.all([
    fetchPipelines(domain, token),
    fetchAllDeals(domain, token),
    fetchDealFields(domain, token),
    fetchLeads(domain, token),
  ]);

  // Get stages for the first (primary) pipeline
  const primaryPipeline = pipelines[0];
  const stages = primaryPipeline
    ? await fetchStages(domain, token, primaryPipeline.id)
    : [];

  // Date filtering
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  const filteredDeals = allDeals.filter((d) => {
    if (!start || !end) return true;
    const added = new Date(d.add_time);
    return added >= start && added <= end;
  });

  // ---- Aggregate by source/channel ----

  function getDealSource(deal) {
    if (sourceField && deal[sourceField]) return deal[sourceField];
    // Fall back to origin or channel field on the deal
    if (deal.channel) return deal.channel;
    if (deal.origin) return deal.origin;
    return "Unknown";
  }

  function getDealCampaign(deal) {
    if (campaignField && deal[campaignField]) return deal[campaignField];
    return null;
  }

  const bySource = {};
  for (const deal of filteredDeals) {
    const source = getDealSource(deal);
    if (!bySource[source]) {
      bySource[source] = { source, deals: 0, won: 0, lost: 0, open: 0, value: 0, wonValue: 0, lostValue: 0 };
    }
    const s = bySource[source];
    s.deals++;
    s.value += deal.value || 0;
    if (deal.status === "won") {
      s.won++;
      s.wonValue += deal.value || 0;
    } else if (deal.status === "lost") {
      s.lost++;
      s.lostValue += deal.value || 0;
    } else {
      s.open++;
    }
  }

  // ---- Aggregate by campaign ----

  const byCampaign = {};
  for (const deal of filteredDeals) {
    const campaign = getDealCampaign(deal) || "No Campaign";
    const source = getDealSource(deal);
    const key = `${campaign}::${source}`;
    if (!byCampaign[key]) {
      byCampaign[key] = { campaign, source, deals: 0, won: 0, lost: 0, open: 0, value: 0, wonValue: 0 };
    }
    const c = byCampaign[key];
    c.deals++;
    c.value += deal.value || 0;
    if (deal.status === "won") {
      c.won++;
      c.wonValue += deal.value || 0;
    } else if (deal.status === "lost") {
      c.lost++;
    } else {
      c.open++;
    }
  }

  // ---- Pipeline stage distribution ----

  const stageMap = {};
  for (const stage of stages) {
    stageMap[stage.id] = { name: stage.name, order: stage.order_nr, deals: 0, value: 0 };
  }
  for (const deal of filteredDeals.filter((d) => d.status === "open")) {
    if (stageMap[deal.stage_id]) {
      stageMap[deal.stage_id].deals++;
      stageMap[deal.stage_id].value += deal.value || 0;
    }
  }

  // ---- Deal timeline (deals added per day) ----

  const timelineMap = {};
  for (const deal of filteredDeals) {
    const day = deal.add_time?.split(" ")[0];
    if (!day) continue;
    if (!timelineMap[day]) timelineMap[day] = { date: day, added: 0, won: 0, lost: 0, value: 0 };
    timelineMap[day].added++;
    if (deal.status === "won") timelineMap[day].won++;
    if (deal.status === "lost") timelineMap[day].lost++;
    timelineMap[day].value += deal.value || 0;
  }
  const timeline = Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date));

  // ---- Sales cycle (days from add to close for won deals) ----

  const cycleTimes = filteredDeals
    .filter((d) => d.status === "won" && d.add_time && d.won_time)
    .map((d) => {
      const add = new Date(d.add_time);
      const won = new Date(d.won_time);
      return { source: getDealSource(d), days: Math.round((won - add) / (1000 * 60 * 60 * 24)) };
    });

  const cycleBySource = {};
  for (const c of cycleTimes) {
    if (!cycleBySource[c.source]) cycleBySource[c.source] = { source: c.source, totalDays: 0, count: 0 };
    cycleBySource[c.source].totalDays += c.days;
    cycleBySource[c.source].count++;
  }
  const salesCycle = Object.values(cycleBySource).map((s) => ({
    source: s.source,
    avgDays: Math.round(s.totalDays / s.count),
    deals: s.count,
  }));

  // ---- Totals ----

  const totalDeals = filteredDeals.length;
  const wonDeals = filteredDeals.filter((d) => d.status === "won");
  const totalPipeline = filteredDeals.filter((d) => d.status === "open").reduce((s, d) => s + (d.value || 0), 0);
  const totalWonValue = wonDeals.reduce((s, d) => s + (d.value || 0), 0);
  const avgDealSize = wonDeals.length ? Math.round(totalWonValue / wonDeals.length) : 0;
  const winRate = totalDeals > 0 ? Math.round((wonDeals.length / totalDeals) * 100) : 0;

  // ---- Sales cycle by campaign ----

  const cycleByCampaign = {};
  for (const c of cycleTimes) {
    const deal = filteredDeals.find(
      (d) => d.status === "won" && getDealSource(d) === c.source && d.won_time
    );
    const campaign = deal ? getDealCampaign(deal) || "No Campaign" : "No Campaign";
    if (!cycleByCampaign[campaign]) cycleByCampaign[campaign] = { campaign, totalDays: 0, count: 0 };
    cycleByCampaign[campaign].totalDays += c.days;
    cycleByCampaign[campaign].count++;
  }

  // ---- Avg time in each stage (based on stage change timestamps) ----

  const stageTimeMap = {};
  for (const stage of stages) {
    const dealsInStage = filteredDeals.filter((d) => d.status === "open" && d.stage_id === stage.id);
    const totalDaysInStage = dealsInStage.reduce((sum, d) => {
      const added = new Date(d.stage_change_time || d.add_time);
      return sum + Math.round((Date.now() - added) / (1000 * 60 * 60 * 24));
    }, 0);
    stageTimeMap[stage.id] = {
      name: stage.name,
      avgDays: dealsInStage.length ? Math.round(totalDaysInStage / dealsInStage.length) : 0,
      deals: dealsInStage.length,
    };
  }

  // ---- Pipeline by source per stage ----

  const stageBySource = {};
  for (const deal of filteredDeals.filter((d) => d.status === "open")) {
    const source = getDealSource(deal);
    const stageId = deal.stage_id;
    const stageName = stageMap[stageId]?.name || "Unknown";
    const key = `${source}::${stageName}`;
    if (!stageBySource[key]) stageBySource[key] = { source, stage: stageName, deals: 0, value: 0 };
    stageBySource[key].deals++;
    stageBySource[key].value += deal.value || 0;
  }

  return {
    mock: false,
    totals: {
      deals: totalDeals,
      won: wonDeals.length,
      lost: filteredDeals.filter((d) => d.status === "lost").length,
      open: filteredDeals.filter((d) => d.status === "open").length,
      pipeline: totalPipeline,
      wonValue: totalWonValue,
      avgDealSize,
      winRate,
      leads: leads.length,
      avgSalesCycle: cycleTimes.length
        ? Math.round(cycleTimes.reduce((s, c) => s + c.days, 0) / cycleTimes.length)
        : 0,
    },
    bySource: Object.values(bySource).sort((a, b) => b.wonValue - a.wonValue),
    byCampaign: Object.values(byCampaign).sort((a, b) => b.deals - a.deals),
    stages: Object.values(stageMap).sort((a, b) => a.order - b.order),
    stageTime: Object.values(stageTimeMap),
    stageBySource: Object.values(stageBySource),
    timeline,
    salesCycle: salesCycle.sort((a, b) => a.avgDays - b.avgDays),
    salesCycleByCampaign: Object.values(cycleByCampaign).map((c) => ({
      campaign: c.campaign,
      avgDays: Math.round(c.totalDays / c.count),
      deals: c.count,
    })),
    pipelines: pipelines.map((p) => ({ id: p.id, name: p.name })),
    dealFields: dealFields.map((f) => ({ key: f.key, name: f.name, field_type: f.field_type })),
    hasSourceField: !!sourceField,
    hasCampaignField: !!campaignField,
  };
}
