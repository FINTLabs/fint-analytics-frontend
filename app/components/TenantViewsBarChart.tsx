import { BodyLong, Box, Heading } from "@navikt/ds-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TenantViewsSummary } from "~/types/analytics";

type TenantViewsBarChartProps = {
  rows: TenantViewsSummary[];
  title?: string;
};

export default function TenantViewsBarChart({
  rows,
  title = "Total visits by tenant",
}: TenantViewsBarChartProps) {
  if (!rows.length) {
    return (
      <Box background="default" borderRadius="8" shadow="dialog" style={{ padding: 16 }}>
        <BodyLong>No tenant page view data in selected period.</BodyLong>
      </Box>
    );
  }

  const chartData = [...rows].sort((a, b) => b.totalViews - a.totalViews);

  return (
    <Box background="default" borderRadius="8" shadow="dialog" style={{ padding: 16 }}>
      <Heading level="2" size="medium" spacing>
        {title}
      </Heading>
      <Box style={{ width: "100%", minWidth: 0 }}>
        <ResponsiveContainer width="100%" height={360} minWidth={0}>
          <BarChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 56 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="tenant" angle={-35} textAnchor="end" interval={0} height={72} />
            <YAxis allowDecimals={false} width={40} />
            <Tooltip
              formatter={(value) => [
                typeof value === "number" ? value : Number(value ?? 0),
                "Total visits",
              ]}
            />
            <Bar dataKey="totalViews" fill="#0088FE" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
