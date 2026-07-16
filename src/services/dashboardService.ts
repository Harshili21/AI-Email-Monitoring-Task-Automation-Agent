import { mockStats, mockTrend, sentimentDist, deptDist, statusDist, mockEmails, mockTasks, mockActivity } from "./mockData";

const delay = <T,>(v: T, ms = 200) => new Promise<T>(r => setTimeout(() => r(v), ms));

export async function getStats() { return delay(mockStats); }
export async function getTrend() { return delay(mockTrend); }
export async function getSentimentDistribution() { return delay(sentimentDist); }
export async function getDepartmentDistribution() { return delay(deptDist); }
export async function getStatusDistribution() { return delay(statusDist); }
export async function getRecentEmails(limit = 6) {
  return delay([...mockEmails].sort((a, b) => +new Date(b.receivedAt) - +new Date(a.receivedAt)).slice(0, limit));
}
export async function getRecentTasks(limit = 5) {
  return delay([...mockTasks].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, limit));
}
export async function getActivity(limit = 8) { return delay(mockActivity.slice(0, limit)); }
