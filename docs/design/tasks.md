# Tasks — Design Doc

## Scope
- In scope: task CRUD, kanban movement, task detail editing.
- Out of scope: complex permissions, multi-tenant isolation, external integrations.

## Data model
### Table: `tasks`
Core fields:
- `title: string`
- `description: string`
- `status: Backlog | Doing | Review | Done | Blocked`
- `stage?: planning | execution` (optional to preserve compatibility with existing local data)
- `assignee?: string`
- `dueDate?: string`
- `priority?: string`
- `plan?: { summary, steps[], acceptanceCriteria[], generatedAt }`
- `createdAt: number`
- `updatedAt: number`

Indexes:
- `by_status(status)`
- `by_updatedAt(updatedAt)`

## Flows
### Create
- `tasks.create` inserts a new task.
- (When AI Planning is enabled) it also ensures a `planningSessions` record exists.

### Move
- `tasks.move` updates `status` and `updatedAt`.

### Update
- `tasks.update` updates editable fields and `updatedAt`.

## APIs
- `convex/tasks.ts`: list/get/create/move/update

## Decisions & tradeoffs
- `stage` is optional in schema to prevent Convex schema validation from failing on existing data.
- “planning vs execution” is intentionally orthogonal to the kanban `status`.
