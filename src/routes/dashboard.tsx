import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { KpiCard } from "@/components/kpi-card";
import { ChartCard } from "@/components/chart-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge, SentimentBadge, TaskStatusBadge } from "@/components/badges";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingSpinner } from "@/components/common";
import {
  Mail, Clock, CheckCircle2, ShieldAlert, Gauge,
  Activity, ArrowUpRight, Inbox
} from "lucide-react";

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

import {
  getStats, getTrend, getSentimentDistribution, getDepartmentDistribution,
  getStatusDistribution, getRecentEmails, getRecentTasks, getActivity,
} from "@/services/dashboardService";
import { formatDistanceToNow } from "date-fns";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — MailPilot" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const stats = useQuery({ queryKey: ["stats"], queryFn: getStats });
  const trend = useQuery({ queryKey: ["trend"], queryFn: getTrend });
  const sentiment = useQuery({ queryKey: ["sentiment"], queryFn: getSentimentDistribution });
  const dept = useQuery({ queryKey: ["dept"], queryFn: getDepartmentDistribution });
  const status = useQuery({ queryKey: ["status-dist"], queryFn: getStatusDistribution });
  const emails = useQuery({ queryKey: ["recent-emails"], queryFn: () => getRecentEmails({ data: 5 }) });
  const tasks = useQuery({ queryKey: ["recent-tasks"], queryFn: () => getRecentTasks({ data: 5 }) });
  const activity = useQuery({ queryKey: ["activity"], queryFn: () => getActivity({ data: 8 }) });

  if (!stats.data) return <LoadingSpinner />;
  const s = stats.data;

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
      legend: { display: false },
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

  const trendData = {
    labels: (trend.data ?? []).map(d => d.date),
    datasets: [
      {
        label: "Total Volume",
        data: (trend.data ?? []).map(d => d.emails),
        borderColor: "#64b5f6",
        backgroundColor: "#64b5f61A", // 10% opacity
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
      {
        label: "Processed",
        data: (trend.data ?? []).map(d => d.completed),
        borderColor: "#81c784",
        backgroundColor: "#81c7841A",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
      }
    ]
  };

  const sentimentData = {
    labels: (sentiment.data ?? []).map(d => d.name),
    datasets: [{
      data: (sentiment.data ?? []).map(d => d.value),
      backgroundColor: (sentiment.data ?? []).map(d => 
        d.name === "Positive" ? "#81c784" : d.name === "Negative" ? "#e57373" : "#64b5f6"
      ),
      borderWidth: 0,
    }]
  };

  const deptData = {
    labels: (dept.data ?? []).map(d => d.name),
    datasets: [{
      label: "Volume",
      data: (dept.data ?? []).map(d => d.value),
      backgroundColor: (dept.data ?? []).map((_, i) => {
        const palette = [COLORS.accent, COLORS.primary, COLORS.secondary, COLORS.warning, COLORS.success, "#8b5cf6", "#0ea5e9"];
        return palette[i % palette.length];
      }),
      borderRadius: 4,
    }]
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Inbox Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitoring inbound traffic and routing automation accuracy.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col text-right">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending Action</span>
            <span className="text-xl font-bold tabular-nums text-foreground">{s.pending}</span>
          </div>
          <div className="h-10 w-px bg-border/60 mx-1" />
          <div className="flex flex-col text-right">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Routing Accuracy</span>
            <span className="text-xl font-bold tabular-nums text-foreground">{Math.round(s.avgConfidence * 100)}%</span>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" aria-label="Key Performance Indicators">
        <KpiCard label="Total Volume" value={s.total} icon={Inbox} tone="default" trend="+12% vs last week" />
        <KpiCard label="Completed" value={s.completed} icon={CheckCircle2} tone="default" trend="Processed successfully" />
        <KpiCard label="Overdue" value={s.overdue} icon={Clock} tone="default" />
        <KpiCard label="Needs Review" value={s.needsReview} icon={ShieldAlert} tone="default" />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/40 shadow-sm rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold tracking-tight text-foreground">Inbound Traffic Trend</CardTitle>
            <CardDescription className="text-xs">Volume over the last 14 days vs processed items.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] mt-4 w-full">
              <Line data={trendData} options={chartOptionsBase as any} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-sm rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold tracking-tight text-foreground">Customer Mood</CardTitle>
            <CardDescription className="text-xs">Aggregated sentiment analysis.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] mt-4 w-full flex items-center justify-center">
              <div className="h-[220px] w-full">
                <Doughnut 
                  data={sentimentData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "70%",
                    plugins: {
                      legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 6, font: { size: 12 } } },
                      tooltip: chartOptionsBase.plugins.tooltip
                    }
                  } as any} 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/40 shadow-sm rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold tracking-tight text-foreground">Routing Distribution</CardTitle>
            <CardDescription className="text-xs">Volume segmented by target department.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] mt-4 w-full">
              <Bar 
                data={deptData} 
                options={{
                  ...chartOptionsBase,
                  scales: {
                    x: { ...chartOptionsBase.scales.x, grid: { display: false } },
                    y: { ...chartOptionsBase.scales.y, beginAtZero: true }
                  }
                } as any} 
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-sm rounded-xl flex flex-col">
          <CardHeader className="pb-2 border-b border-border/40">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-tight">
              <Activity className="h-4 w-4 text-muted-foreground" /> System Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto max-h-[260px]">
            <div className="divide-y divide-border/30">
              {(activity.data ?? []).map(a => (
                <div key={a.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex gap-3">
                    <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{a.message}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">{formatDistanceToNow(new Date(a.timestamp), { addSuffix: true })}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1">
        <Card className="border-border/40 shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-border/40">
            <div>
              <CardTitle className="text-sm font-semibold tracking-tight text-foreground">Recent Communications</CardTitle>
              <CardDescription className="text-xs mt-1">Latest inbound items pending or processed.</CardDescription>
            </div>
            <Link to="/emails" className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors">
              View All &rarr;
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-10 text-xs">Sender</TableHead>
                  <TableHead className="h-10 text-xs">Subject</TableHead>
                  <TableHead className="h-10 text-xs">Mood</TableHead>
                  <TableHead className="h-10 text-xs text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(emails.data ?? []).map(e => (
                  <TableRow key={e.id} className="cursor-pointer transition-colors hover:bg-muted/40" onClick={() => navigate({ to: "/emails/$id", params: { id: e.id } })}>
                    <TableCell className="py-2.5">
                      <span className="font-medium text-sm text-foreground">{e.sender}</span>
                    </TableCell>
                    <TableCell className="py-2.5 max-w-[160px] truncate text-sm text-muted-foreground">{e.subject}</TableCell>
                    <TableCell className="py-2.5"><SentimentBadge sentiment={e.ai.sentiment} /></TableCell>
                    <TableCell className="py-2.5 text-right"><StatusBadge status={e.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-border/40">
            <div>
              <CardTitle className="text-sm font-semibold tracking-tight text-foreground">ClickUp Synchronization</CardTitle>
              <CardDescription className="text-xs mt-1">Tasks automatically created in the workspace.</CardDescription>
            </div>
            <Link to="/clickup" className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors">
              View All &rarr;
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-10 text-xs">Reference</TableHead>
                  <TableHead className="h-10 text-xs">Context</TableHead>
                  <TableHead className="h-10 text-xs text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(tasks.data ?? []).map(t => (
                  <TableRow key={t.id} className="transition-colors hover:bg-muted/40">
                    <TableCell className="py-2.5 font-mono text-xs font-medium text-slate-600">{t.taskId}</TableCell>
                    <TableCell className="py-2.5">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t.folder}</span>
                        <span className="max-w-[180px] truncate text-sm text-foreground mt-0.5">{t.emailSubject}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 text-right"><TaskStatusBadge status={t.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
