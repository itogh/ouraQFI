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
        let json: any;
        try {
          json = JSON.parse(text);
        } catch (parseErr) {
          return NextResponse.json({ error: "Failed to parse Oura response as JSON", details: String(parseErr) }, { status: 502 });
        }

        const rawItems: any[] = json.activity_summaries || json.items || json.summaries || json || [];

        const mapped: DailyStats[] = (Array.isArray(rawItems) ? rawItems : []).map((it: any) => {
          const date = it.summary_date || it.date || it.day || it.summaryDate || it.calendar_date || "";

          const very = it.very_active_minutes ?? it.veryActiveMinutes ?? 0;
          const moderate = it.moderately_active_minutes ?? it.moderatelyActiveMinutes ?? 0;
          const light = it.lightly_active_minutes ?? it.lightlyActiveMinutes ?? 0;
          const active = it.active_minutes ?? it.activeMinutes ?? 0;

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
    } catch (err: any) {
      attempts.push({ url: ouraUrl, status: 0, body: String(err?.message ?? err) });
    }
  }

  return NextResponse.json({ error: "Oura API error - no candidate endpoints succeeded", attempts }, { status: 502 });
}
