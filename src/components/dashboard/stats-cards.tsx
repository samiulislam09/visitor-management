import { Users, DoorOpen, LogIn, LogOut, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import type { DashboardStats } from "@/lib/services/dashboard";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  sub?: string;
  accent: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${accent}`}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-2xl font-semibold tabular-nums">
            {formatNumber(value)}
          </p>
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard
        icon={Users}
        label="Today's Visitors"
        value={stats.todayVisitors}
        accent="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
      />
      <StatCard
        icon={DoorOpen}
        label="Currently Inside"
        value={stats.currentlyInside}
        accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
      />
      <StatCard
        icon={LogIn}
        label="Today's Check-ins"
        value={stats.todayCheckins}
        accent="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
      />
      <StatCard
        icon={LogOut}
        label="Today's Check-outs"
        value={stats.todayCheckouts}
        accent="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
      />
      <StatCard
        icon={UserCheck}
        label="Total Visitors"
        value={stats.totalVisitors}
        accent="bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
      />
    </div>
  );
}