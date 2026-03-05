// import {db, query} from "~/server/db.server";
import type {
    AnalyticsEvent,
    AppDashboardSummary,
    AppViewsSummary,
    IncomingEvent,
    TenantDashboardSummary,
    TenantViewsSummary,
} from "~/types/analytics";
export type {
    AnalyticsEvent,
    AppDashboardSummary,
    AppViewsSummary,
    EventsByType,
    HitsPerDayByAppRow,
    IncomingEvent,
    PageViewsRow,
    TenantDashboardSummary,
    TenantViewsSummary,
    TotalEventsPerAppWithTypesRow,
    TotalEventsPerTenantRow,
} from "~/types/analytics";

//TODO: clean up types
//TODO: make 1 copy for POC cache, one for DB


// export async function getPageViewsByAppAndPath(params: {
//     from: Date;
//     to: Date;     // exclusive end
//     app?: string; // optional filter
// }) {
//     const { from, to, app } = params;
//
//     if (app) {
//         return query<PageViewsRow>(
//             `
//       select
//         app,
//         coalesce(path, '/__unknown__') as path,
//         count(*)::int as views
//       from analytics_event
//       where type = 'page_view'
//         and app = $1
//         and ts >= $2::timestamptz
//         and ts <  $3::timestamptz
//       group by app, path
//       order by views desc
//       `,
//             [app, from.toISOString(), to.toISOString()]
//         );
//     }
//
//     return query<PageViewsRow>(
//         `
//     select
//       app,
//       coalesce(path, '/__unknown__') as path,
//       count(*)::int as views
//     from analytics_event
//     where type = 'page_view'
//       and ts >= $1::timestamptz
//       and ts <  $2::timestamptz
//     group by app, path
//     order by views desc
//     `,
//         [from.toISOString(), to.toISOString()]
//     );
// }


// export async function getTotalEventsPerAppWithTypes(params: {
//     from: Date;
//     to: Date; // exclusive
// }) {
//     const { from, to } = params;
//
//     return query<TotalEventsPerAppWithTypesRow>(
//         `
//     with per_type as (
//       select
//         app,
//         type,
//         count(*)::int as events
//       from analytics_event
//       where ts >= $1::timestamptz
//         and ts <  $2::timestamptz
//       group by 1, 2
//     ),
//     totals as (
//       select
//         app,
//         count(*)::int as total_events
//       from analytics_event
//       where ts >= $1::timestamptz
//         and ts <  $2::timestamptz
//       group by 1
//     )
//     select
//       t.app,
//       t.total_events,
//       coalesce(
//         jsonb_agg(
//           jsonb_build_object('type', p.type, 'events', p.events)
//           order by p.events desc, p.type asc
//         ) filter (where p.type is not null),
//         '[]'::jsonb
//       ) as by_type
//     from totals t
//     left join per_type p on p.app = t.app
//     group by t.app, t.total_events
//     order by t.total_events desc, t.app asc
//     `,
//         [from.toISOString(), to.toISOString()]
//     );
// }

// export interface TotalEventsPerAppRow {
//     app: string;
//     events: number;
// }
//
// export async function getTotalEventsPerApp(params: {
//     from: Date;
//     to: Date;     // exclusive end
//     app?: string; // optional filter
// }) {
//     const { from, to, app } = params;
//
//     return query<TotalEventsPerAppRow>(
//         `
//     select
//       app,
//       count(*)::int as events
//     from analytics_event
//     where ($1::text is null or app = $1::text)
//       and ts >= $2::timestamptz
//       and ts <  $3::timestamptz
//     group by 1
//     order by 2 desc, 1 asc
//     `,
//         [app ?? null, from.toISOString(), to.toISOString()]
//     );
// }


// export async function getTotalEventsPerTenant(params: {
//     from: Date;
//     to: Date;        // exclusive end
//     tenant?: string; // optional filter
//
// }) {
//     const { from, to, tenant } = params;
//
//     return query<TotalEventsPerTenantRow>(
//         `
//     select
//       tenant,
//       count(*)::int as events
//     from analytics_event
//     where ($1::text is null or tenant = $1::text)
//       and ts >= $2::timestamptz
//       and ts <  $3::timestamptz
//     group by 1
//     order by 2 desc, 1 asc
//     `,
//         [tenant ?? null, from.toISOString(), to.toISOString()]
//     );
// }

