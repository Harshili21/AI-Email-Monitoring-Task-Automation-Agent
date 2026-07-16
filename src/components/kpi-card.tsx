import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  tone?: "default" | "success" | "warning" | "destructive" | "info";
}

const toneMap = {
  default: "bg-primary/10 text-primary ring-primary/15",
  success: "bg-success/10 text-success ring-success/15",
  warning: "bg-warning/15 text-warning ring-warning/20",
  destructive: "bg-destructive/10 text-destructive ring-destructive/15",
  info: "bg-info/10 text-info ring-info/15",
};

const barMap = {
  default: "from-primary/60 to-primary",
  success: "from-success/60 to-success",
  warning: "from-warning/60 to-warning",
  destructive: "from-destructive/60 to-destructive",
  info: "from-info/60 to-info",
};

export function KpiCard({ label, value, icon: Icon, trend, tone = "default" }: Props) {
  return (
    <Card
      role="group"
      tabIndex={0}
      aria-label={`${label}: ${value}`}
      className={cn(
        "group relative overflow-hidden border-border/60 bg-[var(--gradient-surface)] kpi-card",
        "transition-all duration-200 ease-in-out",
        "focus-visible:translate-y-[-2px] focus-visible:shadow-[var(--shadow-elevated)]",
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r opacity-70", barMap[tone])} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.05em] text-muted-foreground">{label}</p>
            <p className="mt-2 font-display text-2xl font-semibold tabular-nums tracking-tight" aria-hidden="false">{value}</p>
            {trend && <p className="mt-1 text-sm text-muted-foreground">{trend}</p>}
          </div>
          <div
            className={cn(
              "rounded-lg p-2.5 ring-1 transition-transform duration-200 ease-in-out kpi-icon",
              "group-hover:scale-105 focus-visible:scale-105",
              toneMap[tone],
            )}
            aria-hidden="true"
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
