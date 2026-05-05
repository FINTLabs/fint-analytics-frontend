# FINT Frontend Analytics

Analytics collector and dashboard for frontend events.

This app stores analytics events in Postgres and provides:

- an ingestion endpoint (`POST /api/events`)
- a dashboard with latest events and aggregates (`/`)

## Tech Stack

- React Router (SSR)
- React + TypeScript
- PostgreSQL (`pg`)
- NAV design system (`@navikt/ds-react`)
- Recharts

## Local Development

### 1) Install dependencies

```bash
npm install
```

### 2) Start Postgres

Using Docker Compose:

```bash
docker compose up -d db
```

### 3) Configure environment

Create `.env` in the project root:

```bash
DATABASE_URL=postgres://analytics:analytics@localhost:5432/analytics
# Optional: require this token on POST /api/events
ANALYTICS_TOKEN=change-me
```

### 4) Run the app

```bash
npm run dev
```

App is available at `http://localhost:5173`.

## Routes

- `GET /` - analytics dashboard (latest events + totals per app and tenant)
- `GET /views` - page views report with range selector and chart
- `POST /api/events` - ingest one event or batch
- `OPTIONS /api/events` - CORS preflight

## React SDK (WIP)

An initial SDK scaffold is available in `app/sdk`:

- `AnalyticsProvider`
- `TrackAnalytics`
- `useTrackAnalytics`
- `createAnalyticsServerClient` (for Remix loaders/actions)

Example usage:

```tsx
import { AnalyticsProvider, TrackAnalytics } from "~/sdk";

export function App() {
  return (
    <AnalyticsProvider
      app="my-app"
      endpoint="https://analytics.example.com/api/events"
    >
      <TrackAnalytics type="page_view" url="/home" />
      {/* rest of app */}
    </AnalyticsProvider>
  );
}
```

Track button clicks:

```tsx
import { useTrackAnalytics } from "~/sdk";

export function SaveButton() {
  const track = useTrackAnalytics();

  return (
    <button
      onClick={() =>
        track({
          type: "button_click",
          element: "save-button",
          meta: { section: "profile" },
        })
      }
    >
      Save
    </button>
  );
}
```

Track searches:

```tsx
import { useTrackAnalytics } from "~/sdk";

export function SearchForm() {
  const track = useTrackAnalytics();

  function onSearch(query: string) {
    track({
      type: "search",
      url: "/search",
      meta: { queryLength: query.length },
    });
  }

  return <button onClick={() => onSearch("my query")}>Search</button>;
}
```

Track errors:

```tsx
import { useTrackAnalytics } from "~/sdk";

export function LoadCustomerButton() {
  const track = useTrackAnalytics();

  async function onClick() {
    try {
      // your async logic
      throw new Error("Customer service unavailable");
    } catch (error) {
      track({
        type: "error",
        url: "/customers",
        meta: {
          message: error instanceof Error ? error.message : "Unknown error",
          source: "LoadCustomerButton",
        },
      });
    }
  }

  return <button onClick={onClick}>Load customer</button>;
}
```

### Server-side tracking (Remix loader/action)

Use `createAnalyticsServerClient` when tracking from server code (for example errors or action events in loaders/actions).

```ts
import { createAnalyticsServerClient } from "~/sdk";

const analytics = createAnalyticsServerClient({
  app: "kunde-portal",
  endpoint: "http://fint-analytics-frontend:3000/api/events",
  token: "change-me",
});
```

Track an action error (separate endpoint/client if needed):

```ts
import { createAnalyticsServerClient } from "~/sdk";

const actionAnalytics = createAnalyticsServerClient({
  app: "kunde-portal",
  endpoint: "http://fint-analytics-frontend:3000/api/events",
  token: "change-me",
});

export async function action({ request }: { request: Request }) {
  const path = new URL(request.url).pathname;

  try {
    // action logic
    return new Response(null, { status: 204 });
  } catch (error) {
    await actionAnalytics.trackActionError(
      path,
      error instanceof Error ? error.message : "Unknown action error",
      500,
      "tenant-a",
      "save-settings",
    );

    throw error;
  }
}
```

## Event Ingestion API

`POST /api/events` accepts either:

- a single event object, or
- `{ "events": [ ... ] }`

### Event shape

```json
{
  "ts": "2026-02-27T10:15:00.000Z",
  "app": "fint-min-app",
  "type": "page_view",
  "path": "/home",
  "element": "search-button",
  "tenant": "my-tenant",
  "meta": {
    "query": "search-params"
  }
}
```

Notes:

- `app` and `type` are required
- `type` supports `page_view`, `button_click`, `search`, `error`, `action`
- max 10 events per request
- if `ANALYTICS_TOKEN` is set, send it as `x-analytics-token`

### Example requests

Single event:

```bash
curl -X POST "http://localhost:5173/api/events" \
  -H "Content-Type: application/json" \
  -H "x-analytics-token: change-me" \
  -d '{
    "app": "fint-min-app",
    "type": "page_view",
    "path": "/"
  }'
```

Batch:

```bash
curl -X POST "http://localhost:5173/api/events" \
  -H "Content-Type: application/json" \
  -H "x-analytics-token: change-me" \
  -d '{
    "events": [
      { "app": "fint-min-app", "type": "page_view", "path": "/" },
      { "app": "fint-min-app", "type": "button_click", "element": "save" }
    ]
  }'
```

## Scripts

- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run start` - run built server
- `npm run typecheck` - React Router typegen + TypeScript check

## Docker Compose (App + DB)

To run both services:

```bash
docker compose up --build
```

This starts:

- `db` on `5432`
- `app` on `3000`

When using Compose app service, `DATABASE_URL` points to the `db` service internally.
