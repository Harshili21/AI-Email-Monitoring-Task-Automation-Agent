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
  getDailyVolume, getWeeklyTrend, getDepartmentPerformance,
  getPendingVsCompleted, getSentimentReport, exportReport, generateReport,
} from "@/services/reportService";
import type { ReportFilters } from "@/services/reportService";
import { toast } from "sonner";
import { useState } from "react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — MailPilot" }] }),
  component: ReportsPage,
});

const DEPTS = ["all", "Sales", "Support", "Finance", "Operations", "HR", "Legal", "Other"];

// Professional enterprise color palette
const COLORS = {
  primary: "#0f172a", // Slate 900
  secondary: "#64748b", // Slate 500
  accent: "#0284c7", // Sky 600
  success: "#059669", // Emerald 600
  warning: "#d97706", // Amber 600
  destructive: "#dc2626", // Red 600
  muted: "#e2e8f0" // Slate 200
};

const chartOptionsBase = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "top" as const, labels: { usePointStyle: true, boxWidth: 6, font: { size: 12 } } },
    tooltip: {
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      titleColor: "#0f172a",
      bodyColor: "#475569",
      borderColor: "#e2e8f0",
      borderWidth: 1,
      padding: 12,
      boxPadding: 4,
      usePointStyle: true,
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: "#64748b", font: { size: 12 } }, border: { display: false } },
    y: { grid: { color: "#e2e8f0", drawTicks: false, borderDash: [4, 4] }, ticks: { color: "#64748b", font: { size: 12 }, maxTicksLimit: 6 }, border: { display: false } },
  }
};

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

  const dailyData = {
    labels: (daily.data ?? []).map(d => d.date),
    datasets: [{
      label: "Emails",
      data: (daily.data ?? []).map(d => d.emails),
      borderColor: COLORS.primary,
      backgroundColor: `${COLORS.primary}1A`,
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 4,
    }]
  };

  const weeklyData = {
    labels: (weekly.data ?? []).map(d => d.date),
    datasets: [
      {
        label: "Total Volume",
        data: (weekly.data ?? []).map(d => d.emails),
        borderColor: COLORS.primary,
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
      {
        label: "Processed",
        data: (weekly.data ?? []).map(d => d.completed),
        borderColor: COLORS.secondary,
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
      }
    ]
  };

  const perfData = {
    labels: (perf.data ?? []).map(d => d.name),
    datasets: [
      {
        label: "Completed",
        data: (perf.data ?? []).map(d => d.completed),
        backgroundColor: COLORS.success,
        borderRadius: { topLeft: 0, topRight: 0, bottomLeft: 4, bottomRight: 4 },
      },
      {
        label: "Pending",
        data: (perf.data ?? []).map(d => d.pending),
        backgroundColor: COLORS.warning,
        borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
      }
    ]
  };

  const pvcData = {
    labels: (pvc.data ?? []).map(d => d.name),
    datasets: [{
      data: (pvc.data ?? []).map(d => d.value),
      backgroundColor: (pvc.data ?? []).map(d => 
        d.name === "Completed" ? COLORS.success : COLORS.warning
      ),
      borderWidth: 0,
    }]
  };

  const sentimentData = {
    labels: (sent.data ?? []).map(d => d.name),
    datasets: [{
      data: (sent.data ?? []).map(d => d.value),
      backgroundColor: (sent.data ?? []).map(d => 
        d.name === "Positive" ? COLORS.success : d.name === "Negative" ? COLORS.destructive : COLORS.secondary
      ),
      borderWidth: 0,
    }]
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <PageHeader
        title="Reports & Analytics"
        description="Data-driven insights on email volume, routing performance, and client sentiment."
        actions={
          <div className="flex flex-wrap items-center gap-2 mt-4 sm:mt-0">
            <Button variant="outline" size="sm" onClick={refreshAll} className="h-8 text-xs font-medium border-border/60">
              <RefreshCw className="mr-2 h-3.5 w-3.5" />Refresh
            </Button>
            <Button variant="outline" size="sm" disabled={exporting === "csv"} onClick={() => doExport("csv")} className="h-8 text-xs font-medium border-border/60">
              {exporting === "csv" ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <FileDown className="mr-2 h-3.5 w-3.5" />}
              CSV
            </Button>
            <Button variant="outline" size="sm" disabled={exporting === "pdf"} onClick={() => doExport("pdf")} className="h-8 text-xs font-medium border-border/60">
              {exporting === "pdf" ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <FileText className="mr-2 h-3.5 w-3.5" />}
              PDF
            </Button>
            <Button size="sm" disabled={generating} onClick={doGenerate} className="h-8 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800">
              {generating ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-2 h-3.5 w-3.5" />}
              Generate
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <Card className="border-border/40 shadow-sm rounded-xl bg-muted/10">
        <CardContent className="flex flex-wrap items-center gap-4 py-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-600 whitespace-nowrap uppercase tracking-wider">From</label>
            <Input
              type="date"
              className="h-8 w-[160px] text-sm border-slate-300"
              value={filters.from ?? ""}
              onChange={e => updateFilter("from", e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-600 whitespace-nowrap uppercase tracking-wider">To</label>
            <Input
              type="date"
              className="h-8 w-[160px] text-sm border-slate-300"
              value={filters.to ?? ""}
              onChange={e => updateFilter("to", e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-600 whitespace-nowrap uppercase tracking-wider">Dept</label>
            <Select value={filters.department ?? "all"} onValueChange={v => updateFilter("department", v)}>
              <SelectTrigger className="h-8 w-[150px] text-sm border-slate-300"><SelectValue /></SelectTrigger>
              <SelectContent>{DEPTS.map(d => <SelectItem key={d} value={d}>{d === "all" ? "All Departments" : d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {(filters.from || filters.to || filters.department) && (
            <Button variant="ghost" size="sm" className="h-8 text-xs font-medium text-slate-500 hover:text-slate-900" onClick={() => setFilters({})}>Clear filters</Button>
          )}
        </CardContent>
      </Card>

      {/* Generated Report Summary */}
      {reportSummary && (
        <Card className="border-blue-200 bg-blue-50/50 shadow-sm rounded-xl">
          <CardHeader className="pb-3 border-b border-blue-100">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Sparkles className="h-4 w-4 text-blue-600" />
              Generated Report Summary
              <Button variant="ghost" size="sm" className="ml-auto text-xs text-slate-500 hover:text-slate-900 h-6 px-2" onClick={() => setReportSummary(null)}>Dismiss</Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryItem icon={<TrendingUp className="h-4 w-4 text-slate-700" />} label="Total Emails" value={reportSummary.totalEmails} />
              <SummaryItem icon={<CheckCircle className="h-4 w-4 text-emerald-600" />} label="Completion Rate" value={`${reportSummary.completionRate}%`} />
              <SummaryItem icon={<Brain className="h-4 w-4 text-sky-600" />} label="Avg Confidence" value={`${reportSummary.avgConfidence}%`} />
              <SummaryItem icon={<Clock className="h-4 w-4 text-amber-600" />} label="Needs Review" value={reportSummary.needsReview} />
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center justify-between rounded-md bg-white border border-slate-200 px-3 py-2 shadow-sm">
                <span className="text-slate-500 font-medium text-xs uppercase tracking-wider">Completed</span>
                <span className="font-semibold text-slate-900">{reportSummary.completed}</span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-white border border-slate-200 px-3 py-2 shadow-sm">
                <span className="text-slate-500 font-medium text-xs uppercase tracking-wider">Pending</span>
                <span className="font-semibold text-slate-900">{reportSummary.pending}</span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-white border border-slate-200 px-3 py-2 shadow-sm">
                <span className="text-slate-500 font-medium text-xs uppercase tracking-wider">Top Dept</span>
                <span className="font-semibold text-slate-900">{reportSummary.topDepartment}</span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-white border border-slate-200 px-3 py-2 shadow-sm">
                <span className="text-slate-500 font-medium text-xs uppercase tracking-wider">Syncs</span>
                <span className="font-semibold text-slate-900">{reportSummary.tasksCreated}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Daily Email Volume" className="border-border/40 shadow-sm rounded-xl">
          <div className="h-[280px] w-full">
            <Line data={dailyData} options={{...chartOptionsBase, plugins: {...chartOptionsBase.plugins, legend: { display: false }}} as any} />
          </div>
        </ChartCard>

        <ChartCard title="Weekly Trend" className="border-border/40 shadow-sm rounded-xl">
          <div className="h-[280px] w-full">
            <Line data={weeklyData} options={chartOptionsBase as any} />
          </div>
        </ChartCard>

        <ChartCard title="Department Performance" className="border-border/40 shadow-sm rounded-xl lg:col-span-2">
          <div className="h-[300px] w-full">
            <Bar 
              data={perfData} 
              options={{
                ...chartOptionsBase,
                scales: {
                  x: { ...chartOptionsBase.scales.x, grid: { display: false }, stacked: true },
                  y: { ...chartOptionsBase.scales.y, beginAtZero: true, stacked: true }
                }
              } as any} 
            />
          </div>
        </ChartCard>

        <ChartCard title="Pending vs Completed" className="border-border/40 shadow-sm rounded-xl">
          <div className="h-[280px] w-full flex items-center justify-center">
            <div className="h-[220px] w-full">
              <Doughnut 
                data={pvcData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: "65%",
                  plugins: {
                    legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 6, font: { size: 12 } } },
                    tooltip: chartOptionsBase.plugins.tooltip
                  }
                } as any} 
              />
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Sentiment Analysis" className="border-border/40 shadow-sm rounded-xl">
          <div className="h-[280px] w-full flex items-center justify-center">
            <div className="h-[220px] w-full">
              <Doughnut 
                data={sentimentData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: "65%",
                  plugins: {
                    legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 6, font: { size: 12 } } },
                    tooltip: chartOptionsBase.plugins.tooltip
                  }
                } as any} 
              />
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function SummaryItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-white border border-slate-200 shadow-sm px-4 py-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100">{icon}</div>
      <div>
        <div className="text-lg font-bold tabular-nums text-slate-900">{value}</div>
        <div className="text-xs text-slate-500 font-medium tracking-wide uppercase">{label}</div>
      </div>
    </div>
  );
}
