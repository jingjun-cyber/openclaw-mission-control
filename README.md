# Mission Control

Unified Next.js + Convex app for:

- Tasks Board
- AI Planning for Tasks
- Content Pipeline
- Calendar
- Memory
- Team
- Office

## Routes

- `/tasks`
- `/pipeline`
- `/calendar`
- `/memory`
- `/team`
- `/office`
- `/settings`

## AI Planning Flow

New tasks now enter a planning stage automatically.

1. Create a task from `/tasks`.
2. The app creates a linked `planningSession` in Convex and opens the task detail view.
3. Use the `Planning` tab to answer one clarifying question at a time.
4. You can `Skip`, `Stop planning`, `Regenerate questions`, or `Mark planning complete`.
5. Once planning completes, the task stores a structured execution plan with bullet steps and acceptance criteria, and the task stage moves to `execution`.

Planning session data lives in the `planningSessions` table and is linked to tasks through `taskId`.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure env:

```bash
cp .env.local.example .env.local
```

Set `NEXT_PUBLIC_CONVEX_URL` (and optionally `CONVEX_URL`) from Convex.

3. Start Convex (in one terminal):

```bash
npm run convex:dev
```

4. Start Next.js (in another terminal):

```bash
npm run dev
```

If you added the planning feature to an existing deployment, regenerate Convex types after the backend is running:

```bash
npx convex codegen
```

For existing task rows, run the backfill mutation once to create missing planning sessions and task stages:

```ts
api.planning.migrateExistingTasks
```

## Build

```bash
npm run build
```

## Sync Scripts

Sync OpenClaw cron jobs into Calendar jobs table:

```bash
npm run sync:cron
# or
npm run sync:cron -- ./openclaw-cron.json
```

Sync workspace markdown memories into Memory table:

```bash
npm run sync:memory
# or
npm run sync:memory -- /path/to/openclaw/workspace
```

Sync recent sessions into Team sessions table:

```bash
npm run sync:sessions
# or
npm run sync:sessions -- ./openclaw-sessions.json
```

## Office Presence Webhook

Endpoint:

- `POST /api/office/presence`

Auth header:

- `Authorization: Bearer $OFFICE_WEBHOOK_SECRET`

Payload:

```json
{
  "deskCode": "D11",
  "presence": "working",
  "note": "optional"
}
```
