import { data, type ActionFunctionArgs } from "react-router";
import { insertEvents } from "~/server/analytics.repo";
import { notifySlackOnErrorSpike } from "~/server/slack-alerts.server";
import type { IncomingEvent } from "~/types/analytics";

const LOG_PREFIX = "[api/events]";

function corsHeaders(request: Request): Headers {
  const headers = new Headers();

  const origin = request.headers.get("Origin");
  if (origin === "http://localhost:3001") {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, x-analytics-token");
    headers.set("Access-Control-Max-Age", "86400");
    headers.set("Vary", "Origin");
  }

  return headers;
}

const ALLOWED_EVENT_TYPES = new Set(["page_view", "button_click", "search", "error", "action"]);

//TODO: check for double events
export async function loader({ request }: { request: Request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(request),
    });
  }
  return new Response("Method Not Allowed", { status: 405 });
}


export async function action({ request }: ActionFunctionArgs) {
  const requestInfo = {
    method: request.method,
    origin: request.headers.get("origin") ?? "unknown",
    userAgent: request.headers.get("user-agent") ?? "unknown",
  };

  if (request.method !== "POST") {
    console.warn(`${LOG_PREFIX} Method not allowed`, requestInfo);
    return new Response("Method Not Allowed", { status: 405 });
  }

  // Optional auth
  const token = request.headers.get("x-analytics-token");
  if (process.env.ANALYTICS_TOKEN && token !== process.env.ANALYTICS_TOKEN) {
    console.warn(`${LOG_PREFIX} Unauthorized request`, requestInfo);
    return new Response("Unauthorized", { status: 401 });
  }

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    console.warn(`${LOG_PREFIX} Invalid JSON body`, requestInfo);
    return new Response("Bad Request", { status: 400 });
  }

  const events: IncomingEvent[] = Array.isArray(body)
      ? (body as IncomingEvent[])
      : body && typeof body === "object" && Array.isArray((body as any).events)
          ? ((body as any).events as IncomingEvent[])
          : body
              ? [body as IncomingEvent]
              : [];

  if (events.length === 0) {
    console.warn(`${LOG_PREFIX} Empty events payload`, requestInfo);
    return new Response("Bad Request", { status: 400 });
  }
  if (events.length > 10) {
    console.warn(`${LOG_PREFIX} Too many events in payload`, {
      ...requestInfo,
      eventCount: events.length,
    });
    return new Response("Too many events", { status: 413 });
  }

  // basic validation
  for (const e of events) {
    if (!e?.app || !e?.type) {
      console.warn(`${LOG_PREFIX} Event missing app or type`, requestInfo);
      return new Response("Bad Request: missing app or type", { status: 400 });
    }
    if (!ALLOWED_EVENT_TYPES.has(e.type)) {
      console.warn(`${LOG_PREFIX} Invalid event type`, {
        ...requestInfo,
        eventType: e.type,
      });
      return new Response("Bad Request: invalid event type", { status: 400 });
    }
    if (e.app.length > 80) {
      console.warn(`${LOG_PREFIX} App name too long`, requestInfo);
      return new Response("Bad Request: app name too long", { status: 400 });
    }
    if (e.path && e.path.length > 200) {
      console.warn(`${LOG_PREFIX} Path too long`, requestInfo);
      return new Response("Bad Request: path too long", { status: 400 });
    }
    if (e.element && e.element.length > 120) {
      console.warn(`${LOG_PREFIX} Element name too long`, requestInfo);
      return new Response("Bad Request: element name too long", {
        status: 400,
      });
    }
    if (e.ts && Number.isNaN(Date.parse(e.ts))) {
      console.warn(`${LOG_PREFIX} Invalid event timestamp`, {
        ...requestInfo,
        timestamp: e.ts,
      });
      return new Response("Bad Request: invalid timestamp", { status: 400 });
    }
    if (e.tenant && e.tenant.length > 80) {
      console.warn(`${LOG_PREFIX} Tenant name too long`, requestInfo);
      return new Response("Bad Request: tenant name too long", { status: 400 });
    }
    if (e.meta && typeof e.meta !== "object") {
      console.warn(`${LOG_PREFIX} Invalid meta field`, requestInfo);
      return new Response("Bad Request: meta must be an object", { status: 400 });
    }
  }

  try {
    await insertEvents(events);
    await notifySlackOnErrorSpike(events);
  } catch (error) {
    console.error(`${LOG_PREFIX} Failed to process events`, {
      ...requestInfo,
      eventCount: events.length,
      error,
    });
    return new Response("Internal Server Error", { status: 500 });
  }

  console.info(`${LOG_PREFIX} Events accepted`, {
    ...requestInfo,
    eventCount: events.length,
    apps: [...new Set(events.map((event) => event.app))],
    types: [...new Set(events.map((event) => event.type))],
  });

  return data(
      { ok: true, inserted: events.length },
      { headers: corsHeaders(request) }
  );
}
