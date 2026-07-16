export type Department = "Sales" | "Support" | "Finance" | "Operations" | "HR" | "Legal" | "Other";
export type EmailStatus = "Pending" | "Processing" | "Completed" | "Overdue" | "Needs Review";
export type Sentiment = "Positive" | "Neutral" | "Negative";
export type Urgency = "Low" | "Medium" | "High" | "Critical";
export type TaskStatus = "Created" | "Pending Retry" | "Failed" | "Completed";

export interface Client {
  id: string;
  name: string;
  domain: string;
}

export interface AIAnalysis {
  summary: string;
  sentiment: Sentiment;
  category: string;
  urgency: Urgency;
  businessImportance: "Low" | "Medium" | "High";
  confidence: number; // 0-1
}

export interface ClickUpInfo {
  folder?: string;
  taskId?: string;
  status?: TaskStatus;
}

export interface Email {
  id: string;
  sender: string;
  senderEmail: string;
  recipient: string;
  clientId: string;
  clientName: string;
  subject: string;
  htmlBody: string;
  plainBody: string;
  department: Department;
  status: EmailStatus;
  receivedAt: string;
  conversationId: string;
  messageId: string;
  ai: AIAnalysis;
  clickup?: ClickUpInfo;
}

export interface ClickUpTask {
  id: string;
  taskId: string;
  folder: string;
  emailSubject: string;
  emailId: string;
  status: TaskStatus;
  retryCount: number;
  errorMessage?: string;
  createdAt: string;
}

export interface DashboardStats {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
  needsReview: number;
  clickupCreated: number;
  avgConfidence: number;
}

export interface TrendPoint {
  date: string;
  emails: number;
  completed: number;
}

export interface DistributionPoint {
  name: string;
  value: number;
}

export interface ActivityItem {
  id: string;
  type: "email" | "task" | "review" | "system";
  message: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface IntegrationStatus {
  name: string;
  connected: boolean;
  detail?: string;
}
