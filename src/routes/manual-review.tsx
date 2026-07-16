import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
import { Check, X, ListPlus } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/manual-review")({
  head: () => ({ meta: [{ title: "Manual Review — MailPilot" }] }),
  component: ManualReviewPage,
});

const DEPTS = ["Sales", "Support", "Finance", "Operations", "HR", "Legal"];

function ManualReviewPage() {
  const { data, isLoading, refetch } = useQuery({ queryKey: ["low-conf"], queryFn: getLowConfidenceEmails });
  const [reclassifying, setReclassifying] = useState<Record<string, string>>({});

  return (
    <div>
      <PageHeader
        title="Manual Review"
        description="Emails with AI confidence below 70% — verify or reclassify them"
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Manual Review" }]}
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
                      <Select value={reclassifying[e.id] ?? ""} onValueChange={async v => {
                        setReclassifying(r => ({ ...r, [e.id]: v }));
                        await reclassifyEmail(e.id, v);
                        toast.success(`Reclassified to ${v}`);
                      }}>
                        <SelectTrigger className="h-8 w-[130px]"><SelectValue placeholder="Change..." /></SelectTrigger>
                        <SelectContent>{DEPTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={async () => { await approveEmail(e.id); toast.success("Approved"); refetch(); }}><Check className="h-4 w-4 text-success" /></Button>
                        <Button size="icon" variant="ghost" onClick={async () => { await rejectEmail(e.id); toast.error("Rejected"); refetch(); }}><X className="h-4 w-4 text-destructive" /></Button>
                        <Button size="icon" variant="ghost" onClick={async () => { await createTaskFromEmail(e.id); toast.success("Task created"); }}><ListPlus className="h-4 w-4" /></Button>
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
