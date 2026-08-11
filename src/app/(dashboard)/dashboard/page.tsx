import { getDashboardStats, getVisitorsOverTime, getPurposeDistribution, getRecentVisitors } from "@/lib/services/dashboard";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { VisitsChart } from "@/components/dashboard/visits-chart";
import { PurposeChart } from "@/components/dashboard/purpose-chart";
import { RecentVisitors } from "@/components/dashboard/recent-visitors";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [stats, trends, purposes, recent] = await Promise.all([
    getDashboardStats(),
    getVisitorsOverTime(),
    getPurposeDistribution(30),
    getRecentVisitors(8),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of visitor activity across the office.
        </p>
      </div>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <VisitsChart trends={trends} />
        <PurposeChart data={purposes} />
      </div>

      <RecentVisitors rows={recent} />
    </div>
  );
}