import { mockIntegrations, mockMailboxes } from "./mockData";

const delay = <T,>(v: T, ms = 200) => new Promise<T>(r => setTimeout(() => r(v), ms));

export async function getIntegrations() { return delay(mockIntegrations); }
export async function getMailboxes() { return delay(mockMailboxes); }
