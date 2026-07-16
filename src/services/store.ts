/**
 * Shared in-memory store for emails and tasks.
 * All services read/write from this store so mutations are reflected across the app.
 */
import { mockEmails, mockTasks } from "./mockData";
import type { Email, ClickUpTask, Department } from "@/types";

class Store {
  emails: Email[];
  tasks: ClickUpTask[];

  constructor() {
    // Deep clone to avoid mutating the original mock arrays
    this.emails = JSON.parse(JSON.stringify(mockEmails));
    this.tasks = JSON.parse(JSON.stringify(mockTasks));
  }

  // ── Email helpers ──────────────────────────────────────────

  getEmailById(id: string): Email | undefined {
    return this.emails.find(e => e.id === id);
  }

  updateEmail(id: string, patch: Partial<Email>): Email | undefined {
    const idx = this.emails.findIndex(e => e.id === id);
    if (idx === -1) return undefined;
    this.emails[idx] = { ...this.emails[idx], ...patch };
    return this.emails[idx];
  }

  getLowConfidenceEmails(): Email[] {
    return this.emails.filter(
      e => e.ai.confidence < 0.7 && e.status !== "Completed" && !(e as any)._rejected,
    );
  }

  approveEmail(id: string): Email | undefined {
    const email = this.getEmailById(id);
    if (!email) return undefined;
    return this.updateEmail(id, {
      status: "Completed",
      ai: { ...email.ai, confidence: 1.0 },
    });
  }

  rejectEmail(id: string): Email | undefined {
    const email = this.getEmailById(id);
    if (!email) return undefined;
    const updated = this.updateEmail(id, {
      status: "Completed",
      ai: { ...email.ai, confidence: 1.0 },
    });
    if (updated) (updated as any)._rejected = true;
    return updated;
  }

  reclassifyEmail(id: string, department: Department): Email | undefined {
    const email = this.getEmailById(id);
    if (!email) return undefined;
    return this.updateEmail(id, {
      department,
      ai: {
        ...email.ai,
        confidence: 0.95,
        summary: email.ai.summary.replace(
          /Route to \w+/,
          `Route to ${department}`,
        ),
      },
    });
  }

  // ── Task helpers ───────────────────────────────────────────

  getTaskById(taskId: string): ClickUpTask | undefined {
    return this.tasks.find(t => t.taskId === taskId);
  }

  addTask(task: ClickUpTask): void {
    this.tasks.push(task);
  }

  createTaskFromEmail(emailId: string): ClickUpTask | undefined {
    const email = this.getEmailById(emailId);
    if (!email) return undefined;

    // Check if task already exists for this email
    const existing = this.tasks.find(t => t.emailId === emailId);
    if (existing) return existing;

    const taskId = `CU-${Math.floor(Math.random() * 90000 + 10000)}`;
    const newTask: ClickUpTask = {
      id: `t${this.tasks.length + 1}`,
      taskId,
      folder: "Client Requests",
      emailSubject: email.subject,
      emailId: email.id,
      status: "Created",
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };

    this.addTask(newTask);

    // Update the email's clickup info
    this.updateEmail(emailId, {
      clickup: { folder: "Client Requests", taskId, status: "Created" },
    });

    return newTask;
  }

  retryTask(taskId: string): ClickUpTask | undefined {
    const task = this.getTaskById(taskId);
    if (!task) return undefined;

    task.status = "Created";
    task.errorMessage = undefined;
    task.retryCount = 0;

    // Also update the corresponding email's clickup status
    const email = this.getEmailById(task.emailId);
    if (email?.clickup) {
      this.updateEmail(task.emailId, {
        clickup: { ...email.clickup, status: "Created" },
      });
    }

    return task;
  }

  // ── Stats helpers ──────────────────────────────────────────

  getStats() {
    return {
      total: this.emails.length,
      pending: this.emails.filter(e => e.status === "Pending").length,
      completed: this.emails.filter(e => e.status === "Completed").length,
      overdue: this.emails.filter(e => e.status === "Overdue").length,
      needsReview: this.getLowConfidenceEmails().length,
      clickupCreated: this.tasks.length,
      avgConfidence:
        Math.round(
          (this.emails.reduce((s, e) => s + e.ai.confidence, 0) /
            this.emails.length) *
            100,
        ) / 100,
    };
  }
}

export const store = new Store();