// export async function getHitsPerDayByApp(params: {
//     from: Date;
//     to: Date;     // exclusive end
//     app?: string; // optional filter
// }) {
//     const { from, to, app } = params;
//
//     if (app) {
//         return query<HitsPerDayByAppRow>(
//             `
//       select
//         date_trunc('day', ts)::date::text as day,
//         app,
//         count(*)::int as hits
//       from analytics_event
//       where app = $1
//         and ts >= $2::timestamptz
//         and ts <  $3::timestamptz
//       group by 1, 2
//       order by 1 asc, 2 asc
//       `,
//             [app, from.toISOString(), to.toISOString()]
//         );
//     }
//
//     return query<HitsPerDayByAppRow>(
//         `
//     select
//       date_trunc('day', ts)::date::text as day,
//       app,
//       count(*)::int as hits
//     from analytics_event
//     where ts >= $1::timestamptz
//       and ts <  $2::timestamptz
//     group by 1, 2
//     order by 1 asc, 2 asc
//     `,
//         [from.toISOString(), to.toISOString()]
//     );
// }

// export type AppRow = { app: string };
//
// export async function listApps() {
//     return query<AppRow>(
//         `
//     select distinct app
//     from analytics_event
//     order by app asc
//     `
//     );
// }



//TODO: POC cache HERE
export async function getLatestEvents(limit = 50) {
    // return query<AnalyticsEvent>(
    //     `
    // select id, ts, app, type, path, element, tenant, meta
    // from analytics_event
    // order by ts desc
    // limit $1
    // `,
    //     [limit]
    // );

    var returnSorted = listOfEvents.sort((a, b) => (a.ts > b.ts ? -1 : 1));
    return returnSorted.slice(0, limit);
}

export async function listApps() {
    return Array.from(new Set(listOfEvents.map((event) => event.app))).sort((a, b) =>
        a.localeCompare(b)
    );
}

export async function getAppViewsSummary(params: {
    from: Date;
    to: Date;
}): Promise<AppViewsSummary[]> {
    const { from, to } = params;
    const counts = new Map<string, number>();

    for (const event of listOfEvents) {
        const ts = new Date(event.ts);
        if (Number.isNaN(ts.getTime())) continue;
        if (ts < from || ts >= to) continue;
        if (event.type !== "page_view") continue;

        counts.set(event.app, (counts.get(event.app) ?? 0) + 1);
    }

    const apps = await listApps();
    return apps
        .map((app) => ({
            app,
            totalViews: counts.get(app) ?? 0,
        }))
        .sort((a, b) => b.totalViews - a.totalViews || a.app.localeCompare(b.app));
}

export async function listTenants() {
    return Array.from(
        new Set(
            listOfEvents
                .map((event) => event.tenant)
                .filter((tenant): tenant is string => Boolean(tenant))
        )
    ).sort((a, b) => a.localeCompare(b));
}

export async function getTenantViewsSummary(params: {
    from: Date;
    to: Date;
}): Promise<TenantViewsSummary[]> {
    const { from, to } = params;
    const counts = new Map<string, number>();

    for (const event of listOfEvents) {
        const ts = new Date(event.ts);
        if (Number.isNaN(ts.getTime())) continue;
        if (ts < from || ts >= to) continue;
        if (event.type !== "page_view") continue;
        if (!event.tenant) continue;

        counts.set(event.tenant, (counts.get(event.tenant) ?? 0) + 1);
    }

    const tenants = await listTenants();
    return tenants
        .map((tenant) => ({
            tenant,
            totalViews: counts.get(tenant) ?? 0,
        }))
        .sort((a, b) => b.totalViews - a.totalViews || a.tenant.localeCompare(b.tenant));
}

