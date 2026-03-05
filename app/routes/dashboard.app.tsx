import {
  BodyLong,
  Box,
  Heading,
  HStack,
  Spacer,
  VStack,
} from "@navikt/ds-react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useLocation, useNavigate } from "react-router";
import {
  getAppDashboardSummary,
  getAppViewsSummary,
  listApps,
  type AppDashboardSummary,
  type AppViewsSummary,
} from "~/server/analytics.repo";
import EventsTable from "~/components/EventsTable";
import DashboardSummaryCards from "~/components/DashboardSummaryCards";
import DashboardLinkCards from "~/components/DashboardLinkCards";
import DashboardTopTables from "~/components/DashboardTopTables";
import DateRangeActionMenu, {
  parseDashboardRange,
} from "~/components/DateRangeActionMenu";
import type { DashboardRange } from "~/types/dashboard";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const range = parseDashboardRange(url);

  console.log("params", params);
  const appName = params.appName;

  const apps = await listApps();
  const appViewsSummary = await getAppViewsSummary({
    from: range.from,
    to: range.to,
  });

  const selectedApp = appName && apps.includes(appName) ? appName : null;

  const summary =
    selectedApp === null
      ? null
      : await getAppDashboardSummary({
          app: selectedApp,
          from: range.from,
          to: range.to,
        });

  return {
    apps,
    appViewsSummary,
    appName: params.appName,
    selectedApp,
    range,
    summary,
  };
};

export default function DashboardRoute() {
  const { apps, appViewsSummary, selectedApp, appName, range, summary } =
    useLoaderData<{
      apps: string[];
      appViewsSummary: AppViewsSummary[];
      appName: string | null;
      selectedApp: string | null;
      range: DashboardRange;
      summary: AppDashboardSummary | null;
    }>();
  const navigate = useNavigate();
  const location = useLocation();

  const hasApps = apps.length > 0 || selectedApp !== null;

  return (
    <div style={{ paddingBlock: 16 }}>
      <HStack gap={"space-4"} align={"center"}>
        <VStack gap={"space-2"}>
          <Heading level="1" size="large" spacing>
            {appName ? appName : "App"} dashboard
          </Heading>
          <BodyLong spacing>Statistics by app for {range.label.toLowerCase()}</BodyLong>
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

      {!appName ? (
        <>
          <BodyLong spacing>
            Total page views by app
          </BodyLong>
          <DashboardLinkCards
            columns={4}
            items={appViewsSummary.map((item) => ({
              title: item.app,
              content: item.totalViews,
              href: `/dashboard/app/${item.app}`,
              color: "brand-blue",
            }))}
          />

        </>
      ) : null}

      {!hasApps ? (
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
                title: "Unique tenants",
                content: summary.uniqueTenants,
                color: "neutral",
              },
            ]}
          />


          <DashboardTopTables
            leftTitle="Top pages"
            leftLabel="Path"
            leftRows={summary.topPaths}
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
              Latest events in selected period
            </Heading>
            <EventsTable
              events={summary.latestEvents}
              hideAppColumn
              emptyMessage="No events in this period"
            />
          </Box>
        </>
      ) : null}
    </div>
  );
}
