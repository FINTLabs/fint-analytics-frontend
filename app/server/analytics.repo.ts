import { query } from "~/server/db.server";
import type {
  AnalyticsEvent,
  AppDashboardSummary,
  AppViewsSummary,
  ErrorCountByAppRow,
  ErrorCountByDayRow,
  ErrorCountByTenantRow,
  ErrorsOverview,
  IncomingEvent,
  PageViewsByDayAppRow,
  TenantDashboardSummary,
  TenantViewsSummary,
} from "~/types/analytics";

export type {
  AnalyticsEvent,
  AppDashboardSummary,
  AppViewsSummary,
  ErrorCountByAppRow,
  ErrorCountByDayRow,
  ErrorCountByTenantRow,
  ErrorsOverview,
  EventsByType,
  HitsPerDayByAppRow,
  IncomingEvent,
  PageViewsRow,
  PageViewsByDayAppRow,
  TenantDashboardSummary,
  TenantViewsSummary,
  TotalEventsPerAppWithTypesRow,
  TotalEventsPerTenantRow,
} from "~/types/analytics";

type DbEventRow = {
  id: number;
  ts: Date | string;
  app: string;
  type: string;
  path: string | null;
  element: string | null;
  tenant: string | null;
  meta: Record<string, unknown> | null;
};

function toAnalyticsEvent(row: DbEventRow): AnalyticsEvent {
  return {
    id: row.id,
    ts: row.ts instanceof Date ? row.ts.toISOString() : new Date(row.ts).toISOString(),
    app: row.app,
    type: row.type,
    path: row.path,
    element: row.element,
    tenant: row.tenant,
    meta: row.meta ?? undefined,
  };
}

export async function getLatestEvents(limit = 50): Promise<AnalyticsEvent[]> {
  const rows = await query<DbEventRow>(
    `
      select id, ts, app, type, path, element, tenant, meta
      from analytics_event
      order by ts desc
      limit $1
    `,
    [limit]
  );

  return rows.map(toAnalyticsEvent);
}

export async function listApps(): Promise<string[]> {
  const rows = await query<{ app: string }>(
    `
      select distinct app
      from analytics_event
      order by app asc
    `
  );
  return rows.map((row) => row.app);
}

export async function listTenants(): Promise<string[]> {
  const rows = await query<{ tenant: string }>(
    `
      select distinct tenant
      from analytics_event
      where tenant is not null and tenant <> ''
      order by tenant asc
    `
  );
  return rows.map((row) => row.tenant);
}

export async function getAppViewsSummary(params: {
  from: Date;
  to: Date;
}): Promise<AppViewsSummary[]> {
  const rows = await query<{ app: string; total_views: number }>(
    `
      select
        app,
        count(*)::int as total_views
      from analytics_event
      where type = 'page_view'
        and ts >= $1::timestamptz
        and ts < $2::timestamptz
      group by app
      order by total_views desc, app asc
    `,
    [params.from.toISOString(), params.to.toISOString()]
  );

  return rows.map((row) => ({ app: row.app, totalViews: row.total_views }));
}

export async function getTenantViewsSummary(params: {
  from: Date;
  to: Date;
}): Promise<TenantViewsSummary[]> {
  const rows = await query<{ tenant: string; total_views: number }>(
    `
      select
        tenant,
        count(*)::int as total_views
      from analytics_event
      where type = 'page_view'
        and tenant is not null
        and tenant <> ''
        and ts >= $1::timestamptz
        and ts < $2::timestamptz
      group by tenant
      order by total_views desc, tenant asc
    `,
    [params.from.toISOString(), params.to.toISOString()]
  );

  return rows.map((row) => ({ tenant: row.tenant, totalViews: row.total_views }));
}

export async function getPageViewsByDayByApp(params: {
  from: Date;
  to: Date;
}): Promise<PageViewsByDayAppRow[]> {
  return query<PageViewsByDayAppRow>(
    `
      select
        date_trunc('day', ts)::date::text as day,
        app,
        count(*)::int as views
      from analytics_event
      where type = 'page_view'
        and ts >= $1::timestamptz
        and ts < $2::timestamptz
      group by 1, 2
      order by 1 asc, 2 asc
    `,
    [params.from.toISOString(), params.to.toISOString()]
  );
}

