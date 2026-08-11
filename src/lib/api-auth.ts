import "server-only";
import { getCurrentUser } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { hasPermission, type Permission } from "@/lib/permissions";

export async function requireApiAuth(permission?: Permission): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new ApiError("Authentication required", 401, "UNAUTHORIZED");
  }
  if (permission && !hasPermission(user, permission)) {
    throw new ApiError("You do not have permission to perform this action", 403, "FORBIDDEN");
  }
  return user;
}