"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Line,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Trends } from "@/lib/services/dashboard";

function formatShortDate(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
}

const COLOR = {
  visits: "#2563eb",
  checkins: "#0d9488",
};

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const dateLabel = label
    ? new Date(`${String(label)}T00:00:00`).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : "";
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md">
      {dateLabel && <p className="mb-1 text-xs font-semibold">{dateLabel}</p>}
      <div className="flex flex-col gap-1 text-xs">
        {payload.map((entry) => (
          <div key={String(entry.name)} className="flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-muted-foreground">
              {entry.name === "visits" ? "Visitors" : "Check-ins"}
            </span>
            <span className="ml-auto font-medium tabular-nums">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VisitsChart({ trends }: { trends: Trends }) {
  const [range, setRange] = React.useState<"last7Days" | "today" | "last30Days">("last7Days");

  const data = trends[range] ?? [];

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Visitors over time</CardTitle>
        <CardDescription>
          Daily registration and check-in volume
        </CardDescription>
        <Tabs
          value={range}
          onValueChange={(v) => setRange(v as typeof range)}
          className="mt-2"
        >
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="last7Days">Last 7 days</TabsTrigger>
            <TabsTrigger value="last30Days">Last 30 days</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatShortDate}
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend formatter={(value: string) => (value === "visits" ? "Visitors" : "Check-ins")} />
            <Bar dataKey="visits" fill={COLOR.visits} radius={[4, 4, 0, 0]} barSize={18} />
            <Line type="monotone" dataKey="checkins" stroke={COLOR.checkins} strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}