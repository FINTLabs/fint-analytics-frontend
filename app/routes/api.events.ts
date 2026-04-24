import { data, type ActionFunctionArgs } from "react-router";
import { insertEvents } from "~/server/analytics.repo";
import { notifySlackOnErrorSpike } from "~/server/slack-alerts.server";
import type { IncomingEvent } from "~/types/analytics";

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
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // Optional auth
  const token = request.headers.get("x-analytics-token");
  if (process.env.ANALYTICS_TOKEN && token !== process.env.ANALYTICS_TOKEN) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as unknown;

  const events: IncomingEvent[] = Array.isArray(body)
      ? (body as IncomingEvent[])
      : body && typeof body === "object" && Array.isArray((body as any).events)
          ? ((body as any).events as IncomingEvent[])
          : body
              ? [body as IncomingEvent]
              : [];

  if (events.length === 0) return new Response("Bad Request", { status: 400 });
  if (events.length > 10)
    return new Response("Too many events", { status: 413 });

  // basic validation
  for (const e of events) {
    if (!e?.app || !e?.type)
      return new Response("Bad Request: missing app or type", { status: 400 });
    if (!ALLOWED_EVENT_TYPES.has(e.type))
      return new Response("Bad Request: invalid event type", { status: 400 });
    if (e.app.length > 80)
      return new Response("Bad Request: app name too long", { status: 400 });
    if (e.path && e.path.length > 200)
      return new Response("Bad Request: path too long", { status: 400 });
    if (e.element && e.element.length > 120)
      return new Response("Bad Request: element name too long", {
        status: 400,
      });
    if (e.ts && Number.isNaN(Date.parse(e.ts)))
      return new Response("Bad Request: invalid timestamp", { status: 400 });
    if (e.tenant && e.tenant.length > 80)
      return new Response("Bad Request: tenant name too long", { status: 400 });
    if (e.meta && typeof e.meta !== "object")
      return new Response("Bad Request: meta must be an object", { status: 400 });

  }

  await insertEvents(events);
  await notifySlackOnErrorSpike(events);

  return data(
      { ok: true, inserted: events.length },
      { headers: corsHeaders(request) }
  );}
