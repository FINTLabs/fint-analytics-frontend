import type { AnalyticsEventType } from "~/sdk/types";

export type ServerAnalyticsClientConfig = {
  app: string;
  endpoint: string;
  token?: string;
  tenant?: string;
};

export type ServerTrackEventParams = {
  type: AnalyticsEventType;
  ts?: string;
  path?: string;
  element?: string;
  tenant?: string;
  meta?: Record<string, unknown> | null;
};

type EventPayload = {
  app: string;
  type: AnalyticsEventType;
  ts?: string;
  path?: string | null;
  element?: string | null;
  tenant?: string | null;
  meta?: Record<string, unknown> | null;
};

export type AnalyticsServerClient = {
  trackEvent: (params: ServerTrackEventParams) => Promise<void>;
  trackButtonClick: (
    element: string,
    path: string,
    tenant?: string,
    meta?: Record<string, unknown> | null,
  ) => Promise<void>;
  trackSearch: (path: string, meta: Record<string, unknown>, tenant?: string) => Promise<void>;
  trackError: (
    path: string,
    message: string,
    statusCode: number,
    tenant?: string,
    action?: string,
  ) => Promise<void>;
  trackActionError: (
    path: string,
    message: string,
    statusCode: number,
    tenant?: string,
    action?: string,
  ) => Promise<void>;
};

function createBody(config: ServerAnalyticsClientConfig, params: ServerTrackEventParams): EventPayload {
  return {
    app: config.app,
    type: params.type,
    ts: params.ts,
    path: params.path ?? null,
    element: params.element ?? null,
    tenant: params.tenant ?? config.tenant ?? null,
    meta: params.meta ?? null,
  };
}

async function postEvent(config: ServerAnalyticsClientConfig, body: EventPayload): Promise<void> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (config.token) {
    headers["x-analytics-token"] = config.token;
  }

  const response = await fetch(config.endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Analytics server track failed (${response.status})`);
  }
}

export function createAnalyticsServerClient(config: ServerAnalyticsClientConfig): AnalyticsServerClient {
  return {
    trackEvent: async (params: ServerTrackEventParams) => {
      await postEvent(config, createBody(config, params));
    },
    trackButtonClick: async (
      element: string,
      path: string,
      tenant?: string,
      meta?: Record<string, unknown> | null,
    ) => {
      await postEvent(
        config,
        createBody(config, {
          type: "button_click",
          path,
          element,
          tenant,
          meta,
        }),
      );
    },
    trackSearch: async (path: string, meta: Record<string, unknown>, tenant?: string) => {
      await postEvent(
        config,
        createBody(config, {
          type: "search",
          path,
          tenant,
          meta,
        }),
      );
    },
    trackError: async (
      path: string,
      message: string,
      statusCode: number,
      tenant?: string,
      action?: string,
    ) => {
      await postEvent(
        config,
        createBody(config, {
          type: "error",
          path,
          tenant,
          meta: {
            message,
            status: statusCode,
            action,
          },
        }),
      );
    },
    trackActionError: async (
      path: string,
      message: string,
      statusCode: number,
      tenant?: string,
      action?: string,
    ) => {
      await postEvent(
        config,
        createBody(config, {
          type: "error",
          path,
          tenant,
          meta: {
            message,
            status: statusCode,
            action,
          },
        }),
      );
    },
  };
}
