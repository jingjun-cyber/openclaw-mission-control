export const TASK_STATUSES = ["Backlog", "Doing", "Review", "Done", "Blocked"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STAGES = ["planning", "execution"] as const;
export type TaskStage = (typeof TASK_STAGES)[number];
