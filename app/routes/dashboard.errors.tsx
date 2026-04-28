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
import DateRangeActionMenu, {
  parseDashboardRange,
} from "~/components/DateRangeActionMenu";
import DashboardLinkCards from "~/components/DashboardLinkCards";
import EventsTable from "~/components/EventsTable";
import { getErrorsOverview } from "~/server/analytics.repo";
import type { ErrorsOverview } from "~/types/analytics";
import type { DashboardRange } from "~/types/dashboard";

function formatDateShort(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const range = parseDashboardRange(url);

  const overview = await getErrorsOverview({
    from: range.from,
    to: range.to,
  });

  return {
    range,
    overview,
  };
};

export default function ErrorsDashboardRoute() {
  const { range, overview } = useLoaderData<{
    range: DashboardRange;
    overview: ErrorsOverview;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const periodEndDate = new Date(range.to);
  periodEndDate.setDate(periodEndDate.getDate() - 1);
  const formattedDateRange = `${formatDateShort(range.from)} - ${formatDateShort(periodEndDate)}`;

  return (
    <div style={{ paddingBlock: 16 }}>
      <HStack gap="space-4" align="center">
        <VStack gap="space-2">
          <Heading level="1" size="large" spacing>
            Errors dashboard
          </Heading>
          <BodyLong spacing>
            Error events by app for {range.label.toLowerCase()} ({formattedDateRange}).
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

      <BodyLong spacing>Apps with errors in selected period</BodyLong>
      <DashboardLinkCards
        columns={4}
        items={overview.byApp.map((row) => ({
          title: row.app,
          content: row.errors,
          href: `/dashboard/app/${row.app}${location.search}`,
          color: "danger",
        }))}
      />

      {!overview.totalErrors ? (
        <Box background="warning-soft" borderRadius="8" style={{ padding: 16 }}>
          <BodyLong>
            No error events in this period.
          </BodyLong>
        </Box>
      ) : null}

      <Box background="default" borderRadius="8" shadow="dialog" style={{ padding: 16 }}>
        <Heading level="2" size="medium" spacing>
          Latest errors in selected period
        </Heading>
        <EventsTable events={overview.latestErrors} emptyMessage="No errors in this period" />
      </Box>
    </div>
  );
}
