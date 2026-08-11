import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { UsersManager, type UserRow } from "@/components/settings/users-manager";
import { AuditLogsView } from "@/components/settings/audit-logs-view";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isAdmin } from "@/lib/permissions";
import { COMPANY_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/dashboard");

  await dbConnect();
  const users = await User.find({}).sort({ createdAt: 1 }).lean().exec();
  const userRows: UserRow[] = users.map((u) => ({
    id: String(u._id),
    email: u.email,
    name: u.name,
    role: u.role,
    isActive: u.isActive,
    createdAt: new Date(u.createdAt).toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Company and system configuration.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company</CardTitle>
          <CardDescription>
            The organization name shown on printed visitor passes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">Company Name</dt>
              <dd className="mt-1 font-medium">{COMPANY_NAME}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Configured Via</dt>
              <dd className="mt-1 font-medium">COMPANY_NAME environment variable</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Staff Accounts</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <UsersManager initialUsers={userRows} />
        </TabsContent>
        <TabsContent value="audit">
          <AuditLogsView />
        </TabsContent>
      </Tabs>
    </div>
  );
}