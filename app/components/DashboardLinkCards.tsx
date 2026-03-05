import { Box, Heading, HGrid, InfoCard, LinkCard } from "@navikt/ds-react";
import type { ComponentProps, ReactNode } from "react";
import { BarChartIcon } from "@navikt/aksel-icons";

type InfoCardColor = ComponentProps<typeof InfoCard>["data-color"];

type DashboardLinkItem = {
  title: string;
  content: ReactNode;
  href: string;
  color?: InfoCardColor;
};

type DashboardLinkCardsProps = {
  items: DashboardLinkItem[];
  columns?: number;
};

export default function DashboardLinkCards({
  items,
  columns,
}: DashboardLinkCardsProps) {
  return (
    <HGrid
      columns={columns ?? items.length}
      gap="space-16"
      style={{ marginBottom: 16 }}
    >
      {items.map((item) => (
        // <InfoCard key={item.title} data-color={item.color}>
        //   <InfoCard.Header>
        //     <InfoCard.Title>{item.title}</InfoCard.Title>
        //   </InfoCard.Header>
        //   <InfoCard.Content>
        //     <Heading size="large" level="3" spacing align="center">
        //       {item.content}
        //     </Heading>
        //   </InfoCard.Content>
        // </InfoCard>
        <LinkCard id={item.title} key={item.title}>
          <Box
            asChild
            borderRadius="12"
            padding="space-8"
            style={{ backgroundColor: "var(--ax-bg-moderateA)" }}
          >
            <LinkCard.Icon>
              <BarChartIcon fontSize="2rem" />
            </LinkCard.Icon>
          </Box>
          <LinkCard.Title>
            <LinkCard.Anchor href={item.href}>{item.title}</LinkCard.Anchor>
          </LinkCard.Title>
          <LinkCard.Description> <Heading size="large" level="3" spacing align="center">
              {item.content}</Heading></LinkCard.Description>
        </LinkCard>
      ))}
    </HGrid>
  );
}
