import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingSpinner, EmptyState } from "@/components/common";
import { TaskStatusBadge } from "@/components/badges";
import { listTasks, retryTask } from "@/services/clickupService";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/clickup")({
  head: () => ({ meta: [{ title: "ClickUp Tasks — MailPilot" }] }),
  component: ClickUpPage,
});

function ClickUpPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useQuery({ queryKey: ["tasks"], queryFn: listTasks });
  const [retrying, setRetrying] = useState<Record<string, boolean>>({});

  const handleRetry = async (taskId: string) => {
    setRetrying(prev => ({ ...prev, [taskId]: true }));
    try {
      const result = await retryTask(taskId);
      if (result.ok) {
        toast.success(`Task ${taskId} has been reset and will be retried`);
      } else {
        toast.error("Failed to retry task");
      }
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["recent-tasks"] });
    } finally {
      setRetrying(prev => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
    }
  };

  return (
    <div>
      <PageHeader
        title="ClickUp Tasks"
        description="Tasks created by the AI agent from processed emails"
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "ClickUp Tasks" }]}
        actions={<Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>}
      />
      <Card className="border-border/60 shadow-[var(--shadow-soft)]">
        <CardContent className="p-0">
          {isLoading ? <LoadingSpinner /> : (data?.length ?? 0) === 0 ? (
            <EmptyState title="No tasks yet" description="Tasks appear here once the AI agent creates them." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task ID</TableHead>
                  <TableHead>Folder</TableHead>
                  <TableHead>Email Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Retries</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data!.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.taskId}</TableCell>
                    <TableCell>{t.folder}</TableCell>
                    <TableCell className="max-w-[240px] truncate">{t.emailSubject}</TableCell>
                    <TableCell><TaskStatusBadge status={t.status} /></TableCell>
                    <TableCell className="tabular-nums">{t.retryCount}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-destructive">{t.errorMessage ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(t.createdAt), "MMM d, HH:mm")}</TableCell>
                    <TableCell className="text-right">
                      {(t.status === "Failed" || t.status === "Pending Retry") && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={retrying[t.taskId]}
                          onClick={() => handleRetry(t.taskId)}
                        >
                          {retrying[t.taskId]
                            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Retrying...</>
                            : "Retry"}
                        </Button>
                      )}
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
