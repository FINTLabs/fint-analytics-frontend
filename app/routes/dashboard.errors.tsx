import {
  BodyLong,
  Box,
  Button,
  Heading,
  HGrid,
  HStack,
  Spacer,
  Table,
  VStack,
} from "@navikt/ds-react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useLocation, useNavigate } from "react-router";
import DateRangeActionMenu, {
  parseDashboardRange,
} from "~/components/DateRangeActionMenu";
import EventsTable from "~/components/EventsTable";
import { getErrorsOverview, listApps, listTenants } from "~/server/analytics.repo";
import type {
  ErrorCountByAppRow,
  ErrorCountByDayRow,
  ErrorCountByTenantRow,
  ErrorsOverview,
} from "~/types/analytics";
import type { DashboardRange } from "~/types/dashboard";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const range = parseDashboardRange(url);

  const app = url.searchParams.get("app")?.trim() || null;
  const tenant = url.searchParams.get("tenant")?.trim() || null;

  const [apps, tenants, overview] = await Promise.all([
    listApps(),
    listTenants(),
    getErrorsOverview({
      from: range.from,
      to: range.to,
      app,
      tenant,
    }),
  ]);

  return {
    apps,
    tenants,
    range,
    app,
    tenant,
    overview,
  };
};

function buildFilterHref(
  locationSearch: string,
  next: { app?: string | null; tenant?: string | null },
) {
  const params = new URLSearchParams(locationSearch);

  if (next.app === null) {
    params.delete("app");
  } else if (next.app !== undefined) {
    params.set("app", next.app);
  }

  if (next.tenant === null) {
    params.delete("tenant");
  } else if (next.tenant !== undefined) {
    params.set("tenant", next.tenant);
  }

  const search = params.toString();
  return search ? `?${search}` : "";
}

function FilterTable({
  title,
  rows,
  emptyMessage,
  activeValue,
  locationSearch,
  kind,
}: {
  title: string;
  rows: ErrorCountByAppRow[] | ErrorCountByTenantRow[];
  emptyMessage: string;
  activeValue: string | null;
  locationSearch: string;
  kind: "app" | "tenant";
}) {
  return (
    <Box background="default" borderRadius="8" shadow="dialog" paddingInline={'space-16'}>
      <Heading level="2" size="medium" spacing>
        {title}
      </Heading>
      <Table zebraStripes>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>{kind === "app" ? "App" : "Tenant"}</Table.HeaderCell>
            <Table.HeaderCell align="right">Errors</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.length === 0 ? (
            <Table.Row>
              <Table.DataCell>{emptyMessage}</Table.DataCell>
              <Table.DataCell align="right">0</Table.DataCell>
            </Table.Row>
          ) : kind === "app" ? (
            (rows as ErrorCountByAppRow[]).map((row) => {
              const href = buildFilterHref(locationSearch, { app: row.app });
              return (
                <Table.Row key={row.app}>
                  <Table.DataCell>
                    {activeValue === row.app ? (
                      <strong>{row.app}</strong>
                    ) : (
                      <a href={href}>{row.app}</a>
                    )}
                  </Table.DataCell>
                  <Table.DataCell align="right">{row.errors}</Table.DataCell>
                </Table.Row>
              );
            })
          ) : (
            (rows as ErrorCountByTenantRow[]).map((row) => {
              const href = buildFilterHref(locationSearch, { tenant: row.tenant });
              return (
                <Table.Row key={row.tenant}>
                  <Table.DataCell>
                    {activeValue === row.tenant ? (
                      <strong>{row.tenant}</strong>
                    ) : (
                      <a href={href}>{row.tenant}</a>
                    )}
                  </Table.DataCell>
                  <Table.DataCell align="right">{row.errors}</Table.DataCell>
                </Table.Row>
              );
            })
          )}
        </Table.Body>
      </Table>
    </Box>
  );
}

