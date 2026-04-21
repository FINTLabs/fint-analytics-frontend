import type { IncomingEvent } from "~/types/analytics";

const ONE_HOUR_MS = 60 * 60 * 1000;
const ERROR_THRESHOLD = 5;

type AppErrorWindowState = {
  timestamps: number[];
  lastNotifiedAt?: number;
};

const appErrorState = new Map<string, AppErrorWindowState>();

function parseEventTimestamp(ts?: string) {
  if (!ts) return Date.now();
  const parsed = Date.parse(ts);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

async function postSlackMessage(webhookUrl: string, text: string) {
  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
}

export async function notifySlackOnErrorSpike(events: IncomingEvent[]) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const errorEvents = events.filter((event) => event.type === "error");
  if (errorEvents.length === 0) return;

  for (const event of errorEvents) {
    const ts = parseEventTimestamp(event.ts);
    const windowStart = ts - ONE_HOUR_MS;

    const currentState = appErrorState.get(event.app) ?? { timestamps: [] };
    const timestamps = currentState.timestamps.filter((value) => value >= windowStart);
    timestamps.push(ts);

    const updatedState: AppErrorWindowState = {
      ...currentState,
      timestamps,
    };

    const overThreshold = timestamps.length > ERROR_THRESHOLD;
    const canNotifyAgain =
      updatedState.lastNotifiedAt === undefined ||
      ts - updatedState.lastNotifiedAt >= ONE_HOUR_MS;

    if (overThreshold && canNotifyAgain) {
      const readableTs = new Date(ts).toISOString();
      const message = [
        ":rotating_light: Error spike detected",
        `App: ${event.app}`,
        `Errors in last hour: ${timestamps.length}`,
        `Latest error at: ${readableTs}`,
      ].join("\n");

      try {
        await postSlackMessage(webhookUrl, message);
        updatedState.lastNotifiedAt = ts;
      } catch (error) {
        // Keep the ingestion flow stable even if Slack is unavailable.
        console.error("Failed to send Slack alert", error);
      }
    }

    appErrorState.set(event.app, updatedState);
  }
}
