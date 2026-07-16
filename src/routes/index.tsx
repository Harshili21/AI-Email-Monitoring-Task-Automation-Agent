import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { KpiCard } from "@/components/kpi-card";
import { ChartCard } from "@/components/chart-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge, SentimentBadge, DepartmentBadge, TaskStatusBadge } from "@/components/badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingSpinner } from "@/components/common";
import {
  Mail, Clock, CheckCircle2, AlertOctagon, ShieldAlert, ListChecks, Gauge,
  Activity, ArrowUpRight,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";
import {
  getStats, getTrend, getSentimentDistribution, getDepartmentDistribution,
  getStatusDistribution, getRecentEmails, getRecentTasks, getActivity,
} from "@/services/dashboardService";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — MailPilot" }] }),
  component: DashboardPage,
});

const CHART_COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];

function DashboardPage() {
  const stats = useQuery({ queryKey: ["stats"], queryFn: getStats });
  const trend = useQuery({ queryKey: ["trend"], queryFn: getTrend });
  const sentiment = useQuery({ queryKey: ["sentiment"], queryFn: getSentimentDistribution });
  const dept = useQuery({ queryKey: ["dept"], queryFn: getDepartmentDistribution });
  const status = useQuery({ queryKey: ["status-dist"], queryFn: getStatusDistribution });
  const emails = useQuery({ queryKey: ["recent-emails"], queryFn: () => getRecentEmails(6) });
  const tasks = useQuery({ queryKey: ["recent-tasks"], queryFn: () => getRecentTasks(5) });
  const activity = useQuery({ queryKey: ["activity"], queryFn: () => getActivity(8) });

  if (!stats.data) return <LoadingSpinner />;
  const s = stats.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your inbox automation activity"
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Dashboard" }]}
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7" aria-label="KPI Metrics">
        <KpiCard label="Total Emails" value={s.total} icon={Mail} trend="+12% vs last week" />
        <KpiCard label="Pending" value={s.pending} icon={Clock} tone="warning" />
        <KpiCard label="Completed" value={s.completed} icon={CheckCircle2} tone="success" />
        <KpiCard label="Overdue" value={s.overdue} icon={AlertOctagon} tone="destructive" />
        <KpiCard label="Needs Review" value={s.needsReview} icon={ShieldAlert} tone="warning" />
        <KpiCard label="ClickUp Tasks" value={s.clickupCreated} icon={ListChecks} tone="info" />
        <KpiCard label="Avg AI Confidence" value={`${Math.round(s.avgConfidence * 100)}%`} icon={Gauge} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Email Trend" description="Last 14 days">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend.data ?? []} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--color-border)" opacity={0.6} />
                <XAxis dataKey="date" tick={{ fontSize: 13 }} tickLine={false} axisLine={false} stroke="var(--color-muted-foreground)" />
                <YAxis tick={{ fontSize: 13 }} tickLine={false} axisLine={false} stroke="var(--color-muted-foreground)" width={36} />
                <Tooltip cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 10, fontSize: 14, boxShadow: "var(--shadow-elevated)" }} />
                <Area animationEasing="ease-out" animationDuration={900} type="monotone" dataKey="emails" stroke="var(--color-chart-1)" fill="url(#g1)" strokeWidth={2.25} activeDot={{ r: 4, strokeWidth: 2 }} />
                <Area animationEasing="ease-out" animationDuration={900} type="monotone" dataKey="completed" stroke="var(--color-chart-2)" fill="url(#g2)" strokeWidth={2.25} activeDot={{ r: 4, strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Sentiment Distribution">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie animationEasing="ease-out" animationDuration={800} data={sentiment.data ?? []} dataKey="value" nameKey="name" innerRadius={54} outerRadius={82} paddingAngle={3} stroke="var(--color-card)" strokeWidth={2}>
                  {(sentiment.data ?? []).map((entry, i) => {
                    const color = entry.name === "Positive" ? "var(--color-success)" : entry.name === "Negative" ? "var(--color-destructive)" : "oklch(0.65 0.01 240)";
                    return <Cell key={i} fill={color} />;
                  })}
                </Pie>
                <Tooltip animationEasing="ease-out" animationDuration={700} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 10, fontSize: 14, boxShadow: "var(--shadow-elevated)" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 14, paddingTop: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Status Breakdown">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie animationEasing="ease-out" animationDuration={800} data={status.data ?? []} dataKey="value" nameKey="name" innerRadius={40} outerRadius={82} paddingAngle={2} stroke="var(--color-card)" strokeWidth={2}>
                  {(status.data ?? []).map((entry, i) => {
                    let color = "var(--color-chart-1)";
                    if (entry.name === "Completed") color = "var(--color-success)";
                    else if (entry.name === "Pending") color = "var(--color-warning)";
                    else if (entry.name === "Processing") color = "var(--color-info)";
                    else if (entry.name === "Overdue") color = "var(--color-destructive)";
                    else if (entry.name === "Needs Review") color = "var(--color-primary)";
                    return <Cell key={i} fill={color} />;
                  })}
                </Pie>
                <Tooltip animationEasing="ease-out" animationDuration={700} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 10, fontSize: 14, boxShadow: "var(--shadow-elevated)" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 14, paddingTop: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="Department Breakdown">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dept.data ?? []} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap="30%">
                  <defs>
                    <linearGradient id="barG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={1} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--color-border)" opacity={0.6} />
                  <XAxis dataKey="name" tick={{ fontSize: 13 }} tickLine={false} axisLine={false} stroke="var(--color-muted-foreground)" />
                  <YAxis tick={{ fontSize: 13 }} tickLine={false} axisLine={false} stroke="var(--color-muted-foreground)" width={36} />
                  <Tooltip animationEasing="ease-out" animationDuration={700} cursor={{ fill: "var(--color-muted)", opacity: 0.4 }} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 10, fontSize: 14, boxShadow: "var(--shadow-elevated)" }} />
                    <Bar animationEasing="ease-out" animationDuration={900} dataKey="value" fill="url(#barG)" radius={[8, 8, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        <Card className="border-border/60 shadow-[var(--shadow-soft)]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Activity className="h-4 w-4" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {(activity.data ?? []).map(a => (
                <li key={a.id} className="flex gap-3 text-sm">
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{a.message}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(a.timestamp), { addSuffix: true })}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60 shadow-[var(--shadow-soft)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">Recent Emails</CardTitle>
            <Link to="/emails" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sender</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Dept</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sentiment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(emails.data ?? []).map(e => (
                  <TableRow key={e.id} className="cursor-pointer" onClick={() => navigate({ to: "/emails/$id", params: { id: e.id } })} tabIndex={0} aria-label={`Email from ${e.sender} about ${e.subject}`}>
                    <TableCell className="font-medium text-sm">{e.sender}</TableCell>
                    <TableCell className="max-w-[180px] truncate text-sm">{e.subject}</TableCell>
                    <TableCell><DepartmentBadge department={e.department} /></TableCell>
                    <TableCell><StatusBadge status={e.status} /></TableCell>
                    <TableCell><SentimentBadge sentiment={e.ai.sentiment} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-[var(--shadow-soft)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">Recent ClickUp Tasks</CardTitle>
            <Link to="/clickup" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task ID</TableHead>
                  <TableHead>Folder</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(tasks.data ?? []).map(t => (
                  <TableRow key={t.id} tabIndex={0} aria-label={`ClickUp Task ${t.taskId}`}>
                    <TableCell className="font-mono text-sm">{t.taskId}</TableCell>
                    <TableCell className="text-sm">{t.folder}</TableCell>
                    <TableCell className="max-w-[180px] truncate text-sm">{t.emailSubject}</TableCell>
                    <TableCell><TaskStatusBadge status={t.status} /></TableCell>
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
