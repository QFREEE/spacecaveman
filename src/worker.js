import { handlePresence } from './presence.js';

// Fictional fixtures for the first local milestone. Replace behind authentication
// before adding real personal plans. No visitor data is stored by this API.
const visits = [
  { id: "sample-1", start: "2026-10-23T17:00:00-04:00", end: "2026-10-23T21:00:00-04:00", area: "Midtown", status: "confirmed", note: "Around after work. Up for dinner or a quick drink." },
  { id: "sample-2", start: "2026-10-25T11:00:00-04:00", end: "2026-10-25T16:00:00-04:00", area: "Lower Manhattan", status: "tentative", note: "Thinking about a Sunday in the city. Coffee and a walk?" },
  { id: "sample-3", start: "2026-10-29T18:00:00-04:00", end: "2026-10-29T22:00:00-04:00", area: "Brooklyn", status: "confirmed", note: "An open evening. Let's pick somewhere to eat." }
];

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/presence') return handlePresence(request, env);
    const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
    if (pathname !== "/api/visits") {
      return Response.json({ error: "Not found" }, { status: 404, headers });
    }
    if (request.method !== "GET") {
      return Response.json({ error: "Method not allowed" }, { status: 405, headers: { ...headers, Allow: "GET" } });
    }
    const upcoming = visits
      .filter((visit) => Date.parse(visit.end) > Date.now())
      .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
    return Response.json({ demo: true, timeZone: "America/New_York", visits: upcoming }, { headers });
  }
};
