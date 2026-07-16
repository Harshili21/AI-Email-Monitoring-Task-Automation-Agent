import { store } from "./store";
import { mockTrend, sentimentDist, deptDist, statusDist, mockActivity } from "./mockData";

const delay = <T,>(v: T, ms = 200) => new Promise<T>(r => setTimeout(() => r(v), ms));

export async function getStats() {
  return delay(store.getStats());
}

export async function getTrend() { return delay(mockTrend); }

export async function getSentimentDistribution() {
  const emails = store.emails;
  const dist = ["Positive", "Neutral", "Negative"].map(s => ({
    name: s,
    value: emails.filter(e => e.ai.sentiment === s).length,
  }));
  return delay(dist);
}

export async function getDepartmentDistribution() {
  const emails = store.emails;
  const depts = ["Sales", "Support", "Finance", "Operations", "HR", "Legal", "Other"];
  const dist = depts.map(d => ({
    name: d,
    value: emails.filter(e => e.department === d).length,
  }));
  return delay(dist);
}

export async function getStatusDistribution() {
  const emails = store.emails;
  const statuses = ["Pending", "Processing", "Completed", "Overdue", "Needs Review"];
  const dist = statuses.map(s => ({
    name: s,
    value: emails.filter(e => e.status === s).length,
  }));
  return delay(dist);
}

export async function getRecentEmails(limit = 6) {
  return delay([...store.emails].sort((a, b) => +new Date(b.receivedAt) - +new Date(a.receivedAt)).slice(0, limit));
}

export async function getRecentTasks(limit = 5) {
  return delay([...store.tasks].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, limit));
}

export async function getActivity(limit = 8) { return delay(mockActivity.slice(0, limit)); }
