import { type LucideIcon, User, Clock, LogIn, LogOut, Users } from "lucide-react";

export const COMPANY_NAME = process.env.COMPANY_NAME ?? "Acme Office";

export const SESSION_COOKIE_NAME = "vms_session";

export const APP_NAME = "Visitor Management";

export const VISIT_PURPOSES = [
  "Meeting",
  "Interview",
  "Delivery",
  "Maintenance",
  "Personal Visit",
  "Official Work",
  "Other",
] as const;

export const VISITOR_STATUSES = [
  "EXPECTED",
  "CHECKED_IN",
  "CHECKED_OUT",
  "CANCELLED",
] as const;

export type VisitorStatus = (typeof VISITOR_STATUSES)[number];

export const HOST_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type HostStatus = (typeof HOST_STATUSES)[number];

export const ID_TYPES = ["National ID", "Passport", "Driving License", "Other"] as const;

export const USER_ROLES = ["ADMIN", "RECEPTIONIST", "SECURITY"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const STATUS_BADGE_STYLES: Record<string, string> = {
  CHECKED_IN: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  CHECKED_OUT: "bg-muted text-muted-foreground",
  EXPECTED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export const PURPOSE_COLORS: Record<string, string> = {
  Meeting: "#2563eb",
  Interview: "#7c3aed",
  Delivery: "#ea580c",
  Maintenance: "#16a34a",
  "Personal Visit": "#0d9488",
  "Official Work": "#dc2626",
  Other: "#6b7280",
};

export const STATUS_META: Record<
  VisitorStatus,
  { label: string; icon: LucideIcon }
> = {
  EXPECTED: { label: "Expected", icon: Clock },
  CHECKED_IN: { label: "Inside", icon: LogIn },
  CHECKED_OUT: { label: "Checked Out", icon: LogOut },
  CANCELLED: { label: "Cancelled", icon: User },
};

export const PURPOSE_ICONS: Record<string, LucideIcon> = {
  Meeting: Users,
};

export const DEFAULT_PAGE_SIZE = 20;

export const REPORT_PURPOSES = VISIT_PURPOSES as readonly string[];

export const SORT_OPTIONS = [
  { value: "createdAt_desc", label: "Newest first" },
  { value: "createdAt_asc", label: "Oldest first" },
  { value: "name_asc", label: "Name (A-Z)" },
  { value: "name_desc", label: "Name (Z-A)" },
  { value: "checkInTime_desc", label: "Check-in (newest)" },
  { value: "checkInTime_asc", label: "Check-in (oldest)" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

export const VISITORS_PER_DAY = [1, 3, 5] as const;