import { NextResponse } from "next/server";
import { DailyStats } from "@/lib/types";

// Server-side route: /api/oura?start=YYYY-MM-DD&end=YYYY-MM-DD
export async function GET(req: Request) {
  const url = new URL(req.url);
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");

  const token = process.env.OURA_PERSONAL_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "OURA_PERSONAL_ACCESS_TOKEN not set" }, { status: 500 });
  }

  const qs = new URLSearchParams();
  if (start) qs.set("start", start);
  if (end) qs.set("end", end);

  // Candidate endpoints to try (some API versions or docs may differ)
  const candidates = [
    "/v2/activity/summaries",
    "/v2/activity",
    "/v2/activities",
    "/v2/summaries",
    "/v1/activity/summaries",
  ];

  const attempts: { url: string; status: number; body: string }[] = [];

  for (const path of candidates) {
    const ouraUrl = `https://api.ouraring.com${path}?${qs.toString()}`;
    try {
      const resp = await fetch(ouraUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const text = await resp.text();
      attempts.push({ url: ouraUrl, status: resp.status, body: text });

      if (resp.ok) {
        let json: unknown;
        try {
          json = JSON.parse(text) as unknown;
        } catch (parseErr) {
          return NextResponse.json({ error: "Failed to parse Oura response as JSON", details: String(parseErr) }, { status: 502 });
        }

        // attempt to find array of items in known locations
        const candidate = (json && typeof json === "object") ? (json as Record<string, unknown>) : {};
        const rawItems = (Array.isArray((candidate.activity_summaries ?? candidate.items ?? candidate.summaries) as unknown) ? (candidate.activity_summaries ?? candidate.items ?? candidate.summaries) : (Array.isArray(json) ? json : [])) as unknown[];

        const mapped: DailyStats[] = (Array.isArray(rawItems) ? rawItems : []).map((it) => {
          const item = (it && typeof it === "object") ? (it as Record<string, unknown>) : {};

          const date = String(item.summary_date ?? item.date ?? item.day ?? item.summaryDate ?? item.calendar_date ?? "");

          const toNum = (v: unknown) => (typeof v === "number" ? v : (typeof v === "string" && v.trim() !== "" ? Number(v) : 0));

          const very = toNum(item.very_active_minutes ?? item.veryActiveMinutes);
          const moderate = toNum(item.moderately_active_minutes ?? item.moderatelyActiveMinutes);
          const light = toNum(item.lightly_active_minutes ?? item.lightlyActiveMinutes);
          const active = toNum(item.active_minutes ?? item.activeMinutes);

          const timeMinutes = (very || moderate || light) ? (very + moderate + light) : (active || 0);

          return {
            date,
            timeMinutes,
            moneyJpy: 0,
            emotionZ: 0,
          } as DailyStats;
        });

        return NextResponse.json({ data: mapped, tried: attempts });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      attempts.push({ url: ouraUrl, status: 0, body: msg });
    }
  }

  return NextResponse.json({ error: "Oura API error - no candidate endpoints succeeded", attempts }, { status: 502 });
}
