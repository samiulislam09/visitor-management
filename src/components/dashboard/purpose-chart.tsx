"use client";

import * as React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PURPOSE_COLORS } from "@/lib/constants";

export interface PurposeSlice {
  purpose: string;
  count: number;
}

function hueFor(purpose: string, index: number): string {
  if (PURPOSE_COLORS[purpose]) return PURPOSE_COLORS[purpose];
  const palette = ["#2563eb", "#7c3aed", "#ea580c", "#16a34a", "#0d9488", "#dc2626", "#6b7280", "#f59e0b"];
  return palette[index % palette.length];
}

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; payload?: PurposeSlice }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow-md">
      <p className="font-semibold">{entry.payload?.purpose}</p>
      <p className="text-muted-foreground">{entry.value} visits</p>
    </div>
  );
}

export function PurposeChart({ data }: { data: PurposeSlice[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visit purpose distribution</CardTitle>
        <CardDescription>Last 30 days</CardDescription>
      </CardHeader>
      <CardContent className="h-[320px]">
        {total === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No visits recorded yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="purpose"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                label={({ percent }: { percent?: number }) =>
                  `${Math.round((percent ?? 0) * 100)}%`
                }
              >
                {data.map((entry, index) => (
                  <Cell key={entry.purpose} fill={hueFor(entry.purpose, index)} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend formatter={(value: string) => value} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}