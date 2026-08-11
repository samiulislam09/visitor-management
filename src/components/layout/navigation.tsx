"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { NavGroup } from "./nav-items";

function isActive(href: string, pathname: string, exact?: boolean, search = ""): boolean {
  if (href.includes("?")) {
    const [base, query] = href.split("?");
    const params = new URLSearchParams(query);
    if (params.has("status")) {
      const statusSearch = new URLSearchParams(search).get("status");
      return pathname === base && statusSearch === params.get("status");
    }
    return pathname === base;
  }
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navigation({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <ScrollArea className="h-full">
      <nav className="flex flex-col gap-6 px-2 py-4">
        {groups.map((group, index) => (
          <div key={index} className="flex flex-col gap-1">
            {group.label && (
              <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const active = isActive(item.href, pathname, item.exact, searchParams.toString());
              const Icon = item.icon;
              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </ScrollArea>
  );
}