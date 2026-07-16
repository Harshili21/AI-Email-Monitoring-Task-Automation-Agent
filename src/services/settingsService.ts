import { store } from "./store";

const delay = <T,>(v: T, ms = 200) => new Promise<T>(r => setTimeout(() => r(v), ms));

export async function getIntegrations() { return delay(store.getIntegrations()); }
export async function getMailboxes() { return delay(store.getMailboxes()); }

export async function toggleMailbox(id: string) {
  store.toggleMailbox(id);
  return delay(store.getMailboxes());
}

export async function toggleIntegration(name: string) {
  store.toggleIntegration(name);
  return delay(store.getIntegrations());
}
