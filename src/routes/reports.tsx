import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { ChartCard } from "@/components/chart-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { FileText, FileDown, Sparkles, RefreshCw, Loader2, TrendingUp, CheckCircle, Clock, Brain } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area, AreaChart,
} from "recharts";
import {
  getDailyVolume, getWeeklyTrend, getDepartmentPerformance,
  getPendingVsCompleted, getSentimentReport, exportReport, generateReport,
} from "@/services/reportService";
import type { ReportFilters } from "@/services/reportService";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — MailPilot" }] }),
  component: ReportsPage,
});

const COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];
const DEPTS = ["all", "Sales", "Support", "Finance", "Operations", "HR", "Legal", "Other"];

function ReportsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ReportFilters>({});
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);
  const [generating, setGenerating] = useState(false);
  const [reportSummary, setReportSummary] = useState<any>(null);

  const daily = useQuery({ queryKey: ["r-daily", filters], queryFn: () => getDailyVolume(filters) });
  const weekly = useQuery({ queryKey: ["r-weekly", filters], queryFn: () => getWeeklyTrend(filters) });
  const perf = useQuery({ queryKey: ["r-perf", filters], queryFn: () => getDepartmentPerformance(filters) });
  const pvc = useQuery({ queryKey: ["r-pvc", filters], queryFn: () => getPendingVsCompleted(filters) });
  const sent = useQuery({ queryKey: ["r-sent", filters], queryFn: () => getSentimentReport(filters) });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["r-daily"] });
    queryClient.invalidateQueries({ queryKey: ["r-weekly"] });
    queryClient.invalidateQueries({ queryKey: ["r-perf"] });
    queryClient.invalidateQueries({ queryKey: ["r-pvc"] });
    queryClient.invalidateQueries({ queryKey: ["r-sent"] });
  };

  const doExport = async (fmt: "csv" | "pdf") => {
    setExporting(fmt);
    try {
      const result = await exportReport(fmt, filters);
      if (result.ok) {
        toast.success(`${fmt.toUpperCase()} report exported — ${result.count} emails`);
      }
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(null);
    }
  };

  const doGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generateReport(filters);
      if (result.ok) {
        setReportSummary(result.summary);
        toast.success("Report generated successfully");
      }
    } catch {
      toast.error("Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const updateFilter = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value || undefined };
      if (value === "" || value === "all") delete (next as any)[key];
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Insights on email volume, performance, and sentiment"
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Reports" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refreshAll}>
              <RefreshCw className="mr-2 h-4 w-4" />Refresh
            </Button>
            <Button variant="outline" size="sm" disabled={exporting === "csv"} onClick={() => doExport("csv")}>
              {exporting === "csv" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
              CSV
            </Button>
            <Button variant="outline" size="sm" disabled={exporting === "pdf"} onClick={() => doExport("pdf")}>
              {exporting === "pdf" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
              PDF
            </Button>
            <Button size="sm" disabled={generating} onClick={doGenerate}>
              {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generate
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <Card className="border-border/60 shadow-[var(--shadow-soft)]">
        <CardContent className="flex flex-wrap items-center gap-4 py-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">From:</label>
            <Input
              type="date"
              className="h-8 w-[160px]"
              value={filters.from ?? ""}
              onChange={e => updateFilter("from", e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">To:</label>
            <Input
              type="date"
              className="h-8 w-[160px]"
              value={filters.to ?? ""}
              onChange={e => updateFilter("to", e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Department:</label>
            <Select value={filters.department ?? "all"} onValueChange={v => updateFilter("department", v)}>
              <SelectTrigger className="h-8 w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>{DEPTS.map(d => <SelectItem key={d} value={d}>{d === "all" ? "All Departments" : d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {(filters.from || filters.to || filters.department) && (
            <Button variant="ghost" size="sm" onClick={() => setFilters({})}>Clear filters</Button>
          )}
        </CardContent>
      </Card>

      {/* Generated Report Summary */}
      {reportSummary && (
        <Card className="border-primary/30 bg-primary/5 shadow-[var(--shadow-soft)]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              Generated Report Summary
              <Button variant="ghost" size="sm" className="ml-auto text-xs" onClick={() => setReportSummary(null)}>Dismiss</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryItem icon={<TrendingUp className="h-4 w-4" />} label="Total Emails" value={reportSummary.totalEmails} />
              <SummaryItem icon={<CheckCircle className="h-4 w-4 text-success" />} label="Completion Rate" value={`${reportSummary.completionRate}%`} />
              <SummaryItem icon={<Brain className="h-4 w-4 text-info" />} label="Avg Confidence" value={`${reportSummary.avgConfidence}%`} />
              <SummaryItem icon={<Clock className="h-4 w-4 text-warning" />} label="Needs Review" value={reportSummary.needsReview} />
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center justify-between rounded-md bg-background/60 px-3 py-2">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-semibold">{reportSummary.completed}</span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-background/60 px-3 py-2">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-semibold">{reportSummary.pending}</span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-background/60 px-3 py-2">
                <span className="text-muted-foreground">Top Dept</span>
                <span className="font-semibold">{reportSummary.topDepartment} ({reportSummary.topDepartmentCount})</span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-background/60 px-3 py-2">
                <span className="text-muted-foreground">Tasks Created</span>
                <span className="font-semibold">{reportSummary.tasksCreated}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Daily Email Volume">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily.data ?? []} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="rd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--color-border)" opacity={0.6} />
                <XAxis dataKey="date" tick={{ fontSize: 13 }} tickLine={false} axisLine={false} stroke="var(--color-muted-foreground)" />
                <YAxis tick={{ fontSize: 13 }} tickLine={false} axisLine={false} stroke="var(--color-muted-foreground)" width={36} />
                <Tooltip cursor={{ stroke: "var(--color-border)" }} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 10, fontSize: 14, boxShadow: "var(--shadow-elevated)" }} />
                <Area type="monotone" dataKey="emails" stroke="var(--color-chart-1)" fill="url(#rd)" strokeWidth={2.25} activeDot={{ r: 4, strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Weekly Trend">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weekly.data ?? []} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--color-border)" opacity={0.6} />
                <XAxis dataKey="date" tick={{ fontSize: 13 }} tickLine={false} axisLine={false} stroke="var(--color-muted-foreground)" />
                <YAxis tick={{ fontSize: 13 }} tickLine={false} axisLine={false} stroke="var(--color-muted-foreground)" width={36} />
                <Tooltip cursor={{ stroke: "var(--color-border)" }} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 10, fontSize: 14, boxShadow: "var(--shadow-elevated)" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 14, paddingTop: 8 }} />
                <Line type="monotone" dataKey="emails" stroke="var(--color-chart-1)" strokeWidth={2.25} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="completed" stroke="var(--color-chart-2)" strokeWidth={2.25} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Department Performance">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perf.data ?? []} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--color-border)" opacity={0.6} />
                <XAxis dataKey="name" tick={{ fontSize: 13 }} tickLine={false} axisLine={false} stroke="var(--color-muted-foreground)" />
                <YAxis tick={{ fontSize: 13 }} tickLine={false} axisLine={false} stroke="var(--color-muted-foreground)" width={36} />
                <Tooltip cursor={{ fill: "var(--color-muted)", opacity: 0.4 }} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 10, fontSize: 14, boxShadow: "var(--shadow-elevated)" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 14, paddingTop: 8 }} />
                <Bar dataKey="completed" stackId="a" fill="var(--color-success)" />
                <Bar dataKey="pending" stackId="a" fill="var(--color-warning)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartCard title="Pending vs Completed">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pvc.data ?? []} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={3} stroke="var(--color-card)" strokeWidth={2}>
                    {(pvc.data ?? []).map((entry, i) => {
                      const color = entry.name === "Completed" ? "var(--color-success)" : "var(--color-warning)";
                      return <Cell key={i} fill={color} />;
                    })}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 10, fontSize: 14, boxShadow: "var(--shadow-elevated)" }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 14, paddingTop: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          <ChartCard title="Sentiment">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sent.data ?? []} dataKey="value" nameKey="name" innerRadius={40} outerRadius={78} paddingAngle={2} stroke="var(--color-card)" strokeWidth={2}>
                    {(sent.data ?? []).map((entry, i) => {
                      const color = entry.name === "Positive" ? "var(--color-success)" : entry.name === "Negative" ? "var(--color-destructive)" : "oklch(0.65 0.01 240)";
                      return <Cell key={i} fill={color} />;
                    })}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 10, fontSize: 14, boxShadow: "var(--shadow-elevated)" }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 14, paddingTop: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

function SummaryItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-background/60 px-4 py-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">{icon}</div>
      <div>
        <div className="text-lg font-bold tabular-nums">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