function ByDayTable({ rows }: { rows: ErrorCountByDayRow[] }) {
  return (
    <Box background="default" borderRadius="8" shadow="dialog" paddingInline={'space-16'}>
      <Heading level="2" size="medium" spacing>
        Errors by date
      </Heading>
      <Table zebraStripes>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Date</Table.HeaderCell>
            <Table.HeaderCell align="right">Errors</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.length === 0 ? (
            <Table.Row>
              <Table.DataCell>No errors in period</Table.DataCell>
              <Table.DataCell align="right">0</Table.DataCell>
            </Table.Row>
          ) : (
            rows.map((row) => (
              <Table.Row key={row.day}>
                <Table.DataCell>{row.day}</Table.DataCell>
                <Table.DataCell align="right">{row.errors}</Table.DataCell>
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table>
    </Box>
  );
}

export default function ErrorsDashboardRoute() {
  const { apps, tenants, range, app, tenant, overview } = useLoaderData<{
    apps: string[];
    tenants: string[];
    range: DashboardRange;
    app: string | null;
    tenant: string | null;
    overview: ErrorsOverview;
  }>();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={{ paddingBlock: 16 }}>
      <HStack gap="space-4" align="center">
        <VStack gap="space-2">
          <Heading level="1" size="large" spacing>
            Errors dashboard
          </Heading>
          <BodyLong spacing>
            Error events for {range.label.toLowerCase()}
            {app ? `, app: ${app}` : ""}
            {tenant ? `, tenant: ${tenant}` : ""}.
          </BodyLong>
        </VStack>
        <Spacer />
        <DateRangeActionMenu
          buttonLabel={range.label}
          onDateSelected={(selectedRange) => {
            const next = new URLSearchParams(location.search);
            next.set("preset", selectedRange.preset);
            next.set("from", selectedRange.fromInput);
            next.set("to", selectedRange.toInput);
            navigate(`${location.pathname}?${next.toString()}`);
          }}
        />
      </HStack>

      <HStack gap="space-8" style={{ marginBottom: 16 }}>
        <Button
          as="a"
          variant="secondary"
          size="small"
          href={buildFilterHref(location.search, { app: null, tenant: null })}
        >
          Clear filters
        </Button>
        {app ? (
          <Button
            as="a"
            variant="tertiary"
            size="small"
            href={buildFilterHref(location.search, { app: null })}
          >
            Remove app filter
          </Button>
        ) : null}
        {tenant ? (
          <Button
            as="a"
            variant="tertiary"
            size="small"
            href={buildFilterHref(location.search, { tenant: null })}
          >
            Remove tenant filter
          </Button>
        ) : null}
      </HStack>

      <HGrid columns={4} gap="space-16" style={{ marginBottom: 16 }}>
        <Box background="default" borderRadius="8" shadow="dialog" paddingInline={'space-16'}>
          <Heading level="2" size="small" spacing>
            Total errors
          </Heading>
          <Heading level="3" size="large">
            {overview.totalErrors}
          </Heading>
        </Box>
        <Box background="default" borderRadius="8" shadow="dialog" paddingInline={'space-16'}>
          <Heading level="2" size="small" spacing>
            Unique apps
          </Heading>
          <Heading level="3" size="large">
            {overview.uniqueApps}
          </Heading>
        </Box>
        <Box background="default" borderRadius="8" shadow="dialog" paddingInline={'space-16'}>
          <Heading level="2" size="small" spacing>
            Unique tenants
          </Heading>
          <Heading level="3" size="large">
            {overview.uniqueTenants}
          </Heading>
        </Box>
        <Box background="default" borderRadius="8" shadow="dialog" paddingInline={'space-16'}>
          <Heading level="2" size="small" spacing>
            Days with errors
          </Heading>
          <Heading level="3" size="large">
            {overview.daysWithErrors}
          </Heading>
        </Box>
      </HGrid>

      {!overview.totalErrors ? (
        <Box background="warning-soft" borderRadius="8" paddingInline={'space-16'}>
          <BodyLong>
            No error events in this period. Try a wider date range or remove filters.
          </BodyLong>
        </Box>
      ) : null}

      <HGrid columns={3} gap="space-16" paddingInline={'space-16'}>
        <ByDayTable rows={overview.byDay} />
        <FilterTable
          title="Errors by app"
          rows={overview.byApp}
          emptyMessage="No apps with errors"
          activeValue={app}
          locationSearch={location.search}
          kind="app"
        />
        <FilterTable
          title="Errors by tenant"
          rows={overview.byTenant}
          emptyMessage="No tenants with errors"
          activeValue={tenant}
          locationSearch={location.search}
          kind="tenant"
        />
      </HGrid>

      <Box background="default" borderRadius="8" shadow="dialog" paddingInline={'space-16'}>
        <Heading level="2" size="medium" spacing>
          Latest errors in selected period
        </Heading>
        <EventsTable events={overview.latestErrors} emptyMessage="No errors in this period" />
      </Box>

      <BodyLong size="small" style={{ marginTop: 16 }}>
        Available filters: {apps.length} apps and {tenants.length} tenants.
      </BodyLong>
    </div>
  );
}
