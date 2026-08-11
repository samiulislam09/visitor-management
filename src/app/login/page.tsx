import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";
import { ShieldCheck } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">{APP_NAME}</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to the visitor desk
            </p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}