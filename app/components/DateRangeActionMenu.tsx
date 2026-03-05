import { ActionMenu, Button } from "@navikt/ds-react";
import { ChevronDownIcon } from "@navikt/aksel-icons";
import type { DashboardPreset, DashboardRange } from "~/types/dashboard";

type FixedPreset = Exclude<DashboardPreset, "custom">;

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(date: Date) {
  const d = startOfDay(date);
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + mondayOffset);
  return d;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1);
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInput(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function getRangeForPreset(preset: FixedPreset, now = new Date()): DashboardRange {
  if (preset === "week") {
    const from = startOfWeek(now);
    const to = addDays(startOfDay(now), 1);
    return {
      label: "This week",
      preset,
      from,
      to,
      fromInput: formatDateInput(from),
      toInput: formatDateInput(addDays(to, -1)),
    };
  }

  if (preset === "month") {
    const from = startOfMonth(now);
    const to = addDays(startOfDay(now), 1);
    return {
      label: "This month",
      preset,
      from,
      to,
      fromInput: formatDateInput(from),
      toInput: formatDateInput(addDays(to, -1)),
    };
  }

  if (preset === "year") {
    const from = startOfYear(now);
    const to = addDays(startOfDay(now), 1);
    return {
      label: "This year",
      preset,
      from,
      to,
      fromInput: formatDateInput(from),
      toInput: formatDateInput(addDays(to, -1)),
    };
  }

  const from = startOfDay(now);
  const to = addDays(from, 1);
  return {
    label: "Today",
    preset: "today",
    from,
    to,
    fromInput: formatDateInput(from),
    toInput: formatDateInput(from),
  };
}

export function parseDashboardRange(url: URL): DashboardRange {
  const presetParam = url.searchParams.get("preset");
  const preset: DashboardPreset =
    presetParam === "today" ||
    presetParam === "week" ||
    presetParam === "month" ||
    presetParam === "year" ||
    presetParam === "custom"
      ? presetParam
      : "today";

  if (preset === "custom") {
    const fromRaw = url.searchParams.get("from");
    const toRaw = url.searchParams.get("to");
    const fromDate = parseDateInput(fromRaw);
    const toDate = parseDateInput(toRaw);

    if (fromDate && toDate && fromDate <= toDate) {
      return {
        label: `${fromRaw} to ${toRaw}`,
        preset,
        from: fromDate,
        to: addDays(toDate, 1),
        fromInput: fromRaw!,
        toInput: toRaw!,
      };
    }
  }

  return getRangeForPreset(preset === "custom" ? "today" : preset);
}

type DateRangeActionMenuProps = {
  buttonLabel?: string;
  onDateSelected?: (range: DashboardRange) => void;
};

export default function DateRangeActionMenu({
  buttonLabel = "This week",
  onDateSelected,
}: DateRangeActionMenuProps) {
  return (
    <ActionMenu>
      <ActionMenu.Trigger>
        <Button
          data-color="neutral"
          variant="secondary"
          icon={<ChevronDownIcon aria-hidden />}
          iconPosition="right"
        >
          {buttonLabel}
        </Button>
      </ActionMenu.Trigger>
      <ActionMenu.Content>
        <ActionMenu.Group label="Select date range">
          <ActionMenu.Item onSelect={() => onDateSelected?.(getRangeForPreset("today"))}>
            Today
          </ActionMenu.Item>
          <ActionMenu.Item onSelect={() => onDateSelected?.(getRangeForPreset("week"))}>
            This week
          </ActionMenu.Item>
          <ActionMenu.Item onSelect={() => onDateSelected?.(getRangeForPreset("month"))}>
            This month
          </ActionMenu.Item>
          <ActionMenu.Item onSelect={() => onDateSelected?.(getRangeForPreset("year"))}>
            This year
          </ActionMenu.Item>
          <ActionMenu.Divider />
          <ActionMenu.Item
            onSelect={() => {
              const today = getRangeForPreset("today");
              onDateSelected?.({ ...today, preset: "custom", label: "Custom Dates" });
            }}
          >
            Custom Dates
          </ActionMenu.Item>
        </ActionMenu.Group>
      </ActionMenu.Content>
    </ActionMenu>
  );
}
