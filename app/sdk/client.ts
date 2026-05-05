import type { AnalyticsClientConfig, TrackAnalyticsInput } from "~/sdk/types";

type InternalEvent = {
  app: string;
  type: TrackAnalyticsInput["type"];
  ts?: string;
  path?: string;
  element?: string;
  tenant?: string;
  meta?: Record<string, unknown>;
};

const DEFAULT_FLUSH_INTERVAL_MS = 5000;
const DEFAULT_MAX_BATCH_SIZE = 10;

export type AnalyticsClient = {
  track: (event: TrackAnalyticsInput) => void;
  flush: () => Promise<void>;
  shutdown: () => Promise<void>;
};

function normalizeEvent(event: TrackAnalyticsInput, config: AnalyticsClientConfig): InternalEvent {
  return {
    app: config.app,
    type: event.type,
    ts: event.ts,
    path: event.path ?? event.url,
    element: event.element,
    tenant: event.tenant ?? config.tenant,
    meta: event.meta,
  };
}

async function postEvents(events: InternalEvent[], config: AnalyticsClientConfig): Promise<void> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (config.token) {
    headers["x-analytics-token"] = config.token;
  }

  const response = await fetch(config.endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ events }),
    keepalive: true,
  });

  if (!response.ok) {
    throw new Error(`Analytics post failed (${response.status})`);
  }
}

export function createAnalyticsClient(config: AnalyticsClientConfig): AnalyticsClient {
  const flushIntervalMs = config.flushIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS;
  const maxBatchSize = config.maxBatchSize ?? DEFAULT_MAX_BATCH_SIZE;
  const queue: InternalEvent[] = [];
  let isFlushing = false;
  const hasWindow = typeof window !== "undefined";

  const flush = async () => {
    if (isFlushing || queue.length === 0) {
      return;
    }

    isFlushing = true;
    const events = queue.splice(0, maxBatchSize);

    try {
      await postEvents(events, config);
    } catch (error) {
      // Put events back in front of the queue for retry.
      queue.unshift(...events);
      console.warn("[analytics-sdk] failed to flush events", error);
    } finally {
      isFlushing = false;
    }
  };

  const timerId = hasWindow ? window.setInterval(() => void flush(), flushIntervalMs) : null;
  const handleUnload = () => {
    void flush();
  };

  if (hasWindow) {
    window.addEventListener("pagehide", handleUnload);
  }

  return {
    track: (event: TrackAnalyticsInput) => {
      queue.push(normalizeEvent(event, config));

      if (queue.length >= maxBatchSize) {
        void flush();
      }
    },
    flush,
    shutdown: async () => {
      if (timerId !== null) {
        window.clearInterval(timerId);
      }

      if (hasWindow) {
        window.removeEventListener("pagehide", handleUnload);
      }

      await flush();
    },
  };
}
