const RETENTION = 30 * 24 * 60 * 60 * 1000;
const headers = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};
const reply = (body, status = 200, extra = {}) =>
  Response.json(body, { status, headers: { ...headers, ...extra } });
function reportResponse(row, now) {
  if (!row?.status || row.observed_at <= now - RETENTION) {
    return reply({ status: "unknown", observed_at: null, expires_at: null });
  }
  return reply({
    status: row.expires_at > now ? row.status : "unknown",
    observed_at: new Date(row.observed_at).toISOString(),
    expires_at: new Date(row.expires_at).toISOString(),
  });
}

export async function cleanupPresence(env, now = Date.now()) {
  // Keep the singleton row so subsequent conditional updates can still succeed.
  await env.PRESENCE_DB.batch([
    env.PRESENCE_DB.prepare(
      `UPDATE presence SET status = NULL, observed_at = 0,
      expires_at = 0, received_at = 0, credential_id = NULL
      WHERE id = 1 AND observed_at <= ?`,
    ).bind(now - RETENTION),
    env.PRESENCE_DB.prepare(
      "DELETE FROM presence_events WHERE expires_at <= ?",
    ).bind(now),
  ]);
}

export async function handlePublicPresence(request, env, now = Date.now()) {
  if (env?.PRESENCE_PUBLIC_READ !== "true")
    return reply({ error: "Not found" }, 404);
  if (request.method !== "GET")
    return reply({ error: "Method not allowed" }, 405, { Allow: "GET" });
  if (!env.PRESENCE_DB)
    return reply({ error: "Presence is not configured" }, 503);
  try {
    const row = await env.PRESENCE_DB.prepare(
      `SELECT p.status, p.observed_at, p.expires_at FROM presence p
      JOIN presence_credentials writer ON writer.id = p.credential_id
      WHERE p.id = 1 AND writer.revoked = 0 AND writer.expires_at > ?
      AND writer.scope = 'presence:write'`,
    )
      .bind(now)
      .first();
    return reportResponse(row, now);
  } catch {
    return reply({ error: "Presence temporarily unavailable" }, 503);
  }
}