export async function getAppDashboardSummary(params: {
  app: string;
  from: Date;
  to: Date;
}): Promise<AppDashboardSummary> {
  const values = [params.app, params.from.toISOString(), params.to.toISOString()];

  const [counts] = await query<{
    total_events: number;
    page_views: number;
    button_clicks: number;
    searches: number;
    unique_tenants: number;
  }>(
    `
      select
        count(*)::int as total_events,
        count(*) filter (where type = 'page_view')::int as page_views,
        count(*) filter (where type = 'button_click')::int as button_clicks,
        count(*) filter (where type = 'search')::int as searches,
        count(distinct tenant)::int as unique_tenants
      from analytics_event
      where app = $1
        and ts >= $2::timestamptz
        and ts < $3::timestamptz
    `,
    values
  );

  const [topPaths, topElements, latestEvents] = await Promise.all([
    query<{ value: string; events: number }>(
      `
        select path as value, count(*)::int as events
        from analytics_event
        where app = $1
          and path is not null
          and ts >= $2::timestamptz
          and ts < $3::timestamptz
        group by path
        order by events desc, value asc
        limit 10
      `,
      values
    ),
    query<{ value: string; events: number }>(
      `
        select element as value, count(*)::int as events
        from analytics_event
        where app = $1
          and element is not null
          and ts >= $2::timestamptz
          and ts < $3::timestamptz
        group by element
        order by events desc, value asc
        limit 10
      `,
      values
    ),
    query<DbEventRow>(
      `
        select id, ts, app, type, path, element, tenant, meta
        from analytics_event
        where app = $1
          and ts >= $2::timestamptz
          and ts < $3::timestamptz
        order by ts desc
        limit 15
      `,
      values
    ),
  ]);

  return {
    app: params.app,
    totalEvents: counts?.total_events ?? 0,
    pageViews: counts?.page_views ?? 0,
    buttonClicks: counts?.button_clicks ?? 0,
    searches: counts?.searches ?? 0,
    uniqueTenants: counts?.unique_tenants ?? 0,
    topPaths,
    topElements,
    latestEvents: latestEvents.map(toAnalyticsEvent),
  };
}

export async function getTenantDashboardSummary(params: {
  tenant: string;
  from: Date;
  to: Date;
}): Promise<TenantDashboardSummary> {
  const values = [params.tenant, params.from.toISOString(), params.to.toISOString()];

  const [counts] = await query<{
    total_events: number;
    page_views: number;
    button_clicks: number;
    searches: number;
    unique_apps: number;
  }>(
    `
      select
        count(*)::int as total_events,
        count(*) filter (where type = 'page_view')::int as page_views,
        count(*) filter (where type = 'button_click')::int as button_clicks,
        count(*) filter (where type = 'search')::int as searches,
        count(distinct app)::int as unique_apps
      from analytics_event
      where tenant = $1
        and ts >= $2::timestamptz
        and ts < $3::timestamptz
    `,
    values
  );

  const [topPaths, topElements, latestEvents] = await Promise.all([
    query<{ value: string; events: number }>(
      `
        select path as value, count(*)::int as events
        from analytics_event
        where tenant = $1
          and path is not null
          and ts >= $2::timestamptz
          and ts < $3::timestamptz
        group by path
        order by events desc, value asc
        limit 10
      `,
      values
    ),
    query<{ value: string; events: number }>(
      `
        select element as value, count(*)::int as events
        from analytics_event
        where tenant = $1
          and element is not null
          and ts >= $2::timestamptz
          and ts < $3::timestamptz
        group by element
        order by events desc, value asc
        limit 10
      `,
      values
    ),
    query<DbEventRow>(
      `
        select id, ts, app, type, path, element, tenant, meta
        from analytics_event
        where tenant = $1
          and ts >= $2::timestamptz
          and ts < $3::timestamptz
        order by ts desc
        limit 15
      `,
      values
    ),
  ]);

  return {
    tenant: params.tenant,
    totalEvents: counts?.total_events ?? 0,
    pageViews: counts?.page_views ?? 0,
    buttonClicks: counts?.button_clicks ?? 0,
    searches: counts?.searches ?? 0,
    uniqueApps: counts?.unique_apps ?? 0,
    topPaths,
    topElements,
    latestEvents: latestEvents.map(toAnalyticsEvent),
  };
}

