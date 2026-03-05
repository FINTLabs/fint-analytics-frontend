import type {Route} from "./+types/home";
import {Box, HGrid, InfoCard} from "@navikt/ds-react";
import {useLoaderData} from "react-router";
import { getLatestEvents } from "~/server/analytics.repo";
import type {
  AnalyticsEvent,
  TotalEventsPerAppWithTypesRow,
  TotalEventsPerTenantRow,
} from "~/types/analytics";
import EventsTable from "~/components/EventsTable";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Novari Analytics" },
    { name: "description", content: "Novari Analytics" },
  ];
}

export const loader = async () => {
  const rows = await getLatestEvents(50);
  // const totalEventsPerApp = await getTotalEventsPerAppWithTypes({
  //   from: new Date("2021-01-01"),
  //   to: new Date(),
  // });
  // const totalEventsPerTenant = await getTotalEventsPerTenant({
  //   from: new Date("2021-01-01"),
  //   to: new Date(),
  // });

  const totalEventsPerApp: never[] = [];
  const totalEventsPerTenant: never[] = [];

  return { rows, totalEventsPerApp, totalEventsPerTenant };
};

export default function Home() {
  const { rows, totalEventsPerApp, totalEventsPerTenant } = useLoaderData<{
    rows: AnalyticsEvent[];
    totalEventsPerApp: TotalEventsPerAppWithTypesRow[];
    totalEventsPerTenant: TotalEventsPerTenantRow[];
  }>();

  return (
    <>
      <h1>Latest events</h1>

      <HGrid columns={3} gap="space-24" margin="space-24" >
        {totalEventsPerApp.map((row) => (
            <InfoCard key={row.app} data-color="info" >
              <InfoCard.Header>
                <InfoCard.Title>{row.app}</InfoCard.Title>
              </InfoCard.Header>

              <InfoCard.Content>
                <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
                  {row.total_events} events
                </div>

                {/*{row.by_type.length > 0 && (*/}
                {/*    <List>*/}
                {/*      {row.by_type.map((t) => (*/}
                {/*            <List.Item icon={getTypeIcon(t.type, "1.125rem")} key={t.type}>*/}
                {/*              {t.events}: {t.type}*/}
                {/*            </List.Item>*/}

                {/*      ))}*/}
                {/*    </List>*/}
                {/*)}*/}
              </InfoCard.Content>
            </InfoCard>
        ))}
      </HGrid>

      <HGrid columns={3} gap="space-24" margin={"space-24"} >
        {totalEventsPerTenant.map((row) => (
          <InfoCard key={row.tenant} data-color="neutral">
            <InfoCard.Header>
              <InfoCard.Title>{row.tenant ?? "Unknown"}</InfoCard.Title>
            </InfoCard.Header>
            <InfoCard.Content>{row.events} events</InfoCard.Content>
          </InfoCard>
        ))}
      </HGrid>

      <Box>
        <EventsTable events={rows} emptyMessage="No events yet" />
      </Box>
    </>
  );
}
