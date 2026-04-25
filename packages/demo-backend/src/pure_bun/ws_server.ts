/**
 * Bun WebSocket server demonstrating ActionHandler integration.
 *
 * Run with: bun run src/pure_bun/ws_server.ts
 *
 * ActionConnect is client-side only. On the server, ActionHandler.handleWire()
 * receives, executes, and produces the response for both HTTP and WebSocket.
 */
import { getDemoBackendHandler } from "../nice_actions/demo_resolver";

const PORT = 4567;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

Bun.serve({
  port: PORT,

  async fetch(req, srv) {
    const url = new URL(req.url);

    if (url.pathname === "/resolve_action") {
      if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
      }
      if (req.method === "POST") {
        const wire = await req.json();
        const result = await getDemoBackendHandler().handleWire(wire);
        if (!result.handled) return new Response(null, { status: 404 });
        return new Response(result.response.toJsonString(), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    if (url.pathname === "/ws") {
      const upgraded = srv.upgrade(req);
      if (upgraded) return undefined;
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    return new Response(
      JSON.stringify({ ok: true, message: "Nice Connect demo WS server", wsPath: "/ws" }),
      { headers: { "Content-Type": "application/json" } },
    );
  },

  websocket: {
    open(_ws) {
      console.log("[ws] client connected");
    },

    async message(ws, raw) {
      const text = typeof raw === "string" ? raw : Buffer.from(raw).toString("utf8");
      let wire: unknown;
      try {
        wire = JSON.parse(text);
      } catch {
        return;
      }

      const result = await getDemoBackendHandler().handleWire(wire);
      if (result.handled) {
        ws.send(result.response.toJsonString());
      }
    },

    close(_ws, code, reason) {
      console.log(`[ws] client disconnected (${code} ${reason})`);
    },
  },
});

console.log(`\n  Nice Connect WS demo running`);
console.log(`    HTTP   http://localhost:${PORT}/`);
console.log(`    WS     ws://localhost:${PORT}/ws`);
console.log(`    POST   http://localhost:${PORT}/resolve_action  (HTTP fallback)\n`);