export async function getTenantEventsPage(params: {
  tenant: string;
  from: Date;
  to: Date;
  page: number;
  pageSize: number;
}): Promise<{ totalEvents: number; events: AnalyticsEvent[]; page: number }> {
  const values = [params.tenant, params.from.toISOString(), params.to.toISOString()];

  const [totalRow] = await query<{ total_events: number }>(
    `
      select count(*)::int as total_events
      from analytics_event
      where tenant = $1
        and ts >= $2::timestamptz
        and ts < $3::timestamptz
    `,
    values
  );

  const totalEvents = totalRow?.total_events ?? 0;
  const totalPages = totalEvents === 0 ? 1 : Math.ceil(totalEvents / params.pageSize);
  const page = Math.min(Math.max(1, params.page), totalPages);
  const offset = (page - 1) * params.pageSize;

  const rows = await query<DbEventRow>(
    `
      select id, ts, app, type, path, element, tenant, meta
      from analytics_event
      where tenant = $1
        and ts >= $2::timestamptz
        and ts < $3::timestamptz
      order by ts desc
      limit $4
      offset $5
    `,
    [...values, params.pageSize, offset]
  );

  return {
    totalEvents,
    events: rows.map(toAnalyticsEvent),
    page,
  };
}

export async function getErrorsOverview(params: {
  from: Date;
  to: Date;
  app?: string | null;
  tenant?: string | null;
}): Promise<ErrorsOverview> {
  const values: Array<string | null> = [params.from.toISOString(), params.to.toISOString()];
  const conditions = [
    "type = 'error'",
    "ts >= $1::timestamptz",
    "ts < $2::timestamptz",
  ];

  if (params.app) {
    values.push(params.app);
    conditions.push(`app = $${values.length}`);
  }

  if (params.tenant) {
    values.push(params.tenant);
    conditions.push(`tenant = $${values.length}`);
  }

  const whereClause = conditions.join("\n        and ");

  const [counts] = await query<{
    total_errors: number;
    unique_apps: number;
    unique_tenants: number;
    days_with_errors: number;
  }>(
    `
      select
        count(*)::int as total_errors,
        count(distinct app)::int as unique_apps,
        count(distinct tenant) filter (where tenant is not null and tenant <> '')::int as unique_tenants,
        count(distinct date_trunc('day', ts))::int as days_with_errors
      from analytics_event
      where ${whereClause}
    `,
    values
  );

  const [byDay, byApp, byTenant, latestErrors] = await Promise.all([
    query<ErrorCountByDayRow>(
      `
        select
          date_trunc('day', ts)::date::text as day,
          count(*)::int as errors
        from analytics_event
        where ${whereClause}
        group by 1
        order by 1 desc
        limit 14
      `,
      values
    ),
    query<ErrorCountByAppRow>(
      `
        select app, count(*)::int as errors
        from analytics_event
        where ${whereClause}
        group by app
        order by errors desc, app asc
        limit 10
      `,
      values
    ),
    query<ErrorCountByTenantRow>(
      `
        select tenant, count(*)::int as errors
        from analytics_event
        where ${whereClause}
          and tenant is not null
          and tenant <> ''
        group by tenant
        order by errors desc, tenant asc
        limit 10
      `,
      values
    ),
    query<DbEventRow>(
      `
        select id, ts, app, type, path, element, tenant, meta
        from analytics_event
        where ${whereClause}
        order by ts desc
        limit 50
      `,
      values
    ),
  ]);

  return {
    totalErrors: counts?.total_errors ?? 0,
    uniqueApps: counts?.unique_apps ?? 0,
    uniqueTenants: counts?.unique_tenants ?? 0,
    daysWithErrors: counts?.days_with_errors ?? 0,
    byDay,
    byApp,
    byTenant,
    latestErrors: latestErrors.map(toAnalyticsEvent),
  };
}

export async function insertEvents(events: IncomingEvent[]) {
  if (events.length === 0) return;

  const values: unknown[] = [];
  const rowsSql = events
    .map((event, i) => {
      const base = i * 7;
      values.push(
        event.ts ?? null,
        event.app,
        event.type,
        event.path ?? null,
        event.element ?? null,
        event.tenant ?? null,
        event.meta ? JSON.stringify(event.meta) : null
      );

      return `(
        coalesce($${base + 1}::timestamptz, now()),
        $${base + 2}::text,
        $${base + 3}::text,
        $${base + 4}::text,
        $${base + 5}::text,
        $${base + 6}::text,
        $${base + 7}::jsonb
      )`;
    })
    .join(",");

  await query(
    `
      insert into analytics_event (ts, app, type, path, element, tenant, meta)
      values ${rowsSql}
    `,
    values
  );
}