export async function getAppDashboardSummary(params: {
    app: string;
    from: Date;
    to: Date;
}): Promise<AppDashboardSummary> {
    const { app, from, to } = params;
    const filtered = listOfEvents
        .filter((event) => {
            if (event.app !== app) return false;
            const ts = new Date(event.ts);
            if (Number.isNaN(ts.getTime())) return false;
            return ts >= from && ts < to;
        })
        .sort((a, b) => (a.ts > b.ts ? -1 : 1));

    const pathCounts = new Map<string, number>();
    const elementCounts = new Map<string, number>();
    const tenants = new Set<string>();

    let pageViews = 0;
    let buttonClicks = 0;
    let searches = 0;

    for (const event of filtered) {
        if (event.type === "page_view") pageViews += 1;
        if (event.type === "button_click") buttonClicks += 1;
        if (event.type === "search") searches += 1;

        if (event.path) {
            pathCounts.set(event.path, (pathCounts.get(event.path) ?? 0) + 1);
        }

        if (event.element) {
            elementCounts.set(event.element, (elementCounts.get(event.element) ?? 0) + 1);
        }

        if (event.tenant) {
            tenants.add(event.tenant);
        }
    }

    const toTopRows = (entries: Map<string, number>) =>
        Array.from(entries.entries())
            .map(([value, events]) => ({ value, events }))
            .sort((a, b) => b.events - a.events || a.value.localeCompare(b.value))
            .slice(0, 10);

    return {
        app,
        totalEvents: filtered.length,
        pageViews,
        buttonClicks,
        searches,
        uniqueTenants: tenants.size,
        topPaths: toTopRows(pathCounts),
        topElements: toTopRows(elementCounts),
        latestEvents: filtered.slice(0, 15),
    };
}

export async function getTenantDashboardSummary(params: {
    tenant: string;
    from: Date;
    to: Date;
}): Promise<TenantDashboardSummary> {
    const { tenant, from, to } = params;
    const filtered = listOfEvents
        .filter((event) => {
            if (event.tenant !== tenant) return false;
            const ts = new Date(event.ts);
            if (Number.isNaN(ts.getTime())) return false;
            return ts >= from && ts < to;
        })
        .sort((a, b) => (a.ts > b.ts ? -1 : 1));

    const pathCounts = new Map<string, number>();
    const elementCounts = new Map<string, number>();
    const apps = new Set<string>();

    let pageViews = 0;
    let buttonClicks = 0;
    let searches = 0;

    for (const event of filtered) {
        if (event.type === "page_view") pageViews += 1;
        if (event.type === "button_click") buttonClicks += 1;
        if (event.type === "search") searches += 1;

        if (event.path) {
            pathCounts.set(event.path, (pathCounts.get(event.path) ?? 0) + 1);
        }

        if (event.element) {
            elementCounts.set(event.element, (elementCounts.get(event.element) ?? 0) + 1);
        }

        apps.add(event.app);
    }

    const toTopRows = (entries: Map<string, number>) =>
        Array.from(entries.entries())
            .map(([value, events]) => ({ value, events }))
            .sort((a, b) => b.events - a.events || a.value.localeCompare(b.value))
            .slice(0, 10);

    return {
        tenant,
        totalEvents: filtered.length,
        pageViews,
        buttonClicks,
        searches,
        uniqueApps: apps.size,
        topPaths: toTopRows(pathCounts),
        topElements: toTopRows(elementCounts),
        latestEvents: filtered.slice(0, 15),
    };
}
const listOfEvents: AnalyticsEvent[] = [];
let nextId = 1;
function toAnalyticsEvent(e: IncomingEvent): AnalyticsEvent {
    return {
        id: nextId++,
        ts: e.ts ?? new Date().toISOString(),
        app: e.app,
        type: e.type,
        path: e.path ?? null,
        element: e.element ?? null,
        tenant: e.tenant ?? null,
        meta: e.meta,
    };
}
export async function insertEvents(newEvents: IncomingEvent[]) {
    if (newEvents.length === 0) return;

    // ✅ push *events*, not the array
    listOfEvents.push(...newEvents.map(toAnalyticsEvent));
}
// export async function insertEvents(events: IncomingEvent[]) {
//     if (events.length === 0) return;
//
//     const values: unknown[] = [];
//
//     const rowsSql = events
//         .map((e, i) => {
//             const base = i * 7; // 👈 now 7 columns
//
//             values.push(
//                 e.ts ?? null,
//                 e.app,
//                 e.type,
//                 e.path ?? null,
//                 e.element ?? null,
//                 e.tenant ?? null,
//                 e.meta ? JSON.stringify(e.meta) : null
//             );
//
//             return `(
//         coalesce($${base + 1}::timestamptz, now()),
//         $${base + 2}::text,
//         $${base + 3}::text,
//         $${base + 4}::text,
//         $${base + 5}::text,
//         $${base + 6}::text,
//         $${base + 7}::jsonb
//       )`;
//         })
//         .join(",");
//
//     await db().query(
//         `insert into analytics_event (ts, app, type, path, element, tenant, meta)
//          values ${rowsSql}`,
//         values
//     );
// }