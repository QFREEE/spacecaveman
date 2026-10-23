const headers = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};
const careIds = ["rain", "sun", "love", "food"];
const flowerDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function dayKey(now) {
  const parts = flowerDay.formatToParts(now);
  return ["year", "month", "day"]
    .map((type) => parts.find((part) => part.type === type).value)
    .join("-");
}

function sameOrigin(request) {
  return (
    request.headers.get("Origin") === new URL(request.url).origin &&
    request.headers.get("Sec-Fetch-Site") !== "cross-site"
  );
}

function unavailable(feature) {
  console.error(JSON.stringify({ event: `site_${feature}_unavailable` }));
  return Response.json(
    { error: "Temporarily unavailable" },
    { status: 503, headers },
  );
}

function flowerResponse(row) {
  return {
    stats: Object.fromEntries(careIds.map((id) => [id, row[id]])),
    log: JSON.parse(row.log).reverse(),
    generation: row.generation,
    bloomed_at:
      row.bloomed_at === null ? null : new Date(row.bloomed_at).toISOString(),
  };
}

export async function handleFlower(request, env, now = Date.now()) {
  if (!["GET", "POST"].includes(request.method)) {
    return Response.json(
      { error: "Method not allowed" },
      { status: 405, headers: { ...headers, Allow: "GET, POST" } },
    );
  }
  if (request.method === "POST" && !sameOrigin(request)) {
    return Response.json(
      { error: "Same-origin request required" },
      { status: 403, headers },
    );
  }
  const action = new URL(request.url).searchParams.get("care");
  if (request.method === "POST" && !careIds.includes(action)) {
    return Response.json(
      { error: "Choose a valid care action without a request body" },
      { status: 400, headers },
    );
  }
  // workerd can expose an empty stream even for a bodyless POST.
  if (request.method === "POST" && request.body) {
    const reader = request.body.getReader();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value.byteLength) {
          await reader.cancel();
          return Response.json(
            { error: "Request body not accepted" },
            { status: 400, headers },
          );
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
  if (!env?.PRESENCE_DB) return unavailable("flower");
  try {
    const db = env.PRESENCE_DB;
    const today = dayKey(now);
    // Only advance the day: an older request must never reset a newer plant.
    // Reads also reset, so an unbloomed plant refreshes without a care action.
    await db
      .prepare(
        `UPDATE site_flower SET
      rain = 0, sun = 0, love = 0, food = 0, updated_at = 0,
      bloomed_at = NULL, log = '[]',
      generation = generation + CASE WHEN day_key = '' THEN 0 ELSE 1 END,
      day_key = ? WHERE id = 1 AND day_key < ? RETURNING id`,
      )
      .bind(today, today)
      .first();
    if (request.method === "POST") {
      // The column is selected from a fixed allowlist, never arbitrary input.
      // Atomic increments keep rapid and concurrent care within the cap.
      const row = await db
        .prepare(
          `UPDATE site_flower SET
        ${action} = MIN(50, ${action} + 5),
        log = json_insert(CASE WHEN json_array_length(log) >= 12 THEN json_remove(log, '$[0]') ELSE log END, '$[#]', ?),
        bloomed_at = CASE
          WHEN ${careIds.map((id) => (id === action ? `${id} >= 45` : `${id} = 50`)).join(" AND ")} THEN ? ELSE bloomed_at END,
        updated_at = ?
        WHERE id = 1 AND day_key = ? AND ${action} < 50
        RETURNING *`,
        )
        .bind(action, now, now, today)
        .first();
      if (row) return Response.json(flowerResponse(row), { headers });
      const current = await db
        .prepare("SELECT * FROM site_flower WHERE id = 1")
        .bind()
        .first();
      if (!current) throw new Error("Missing flower");
      const full = current[action] === 50;
      return Response.json(
        { ...flowerResponse(current), error: full ? "full" : "day_changed" },
        {
          status: 409,
          headers,
        },
      );
    }
    const row = await db
      .prepare("SELECT * FROM site_flower WHERE id = 1")
      .bind()
      .first();
    if (!row) throw new Error("Missing flower");
    return Response.json(flowerResponse(row), { headers });
  } catch {
    return unavailable("flower");
  }
}

// Each New York day gets a random salt; only the resulting daily hashes persist.
// The hourly scheduled job deletes previous days and their hashes together.
export async function cleanupVisitorIdentifiers(env, now = Date.now()) {
  if (!env?.PRESENCE_DB) return;
  await env.PRESENCE_DB.prepare(
    "DELETE FROM site_visitor_days WHERE day_key < ?",
  )
    .bind(dayKey(now))
    .run();
}

// Refreshes/retries count once per IP + browser per New York calendar day.
export async function handleVisitorCount(request, env, now = Date.now()) {
  if (!["GET", "POST"].includes(request.method)) {
    return Response.json(
      { error: "Method not allowed" },
      {
        status: 405,
        headers: { ...headers, Allow: "GET, POST" },
      },
    );
  }
  if (request.method === "POST" && !sameOrigin(request)) {
    return Response.json(
      { error: "Same-origin request required" },
      { status: 403, headers },
    );
  }
  if (!env?.PRESENCE_DB) {
    return Response.json(
      { error: "Counter unavailable" },
      { status: 503, headers },
    );
  }
  try {
    const db = env.PRESENCE_DB;
    if (request.method === "POST") {
      // Trust Cloudflare's client-IP header, never caller-supplied forwarding lists.
      // Local development without this header reads the total without counting.
      const ip = request.headers.get("CF-Connecting-IP");
      const agent = request.headers.get("User-Agent");
      if (ip && agent) {
        const today = dayKey(now);
        const { salt } = await db
          .prepare(
            `INSERT INTO site_visitor_days (day_key, salt) VALUES (?, ?)
           ON CONFLICT(day_key) DO UPDATE SET day_key = excluded.day_key
           RETURNING salt`,
          )
          .bind(today, crypto.randomUUID())
          .first();
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          "raw",
          encoder.encode(salt),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"],
        );
        const signature = await crypto.subtle.sign(
          "HMAC",
          key,
          encoder.encode(
            JSON.stringify([new URL(request.url).hostname, ip, agent]),
          ),
        );
        const hash = Array.from(new Uint8Array(signature), (byte) =>
          byte.toString(16).padStart(2, "0"),
        ).join("");
        // The unique key and trigger commit the identity and increment atomically.
        await db
          .prepare(
            "INSERT INTO site_daily_visitors (day_key, visitor_hash) VALUES (?, ?) ON CONFLICT DO NOTHING RETURNING visitor_hash",
          )
          .bind(today, hash)
          .first();
      }
    }
    const row = await db
      .prepare("SELECT views FROM site_counter WHERE id = 1")
      .bind()
      .first();
    if (!row || !Number.isSafeInteger(row.views) || row.views < 0)
      throw new Error("Invalid counter");
    return Response.json({ views: row.views }, { headers });
  } catch {
    console.error(JSON.stringify({ event: "site_counter_unavailable" }));
    return Response.json(
      { error: "Counter unavailable" },
      { status: 503, headers },
    );
  }
}
