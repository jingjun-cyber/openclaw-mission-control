# AI Planning — Feature Doc

## Summary
A clarifying Q&A step that runs **automatically after task creation** to reduce ambiguity before execution. The output is a structured execution plan stored on the task.

## User goals
- Prevent "wrong work" by forcing quick clarification
- Make tasks execution-ready (steps + acceptance criteria)

## Where it lives
- Task detail: `/tasks/<id>` → Planning panel
- Trigger: automatically when a task is created (default stage = `planning`)

## How to use
1. Create a task in `/tasks`.
2. You are redirected to the task detail page.
3. Answer the current question and click **Answer & next**.
4. Optionally use:
   - **Skip** to move on
   - **Regenerate questions** to refresh the question set
   - **Mark planning complete** to force completion and generate a plan
   - **Stop planning** to cancel planning and switch to execution
5. When planning completes, the task moves to stage `execution` and shows the generated plan.

## Key behaviors
- One question at a time + progress bar
- Answers are saved to Convex immediately
- The plan is generated when planning completes

## Edge cases
- If planning is stopped, the session becomes `cancelled` and the task stage switches to `execution`.
- Older tasks without a `stage` field are treated as `execution`.

## Limitations / non-goals
- Current question generation is heuristic (deterministic) rather than calling an external LLM.
- No multi-user review workflow yet.
