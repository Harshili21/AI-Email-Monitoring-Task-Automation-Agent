# IMAP & ClickUp Dashboard Integration

This plan outlines the architecture and steps required to integrate real Gmail IMAP data, parse emails for metadata, sync with ClickUp, and wire everything into the React dashboard.

## User Review Required

> [!IMPORTANT]
> This integration involves creating a local Node.js backend (Express) to run alongside your Vite frontend. It will continuously poll your IMAP server in the background and expose REST API endpoints that the frontend will consume.
> Please review the Open Questions regarding ClickUp credentials below before approving.

## Open Questions

> [!WARNING]
> **ClickUp Integration**: To sync with ClickUp, we need a ClickUp API Token and a Workspace/List ID to create and fetch tasks. 
> 1. Do you have a ClickUp API Token available? 
> 2. Should we load it from a `.env` file, or mock the ClickUp responses for now?
> 
> **Categorization Logic**: We plan to use keyword-based heuristics to determine the Department and Sentiment (e.g., matching words like "refund" to Sales, "broken" to negative sentiment). Is this acceptable for now, or do you have an OpenAI/LLM API key you'd prefer to use for advanced NLP parsing?

## Proposed Changes

### Backend Service

#### [NEW] `server/index.ts`
- Create an Express server to expose `/api/stats`, `/api/emails`, `/api/clickup`, `/api/reports`, and `/api/activity`.
- Implement an initialization routine that reads from a local `data.json` database.

#### [NEW] `server/imapPoller.ts`
- Implement a `setInterval` loop (every 1-2 minutes) to connect to `imap.gmail.com:993`.
- Fetch `(UNSEEN)` or `SINCE` emails to only pull new data.
- Parse emails and generate metadata: `Department`, `Status`, and `Sentiment`.
- Emit events to update the Activity feed and recalculate Stats (Pending, Completed, Overdue, Needs Review).

#### [NEW] `server/clickupSync.ts`
- Implement ClickUp API synchronization to fetch recent tasks and link them to parsed emails based on Subject/Sender.

### Frontend Integration

#### [MODIFY] `package.json`
- Add `concurrently` (to run Vite and the backend server together) and `imap-simple` or `mailparser` for the backend. Add a `start` script to boot both.

#### [MODIFY] `src/services/api.ts`
- Replace all `mock*` imports and hardcoded returns with `fetch('http://localhost:3001/api/...')` calls to the new Express server.

#### [MODIFY] `src/components/layout/Topbar.tsx`
- Refactor the static `Search` input into a stateful Popover or Dropdown menu.
- Fetch the top 10 recent emails from the API based on the user's search query (matching sender, subject, or department).
- Display a quick-access list of these emails natively in the top bar.

#### [MODIFY] `src/routes/_app.dashboard.tsx`
- Ensure real-time reactivity (e.g., via `refetchInterval` in React Query) so the charts and KPI metrics auto-refresh as the background poller discovers new emails.

## Verification Plan

### Automated Tests
- Run `npm run lint` and TypeScript checks (`tsc --noEmit`) to verify no breaking type changes in `api.ts`.

### Manual Verification
- Start the app with the new concurrent script.
- Send a test email to `harshiliitmbu@gmail.com` and verify that within 1-2 minutes:
  1. It appears in the Recent Emails table.
  2. The Topbar search finds it.
  3. The Activity feed logs the processing event.
  4. The relevant charts and KPI cards update.
