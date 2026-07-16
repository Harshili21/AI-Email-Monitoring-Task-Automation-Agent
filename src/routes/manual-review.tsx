import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner, EmptyState } from "@/components/common";
import { StatusBadge, ConfidenceBadge, SentimentBadge, DepartmentBadge } from "@/components/badges";
import { getLowConfidenceEmails, approveEmail, rejectEmail, reclassifyEmail } from "@/services/emailService";
import { createTaskFromEmail } from "@/services/clickupService";
import { toast } from "sonner";
import { Check, X, ListPlus, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/manual-review")({
  head: () => ({ meta: [{ title: "Manual Review — MailPilot" }] }),
  component: ManualReviewPage,
});

const DEPTS = ["Sales", "Support", "Finance", "Operations", "HR", "Legal"];

// All query keys that should be invalidated after any mutation
const INVALIDATE_KEYS = ["low-conf", "tasks", "stats", "emails", "recent-emails", "recent-tasks", "dept-dist", "status-dist", "sentiment-dist"];

function ManualReviewPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useQuery({ queryKey: ["low-conf"], queryFn: getLowConfidenceEmails });
  const [loadingAction, setLoadingAction] = useState<Record<string, string>>({});

  const invalidateAll = () => {
    INVALIDATE_KEYS.forEach(key => queryClient.invalidateQueries({ queryKey: [key] }));
  };

  const withLoading = async (emailId: string, action: string, fn: () => Promise<void>) => {
    setLoadingAction(prev => ({ ...prev, [emailId]: action }));
    try {
      await fn();
    } finally {
      setLoadingAction(prev => {
        const next = { ...prev };
        delete next[emailId];
        return next;
      });
    }
  };

  const handleApprove = (emailId: string) =>
    withLoading(emailId, "approve", async () => {
      await approveEmail({ data: emailId });
      toast.success("Email approved and marked as completed");
      invalidateAll();
    });

  const handleReject = (emailId: string) =>
    withLoading(emailId, "reject", async () => {
      await rejectEmail({ data: emailId });
      toast.error("Email rejected");
      invalidateAll();
    });

  const handleReclassify = (emailId: string, department: string) =>
    withLoading(emailId, "reclassify", async () => {
      await reclassifyEmail({ data: { id: emailId, department } });
      toast.success(`Reclassified to ${department}`);
      invalidateAll();
    });

  const handleCreateTask = (emailId: string) =>
    withLoading(emailId, "task", async () => {
      const result = await createTaskFromEmail({ data: emailId });
      if (result.ok) {
        toast.success(`ClickUp task ${result.taskId} created`);
      } else {
        toast.error("Task already exists for this email");
      }
      invalidateAll();
    });

  const isActionLoading = (emailId: string, action?: string) => {
    if (!action) return !!loadingAction[emailId];
    return loadingAction[emailId] === action;
  };

  return (
    <div>
      <PageHeader
        title="Manual Review"
        description="Emails with AI confidence below 70% — verify or reclassify them"
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Manual Review" }]}
        actions={<Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>}
      />
      <Card className="border-border/60 shadow-[var(--shadow-soft)]">
        <CardContent className="p-0">
          {isLoading ? <LoadingSpinner /> : (data?.length ?? 0) === 0 ? (
            <EmptyState title="No emails need review" description="Everything is above the confidence threshold." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sender</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Suggested Dept</TableHead>
                  <TableHead>Sentiment</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reclassify</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data!.map(e => (
                  <TableRow key={e.id} className="bg-warning/5">
                    <TableCell>
                      <div className="font-medium">{e.sender}</div>
                      <div className="text-xs text-muted-foreground">{e.senderEmail}</div>
                    </TableCell>
                    <TableCell className="max-w-[240px] truncate">{e.subject}</TableCell>
                    <TableCell><DepartmentBadge department={e.department} /></TableCell>
                    <TableCell><SentimentBadge sentiment={e.ai.sentiment} /></TableCell>
                    <TableCell><ConfidenceBadge value={e.ai.confidence} /></TableCell>
                    <TableCell><StatusBadge status={e.status} /></TableCell>
                    <TableCell>
                      <Select
                        value=""
                        disabled={isActionLoading(e.id)}
                        onValueChange={v => handleReclassify(e.id, v)}
                      >
                        <SelectTrigger className="h-8 w-[130px]"><SelectValue placeholder="Change..." /></SelectTrigger>
                        <SelectContent>{DEPTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={isActionLoading(e.id)}
                          onClick={() => handleApprove(e.id)}
                          title="Approve"
                        >
                          {isActionLoading(e.id, "approve")
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Check className="h-4 w-4 text-success" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={isActionLoading(e.id)}
                          onClick={() => handleReject(e.id)}
                          title="Reject"
                        >
                          {isActionLoading(e.id, "reject")
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <X className="h-4 w-4 text-destructive" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={isActionLoading(e.id)}
                          onClick={() => handleCreateTask(e.id)}
                          title="Create ClickUp Task"
                        >
                          {isActionLoading(e.id, "task")
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <ListPlus className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
