import { STAGES, type Stage } from "./stages";

export type WorkflowState = "new" | "in_progress" | "review" | "approved" | "blocked";

export const WORKFLOW_STATES: Record<WorkflowState, { label: string; color: string }> = {
  new: { label: "New", color: "bg-slate-100 text-slate-700" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700" },
  review: { label: "In Review", color: "bg-amber-100 text-amber-700" },
  approved: { label: "Approved", color: "bg-emerald-100 text-emerald-700" },
  blocked: { label: "Blocked", color: "bg-red-100 text-red-700" }
};

export const DEFAULT_CHECKLISTS: Record<Stage, Array<{ id: string; label: string }>> = {
  Idea: [
    { id: "idea-1", label: "Define target audience" },
    { id: "idea-2", label: "Research topic viability" },
    { id: "idea-3", label: "Set target date" }
  ],
  Outline: [
    { id: "outline-1", label: "Create structure" },
    { id: "outline-2", label: "Define key points" },
    { id: "outline-3", label: "Gather sources" }
  ],
  Draft: [
    { id: "draft-1", label: "Write introduction" },
    { id: "draft-2", label: "Complete main content" },
    { id: "draft-3", label: "Write conclusion" }
  ],
  Edit: [
    { id: "edit-1", label: "Self-review complete" },
    { id: "edit-2", label: "Peer review done" },
    { id: "edit-3", label: "Final polish" }
  ],
  Publish: [
    { id: "publish-1", label: "Final approval" },
    { id: "publish-2", label: "Schedule/Upload" },
    { id: "publish-3", label: "Promote" }
  ],
  Archive: [
    { id: "archive-1", label: "Metrics collected" },
    { id: "archive-2", label: "Lessons documented" }
  ]
};

export function getProgress(checklist: Array<{ done: boolean }> | undefined): number {
  if (!checklist || checklist.length === 0) return 0;
  const done = checklist.filter((c) => c.done).length;
  return Math.round((done / checklist.length) * 100);
}
