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

  // Build Oura API URL (v2 activity summaries)
  const qs = new URLSearchParams();
  if (start) qs.set("start", start);
  if (end) qs.set("end", end);

  const ouraUrl = `https://api.ouraring.com/v2/activity/summaries?${qs.toString()}`;

  try {
    const resp = await fetch(ouraUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json({ error: "Oura API error", status: resp.status, body: text }, { status: 502 });
    }

    const json = await resp.json();

    // Try to find array of daily summaries in known shapes
    // v2 typically returns { activity_summaries: [...] } or { items: [...] }

    const rawItems: any[] = json.activity_summaries || json.items || json || [];

    const mapped: DailyStats[] = (Array.isArray(rawItems) ? rawItems : []).map((it: any) => {
      // Accept various possible field names
      const date = it.summary_date || it.date || it.day || it.summaryDate || "";

      // Try multiple common minute fields (support several naming conventions)
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

    return NextResponse.json({ data: mapped });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
