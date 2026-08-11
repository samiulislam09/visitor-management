import "server-only";
import { dbConnect } from "@/lib/mongodb";
import { AuditLog } from "@/models/AuditLog";
import type { SessionUser } from "@/lib/auth";

export type AuditAction =
  | "VISITOR_CREATED"
  | "VISITOR_UPDATED"
  | "VISITOR_CHECKED_IN"
  | "VISITOR_CHECKED_OUT"
  | "VISITOR_CANCELLED"
  | "VISITOR_DELETED"
  | "HOST_CREATED"
  | "HOST_UPDATED"
  | "HOST_DELETED"
  | "USER_CREATED"
  | "USER_UPDATED"
  | "LOGIN"
  | "LOGOUT";

export interface WriteAuditLogInput {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  user?: SessionUser | null;
  metadata?: Record<string, unknown>;
}

export async function writeAuditLog({
  action,
  entityType,
  entityId,
  user,
  metadata,
}: WriteAuditLogInput): Promise<void> {
  try {
    await dbConnect();
    await AuditLog.create({
      action,
      entityType,
      entityId,
      userId: user?.id,
      userName: user?.name,
      metadata,
    });
  } catch (error) {
    console.error("[audit-log] failed to write audit log", error);
  }
}