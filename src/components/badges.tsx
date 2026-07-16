import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EmailStatus, Sentiment, Department, TaskStatus } from "@/types";

const statusStyles: Record<EmailStatus, string> = {
  "Pending": "bg-warning/15 text-warning border-warning/20",
  "Processing": "bg-info/15 text-info border-info/20",
  "Completed": "bg-success/15 text-success border-success/20",
  "Overdue": "bg-destructive/15 text-destructive border-destructive/20",
  "Needs Review": "bg-accent text-accent-foreground border-accent",
};

export function StatusBadge({ status }: { status: EmailStatus }) {
  return <Badge variant="outline" className={cn("font-medium", statusStyles[status])}>{status}</Badge>;
}

const taskStyles: Record<TaskStatus, string> = {
  "Created": "bg-info/15 text-info border-info/20",
  "Pending Retry": "bg-warning/15 text-warning border-warning/20",
  "Failed": "bg-destructive/15 text-destructive border-destructive/20",
  "Completed": "bg-success/15 text-success border-success/20",
};
export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge variant="outline" className={cn("font-medium", taskStyles[status])}>{status}</Badge>;
}

const sentimentStyles: Record<Sentiment, string> = {
  "Positive": "bg-success/15 text-success border-success/20",
  "Neutral": "bg-muted text-muted-foreground border-border",
  "Negative": "bg-destructive/15 text-destructive border-destructive/20",
};
export function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  return <Badge variant="outline" className={cn("font-medium", sentimentStyles[sentiment])}>{sentiment}</Badge>;
}

export function DepartmentBadge({ department }: { department: Department }) {
  return <Badge role="status" aria-label={`Department ${department}`} variant="secondary" className="font-medium">{department}</Badge>;
}

export function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const cls = value >= 0.85 ? "bg-success/15 text-success border-success/20"
    : value >= 0.7 ? "bg-info/15 text-info border-info/20"
    : "bg-destructive/15 text-destructive border-destructive/20";
  return <Badge variant="outline" className={cn("font-medium tabular-nums", cls)}>{pct}%</Badge>;
}
