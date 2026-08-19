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
