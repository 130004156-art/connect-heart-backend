import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function MatchBadge({ value, className }: { value: number; className?: string }) {
  const tone =
    value >= 75
      ? "bg-success/15 text-success border-success/30"
      : value >= 45
        ? "bg-warning/15 text-warning border-warning/30"
        : "bg-destructive/15 text-destructive border-destructive/30";

  return (
    <Badge variant="outline" className={cn("font-semibold", tone, className)}>
      {value}% match
    </Badge>
  );
}
