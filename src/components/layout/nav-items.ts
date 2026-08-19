import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FileBarChart,
} from "lucide-react";
import type { Permission } from "@/lib/permissions";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  permission?: Permission;
  exact?: boolean;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        permission: "dashboard:read",
        exact: true,
      },
    ],
  },
  {
    label: "Visitors",
    items: [
      {
        href: "/visitors",
        label: "All Visitors",
        icon: Users,
        permission: "visitor:read",
      },
      {
        href: "/visitors/register",
        label: "Register Visitor",
        icon: UserPlus,
        permission: "visitor:create",
        exact: true,
      },
    ],
  },
  {
    label: "Overview",
    items: [
      {
        href: "/reports",
        label: "Reports",
        icon: FileBarChart,
        permission: "report:read",
        exact: true,
      },
    ],
  },
];