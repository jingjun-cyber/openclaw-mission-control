export const TASK_STATUSES = ["Backlog", "Doing", "Review", "Done", "Blocked"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
