import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge, DepartmentBadge, ConfidenceBadge } from "@/components/badges";
import { LoadingSpinner, EmptyState } from "@/components/common";
import { listEmails } from "@/services/emailService";
import { Search, Filter, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import {
  Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import { triggerImapFetch } from "@/services/imapActions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/emails")({
  head: () => ({ meta: [{ title: "Emails — MailPilot" }] }),
  component: EmailsPage,
});

function EmailsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState("all");
  const [client, setClient] = useState("all");
  const [minConf, setMinConf] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pageSize = 10;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["emails", { search, department, status, client, minConf, page }],
    queryFn: () => listEmails({ data: { search, department, status, client, minConfidence: minConf, page, pageSize } }),
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast.loading("Polling Gmail IMAP for new emails...", { id: "imap-refresh" });
    try {
      const res = await triggerImapFetch();
      if (res.success) {
        toast.success(res.message || "Emails synced successfully!", { id: "imap-refresh" });
        await refetch();
        // Force browser page reload to reset static JSON imports
        window.location.reload();
      } else {
        toast.error(res.message || (res as any).error || "Failed to fetch new emails", { id: "imap-refresh" });
      }
    } catch (err: any) {
      toast.error(err.message || "Error connecting to server", { id: "imap-refresh" });
    } finally {
      setIsRefreshing(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / pageSize));

  return (
    <div>
      <PageHeader
        title="Emails"
        description="All emails processed by the AI agent"
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Emails" }]}
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            <span>Refresh Inbox</span>
          </Button>
        }
      />

      <Card className="mb-4 border-border/60 shadow-[var(--shadow-soft)]">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search sender, subject..." className="pl-8" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <FilterSelect label="Department" value={department} onChange={v => { setDepartment(v); setPage(1); }}
              options={["all", "Sales", "Support", "Finance", "Operations", "HR", "Legal"]} />
            <FilterSelect label="Status" value={status} onChange={v => { setStatus(v); setPage(1); }}
              options={["all", "Pending", "Processing", "Completed", "Overdue", "Needs Review"]} />
            <FilterSelect label="Client" value={client} onChange={v => { setClient(v); setPage(1); }}
              options={["all", "c1", "c2", "c3", "c4", "c5"]}
              labels={{ all: "All clients", c1: "Acme Corp", c2: "Globex", c3: "Initech", c4: "Umbrella", c5: "Stark Industries" }} />
            <Select value={minConf?.toString() ?? "any"} onValueChange={v => { setMinConf(v === "any" ? undefined : Number(v)); setPage(1); }}>
              <SelectTrigger className="w-[170px]"><Filter className="mr-2 h-3.5 w-3.5" /><SelectValue placeholder="Min confidence" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any confidence</SelectItem>
                <SelectItem value="0.9">≥ 90%</SelectItem>
                <SelectItem value="0.7">≥ 70%</SelectItem>
                <SelectItem value="0.5">≥ 50%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-[var(--shadow-soft)]">
        <CardContent className="p-0">
          {isLoading ? <LoadingSpinner /> : (data?.items.length ?? 0) === 0 ? (
            <EmptyState title="No emails match your filters" description="Try clearing filters or changing the search query." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sender</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data!.items.map(e => (
                  <TableRow
                    key={e.id}
                    className="cursor-pointer transition-colors hover:bg-accent/50"
                    onClick={() => navigate({ to: "/emails/$id", params: { id: e.id } })}
                  >
                    <TableCell>
                      <div className="font-medium">{e.sender}</div>
                      <div className="text-xs text-muted-foreground">{e.senderEmail}</div>
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate font-medium">{e.subject}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">{e.plainBody?.slice(0, 80) || "—"}</TableCell>
                    <TableCell><DepartmentBadge department={e.department} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(e.receivedAt), "MMM d, HH:mm")}</TableCell>
                    <TableCell><StatusBadge status={e.status} /></TableCell>
                    <TableCell className="text-right"><ConfidenceBadge value={e.ai.confidence} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {data && data.total > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages} · {data.total} emails
          </p>
          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" onClick={e => { e.preventDefault(); setPage(p => Math.max(1, p - 1)); }} />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" onClick={e => { e.preventDefault(); setPage(p => Math.min(totalPages, p + 1)); }} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, labels }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; labels?: Record<string, string>;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[160px]"><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent>
        {options.map(o => (
          <SelectItem key={o} value={o}>{o === "all" ? `All ${label.toLowerCase()}` : labels?.[o] ?? o}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
