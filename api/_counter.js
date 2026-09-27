// Shared helpers for the download / install counters.
// Privacy: only two plain numbers are stored. No IP, device ID or anything personal.
// Duplicate prevention happens on the user's side (a flag in their browser / inside the app).

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export const KEYS = { downloads: "evilock:downloads", installs: "evilock:installs" };

export async function redis(commands) {
  if (!URL_ || !TOKEN) throw Object.assign(new Error("Counter storage is not configured"), { status: 503 });
  const r = await fetch(`${URL_}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands)
  });
  if (!r.ok) throw Object.assign(new Error(`Redis ${r.status}`), { status: 502 });
  return r.json();
}

export async function readCounts() {
  const [d, i] = await redis([["GET", KEYS.downloads], ["GET", KEYS.installs]]);
  return { downloads: Number(d.result || 0), installs: Number(i.result || 0) };
}

// Handles GET (read both numbers) and POST (add one to `key`, then read both).
export function counterHandler(key) {
  return async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") return res.status(204).end();
    try {
      if (req.method === "POST") await redis([["INCR", key]]);
      else if (req.method !== "GET") { res.setHeader("Allow", "GET, POST"); return res.status(405).json({ error: "Method not allowed" }); }
      return res.status(200).json(await readCounts());
    } catch (e) {
      return res.status(e.status || 502).json({ error: e.message || "Counter unavailable" });
    }
  };
}
