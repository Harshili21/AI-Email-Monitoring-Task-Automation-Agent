import type {
  Email, ClickUpTask, DashboardStats, TrendPoint, DistributionPoint,
  ActivityItem, Notification, Department, EmailStatus, Sentiment, Urgency, TaskStatus,
  IntegrationStatus,
} from "@/types";
import realEmailsRaw from "./emails_result.json";

const departments: Department[] = ["Sales", "Support", "Finance", "Operations", "HR", "Legal", "Other"];
const statuses: EmailStatus[] = ["Pending", "Processing", "Completed", "Overdue", "Needs Review"];
const sentiments: Sentiment[] = ["Positive", "Neutral", "Negative"];
const urgencies: Urgency[] = ["Low", "Medium", "High", "Critical"];
const taskStatuses: TaskStatus[] = ["Created", "Pending Retry", "Failed", "Completed"];
const clients = [
  { id: "c1", name: "Acme Corp", domain: "acme.com" },
  { id: "c2", name: "Globex", domain: "globex.io" },
  { id: "c3", name: "Initech", domain: "initech.co" },
  { id: "c4", name: "Umbrella", domain: "umbrella.net" },
  { id: "c5", name: "Stark Industries", domain: "stark.com" },
];

interface RawRealEmail {
  Subject: string;
  Sender: string;
  Date: string;
  Flags: string[];
  Body_Text?: string;
  Body_Html?: string;
  Recipient?: string;
}

function parseSender(senderStr: string) {
  const match = senderStr.match(/^(.*?)\s*<(.*?)>$/);
  if (match) {
    return {
      name: match[1].trim() || match[2].trim(),
      email: match[2].trim(),
    };
  }
  return {
    name: senderStr.trim(),
    email: senderStr.trim(),
  };
}

const cleanStr = (str: string) => str.replace(/[\r\n\t]+/g, " ").trim();

const seededRand = () => Math.random();
const sInt = (min: number, max: number) => Math.floor(seededRand() * (max - min + 1)) + min;
const sRand = <T,>(arr: T[]) => arr[Math.floor(seededRand() * arr.length)];

export const mockEmails: Email[] = (realEmailsRaw as RawRealEmail[])
  .slice()
  .reverse() // Most recent first
  .map((raw, i) => {
    const { name, email } = parseSender(raw.Sender);
    const subjectLower = raw.Subject.toLowerCase();
    
    // AI Classification logic based on keywords
    let department: Department = "Other";
    if (subjectLower.includes("invoice") || subjectLower.includes("payment") || subjectLower.includes("tax") || subjectLower.includes("billing") || subjectLower.includes("refund")) {
      department = "Finance";
    } else if (subjectLower.includes("hire") || subjectLower.includes("hiring") || subjectLower.includes("career") || subjectLower.includes("apply") || subjectLower.includes("job") || subjectLower.includes("resume") || subjectLower.includes("internship")) {
      department = "HR";
    } else if (subjectLower.includes("contract") || subjectLower.includes("legal") || subjectLower.includes("nda") || subjectLower.includes("agreement")) {
      department = "Legal";
    } else if (subjectLower.includes("proposal") || subjectLower.includes("pricing") || subjectLower.includes("sales") || subjectLower.includes("quote") || subjectLower.includes("demo")) {
      department = "Sales";
    } else if (subjectLower.includes("bug") || subjectLower.includes("error") || subjectLower.includes("broken") || subjectLower.includes("issue") || subjectLower.includes("fail") || subjectLower.includes("practical") || subjectLower.includes("lab")) {
      department = "Operations";
    }

    let sentiment: Sentiment = "Neutral";
    let urgency: Urgency = "Medium";
    if (subjectLower.includes("urgent") || subjectLower.includes("alert") || subjectLower.includes("broken") || subjectLower.includes("fail") || subjectLower.includes("failed") || subjectLower.includes("error") || subjectLower.includes("security")) {
      sentiment = "Negative";
      urgency = "High";
    } else if (subjectLower.includes("welcome") || subjectLower.includes("success") || subjectLower.includes("won") || subjectLower.includes("congratulations") || subjectLower.includes("good") || subjectLower.includes("thanks") || subjectLower.includes("thank you")) {
      sentiment = "Positive";
      urgency = "Low";
    }

    // Determine Status
    let status: EmailStatus = "Completed";
    const isRead = raw.Flags?.some(f => f.toLowerCase().includes("seen"));
    if (isRead) {
      status = "Completed";
    } else {
      if (sentiment === "Negative") {
        status = "Needs Review";
      } else if (Math.random() > 0.65) {
        status = "Pending";
      } else if (Math.random() > 0.75) {
        status = "Processing";
      }
    }

    const cleanSubject = cleanStr(raw.Subject) || "(No Subject)";
    const cleanSender = cleanStr(name) || "Unknown Sender";

    // Match client based dynamically on sender name as requested
    let clientName = cleanSender;
    let clientId = `client-${cleanSender.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}`;

    const conf = 0.5 + Math.random() * 0.49;

    let receivedAt = new Date().toISOString();
    try {
      const parsedDate = new Date(raw.Date);
      if (!isNaN(parsedDate.getTime())) {
        receivedAt = parsedDate.toISOString();
      }
    } catch (err) {}

    return {
      id: `e${i + 1}`,
      sender: cleanSender,
      senderEmail: email,
      recipient: raw.Recipient || "demo.signal.test@gmail.com",
      clientId,
      clientName,
      subject: cleanSubject,
      body: raw.Body_Text || cleanSubject,
      htmlBody: raw.Body_Html || `<p><b>Subject:</b> ${cleanSubject}</p><p><b>Date:</b> ${raw.Date}</p><br/><pre style="white-space: pre-wrap; font-family: inherit;">${raw.Body_Text || cleanSubject}</pre>`,
      plainBody: raw.Body_Text || `Real email received from ${cleanSender} <${email}>.\nSubject: ${cleanSubject}\nDate: ${raw.Date}`,
      department,
      status,
      receivedAt,
      conversationId: `conv-${1000 + i}`,
      messageId: `msg-${5000 + i}`,
      ai: {
        summary: `AI classified real email from ${cleanSender} regarding "${cleanSubject}". Route to ${department} with ${sentiment} sentiment.`,
        sentiment,
        category: "Real Mail",
        urgency,
        businessImportance: "Medium",
        confidence: Math.round(conf * 100) / 100,
      },
      clickup: status === "Completed" ? {
        folder: "Client Requests",
        taskId: `CU-${10000 + i}`,
        status: "Completed",
      } : undefined,
    };
  });

