import { store } from "./store";
import { mockTrend } from "./mockData";
import type { Email } from "@/types";

const delay = <T,>(v: T, ms = 250) => new Promise<T>(r => setTimeout(() => r(v), ms));

export interface ReportFilters {
  from?: string;
  to?: string;
  department?: string;
}

function filterEmails(filters: ReportFilters = {}): Email[] {
  let items = [...store.emails];
  if (filters.from) items = items.filter(e => new Date(e.receivedAt) >= new Date(filters.from!));
  if (filters.to) items = items.filter(e => new Date(e.receivedAt) <= new Date(filters.to!));
  if (filters.department && filters.department !== "all") items = items.filter(e => e.department === filters.department);
  return items;
}

export async function getDailyVolume(filters: ReportFilters = {}) {
  const emails = filterEmails(filters);
  // Group by date
  const dateMap = new Map<string, { emails: number; completed: number }>();
  emails.forEach(e => {
    const d = new Date(e.receivedAt);
    const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const existing = dateMap.get(key) || { emails: 0, completed: 0 };
    existing.emails++;
    if (e.status === "Completed") existing.completed++;
    dateMap.set(key, existing);
  });
  const result = Array.from(dateMap.entries()).map(([date, counts]) => ({
    date,
    ...counts,
  }));
  // Sort by date
  result.sort((a, b) => {
    const parseDate = (s: string) => new Date(s + ", 2026");
    return parseDate(a.date).getTime() - parseDate(b.date).getTime();
  });
  return delay(result.length > 0 ? result : mockTrend);
}

export async function getWeeklyTrend(filters: ReportFilters = {}) {
  const daily = await getDailyVolume(filters);
  // Aggregate every 2 days as "weekly-like" trend
  return daily.filter((_, i) => i % 2 === 0).map(p => ({
    ...p,
    emails: p.emails * 5,
    completed: p.completed * 5,
  }));
}

export async function getDepartmentPerformance(filters: ReportFilters = {}) {
  const emails = filterEmails(filters);
  const depts = ["Sales", "Support", "Finance", "Operations", "HR", "Legal", "Other"];
  const dist = depts.map(d => {
    const deptEmails = emails.filter(e => e.department === d);
    return {
      name: d,
      completed: deptEmails.filter(e => e.status === "Completed").length,
      pending: deptEmails.filter(e => e.status !== "Completed").length,
    };
  });
  return delay(dist);
}

export async function getPendingVsCompleted(filters: ReportFilters = {}) {
  const emails = filterEmails(filters);
  return delay([
    { name: "Pending", value: emails.filter(e => e.status !== "Completed").length },
    { name: "Completed", value: emails.filter(e => e.status === "Completed").length },
  ]);
}

export async function getSentimentReport(filters: ReportFilters = {}) {
  const emails = filterEmails(filters);
  const dist = ["Positive", "Neutral", "Negative"].map(s => ({
    name: s,
    value: emails.filter(e => e.ai.sentiment === s).length,
  }));
  return delay(dist);
}

