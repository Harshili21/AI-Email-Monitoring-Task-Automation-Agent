import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getEmail, approveEmail, rejectEmail, reclassifyEmail } from "@/services/emailService";
import { createTaskFromEmail } from "@/services/clickupService";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner, EmptyState } from "@/components/common";
import { StatusBadge, SentimentBadge, DepartmentBadge, ConfidenceBadge, TaskStatusBadge } from "@/components/badges";
import { Check, X, ListPlus, ArrowLeft, Loader2, Mail, User, Calendar, Hash, Building } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export const Route = createFileRoute("/emails_/$id")({
  head: () => ({ meta: [{ title: "Email — MailPilot" }] }),
  component: EmailDetailPage,
});

const DEPTS = ["Sales", "Support", "Finance", "Operations", "HR", "Legal"];
const INVALIDATE_KEYS = ["emails", "email", "low-conf", "tasks", "stats", "recent-emails"];

function EmailDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: email, isLoading, refetch } = useQuery({ queryKey: ["email", id], queryFn: () => getEmail(id) });
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const invalidateAll = () => {
    INVALIDATE_KEYS.forEach(key => queryClient.invalidateQueries({ queryKey: [key] }));
  };

  const withLoading = async (action: string, fn: () => Promise<void>) => {
    setLoadingAction(action);
    try {
      await fn();
    } finally {
      setLoadingAction(null);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (!email) return <EmptyState title="Email not found" />;

  return (
    <div>
      <PageHeader
        title={email.subject}
        description={`From ${email.sender} · ${format(new Date(email.receivedAt), "PPpp")}`}
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Emails", to: "/emails" }, { label: "Detail" }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate({ to: "/emails" })}>
              <ArrowLeft className="mr-2 h-4 w-4" />Back
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!!loadingAction}
              onClick={() => withLoading("reject", async () => {
                await rejectEmail(email.id);
                toast.error("Email rejected");
                invalidateAll();
                refetch();
              })}
            >
              {loadingAction === "reject" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
              Reject
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!!loadingAction}
              onClick={() => withLoading("task", async () => {
                const result = await createTaskFromEmail(email.id);
                if (result.ok) {
                  toast.success(`ClickUp task ${result.taskId} created`);
                } else {
                  toast.error("Task already exists for this email");
                }
                invalidateAll();
                refetch();
              })}
            >
              {loadingAction === "task" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ListPlus className="mr-2 h-4 w-4" />}
              Create Task
            </Button>
            <Button
              size="sm"
              disabled={!!loadingAction}
              onClick={() => withLoading("approve", async () => {
                await approveEmail(email.id);
                toast.success("Email approved");
                invalidateAll();
                refetch();
              })}
            >
              {loadingAction === "approve" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Approve
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main content — 2 columns */}
        <div className="space-y-4 lg:col-span-2">
          {/* Email header bar */}
          <Card className="border-border/60 shadow-[var(--shadow-soft)]">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg">
                  {email.sender.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{email.sender}</span>
                    <span className="text-sm text-muted-foreground">&lt;{email.senderEmail}&gt;</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Mail className="h-3.5 w-3.5" />
                    <span>To: {email.recipient}</span>
                    <span className="mx-1">·</span>
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{format(new Date(email.receivedAt), "PPpp")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={email.status} />
                  <DepartmentBadge department={email.department} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email body */}
          <Card className="border-border/60 shadow-[var(--shadow-soft)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h2 className="text-lg font-semibold">{email.subject}</h2>
              <Separator className="my-3" />
              <Tabs defaultValue="html">
                <TabsList>
                  <TabsTrigger value="html">Rendered</TabsTrigger>
                  <TabsTrigger value="text">Plain Text</TabsTrigger>
                </TabsList>
                <TabsContent value="html" className="mt-3">
                  <div
                    className="prose prose-sm max-w-none rounded-lg border bg-muted/30 p-5 dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: email.htmlBody }}
                  />
                </TabsContent>
                <TabsContent value="text" className="mt-3">
                  <pre className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-5 text-sm leading-relaxed">
                    {email.plainBody}
                  </pre>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* AI Analysis */}
          <Card className="border-border/60 shadow-[var(--shadow-soft)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Building className="h-4 w-4" />
                AI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{email.ai.summary}</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Info label="Sentiment"><SentimentBadge sentiment={email.ai.sentiment} /></Info>
                <Info label="Category"><span className="text-sm font-medium">{email.ai.category}</span></Info>
                <Info label="Urgency"><span className="text-sm font-medium">{email.ai.urgency}</span></Info>
                <Info label="Business Importance"><span className="text-sm font-medium">{email.ai.businessImportance}</span></Info>
                <Info label="Confidence"><ConfidenceBadge value={email.ai.confidence} /></Info>
                <Info label="Status"><StatusBadge status={email.status} /></Info>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="border-border/60 shadow-[var(--shadow-soft)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Info label="Sender">{email.sender} <span className="text-muted-foreground">&lt;{email.senderEmail}&gt;</span></Info>
              <Info label="Recipient">{email.recipient}</Info>
              <Info label="Client">{email.clientName}</Info>
              <Info label="Department">
                <div className="flex items-center gap-2">
                  <DepartmentBadge department={email.department} />
                  <Select
                    value=""
                    disabled={!!loadingAction}
                    onValueChange={async v => {
                      setLoadingAction("reclassify");
                      await reclassifyEmail(email.id, v);
                      toast.success(`Reclassified to ${v}`);
                      invalidateAll();
                      refetch();
                      setLoadingAction(null);
                    }}
                  >
                    <SelectTrigger className="h-7 w-[100px] text-xs"><SelectValue placeholder="Change" /></SelectTrigger>
                    <SelectContent>{DEPTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </Info>
              <Info label="Received">{format(new Date(email.receivedAt), "PPpp")}</Info>
              <Info label="Conversation ID"><span className="font-mono text-xs">{email.conversationId}</span></Info>
              <Info label="Message ID"><span className="font-mono text-xs">{email.messageId}</span></Info>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-[var(--shadow-soft)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Hash className="h-4 w-4" />
                ClickUp
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {email.clickup ? (
                <>
                  <Info label="Folder">{email.clickup.folder}</Info>
                  <Info label="Task ID"><span className="font-mono text-xs">{email.clickup.taskId}</span></Info>
                  <Info label="Status">{email.clickup.status && <TaskStatusBadge status={email.clickup.status} />}</Info>
                </>
              ) : <p className="text-muted-foreground">No task created yet. Click "Create Task" above.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div>{children}</div>
    </div>
  );
}