export const mockTasks: ClickUpTask[] = mockEmails
  .filter(e => e.clickup)
  .map((e, i) => ({
    id: `t${i + 1}`,
    taskId: e.clickup!.taskId!,
    folder: e.clickup!.folder!,
    emailSubject: e.subject,
    emailId: e.id,
    status: e.clickup!.status!,
    retryCount: sInt(0, 3),
    errorMessage: e.clickup!.status === "Failed" ? "ClickUp API rate limit exceeded" : undefined,
    createdAt: e.receivedAt,
  }));

export const mockStats: DashboardStats = {
  total: mockEmails.length,
  pending: mockEmails.filter(e => e.status === "Pending").length,
  completed: mockEmails.filter(e => e.status === "Completed").length,
  overdue: mockEmails.filter(e => e.status === "Overdue").length,
  needsReview: mockEmails.filter(e => e.ai.confidence < 0.7).length,
  clickupCreated: mockTasks.length,
  avgConfidence: Math.round(
    (mockEmails.reduce((s, e) => s + e.ai.confidence, 0) / mockEmails.length) * 100,
  ) / 100,
};

export const mockTrend: TrendPoint[] = Array.from({ length: 14 }).map((_, i) => {
  const d = new Date(Date.now() - (13 - i) * 86400000);
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    emails: sInt(20, 90),
    completed: sInt(10, 60),
  };
});

export const sentimentDist: DistributionPoint[] = sentiments.map(s => ({
  name: s,
  value: mockEmails.filter(e => e.ai.sentiment === s).length,
}));

export const deptDist: DistributionPoint[] = departments.map(d => ({
  name: d,
  value: mockEmails.filter(e => e.department === d).length,
}));

export const statusDist: DistributionPoint[] = statuses.map(s => ({
  name: s,
  value: mockEmails.filter(e => e.status === s).length,
}));

export const mockActivity: ActivityItem[] = Array.from({ length: 12 }).map((_, i) => ({
  id: `a${i}`,
  type: sRand(["email", "task", "review", "system"] as const),
  message: sRand([
    "New email routed to Support department",
    "ClickUp task CU-48291 created successfully",
    "Manual review approved by manager",
    "Scheduler heartbeat OK",
    "Email escalated as Overdue",
    "AI classified email with 94% confidence",
  ]),
  timestamp: new Date(Date.now() - i * 3600000 * sInt(1, 4)).toISOString(),
}));

export const mockNotifications: Notification[] = [
  { id: "n1", title: "5 emails need review", description: "Confidence below threshold", timestamp: new Date().toISOString(), read: false },
  { id: "n2", title: "ClickUp task failed", description: "CU-48291 hit rate limit", timestamp: new Date(Date.now() - 3600000).toISOString(), read: false },
  { id: "n3", title: "Weekly report ready", description: "Download from Reports page", timestamp: new Date(Date.now() - 86400000).toISOString(), read: true },
];

export const mockIntegrations: IntegrationStatus[] = [
  { name: "Microsoft Graph", connected: true, detail: "3 mailboxes active" },
  { name: "ClickUp", connected: true, detail: "Workspace: Acme HQ" },
  { name: "OpenAI", connected: true, detail: "gpt-4o-mini" },
  { name: "Scheduler", connected: true, detail: "Last run 2 min ago" },
  { name: "Environment", connected: true, detail: "production" },
];

export const mockMailboxes = [
  { id: "m1", email: "support@yourcompany.com", active: true },
  { id: "m2", email: "sales@yourcompany.com", active: true },
  { id: "m3", email: "billing@yourcompany.com", active: false },
];
