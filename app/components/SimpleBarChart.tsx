import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BodyLong, Box, Heading } from "@navikt/ds-react";
import type { PageViewsByDayAppRow } from "~/types/analytics";

type SimpleBarChartProps = {
  rows: PageViewsByDayAppRow[];
  title?: string;
};

const CHART_COLORS = [
  "#82ca9d",
  "#8884d8",
  "#ff7300",
  "#00C49F",
  "#0088FE",
  "#FFBB28",
  "#a45ee5",
  "#ff6f91",
];

export default function SimpleBarChart({
  rows,
  title = "Page views per app (last 30 days)",
}: SimpleBarChartProps) {
  const appNames = Array.from(new Set(rows.map((row) => row.app))).sort((a, b) =>
    a.localeCompare(b),
  );

  const dateLabels = Array.from({ length: 30 }, (_, index) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (29 - index));
    return d.toISOString().slice(0, 10);
  });

  const grouped = new Map<string, Record<string, number | string>>(
    dateLabels.map((day) => [day, { day }]),
  );

  for (const row of rows) {
    const existing = grouped.get(row.day) ?? { day: row.day };
    existing[row.app] = row.views;
    grouped.set(row.day, existing);
  }

  const chartData = Array.from(grouped.values());

  if (rows.length === 0) {
    return (
      <Box background="default" borderRadius="8" shadow="dialog" style={{ padding: 16 }}>
        <BodyLong>No page view data for the last 30 days.</BodyLong>
      </Box>
    );
  }

  return (
    <Box background="default" borderRadius="8" shadow="dialog" style={{ padding: 16 }}>
      <Heading level="2" size="medium" spacing>
        {title}
      </Heading>
      <Box style={{ width: "100%", minWidth: 0 }}>
        <ResponsiveContainer width="100%" height={420} minWidth={0}>
        <BarChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 16 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" interval="preserveStartEnd" />
          <YAxis allowDecimals={false} width={32} />
          <Tooltip />
          <Legend />
          {appNames.map((app, index) => (
            <Bar
              key={app}
              dataKey={app}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}