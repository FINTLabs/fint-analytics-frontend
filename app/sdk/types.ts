export type AnalyticsEventType =
  | "page_view"
  | "button_click"
  | "search"
  | "error"
  | "action";

export type TrackAnalyticsInput = {
  type: AnalyticsEventType;
  ts?: string;
  url?: string;
  path?: string;
  element?: string;
  tenant?: string;
  meta?: Record<string, unknown>;
};

export type AnalyticsClientConfig = {
  app: string;
  endpoint: string;
  token?: string;
  tenant?: string;
  flushIntervalMs?: number;
  maxBatchSize?: number;
};
