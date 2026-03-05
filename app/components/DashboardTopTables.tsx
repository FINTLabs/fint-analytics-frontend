import { Box, Heading, HGrid, Table } from "@navikt/ds-react";

type TopRow = {
  value: string;
  events: number;
};

type DashboardTopTablesProps = {
  leftTitle: string;
  leftLabel: string;
  leftRows: TopRow[];
  leftEmptyMessage: string;
  rightTitle: string;
  rightLabel: string;
  rightRows: TopRow[];
  rightEmptyMessage: string;
};

function TopTable({
  title,
  label,
  rows,
  emptyMessage,
}: {
  title: string;
  label: string;
  rows: TopRow[];
  emptyMessage: string;
}) {
  return (
    <Box background="default" borderRadius="8" shadow="dialog" style={{ padding: 16 }}>
      <Heading level="2" size="medium" spacing>
        {title}
      </Heading>
      <Table zebraStripes>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>{label}</Table.HeaderCell>
            <Table.HeaderCell align="right">Events</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.length === 0 ? (
            <Table.Row>
              <Table.DataCell>{emptyMessage}</Table.DataCell>
              <Table.DataCell align="right">0</Table.DataCell>
            </Table.Row>
          ) : (
            rows.map((row) => (
              <Table.Row key={row.value}>
                <Table.DataCell>{row.value}</Table.DataCell>
                <Table.DataCell align="right">{row.events}</Table.DataCell>
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table>
    </Box>
  );
}

export default function DashboardTopTables({
  leftTitle,
  leftLabel,
  leftRows,
  leftEmptyMessage,
  rightTitle,
  rightLabel,
  rightRows,
  rightEmptyMessage,
}: DashboardTopTablesProps) {
  return (
    <HGrid columns={2} gap="space-16" style={{ marginBottom: 16 }}>
      <TopTable
        title={leftTitle}
        label={leftLabel}
        rows={leftRows}
        emptyMessage={leftEmptyMessage}
      />
      <TopTable
        title={rightTitle}
        label={rightLabel}
        rows={rightRows}
        emptyMessage={rightEmptyMessage}
      />
    </HGrid>
  );
}
