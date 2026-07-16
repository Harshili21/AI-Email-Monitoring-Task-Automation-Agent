import { createServerFn } from "@tanstack/react-start";
import { prisma } from "../lib/prisma";
import { 
  mockTrend, mockActivity, mockStats, sentimentDist, deptDist, 
  statusDist, mockEmails, mockTasks 
} from "./mockData";
import type { Email } from "@/types";

export const getStats = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const [total, completed, overdue, needsReview, pending] = await Promise.all([
      prisma.email.count(),
      prisma.email.count({ where: { status: "Completed" } }),
      prisma.email.count({ where: { status: "Overdue" } }),
      prisma.email.count({ where: { status: "Needs Review" } }),
      prisma.email.count({ where: { status: "Pending" } }),
    ]);

    const avgConfidence = 0.94; // Could compute average from DB but simplifying here for now

    return {
      total,
      completed,
      overdue,
      needsReview,
      pending,
      avgConfidence,
    };
  } catch (err) {
    console.error("Failed to query DB, returning mock stats", err);
    return mockStats;
  }
});

// Since trend data requires date grouping, we can just return a simple dynamic version or keep it mocked
export const getTrend = createServerFn({ method: "GET" }).handler(async () => {
  return mockTrend;
});

export const getSentimentDistribution = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const [pos, neu, neg] = await Promise.all([
      prisma.email.count({ where: { ai: { sentiment: "Positive" } } }),
      prisma.email.count({ where: { ai: { sentiment: "Neutral" } } }),
      prisma.email.count({ where: { ai: { sentiment: "Negative" } } }),
    ]);
    return [
      { name: "Positive", value: pos },
      { name: "Neutral", value: neu },
      { name: "Negative", value: neg },
    ];
  } catch (err) {
    return sentimentDist;
  }
});

export const getDepartmentDistribution = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const depts = ["Sales", "Support", "Finance", "Operations", "HR", "Legal", "Other"];
    const counts = await Promise.all(depts.map(d => prisma.email.count({ where: { department: d } })));
    return depts.map((d, i) => ({ name: d, value: counts[i] }));
  } catch (err) {
    return deptDist;
  }
});

export const getStatusDistribution = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const statuses = ["Pending", "Processing", "Completed", "Overdue", "Needs Review"];
    const counts = await Promise.all(statuses.map(s => prisma.email.count({ where: { status: s } })));
    return statuses.map((s, i) => ({ name: s, value: counts[i] }));
  } catch (err) {
    return statusDist;
  }
});

export const getRecentEmails = createServerFn({ method: "POST" })
  .validator((limit: number = 6) => limit)
  .handler(async ({ data: limit }) => {
    try {
      const emails = await prisma.email.findMany({
        orderBy: { receivedAt: "desc" },
        take: limit,
        include: { ai: true, clickup: true },
      });
      return emails as unknown as Email[];
    } catch (err) {
      return mockEmails.slice(0, limit);
    }
  });

export const getRecentTasks = createServerFn({ method: "POST" })
  .validator((limit: number = 5) => limit)
  .handler(async ({ data: limit }) => {
    try {
      const tasks = await prisma.clickUpTask.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        include: { email: true }
      });
      return tasks as any[];
    } catch (err) {
      return mockTasks.slice(0, limit);
    }
  });

export const getActivity = createServerFn({ method: "POST" })
  .validator((limit: number = 8) => limit)
  .handler(async ({ data: limit }) => {
    return mockActivity.slice(0, limit);
  });
