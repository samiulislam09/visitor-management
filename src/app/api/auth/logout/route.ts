import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";

export async function POST() {
  const session = await getCurrentUser();
  if (session) {
    await writeAuditLog({
      action: "LOGOUT",
      entityType: "User",
      entityId: session.id,
      user: session,
    });
  }
  const response = NextResponse.json({ success: true, data: null });
  response.cookies.set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return response;
}

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ success: true, data: { user } });
}