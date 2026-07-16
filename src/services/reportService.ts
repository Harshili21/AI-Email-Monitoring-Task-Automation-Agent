import { mockTrend, sentimentDist, deptDist } from "./mockData";

const delay = <T,>(v: T, ms = 250) => new Promise<T>(r => setTimeout(() => r(v), ms));

export async function getDailyVolume() { return delay(mockTrend); }
export async function getWeeklyTrend() {
  return delay(mockTrend.filter((_, i) => i % 2 === 0).map(p => ({ ...p, emails: p.emails * 5, completed: p.completed * 5 })));
}
export async function getDepartmentPerformance() {
  return delay(deptDist.map(d => ({ name: d.name, completed: Math.floor(d.value * 0.7), pending: Math.ceil(d.value * 0.3) })));
}
export async function getPendingVsCompleted() {
  return delay([{ name: "Pending", value: 42 }, { name: "Completed", value: 108 }]);
}
export async function getSentimentReport() { return delay(sentimentDist); }
export async function exportReport(format: "csv" | "pdf") { return delay({ url: `/mock-report.${format}`, ok: true }); }
