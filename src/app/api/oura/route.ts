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
          json = JSON.parse(text);
        } catch (parseErr) {
          return NextResponse.json({ error: "Failed to parse Oura response as JSON", details: String(parseErr) }, { status: 502 });
        }

        const jsonObj = json as Record<string, unknown>;
        const rawItems: unknown[] = (jsonObj.activity_summaries || jsonObj.items || jsonObj.summaries || json || []) as unknown[];

        const mapped: DailyStats[] = (Array.isArray(rawItems) ? rawItems : []).map((it: unknown) => {
          const item = it as Record<string, unknown>;
          const date = (item.summary_date || item.date || item.day || item.summaryDate || item.calendar_date || "") as string;

          const very = (item.very_active_minutes ?? item.veryActiveMinutes ?? 0) as number;
          const moderate = (item.moderately_active_minutes ?? item.moderatelyActiveMinutes ?? 0) as number;
          const light = (item.lightly_active_minutes ?? item.lightlyActiveMinutes ?? 0) as number;
          const active = (item.active_minutes ?? item.activeMinutes ?? 0) as number;

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
    } catch (err: unknown) {
      const error = err as Error | undefined;
      attempts.push({ url: ouraUrl, status: 0, body: String(error?.message ?? err) });
    }
  }

  return NextResponse.json({ error: "Oura API error - no candidate endpoints succeeded", attempts }, { status: 502 });
}
