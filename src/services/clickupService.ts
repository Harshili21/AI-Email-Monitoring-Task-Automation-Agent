import { store } from "./store";

const delay = <T,>(v: T, ms = 250) => new Promise<T>(r => setTimeout(() => r(v), ms));

export async function listTasks() {
  return delay([...store.tasks].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)));
}

export async function createTaskFromEmail(emailId: string) {
  const task = store.createTaskFromEmail(emailId);
  if (!task) return delay({ emailId, taskId: null, ok: false });
  return delay({ emailId, taskId: task.taskId, ok: true });
}

export async function retryTask(taskId: string) {
  const task = store.retryTask(taskId);
  return delay({ taskId, ok: !!task });
}
