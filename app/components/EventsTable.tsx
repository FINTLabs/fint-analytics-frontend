import { Button, HStack, Popover, Table } from "@navikt/ds-react";
import {
  ExclamationmarkTriangleIcon,
  FileCodeIcon,
  FingerButtonIcon,
  MagnifyingGlassCheckmarkIcon,
} from "@navikt/aksel-icons";
import { type MouseEvent, type ReactElement, useState } from "react";
import type { AnalyticsEvent } from "~/types/analytics";
import { formatTs } from "~/utils/time";

type EventsTableProps = {
  events: AnalyticsEvent[];
  hideAppColumn?: boolean;
  hideTenantColumn?: boolean;
  emptyMessage?: string;
};

function getTypeIcon(type: string, fontSize = "1.5rem"): ReactElement {
  switch (type) {
    case "page_view":
      return (
        <FileCodeIcon
          aria-hidden
          fontSize={fontSize}
          color="var(--ax-bg-success-strong)"
        />
      );
    case "button_click":
      return (
        <FingerButtonIcon
          aria-hidden
          fontSize={fontSize}
          color="var(--ax-bg-brand-blue-strong)"
        />
      );
    case "search":
      return (
        <MagnifyingGlassCheckmarkIcon
          aria-hidden
          fontSize={fontSize}
          color="var(--ax-bg-meta-purple-strong)"
        />
      );
    default:
      return (
        <ExclamationmarkTriangleIcon
          aria-hidden
          fontSize={fontSize}
          color="var(--ax-bg-danger-strong)"
        />
      );
  }
}

export default function EventsTable({
  events,
  hideAppColumn = false,
  hideTenantColumn = false,
  emptyMessage = "No events in this period",
}: EventsTableProps) {
  const [openPopoverId, setOpenPopoverId] = useState<number | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handlePopoverToggle = (
    event: MouseEvent<HTMLButtonElement>,
    rowId: number,
  ) => {
    if (openPopoverId === rowId) {
      setOpenPopoverId(null);
      setAnchorEl(null);
      return;
    }

    setAnchorEl(event.currentTarget);
    setOpenPopoverId(rowId);
  };

  const handlePopoverClose = () => {
    setOpenPopoverId(null);
    setAnchorEl(null);
  };

  return (
    <Table zebraStripes>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Type</Table.HeaderCell>
          <Table.HeaderCell>Time</Table.HeaderCell>
          {!hideAppColumn ? <Table.HeaderCell>App</Table.HeaderCell> : null}
          <Table.HeaderCell>Path</Table.HeaderCell>
          <Table.HeaderCell>Element</Table.HeaderCell>
          {!hideTenantColumn ? (
            <Table.HeaderCell>Tenant</Table.HeaderCell>
          ) : null}
          <Table.HeaderCell>Meta</Table.HeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {events.length === 0 ? (
          <Table.Row>
            <Table.DataCell>{emptyMessage}</Table.DataCell>
            <Table.DataCell>-</Table.DataCell>
            {!hideAppColumn ? <Table.DataCell>-</Table.DataCell> : null}
            <Table.DataCell>-</Table.DataCell>
            <Table.DataCell>-</Table.DataCell>
            {!hideTenantColumn ? <Table.DataCell>-</Table.DataCell> : null}
            <Table.DataCell>-</Table.DataCell>
          </Table.Row>
        ) : (
          events.map((row) => (
            <Table.Row key={row.id}>
              <Table.DataCell>
                <HStack gap="space-2" align="center">
                  {getTypeIcon(row.type, "1.125rem")}
                  {row.type}
                </HStack>
              </Table.DataCell>
              <Table.DataCell>{formatTs(row.ts)}</Table.DataCell>
              {!hideAppColumn ? (
                <Table.DataCell>{row.app}</Table.DataCell>
              ) : null}
              <Table.DataCell>{row.path ?? "-"}</Table.DataCell>
              <Table.DataCell>{row.element ?? "-"}</Table.DataCell>
              {!hideTenantColumn ? (
                <Table.DataCell>{row.tenant ?? "-"}</Table.DataCell>
              ) : null}
              <Table.DataCell>
                {row.meta ? (
                  <>
                    <Popover
                      open={openPopoverId === row.id}
                      onClose={handlePopoverClose}
                      anchorEl={anchorEl}
                      id={row.id.toString()}
                    >
                      <Popover.Content>
                        {JSON.stringify(row.meta)}
                      </Popover.Content>
                    </Popover>
                    <Button
                      onClick={(event) => handlePopoverToggle(event, row.id)}
                      aria-expanded={openPopoverId === row.id}
                      aria-controls={
                        openPopoverId === row.id ? row.id.toString() : undefined
                      }
                      size="small"
                      variant="tertiary"
                    >
                      View
                    </Button>
                  </>
                ) : (
                  "-"
                )}
              </Table.DataCell>
            </Table.Row>
          ))
        )}
      </Table.Body>
    </Table>
  );
}
