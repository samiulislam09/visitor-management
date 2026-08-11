import { Badge } from "@/components/ui/badge";
import { STATUS_BADGE_STYLES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent",
        STATUS_BADGE_STYLES[status] ?? "bg-muted text-muted-foreground"
      )}
    >
      {status === "CHECKED_IN" && "Inside"}
      {status === "CHECKED_OUT" && "Checked Out"}
      {status === "EXPECTED" && "Expected"}
      {status === "CANCELLED" && "Cancelled"}
    </Badge>
  );
}