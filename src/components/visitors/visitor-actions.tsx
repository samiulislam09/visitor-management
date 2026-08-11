"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Printer, LogIn, LogOut, ClipboardX, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/confirm-dialog";
import { Spinner } from "@/components/spinner";
import type { UserRole } from "@/lib/constants";

export interface DetailVisitor {
  id: string;
  fullName: string;
  status: string;
}

export function VisitorActions({
  visitor,
  role,
}: {
  visitor: DetailVisitor;
  role: UserRole;
}) {
  const router = useRouter();
  const [processing, setProcessing] = React.useState<string | null>(null);
  const [deleted, setDeleted] = React.useState(false);

  async function runAction(action: "check-in" | "check-out" | "cancel" | "delete") {
    setProcessing(action);
    try {
      const res = await fetch(`/api/visitors/${visitor.id}/${action}`, { method: "POST" });
      const body = await res.json();
      if (!res.ok || !body.success) {
        toast.error(body?.error?.message ?? "Action failed");
        return;
      }
      if (action === "delete") {
        toast.success("Visitor deleted successfully");
        setDeleted(true);
        router.push("/visitors");
        router.refresh();
        return;
      }
      toast.success(
        action === "check-in"
          ? "Visitor checked in successfully"
          : action === "check-out"
            ? "Visitor checked out successfully"
            : "Visitor cancelled"
      );
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setProcessing(null);
    }
  }

  if (deleted) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={`/visitors/${visitor.id}/edit`}>
          <Pencil /> Edit
        </Link>
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link href={`/visitors/${visitor.id}/pass`} target="_blank">
          <Printer /> Print Pass
        </Link>
      </Button>

      {visitor.status === "EXPECTED" && (
        <Button
          size="sm"
          disabled={processing !== null}
          onClick={() => void runAction("check-in")}
        >
          {processing === "check-in" ? <Spinner /> : <LogIn />}
          Check In
        </Button>
      )}

      {visitor.status === "CHECKED_IN" && (
        <ConfirmationDialog
          trigger={
            <Button
              size="sm"
              className="bg-emerald-600 text-white hover:bg-emerald-600/90"
              disabled={processing !== null}
            >
              <LogOut /> Check Out
            </Button>
          }
          title="Check Out Visitor?"
          description={`Check out ${visitor.fullName} now?`}
          confirmLabel="Check out"
          destructive={false}
          onConfirm={() => runAction("check-out")}
        />
      )}

      {visitor.status === "EXPECTED" && (
        <ConfirmationDialog
          trigger={
            <Button
              variant="outline"
              size="sm"
              className="text-amber-600"
              disabled={processing !== null}
            >
              <ClipboardX /> Cancel Visit
            </Button>
          }
          title="Cancel Visit?"
          description="Mark this visit as cancelled?"
          confirmLabel="Cancel visit"
          destructive={false}
          onConfirm={() => runAction("cancel")}
        />
      )}

      {role === "ADMIN" && (
        <ConfirmationDialog
          trigger={
            <Button
              variant="outline"
              size="sm"
              className="text-destructive"
              disabled={processing !== null}
            >
              <Trash2 /> Delete
            </Button>
          }
          title="Delete Visitor?"
          description={`This will permanently delete ${visitor.fullName}'s record. This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={() => runAction("delete")}
        />
      )}
    </div>
  );
}