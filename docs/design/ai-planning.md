# AI Planning — Design Doc

## Scope
- In scope: per-task planning session, Q&A loop, plan synthesis, UI panel.
- Out of scope: LLM-backed question generation, multi-agent handoff execution, audit trails beyond stored answers.

## Data model
### Table: `planningSessions`
- `taskId: Id<'tasks'>`
- `status: active | completed | cancelled`
- `stage: planning | execution` (mirrors task stage for clarity)
- `questions: string[]`
- `answers: string[]`
- `currentIndex: number`
- `createdAt: number`
- `updatedAt: number`

Indexes:
- `by_taskId(taskId)`
- `by_status(status)`
- `by_updatedAt(updatedAt)`

### Task integration
- On task creation: create a `planningSessions` record if missing (idempotent)
- On completion: patch task with `plan` and set `stage = execution`

## Flows
### Primary flow (auto-planning)
1. Task created → task.stage = planning
2. `planningSessions.ensureForTask(taskId)` creates session with question pool
3. UI reads session with `planning.getByTask(taskId)`
4. User answers → `planning.answerCurrent`
5. When `currentIndex` reaches end → session completed + plan generated

### Regenerate
- `planning.regenerateQuestions` preserves answered portion and regenerates remaining questions.

### Stop
- `planning.stop` sets session status cancelled and moves task.stage to execution.

## APIs
- `convex/planning.ts`: `getByTask`, `ensureForTask`, `answerCurrent`, `skipCurrent`, `regenerateQuestions`, `markComplete`, `stop`, `migrateExistingTasks`

## UI structure
- Implemented inside `app/tasks/[id]/page.tsx` as a Planning tab/panel.

## Decisions & tradeoffs
- Question generation + plan synthesis are deterministic heuristics so the feature works without external LLM keys.
- `task.stage` is optional for backwards compatibility with pre-existing local data.
