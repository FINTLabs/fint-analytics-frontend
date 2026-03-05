import { Heading, HGrid, InfoCard } from "@navikt/ds-react";
import type { ComponentProps, ReactNode } from "react";

type InfoCardColor = ComponentProps<typeof InfoCard>["data-color"];

type DashboardSummaryItem = {
  title: string;
  content: ReactNode;
  color?: InfoCardColor;
};

type DashboardSummaryCardsProps = {
  items: DashboardSummaryItem[];
  columns?: number;
};

export default function DashboardSummaryCards({
  items,
  columns,
}: DashboardSummaryCardsProps) {
  return (
    <HGrid
      columns={columns ?? items.length}
      gap="space-16"
      style={{ marginBottom: 16 }}
    >
      {items.map((item) => (
        <InfoCard key={item.title} data-color={item.color}>
          <InfoCard.Header>
            <InfoCard.Title>{item.title}</InfoCard.Title>
          </InfoCard.Header>
          <InfoCard.Content>
            <Heading size="large" level="3" spacing align="center">
              {item.content}
            </Heading>
          </InfoCard.Content>
        </InfoCard>
      ))}
    </HGrid>
  );
}