/** Generate a real CSV string and trigger browser download */
export async function exportReport(format: "csv" | "pdf", filters: ReportFilters = {}) {
  const emails = filterEmails(filters);

  if (format === "csv") {
    const headers = ["ID", "Sender", "Email", "Subject", "Department", "Status", "Sentiment", "Urgency", "Confidence", "Received At"];
    const rows = emails.map(e => [
      e.id,
      `"${e.sender.replace(/"/g, '""')}"`,
      e.senderEmail,
      `"${e.subject.replace(/"/g, '""')}"`,
      e.department,
      e.status,
      e.ai.sentiment,
      e.ai.urgency,
      Math.round(e.ai.confidence * 100) + "%",
      e.receivedAt,
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mailpilot-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return { ok: true, format: "csv", count: emails.length };
  }

  // PDF: generate a printable HTML report and open print dialog
  if (format === "pdf") {
    const depts = ["Sales", "Support", "Finance", "Operations", "HR", "Legal", "Other"];
    const statuses = ["Pending", "Processing", "Completed", "Overdue", "Needs Review"];
    const sentiments = ["Positive", "Neutral", "Negative"];

    const deptBreakdown = depts.map(d => `<tr><td>${d}</td><td>${emails.filter(e => e.department === d).length}</td></tr>`).join("");
    const statusBreakdown = statuses.map(s => `<tr><td>${s}</td><td>${emails.filter(e => e.status === s).length}</td></tr>`).join("");
    const sentBreakdown = sentiments.map(s => `<tr><td>${s}</td><td>${emails.filter(e => e.ai.sentiment === s).length}</td></tr>`).join("");

    const avgConf = emails.length > 0
      ? Math.round((emails.reduce((s, e) => s + e.ai.confidence, 0) / emails.length) * 100)
      : 0;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>MailPilot Report</title>
        <style>
          body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; color: #1a1a2e; }
          h1 { color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 8px; }
          h2 { color: #374151; margin-top: 28px; }
          table { border-collapse: collapse; width: 100%; margin: 12px 0 24px; }
          th, td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; }
          th { background: #f3f4f6; font-weight: 600; }
          .summary { display: flex; gap: 24px; flex-wrap: wrap; margin: 16px 0 28px; }
          .stat { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 24px; min-width: 140px; }
          .stat-value { font-size: 28px; font-weight: 700; color: #6366f1; }
          .stat-label { font-size: 13px; color: #6b7280; margin-top: 4px; }
          .footer { margin-top: 40px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 12px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>📊 MailPilot Email Report</h1>
        <p>Generated on ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>

        <div class="summary">
          <div class="stat"><div class="stat-value">${emails.length}</div><div class="stat-label">Total Emails</div></div>
          <div class="stat"><div class="stat-value">${emails.filter(e => e.status === "Completed").length}</div><div class="stat-label">Completed</div></div>
          <div class="stat"><div class="stat-value">${emails.filter(e => e.status === "Pending").length}</div><div class="stat-label">Pending</div></div>
          <div class="stat"><div class="stat-value">${avgConf}%</div><div class="stat-label">Avg Confidence</div></div>
          <div class="stat"><div class="stat-value">${store.tasks.length}</div><div class="stat-label">ClickUp Tasks</div></div>
        </div>

        <h2>Department Breakdown</h2>
        <table><tr><th>Department</th><th>Count</th></tr>${deptBreakdown}</table>

        <h2>Status Breakdown</h2>
        <table><tr><th>Status</th><th>Count</th></tr>${statusBreakdown}</table>

        <h2>Sentiment Analysis</h2>
        <table><tr><th>Sentiment</th><th>Count</th></tr>${sentBreakdown}</table>

        <h2>Email Details</h2>
        <table>
          <tr><th>Sender</th><th>Subject</th><th>Department</th><th>Status</th><th>Confidence</th><th>Date</th></tr>
          ${emails.slice(0, 50).map(e => `<tr>
            <td>${e.sender}</td>
            <td>${e.subject}</td>
            <td>${e.department}</td>
            <td>${e.status}</td>
            <td>${Math.round(e.ai.confidence * 100)}%</td>
            <td>${new Date(e.receivedAt).toLocaleDateString()}</td>
          </tr>`).join("")}
        </table>

        <div class="footer">MailPilot — AI Email Monitoring & Task Automation Agent</div>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
    return { ok: true, format: "pdf", count: emails.length };
  }

  return { ok: false, format, count: 0 };
}

/** Generate a summary report object for the "Generate" button */
export async function generateReport(filters: ReportFilters = {}) {
  const emails = filterEmails(filters);
  const completed = emails.filter(e => e.status === "Completed").length;
  const pending = emails.filter(e => e.status === "Pending").length;
  const avgConf = emails.length > 0
    ? Math.round((emails.reduce((s, e) => s + e.ai.confidence, 0) / emails.length) * 100)
    : 0;

  const topDept = ["Sales", "Support", "Finance", "Operations", "HR", "Legal", "Other"]
    .map(d => ({ name: d, count: emails.filter(e => e.department === d).length }))
    .sort((a, b) => b.count - a.count)[0];

  return delay({
    ok: true,
    summary: {
      totalEmails: emails.length,
      completed,
      pending,
      completionRate: emails.length > 0 ? Math.round((completed / emails.length) * 100) : 0,
      avgConfidence: avgConf,
      topDepartment: topDept?.name ?? "N/A",
      topDepartmentCount: topDept?.count ?? 0,
      tasksCreated: store.tasks.length,
      needsReview: store.getLowConfidenceEmails().length,
    },
  });
}
