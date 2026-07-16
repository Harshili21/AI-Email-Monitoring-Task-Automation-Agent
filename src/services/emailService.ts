import { createServerFn } from "@tanstack/react-start";
import { prisma } from "../lib/prisma";
import type { Email } from "@/types";

export interface EmailFilters {
  department?: string;
  status?: string;
  client?: string;
  from?: string;
  to?: string;
  minConfidence?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}

export const listEmails = createServerFn({ method: "POST" })
  .validator((filters: EmailFilters = {}) => filters)
  .handler(async ({ data: filters }) => {
    const where: any = {};
    if (filters.department && filters.department !== "all") where.department = filters.department;
    if (filters.status && filters.status !== "all") where.status = filters.status;
    if (filters.client && filters.client !== "all") where.clientId = filters.client;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      where.OR = [
        { subject: { contains: q } },
        { sender: { contains: q } },
        { senderEmail: { contains: q } }
      ];
    }
    if (filters.minConfidence != null) {
      where.ai = { confidence: { gte: filters.minConfidence } };
    }
    if (filters.from || filters.to) {
      where.receivedAt = {};
      if (filters.from) where.receivedAt.gte = new Date(filters.from);
      if (filters.to) where.receivedAt.lte = new Date(filters.to);
    }

    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 10;
    
    const [items, total] = await Promise.all([
      prisma.email.findMany({
        where,
        include: { ai: true, clickup: true },
        orderBy: { receivedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.email.count({ where })
    ]);

    return { items: items as unknown as Email[], total, page, pageSize };
  });

export const getEmail = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const email = await prisma.email.findUnique({
      where: { id },
      include: { ai: true, clickup: true },
    });
    return email as unknown as Email | undefined;
  });

export const getLowConfidenceEmails = createServerFn({ method: "POST" })
  .handler(async () => {
    const emails = await prisma.email.findMany({
      where: {
        ai: { confidence: { lt: 0.7 } },
        status: { not: "Completed" }
      },
      include: { ai: true, clickup: true },
    });
    return emails as unknown as Email[];
  });

export const approveEmail = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const email = await prisma.email.update({
      where: { id },
      data: {
        status: "Completed",
        ai: { update: { confidence: 1.0 } }
      },
      include: { ai: true }
    });
    return { id, ok: !!email };
  });

export const rejectEmail = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const email = await prisma.email.update({
      where: { id },
      data: {
        status: "Completed",
        ai: { update: { confidence: 1.0 } } // Simplification
      }
    });
    return { id, ok: !!email };
  });

export const reclassifyEmail = createServerFn({ method: "POST" })
  .validator((data: { id: string; department: string }) => data)
  .handler(async ({ data: { id, department } }) => {
    const existing = await prisma.email.findUnique({ where: { id }, include: { ai: true } });
    if (!existing || !existing.ai) return { id, department, ok: false };
    
    const email = await prisma.email.update({
      where: { id },
      data: {
        department,
        ai: {
          update: {
            confidence: 0.95,
            summary: existing.ai.summary.replace(/Route to \w+/, `Route to ${department}`)
          }
        }
      }
    });
    return { id, department, ok: !!email };
  });
