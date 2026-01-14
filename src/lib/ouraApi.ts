export async function fetchOuraDailyFromServer(start?: string, end?: string) {
  const qs = new URLSearchParams();
  if (start) qs.set("start", start);
  if (end) qs.set("end", end);
  const url = `/api/oura?${qs.toString()}`;

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Oura proxy error: ${res.status} ${body}`);
  }
  const json = await res.json();
  return json.data ?? [];
}
