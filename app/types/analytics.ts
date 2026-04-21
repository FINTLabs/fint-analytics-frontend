export type PageViewsRow = {
  app: string;
  path: string;
  views: number;
};

export type HitsPerDayByAppRow = {
  day: string;
  app: string;
  hits: number;
};

export type PageViewsByDayAppRow = {
  day: string;
  app: string;
  views: number;
};

export type AnalyticsEvent = {
  id: number;
  ts: string;
  app: string;
  type: string;
  path: string | null;
  element: string | null;
  tenant: string | null;
  meta?: Record<string, unknown>;
};

export type IncomingEvent = {
  ts?: string;
  app: string;
  type: "page_view" | "button_click" | "search" | "error";
  path?: string;
  element?: string;
  tenant?: string;
  meta?: Record<string, unknown>;
};

export type AppDashboardSummary = {
  app: string;
  totalEvents: number;
  pageViews: number;
  buttonClicks: number;
  searches: number;
  uniqueTenants: number;
  topPaths: Array<{ value: string; events: number }>;
  topElements: Array<{ value: string; events: number }>;
  latestEvents: AnalyticsEvent[];
};

export type TenantDashboardSummary = {
  tenant: string;
  totalEvents: number;
  pageViews: number;
  buttonClicks: number;
  searches: number;
  uniqueApps: number;
  topPaths: Array<{ value: string; events: number }>;
  topElements: Array<{ value: string; events: number }>;
  latestEvents: AnalyticsEvent[];
};

export type AppViewsSummary = {
  app: string;
  totalViews: number;
};

export type TenantViewsSummary = {
  tenant: string;
  totalViews: number;
};

export type EventsByType = {
  type: string;
  events: number;
};

export type TotalEventsPerAppWithTypesRow = {
  app: string;
  total_events: number;
  by_type: EventsByType[];
};

export type TotalEventsPerTenantRow = {
  tenant: string;
  events: number;
};
