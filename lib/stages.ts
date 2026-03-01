export const STAGES = ["Idea", "Outline", "Draft", "Edit", "Publish", "Archive"] as const;

export type Stage = (typeof STAGES)[number];

export const CHANNELS = ["Blog", "YouTube", "Newsletter", "Podcast", "Social"] as const;
