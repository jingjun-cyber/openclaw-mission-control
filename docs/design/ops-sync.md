# Ops: Sync / Seed / Cron — Design Doc

## Scripts
- `scripts/seed-defaults.ts`: seeds initial roles/agents/desks/tasks/pipeline/events
- `scripts/sync-all.ts`: runs all sync scripts
- `scripts/sync-cron-jobs.ts`: imports cron jobs
- `scripts/sync-sessions.ts`: imports session metadata
- `scripts/sync-memories.ts`: imports memory docs

## Notes
- These scripts are designed for a single operator and local-first workflows.
