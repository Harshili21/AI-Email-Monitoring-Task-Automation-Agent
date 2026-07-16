import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { ChartCard } from "@/components/chart-card";
import { Button } from "@/components/ui/button";
import { FileText, FileDown, Sparkles } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area, AreaChart,
} from "recharts";
import {
  getDailyVolume, getWeeklyTrend, getDepartmentPerformance,
  getPendingVsCompleted, getSentimentReport, exportReport,
} from "@/services/reportService";
import { toast } from "sonner";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — MailPilot" }] }),
  component: ReportsPage,
});

const COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];

function ReportsPage() {
  const daily = useQuery({ queryKey: ["r-daily"], queryFn: getDailyVolume });
  const weekly = useQuery({ queryKey: ["r-weekly"], queryFn: getWeeklyTrend });
  const perf = useQuery({ queryKey: ["r-perf"], queryFn: getDepartmentPerformance });
  const pvc = useQuery({ queryKey: ["r-pvc"], queryFn: getPendingVsCompleted });
  const sent = useQuery({ queryKey: ["r-sent"], queryFn: getSentimentReport });

  const doExport = async (fmt: "csv" | "pdf") => {
    await exportReport(fmt);
    toast.success(`Exported ${fmt.toUpperCase()} report`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Insights on email volume, performance, and sentiment"
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Reports" }]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => doExport("csv")}><FileDown className="mr-2 h-4 w-4" />CSV</Button>
            <Button variant="outline" size="sm" onClick={() => doExport("pdf")}><FileText className="mr-2 h-4 w-4" />PDF</Button>
            <Button size="sm" onClick={() => toast.success("Report generation started")}><Sparkles className="mr-2 h-4 w-4" />Generate</Button>
          </>
        }
      />

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
