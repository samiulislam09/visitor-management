"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ShieldCheck, LogOut } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { hasPermission } from "@/lib/permissions";
import { Navigation } from "./navigation";
import { NAV_GROUPS } from "./nav-items";

const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/visitors": "All Visitors",
  "/visitors/register": "Register Visitor",
  "/reports": "Reports",
  "/hosts": "Hosts / Employees",
  "/settings": "Settings",
};

export function DashboardShell({
  user,
  children,
}: {
  user: { name: string; email: string; role: "ADMIN" | "RECEPTIONIST" | "SECURITY"; id: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.permission || hasPermission(user, item.permission)
    ),
  })).filter((group) => group.items.length > 0);

  function breadcrumbLabel(path: string): string {
    if (path.startsWith("/visitors/register")) return "Register Visitor";
    const match = path.match(/^\/visitors\/([^/]+)$/);
    if (match && !ROUTE_TITLES[path]) return "Visitor Details";
    if (/^\/visitors\/[^/]+\/edit$/.test(path)) return "Edit Visitor";
    return ROUTE_TITLES[path] ?? "Dashboard";
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar lg:flex lg:flex-col lg:sticky lg:top-0 lg:h-screen">
        <div className="flex h-14 items-center gap-2 border-b px-6">
          <ShieldCheck className="size-5 text-primary" />
          <span className="text-sm font-semibold">{APP_NAME}</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <Navigation groups={groups} />
        </div>
        <div className="border-t p-3">
          <div className="flex items-center gap-3 rounded-md px-2 py-2">
            <Avatar className="size-9">
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.role}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4 sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex h-14 items-center gap-2 border-b px-6">
                <ShieldCheck className="size-5 text-primary" />
                <span className="text-sm font-semibold">{APP_NAME}</span>
              </div>
              <div className="flex-1">
                <Navigation groups={groups} />
              </div>
              <div className="border-t p-3">
                <div className="flex items-center gap-3 rounded-md px-2 py-2">
                  <Avatar className="size-9">
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.role}</p>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium text-foreground">{breadcrumbLabel(pathname)}</span>
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <p className="hidden text-sm text-muted-foreground md:block">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full lg:hidden" aria-label="Account">
                  <Avatar className="size-8">
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div>
                    {user.name}
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void handleLogout()}>
                  <LogOut className="size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}