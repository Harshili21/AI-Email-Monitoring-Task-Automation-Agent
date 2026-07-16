import { mockEmails } from "./mockData";
import type { Email } from "@/types";

const delay = <T,>(v: T, ms = 300) => new Promise<T>(r => setTimeout(() => r(v), ms));

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

export async function listEmails(filters: EmailFilters = {}) {
  let items = [...mockEmails];
  if (filters.department && filters.department !== "all") items = items.filter(e => e.department === filters.department);
  if (filters.status && filters.status !== "all") items = items.filter(e => e.status === filters.status);
  if (filters.client && filters.client !== "all") items = items.filter(e => e.clientId === filters.client);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(e =>
      e.subject.toLowerCase().includes(q) ||
      e.sender.toLowerCase().includes(q) ||
      e.senderEmail.toLowerCase().includes(q),
    );
  }
  if (filters.minConfidence != null) items = items.filter(e => e.ai.confidence >= filters.minConfidence!);
  if (filters.from) items = items.filter(e => new Date(e.receivedAt) >= new Date(filters.from!));
  if (filters.to) items = items.filter(e => new Date(e.receivedAt) <= new Date(filters.to!));
  items.sort((a, b) => +new Date(b.receivedAt) - +new Date(a.receivedAt));
  const total = items.length;
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 10;
  const paged = items.slice((page - 1) * pageSize, page * pageSize);
  return delay({ items: paged, total, page, pageSize });
}

export async function getEmail(id: string): Promise<Email | undefined> {
  return delay(mockEmails.find(e => e.id === id));
}

export async function getLowConfidenceEmails() {
  return delay(mockEmails.filter(e => e.ai.confidence < 0.7));
}

export async function approveEmail(id: string) { return delay({ id, ok: true }); }
export async function rejectEmail(id: string) { return delay({ id, ok: true }); }
export async function reclassifyEmail(id: string, department: string) { return delay({ id, department, ok: true }); }
