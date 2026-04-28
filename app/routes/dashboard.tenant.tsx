import {
  BodyLong,
  Box,
  Heading,
  HStack,
  Pagination,
  Spacer,
  VStack,
} from "@navikt/ds-react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useLocation, useNavigate } from "react-router";
import {
  getTenantViewsSummary,
  getTenantDashboardSummary,
  getTenantEventsPage,
  listTenants,
} from "~/server/analytics.repo";
import type {
  AnalyticsEvent,
  TenantDashboardSummary,
  TenantViewsSummary,
} from "~/types/analytics";
import EventsTable from "~/components/EventsTable";
import DashboardSummaryCards from "~/components/DashboardSummaryCards";
import DashboardLinkCards from "~/components/DashboardLinkCards";
import DashboardTopTables from "~/components/DashboardTopTables";
import TenantViewsBarChart from "~/components/TenantViewsBarChart";
import DateRangeActionMenu, {
  parseDashboardRange,
} from "~/components/DateRangeActionMenu";
import type { DashboardRange } from "~/types/dashboard";
import { formatPath } from "~/utils/path";

function formatDateShort(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const range = parseDashboardRange(url);
  const rawPage = Number(url.searchParams.get("page"));
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const eventsPageSize = 20;

  const tenantName = params.tenantName;

  const tenants = await listTenants();
  const tenantViewsSummary = await getTenantViewsSummary({
    from: range.from,
    to: range.to,
  });

  const selectedTenant =
    tenantName && tenants.includes(tenantName) ? tenantName : null;

  const summary =
    selectedTenant === null
      ? null
      : await getTenantDashboardSummary({
          tenant: selectedTenant,
          from: range.from,
          to: range.to,
        });

  const pagedEvents =
    selectedTenant === null
      ? { totalEvents: 0, page, events: [] as AnalyticsEvent[] }
      : await getTenantEventsPage({
          tenant: selectedTenant,
          from: range.from,
          to: range.to,
          page,
          pageSize: eventsPageSize,
        });

  return {
    tenants,
    tenantViewsSummary,
    tenantName: params.tenantName,
    selectedTenant,
    range,
    summary,
    pagedEvents,
    eventsPageSize,
  };
};

export default function TenantDashboardRoute() {
  const {
    tenants,
    tenantViewsSummary,
    selectedTenant,
    tenantName,
    range,
    summary,
    pagedEvents,
    eventsPageSize,
  } = useLoaderData<{
    tenants: string[];
    tenantViewsSummary: TenantViewsSummary[];
    tenantName: string | null;
    selectedTenant: string | null;
    range: DashboardRange;
    summary: TenantDashboardSummary | null;
    pagedEvents: {
      totalEvents: number;
      page: number;
      events: AnalyticsEvent[];
    };
    eventsPageSize: number;
  }>();
  const navigate = useNavigate();
  const location = useLocation();

  const hasTenants = tenants.length > 0 || selectedTenant !== null;
  const periodEndDate = new Date(range.to);
  periodEndDate.setDate(periodEndDate.getDate() - 1);
  const formattedDateRange = `${formatDateShort(range.from)} - ${formatDateShort(periodEndDate)}`;
  const totalEventPages = Math.max(
    1,
    Math.ceil(pagedEvents.totalEvents / eventsPageSize)
  );

  const goToEventsPage = (nextPage: number) => {
    const next = new URLSearchParams(location.search);
    next.set("page", String(nextPage));
    navigate(`${location.pathname}?${next.toString()}`);
  };

  return (
    <div style={{ paddingBlock: 16 }}>
      <HStack gap="space-4" align="center">
        <VStack gap="space-2">
          <Heading level="1" size="large" spacing>
            {tenantName ? tenantName : "Tenant"} dashboard
          </Heading>
          <BodyLong spacing>
            Statistics by tenant for {range.label.toLowerCase()} ({formattedDateRange}).
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
            next.set("page", "1");
            navigate(`${location.pathname}?${next.toString()}`);
          }}
        />
      </HStack>

      {!tenantName ? (
        <>
          <BodyLong spacing>
            Total page views by tenant.
          </BodyLong>
          <TenantViewsBarChart rows={tenantViewsSummary} />
          <DashboardLinkCards
            columns={4}
            items={tenantViewsSummary.map((item) => ({
              title: item.tenant,
              content: item.totalViews,
              href: `/dashboard/tenant/${item.tenant}`,
              color: "brand-blue",
            }))}
          />
        </>
      ) : null}

      {!hasTenants ? (
        <Box background="warning-soft" borderRadius="8" style={{ padding: 16 }}>
          <BodyLong>No events yet. Post events to see a dashboard.</BodyLong>
        </Box>
      ) : null}

      {summary ? (
        <>
          <DashboardSummaryCards
            items={[
              {
                title: "Total events",
                content: summary.totalEvents,
                color: "brand-blue",
              },
              {
                title: "Page views",
                content: summary.pageViews,
                color: "success",
              },
              {
                title: "Button clicks",
                content: summary.buttonClicks,
                color: "info",
              },
              {
                title: "Searches",
                content: summary.searches,
                color: "meta-purple",
              },
              {
                title: "Unique apps",
                content: summary.uniqueApps,
                color: "neutral",
              },
            ]}
          />

          <DashboardTopTables
            leftTitle="Top pages"
            leftLabel="Path"
            leftRows={summary.topPaths.map((row) => ({
              ...row,
              value: formatPath(row.value),
            }))}
            leftEmptyMessage="No paths in period"
            rightTitle="Top elements"
            rightLabel="Element"
            rightRows={summary.topElements}
            rightEmptyMessage="No elements in period"
          />

          <Box
            background="default"
            borderRadius="8"
            shadow="dialog"
            style={{ padding: 16 }}
          >
            <Heading level="2" size="medium" spacing>
              Events in selected period
            </Heading>
            <EventsTable
              events={pagedEvents.events}
              hideTenantColumn
              emptyMessage="No events in this period"
            />
            <HStack justify="space-between" align="center" style={{ marginTop: 12 }}>
              <BodyLong size="small">
                Page {pagedEvents.page} of {totalEventPages} ({pagedEvents.totalEvents} events)
              </BodyLong>
              <Pagination
                page={pagedEvents.page}
                onPageChange={goToEventsPage}
                count={totalEventPages}
                size="small"
                prevNextTexts
              />
            </HStack>
          </Box>
        </>
      ) : null}
    </div>
  );
}
