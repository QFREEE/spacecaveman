import {
  handlePresence,
  handlePublicPresence,
  cleanupPresence,
} from "./presence.js";
import { handleVisitorCount, handleFlower } from "./site.js";

export default {
  async scheduled(_controller, env) {
    await cleanupPresence(env);
  },
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    // Retired setup pages must not fall through to static assets or HTML redirects.
    if (/^\/shortcuts(?:\.html|\.css)?\/?$/.test(pathname)) {
      return new Response(request.method === 'HEAD' ? null : 'Gone', {
        status: 410,
        headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' },
      });
    }
    if (pathname === "/api/visitors") return handleVisitorCount(request, env);
    if (pathname === "/api/flower") return handleFlower(request, env);
    if (pathname === "/api/presence/public")
      return handlePublicPresence(request, env);
    if (pathname === "/api/presence") return handlePresence(request, env);
    const headers = {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    };
    if (pathname !== "/api/visits") {
      return Response.json({ error: "Not found" }, { status: 404, headers });
    }
    if (request.method !== "GET") {
      return Response.json(
        { error: "Method not allowed" },
        { status: 405, headers: { ...headers, Allow: "GET" } },
      );
    }
    // Personal plans stay private until owner and invited-friend access exists.
    return Response.json(
      { timeZone: "America/New_York", visits: [] },
      { headers },
    );
  },
};
