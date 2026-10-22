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

// Counts page loads, including reloads, rather than claiming unique people.
// The database stores only an aggregate, without IPs, cookies or browser IDs.
export async function handleVisitorCount(request, env) {
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
    const row = await env.PRESENCE_DB.prepare(
      request.method === "POST"
        ? "UPDATE site_counter SET views = views + 1 WHERE id = 1 RETURNING views"
        : "SELECT views FROM site_counter WHERE id = 1",
    )
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
