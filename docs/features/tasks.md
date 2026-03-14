# Tasks — Feature Doc

## Summary
A kanban-style board to create, track, and update tasks from Backlog → Doing → Review → Done (plus Blocked).

## User goals
- Capture work quickly
- Move tasks through a lightweight workflow
- Assign an owner and priority
- (New) Use **AI Planning** to clarify requirements before execution

## Where it lives
- Route: `/tasks`
- Task detail: `/tasks/<id>`

## How to use
1. Go to **Tasks**.
2. Create a task (title + optional assignee).
3. Click a card to open task detail.
4. Update task fields and move the task through statuses.

## Key behaviors
- Tasks are sorted by `updatedAt`.
- Status controls how the task appears in the kanban columns.
- Stage (planning/execution) is shown as a pill on the board.

## Edge cases
- If `stage` is missing on older tasks, UI treats it as `execution`.

## Limitations / non-goals
- No multi-user permissions model (single-operator “personal OS” assumption).
