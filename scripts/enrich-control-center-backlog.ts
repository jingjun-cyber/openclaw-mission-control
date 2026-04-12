#!/usr/bin/env tsx

import path from "node:path";
import fs from "node:fs";
import dotenv from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

const now = Date.now();

type Spec = {
  title: string;
  priority: "P0" | "P1" | "P2";
  description: string;
  summary: string;
  steps: string[];
  acceptanceCriteria: string[];
};

const SPECS: Spec[] = [
  {
    title: "Add Overview dashboard for Mission Control",
    priority: "P0",
    description: "Create an operator-first overview page that summarizes runtime health, active work, risks, blocked items, and next actions across Mission Control.",
    summary: "Build a single-screen operations overview for Mission Control.",
    steps: ["Define overview information architecture", "Aggregate health, task, team, office, cron, and connector signals", "Design operator-focused summary cards and alerts", "Link overview items to drilldown pages"],
    acceptanceCriteria: ["Overview page shows system health, active work, and key risks", "Blocked or failing items are prioritized above routine stats", "Each summary card links to a relevant detail page"]
  },
  {
    title: "Add usage and spend analytics page",
    priority: "P0",
    description: "Add a usage analytics view for tokens, spend, model mix, and trend analysis across agents, sessions, and cron jobs.",
    summary: "Expose token and spend observability inside Mission Control.",
    steps: ["Define usage data sources", "Add usage aggregation by day, agent, session, and cron", "Create trend cards and breakdown tables", "Highlight abnormal usage spikes"],
    acceptanceCriteria: ["Page shows daily, 7-day, and 30-day usage trends", "Usage is broken down by agent or job source", "High-cost outliers are visually flagged"]
  },
  {
    title: "Add connector health status panel",
    priority: "P0",
    description: "Provide a unified connector health panel covering Telegram, Feishu, WeChat, Gateway, Convex, and other relevant integrations.",
    summary: "Make external and internal connection health visible in the UI.",
    steps: ["Define connector status model", "Collect heartbeat and recent error status for each connector", "Display success/failure state and last check time", "Distinguish degraded vs fully broken status"],
    acceptanceCriteria: ["Panel shows status for each connector", "Last success or failure time is displayed", "UI distinguishes degraded network conditions from hard failures"]
  },
  {
    title: "Add context pressure monitoring for active sessions",
    priority: "P1",
    description: "Monitor active sessions for growing context size, slower execution risk, and potential model limit pressure.",
    summary: "Surface sessions that are getting too large or expensive.",
    steps: ["Define context pressure indicators", "Aggregate per-session token and message growth", "Show risk scores in UI", "Suggest summarize or split-thread actions"],
    acceptanceCriteria: ["Sessions with high context pressure are clearly marked", "UI explains why a session is risky", "Pressure data updates with recent session activity"]
  },
  {
    title: "Add multi-agent collaboration hall",
    priority: "P0",
    description: "Add a shared collaboration surface where agents can discuss, assign work, and move tasks through discussion, execution, and review.",
    summary: "Build a hall-first collaboration workflow for multiple agents.",
    steps: ["Define hall thread and message model", "Implement shared discussion timeline", "Support assigning execution owner", "Support review state transitions"],
    acceptanceCriteria: ["Users can create a shared collaboration thread", "Multiple agents can participate in the same thread", "Execution owner and review state are visible"]
  },
  {
    title: "Add live runtime stream to collaboration and task views",
    priority: "P0",
    description: "Stream real execution progress into task and collaboration views using runtime output or session-backed deltas.",
    summary: "Show live agent execution instead of only final results.",
    steps: ["Define streaming transport strategy", "Integrate runtime stdout or session deltas", "Render live output in task and collaboration views", "Handle fallback when direct stream is unavailable"],
    acceptanceCriteria: ["Users can see incremental execution progress in the UI", "Task and collaboration views both support live updates", "System gracefully falls back when direct live output is unavailable"]
  },
  {
    title: "Add execution queue and handoff flow for agent collaboration",
    priority: "P0",
    description: "Support ordered execution queues and explicit handoffs between agents during collaborative work.",
    summary: "Make multi-agent execution order and ownership explicit.",
    steps: ["Model queued owners and handoff state", "Allow operators to define execution order", "Record handoff notes between agents", "Pause queue for review or blockers"],
    acceptanceCriteria: ["Operators can define execution order", "Agents can hand off work with context notes", "Queue state shows active, pending, and blocked owners"]
  },
  {
    title: "Add evidence thread view for task execution artifacts",
    priority: "P0",
    description: "Create an evidence-centered task view that groups logs, outputs, files, and review notes around execution artifacts.",
    summary: "Turn tasks into evidence-backed work records.",
    steps: ["Define evidence artifact model", "Attach logs and outputs to tasks", "Create evidence thread UI", "Support review notes and artifact grouping"],
    acceptanceCriteria: ["Tasks can display execution artifacts in one place", "Evidence is grouped chronologically or by run", "Review notes can reference specific artifacts"]
  },
  {
    title: "Add approval workflow and gated action controls",
    priority: "P0",
    description: "Introduce approvals for sensitive operations with dry-run, pending, approved, rejected, and executed states.",
    summary: "Protect sensitive actions behind a structured approval workflow.",
    steps: ["Define approval state machine", "Identify gated action categories", "Add approval UI and audit fields", "Integrate dry-run before execution"],
    acceptanceCriteria: ["Sensitive actions can require approval", "Approval status is visible and auditable", "Dry-run is available before applying side effects"]
  },
  {
    title: "Add source-backed documents workbench",
    priority: "P1",
    description: "Create a dedicated documents workspace for source-backed project docs separate from memory pages.",
    summary: "Expose real working documents as a first-class workbench.",
    steps: ["Define document source model", "Create shared and agent-scoped document views", "Support read/write against real files", "Link documents to related tasks or agents"],
    acceptanceCriteria: ["Documents page lists real source-backed files", "Users can open and edit supported docs", "Document source path and scope are visible"]
  },
  {
    title: "Add memory health and searchability status",
    priority: "P1",
    description: "Add diagnostics for memory availability, freshness, index state, and search readiness across agents.",
    summary: "Make memory health observable instead of assumed.",
    steps: ["Define memory health indicators", "Track sync freshness and index state", "Expose per-agent memory status", "Show warnings for stale or missing memory"],
    acceptanceCriteria: ["Memory status is visible per agent or scope", "UI flags stale or unsearchable memory", "Search readiness is clearly indicated"]
  },
  {
    title: "Improve staff page to separate active, queued, idle, blocked states",
    priority: "P1",
    description: "Refine team/staff visualization so operators can distinguish truly active work from queued or blocked states.",
    summary: "Show who is actually working right now.",
    steps: ["Define workload state taxonomy", "Map sessions and queues to activity states", "Update staff UI cards", "Add recent output or ownership context"],
    acceptanceCriteria: ["Staff view separates active, queued, idle, and blocked", "Each state is backed by recent runtime data", "Operators can see what each active agent is working on"]
  },
  {
    title: "Add connection health diagnostics card in settings",
    priority: "P1",
    description: "Add a settings card that summarizes which runtime links are connected, partial, or broken.",
    summary: "Explain environment readiness in settings.",
    steps: ["List key runtime dependencies", "Check each dependency for availability", "Display health card with plain-language guidance", "Link to deeper diagnostics"],
    acceptanceCriteria: ["Settings page shows connection health status", "Broken or partial links include next-step guidance", "Operators can navigate to more detail from the card"]
  },
  {
    title: "Add security risk summary in settings",
    priority: "P1",
    description: "Summarize current system risk based on write access, approvals, auth gates, and exposed mutations.",
    summary: "Translate technical configuration into operator-facing security risk.",
    steps: ["Define security risk factors", "Compute risk summary from current config", "Render impact and guidance in settings", "Update dynamically with config changes"],
    acceptanceCriteria: ["Settings page shows risk level and impact", "Summary explains why the current risk exists", "Guidance suggests concrete next steps"]
  },
  {
    title: "Add version/update status card",
    priority: "P2",
    description: "Show current version, latest available version, install method, and update channel inside settings.",
    summary: "Make update posture visible from the UI.",
    steps: ["Collect current version metadata", "Check latest available version", "Display install method and update channel", "Flag important version gaps"],
    acceptanceCriteria: ["Settings page shows current and latest version", "UI highlights outdated or risky version gaps", "Install method or update channel is visible"]
  },
  {
    title: "Add read-only mode and mutation safety gates",
    priority: "P0",
    description: "Introduce a global read-only mode and configurable mutation gates for side-effecting actions.",
    summary: "Provide a safe default operating mode for Mission Control.",
    steps: ["Define read-only and gated action config", "Block protected writes when read-only is enabled", "Expose mode in UI", "Audit blocked and allowed writes"],
    acceptanceCriteria: ["Protected mutations are blocked in read-only mode", "UI clearly shows current mode", "Attempted blocked actions return clear reasons"]
  },
  {
    title: "Add local token authentication for protected actions",
    priority: "P0",
    description: "Require a local API token for protected write operations such as approvals, imports, and high-risk mutations.",
    summary: "Add local auth around sensitive actions.",
    steps: ["Define protected action categories", "Implement LOCAL_API_TOKEN validation", "Add token entry flow in UI", "Enforce auth on protected routes or mutations"],
    acceptanceCriteria: ["Protected actions require a valid token", "UI supports entering and reusing token in session", "Unauthorized writes fail with clear error messages"]
  },
  {
    title: "Upgrade content pipeline from basic stages to operational workflow",
    priority: "P2",
    description: "Expand the content pipeline with richer ownership, deadlines, channels, and stage accountability.",
    summary: "Turn the pipeline into a real operating workflow.",
    steps: ["Add owner, deadline, and publish target fields", "Define stage-level expectations", "Improve item detail editing", "Expose bottlenecks and overdue items"],
    acceptanceCriteria: ["Pipeline items include operational fields beyond stage", "Overdue or stalled items are visible", "Item detail supports editing core workflow metadata"]
  },
  {
    title: "Deepen calendar-task linkage",
    priority: "P2",
    description: "Link tasks and calendar events more tightly so milestones and schedules can be navigated both ways.",
    summary: "Make tasks and calendar operate as one planning system.",
    steps: ["Define task-event linkage", "Add task milestone projection to calendar", "Allow calendar detail to reference linked tasks", "Support reverse navigation from tasks"],
    acceptanceCriteria: ["Calendar can show task-linked milestones", "Users can jump between a task and its event", "Linkage persists in stored data"]
  },
  {
    title: "Add cron timeline visualization in calendar",
    priority: "P2",
    description: "Visualize cron schedules and recent runs directly in calendar-style views.",
    summary: "Show recurring automation on a timeline.",
    steps: ["Map cron jobs to calendar entries", "Display next run and recent execution history", "Highlight failing jobs on timeline", "Link timeline items to cron detail"],
    acceptanceCriteria: ["Calendar view displays cron schedules", "Failing cron jobs are visually highlighted", "Users can inspect a job from the timeline"]
  },
  {
    title: "Improve AI planning workflow for tasks",
    priority: "P1",
    description: "Enhance planning sessions with better question quality, clearer outputs, and stronger plan usability.",
    summary: "Make planning sessions produce better execution plans.",
    steps: ["Review current planning questions", "Improve plan generation structure", "Support plan editing or regeneration", "Expose planning quality cues in UI"],
    acceptanceCriteria: ["Planning output is clearer and more actionable", "Users can revise or regenerate weak plans", "Task detail shows improved plan structure"]
  },
  {
    title: "Add explicit planning-to-execution transition management",
    priority: "P1",
    description: "Make the transition from planning to execution explicit, including owner assignment, readiness checks, and next action selection.",
    summary: "Close the gap between planning complete and actual execution start.",
    steps: ["Define readiness criteria for execution", "Add transition controls to task detail", "Support owner or schedule assignment", "Track transition timestamp and state"],
    acceptanceCriteria: ["Task can move from planning to execution through an explicit transition", "Owner or next action is captured at transition time", "UI shows whether a task is execution-ready"]
  },
  {
    title: "Expand task export formats and scope",
    priority: "P2",
    description: "Extend task export beyond JSON to include richer bundles such as Markdown, evidence summaries, or review packs.",
    summary: "Make task data easier to share and review outside the UI.",
    steps: ["Define supported export formats", "Add export options to task detail", "Include plan, acceptance, and evidence in richer exports", "Validate exported structure"],
    acceptanceCriteria: ["Task detail offers more than one export format", "Exports include core task, plan, and acceptance data", "Generated exports are complete and readable"]
  },
  {
    title: "Improve office presence with session-based and webhook-based fusion",
    priority: "P2",
    description: "Fuse presence signals from sessions, webhook updates, and manual overrides into a more reliable office status model.",
    summary: "Make office presence more trustworthy and explainable.",
    steps: ["Define signal precedence rules", "Merge webhook and session presence sources", "Store source and freshness metadata", "Expose presence explanation in UI"],
    acceptanceCriteria: ["Presence can be derived from multiple sources", "UI shows why a desk is in a given state", "Conflicting signals are handled predictably"]
  },
  {
    title: "Enrich agent profiles with capabilities, tools, channels, and workload",
    priority: "P1",
    description: "Expand agent profiles beyond role and model to include capabilities, tools, channels, workload, and specialization hints.",
    summary: "Turn team profiles into routing and workload assets.",
    steps: ["Define extended agent profile schema", "Add editable profile fields", "Surface workload and channels", "Use profile info in recommendations or routing views"],
    acceptanceCriteria: ["Agent profiles include capability and tool information", "Workload indicators are visible per agent", "Profile data can support routing decisions"]
  },
  {
    title: "Add sync health dashboard for seed, memory, sessions, and cron",
    priority: "P0",
    description: "Create an operational dashboard for all sync and seed jobs, including run status, duration, errors, and freshness.",
    summary: "Make background sync health easy to audit.",
    steps: ["Define sync job health model", "Collect latest run metadata for each sync step", "Render dashboard with status and freshness", "Highlight repeated failures"],
    acceptanceCriteria: ["Dashboard shows health for seed, memory, sessions, and cron syncs", "Operators can identify failing or stale syncs quickly", "Recent errors and durations are visible"]
  },
  {
    title: "Add operator daily summary page inside Mission Control",
    priority: "P2",
    description: "Present a daily summary view inside Mission Control so operators can review the system state without relying only on chat output.",
    summary: "Bring daily operational summaries into the product UI.",
    steps: ["Define summary layout", "Reuse or aggregate daily sync output", "Show notable changes and anomalies", "Provide links to affected areas"],
    acceptanceCriteria: ["A daily summary page exists in the app", "Summary highlights health, sync results, and anomalies", "Summary links to detailed pages"]
  },
  {
    title: "Review and close task-board gaps versus control-center tasks",
    priority: "P1",
    description: "Compare Mission Control task capabilities against control-center task views and close the most important missing behaviors.",
    summary: "Drive task parity through explicit gap analysis.",
    steps: ["Document feature gaps", "Prioritize the missing task features", "Implement top gaps", "Validate parity improvements"],
    acceptanceCriteria: ["Gap list is documented", "Top priority task gaps are implemented", "Task board supports stronger execution visibility than before"]
  },
  {
    title: "Review and close memory workbench gaps versus control-center",
    priority: "P2",
    description: "Audit memory workbench differences and close key usability, searchability, and health gaps.",
    summary: "Strengthen memory workbench parity with control-center.",
    steps: ["List missing memory capabilities", "Improve search, filtering, and health indicators", "Close the most operator-visible gaps", "Validate with real memory docs"],
    acceptanceCriteria: ["Memory gap list is documented", "Priority gaps are implemented", "Memory page feels materially more complete for operators"]
  },
  {
    title: "Review and close team/staff visualization gaps",
    priority: "P2",
    description: "Compare current team and staff views against desired live operations visibility and close the highest-value gaps.",
    summary: "Improve clarity of who is doing what.",
    steps: ["Audit current team/staff limitations", "Prioritize missing activity views", "Implement top missing states or summaries", "Validate against real session data"],
    acceptanceCriteria: ["Team/staff gaps are explicitly listed", "At least the highest-value visibility gaps are closed", "Operators can better distinguish active vs idle state"]
  },
  {
    title: "Review and close office visualization gaps",
    priority: "P2",
    description: "Audit the office page against richer control-center presence concepts and close the most important visibility gaps.",
    summary: "Improve office page trust and usefulness.",
    steps: ["Review current office visualization", "Identify missing state explanation or drilldowns", "Implement top improvements", "Test with live presence changes"],
    acceptanceCriteria: ["Office visualization gaps are documented", "Top-priority gaps are addressed", "Office page better explains presence state"]
  },
  {
    title: "Review and close settings observability gaps",
    priority: "P1",
    description: "Audit Mission Control settings against the target environment diagnostics expected from a control center and close critical gaps.",
    summary: "Upgrade settings into a real operations diagnostics page.",
    steps: ["List missing settings diagnostics", "Prioritize connection, risk, and version visibility", "Implement top missing settings cards", "Validate the settings page as an operator tool"],
    acceptanceCriteria: ["Critical settings gaps are documented", "Priority diagnostics cards are implemented", "Settings page gives actionable environment guidance"]
  }
];

async function main() {
  const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) throw new Error("Missing CONVEX_URL or NEXT_PUBLIC_CONVEX_URL");

  const client = new ConvexHttpClient(convexUrl);
  const tasks = await client.query(api.tasks.list, {} as never);
  const byTitle = new Map((tasks ?? []).map((t: any) => [t.title, t]));

  let updated = 0;
  let missing = 0;

  for (const spec of SPECS) {
    const task = byTitle.get(spec.title);
    if (!task) {
      missing += 1;
      console.log(`missing: ${spec.title}`);
      continue;
    }
    await client.mutation(api.tasks.enrich, {
      taskId: task._id,
      description: spec.description,
      priority: spec.priority,
      plan: {
        summary: spec.summary,
        steps: spec.steps,
        acceptanceCriteria: spec.acceptanceCriteria,
        generatedAt: now
      }
    } as never);
    updated += 1;
    console.log(`updated: ${spec.title}`);
  }

  console.log(`\nDone. updated=${updated}, missing=${missing}, total=${SPECS.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
