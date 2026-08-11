import type { SessionUser } from "@/lib/auth";
import { VISITOR_STATUSES } from "./constants";
import type { UserRole } from "./constants";
import { ApiError } from "./api";

export type Permission =
  | "dashboard:read"
  | "visitor:read"
  | "visitor:create"
  | "visitor:update"
  | "visitor:delete"
  | "visitor:checkin"
  | "visitor:checkout"
  | "report:read"
  | "report:export"
  | "host:read"
  | "host:manage"
  | "settings:manage"
  | "user:manage"
  | "audit:read";

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    "dashboard:read",
    "visitor:read",
    "visitor:create",
    "visitor:update",
    "visitor:delete",
    "visitor:checkin",
    "visitor:checkout",
    "report:read",
    "report:export",
    "host:read",
    "host:manage",
    "settings:manage",
    "user:manage",
    "audit:read",
  ],
  RECEPTIONIST: [
    "dashboard:read",
    "visitor:read",
    "visitor:create",
    "visitor:update",
    "visitor:checkin",
    "visitor:checkout",
    "report:read",
    "report:export",
    "host:read",
  ],
  SECURITY: [
    "dashboard:read",
    "visitor:read",
    "visitor:create",
    "visitor:checkin",
    "visitor:checkout",
    "report:read",
    "host:read",
  ],
};

export function hasPermission(user: SessionUser | null, permission: Permission): boolean {
  if (!user) return false;
  const perms = ROLE_PERMISSIONS[user.role];
  return perms.includes(permission);
}

export function requiresPermission(user: SessionUser | null, permission: Permission): void {
  if (!hasPermission(user, permission)) {
    throw new ApiError("You do not have permission to perform this action", 403, "FORBIDDEN");
  }
}

export function isAdmin(user: SessionUser | null): boolean {
  return user?.role === "ADMIN";
}

export const VISITOR_STATUS_VALUES = VISITOR_STATUSES;
export type { UserRole };