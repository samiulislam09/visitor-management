import { getDashboardStats, getRecentVisitors } from "@/lib/services/dashboard";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentVisitors } from "@/components/dashboard/recent-visitors";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [stats, recent] = await Promise.all([
    getDashboardStats(),
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

      <RecentVisitors rows={recent} />
    </div>
  );
}