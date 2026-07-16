import { mockTasks } from "./mockData";

const delay = <T,>(v: T, ms = 250) => new Promise<T>(r => setTimeout(() => r(v), ms));

export async function listTasks() { return delay(mockTasks); }
export async function createTaskFromEmail(emailId: string) { return delay({ emailId, taskId: `CU-${Math.floor(Math.random() * 90000 + 10000)}`, ok: true }); }
export async function retryTask(taskId: string) { return delay({ taskId, ok: true }); }
