# Mission Control

Unified Next.js + Convex app for:

- Tasks Board
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
