import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getEmail, approveEmail, rejectEmail } from "@/services/emailService";
import { createTaskFromEmail } from "@/services/clickupService";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner, EmptyState } from "@/components/common";
import { StatusBadge, SentimentBadge, DepartmentBadge, ConfidenceBadge, TaskStatusBadge } from "@/components/badges";
import { Check, X, ListPlus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/emails/$id")({
  head: () => ({ meta: [{ title: "Email — MailPilot" }] }),
  component: EmailDetailPage,
});

function EmailDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: email, isLoading, refetch } = useQuery({ queryKey: ["email", id], queryFn: () => getEmail(id) });

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
            <Button variant="outline" size="sm" onClick={() => navigate({ to: "/emails" })}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
            <Button variant="outline" size="sm" onClick={async () => { await rejectEmail(email.id); toast.error("Email rejected"); refetch(); }}>
              <X className="mr-2 h-4 w-4" />Reject
            </Button>
            <Button variant="outline" size="sm" onClick={async () => { await createTaskFromEmail(email.id); toast.success("ClickUp task created"); refetch(); }}>
              <ListPlus className="mr-2 h-4 w-4" />Create Task
            </Button>
            <Button size="sm" onClick={async () => { await approveEmail(email.id); toast.success("Email approved"); refetch(); }}>
              <Check className="mr-2 h-4 w-4" />Approve
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="border-border/60 shadow-[var(--shadow-soft)]">
            <CardHeader className="pb-2"><CardTitle className="text-base">Email</CardTitle></CardHeader>
            <CardContent>
              <h2 className="text-lg font-semibold">{email.subject}</h2>
              <Separator className="my-3" />
              <Tabs defaultValue="html">
                <TabsList>
                  <TabsTrigger value="html">HTML</TabsTrigger>
                  <TabsTrigger value="text">Plain Text</TabsTrigger>
                </TabsList>
                <TabsContent value="html" className="mt-3">
                  <div className="prose prose-sm max-w-none rounded-lg border bg-muted/30 p-4 dark:prose-invert" dangerouslySetInnerHTML={{ __html: email.htmlBody }} />
                </TabsContent>
                <TabsContent value="text" className="mt-3">
                  <pre className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 text-sm">{email.plainBody}</pre>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-[var(--shadow-soft)]">
            <CardHeader className="pb-2"><CardTitle className="text-base">AI Analysis</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{email.ai.summary}</p>
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

        <div className="space-y-4">
          <Card className="border-border/60 shadow-[var(--shadow-soft)]">
            <CardHeader className="pb-2"><CardTitle className="text-base">General</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Info label="Sender">{email.sender} <span className="text-muted-foreground">&lt;{email.senderEmail}&gt;</span></Info>
              <Info label="Recipient">{email.recipient}</Info>
              <Info label="Client">{email.clientName}</Info>
              <Info label="Department"><DepartmentBadge department={email.department} /></Info>
              <Info label="Received">{format(new Date(email.receivedAt), "PPpp")}</Info>
              <Info label="Conversation ID"><span className="font-mono text-xs">{email.conversationId}</span></Info>
              <Info label="Message ID"><span className="font-mono text-xs">{email.messageId}</span></Info>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-[var(--shadow-soft)]">
            <CardHeader className="pb-2"><CardTitle className="text-base">ClickUp</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {email.clickup ? (
                <>
                  <Info label="Folder">{email.clickup.folder}</Info>
                  <Info label="Task ID"><span className="font-mono text-xs">{email.clickup.taskId}</span></Info>
                  <Info label="Status">{email.clickup.status && <TaskStatusBadge status={email.clickup.status} />}</Info>
                </>
              ) : <p className="text-muted-foreground">No task created yet.</p>}
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
