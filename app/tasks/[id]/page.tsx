"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, DetailBackLink, PageHeader } from "@/components/ui";
import { TASK_STATUSES, type TaskStage, type TaskStatus } from "@/lib/tasks";

type Form = {
  title: string;
  description: string;
  assignee: string;
  dueDate: string;
  priority: string;
  status: TaskStatus;
};

type TabKey = "overview" | "planning" | "evidence";

type ArtifactKind = "note" | "link" | "snippet" | "output";

type TransitionForm = {
  owner: string;
  nextAction: string;
  notes: string;
};

type ArtifactForm = {
  kind: ArtifactKind;
  title: string;
  body: string;
  link: string;
  source: string;
};

function ArtifactBadge({ kind }: { kind: ArtifactKind }) {
  const cls =
    kind === "output"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : kind === "snippet"
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : kind === "link"
          ? "border-purple-200 bg-purple-50 text-purple-700"
          : "border-slate-200 bg-slate-50 text-slate-700";
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>{kind}</span>;
}

function StagePill({ stage }: { stage: TaskStage }) {
  const cls = stage === "planning" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-700";
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>{stage}</span>;
}

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const taskId = params.id as never;
  const task = useQuery(api.tasks.get, { taskId });
  const planningSession = useQuery(api.planning.getByTask, { taskId });
  const artifacts = useQuery(api.tasks.listArtifacts, { taskId });
  const updateTask = useMutation(api.tasks.update);
  const addArtifact = useMutation(api.tasks.addArtifact);
  const answerCurrent = useMutation(api.planning.answerCurrent);
  const skipCurrent = useMutation(api.planning.skipCurrent);
  const stopPlanning = useMutation(api.planning.stop);
  const regenerateQuestions = useMutation(api.planning.regenerateQuestions);
  const markPlanningComplete = useMutation(api.planning.markComplete);
  const transitionToExecution = useMutation(api.planning.transitionToExecution);
  const [form, setForm] = useState<Form | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [answer, setAnswer] = useState("");
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [transitionMessage, setTransitionMessage] = useState<string | null>(null);
  const [transitionForm, setTransitionForm] = useState<TransitionForm>({ owner: "", nextAction: "", notes: "" });
  const [artifactMessage, setArtifactMessage] = useState<string | null>(null);
  const [artifactForm, setArtifactForm] = useState<ArtifactForm>({ kind: "note", title: "", body: "", link: "", source: "" });

  useEffect(() => {
    if (!task) return;
    setForm({
      title: task.title,
      description: task.description,
      assignee: task.assignee ?? "",
      dueDate: task.dueDate ?? "",
      priority: task.priority ?? "medium",
      status: task.status
    });
  }, [task]);

  useEffect(() => {
    if (!task) return;
    setActiveTab((task.stage ?? "execution") === "planning" ? "planning" : "overview");
  }, [task]);

  useEffect(() => {
    if (!task) return;
    setTransitionForm({
      owner: task.executionTransition?.owner ?? task.assignee ?? "",
      nextAction: task.executionTransition?.nextAction ?? "",
      notes: task.executionTransition?.notes ?? ""
    });
  }, [task]);

  useEffect(() => {
    if (!planningSession || planningSession.status !== "active") {
      setAnswer("");
      return;
    }

    setAnswer(planningSession.answers[planningSession.currentIndex] ?? "");
  }, [planningSession]);

  const readiness = useQuery(api.planning.executionReadiness, { taskId });

  if (task === null) return <p className="text-sm text-red-600">Task not found.</p>;
  if (task === undefined || !form) return <p className="text-sm text-slate-600">Loading task...</p>;

  const questionCount = planningSession?.questions.length ?? 0;
  const answerList = planningSession?.answers ?? [];
  const answeredNow = answerList.filter((value: string) => value?.trim()).length;
  const answeredCount = planningSession?.status === "completed" ? answeredNow : Math.min(planningSession?.currentIndex ?? 0, questionCount);
  const progress = questionCount > 0 ? Math.round((answeredCount / questionCount) * 100) : 0;
  const currentQuestion =
    planningSession && planningSession.status === "active" ? planningSession.questions[planningSession.currentIndex] : null;
  const skippedCount = Math.max((planningSession?.currentIndex ?? 0) - answeredNow, 0);
  const qualityState =
    progress >= 80 && answeredNow >= Math.max(3, questionCount - 1)
      ? "strong"
      : progress >= 50
        ? "usable"
        : "thin";
  const qualityHint =
    qualityState === "strong"
      ? "Planning looks strong enough to execute with low ambiguity."
      : qualityState === "usable"
        ? "Planning is usable, but a few answers could still be sharper."
        : "Planning is still thin. Add more detail before execution if the task is risky.";

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    task: {
      id: task._id,
      title: task.title,
      description: task.description,
      assignee: task.assignee ?? null,
      dueDate: task.dueDate ?? null,
      priority: task.priority ?? null,
      status: task.status,
      stage: task.stage ?? "execution",
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      plan: task.plan ?? null,
      executionTransition: task.executionTransition ?? null,
    },
    planningSession: planningSession
      ? {
          status: planningSession.status,
          stage: planningSession.stage,
          currentIndex: planningSession.currentIndex,
          questions: planningSession.questions,
          answers: planningSession.answers,
          updatedAt: planningSession.updatedAt,
        }
      : null,
    acceptance: {
      validation: [
        "Task detail page renders multiple export options.",
        "Exports include core task, plan, and planning session details when present.",
        "Generated exports are readable outside the UI.",
      ],
    },
  };

  const downloadFile = (content: string, fileName: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    setExportMessage(`Exported ${fileName}`);
  };

  const handleExport = async (format: "json" | "md" | "txt") => {
    try {
      if (format === "json") {
        downloadFile(JSON.stringify(exportPayload, null, 2), `task-${task._id}.json`, "application/json");
        return;
      }

      if (format === "md") {
        const markdown = `# ${task.title}\n\n## Summary\n- Assignee: ${task.assignee ?? "Unassigned"}\n- Priority: ${task.priority ?? "n/a"}\n- Status: ${task.status}\n- Stage: ${task.stage ?? "execution"}\n- Due: ${task.dueDate ?? "n/a"}\n\n## Description\n${task.description || "No description"}\n\n## Plan\n${task.plan?.summary ?? "No generated plan"}\n\n### Steps\n${task.plan?.steps?.map((step: string) => `- ${step}`).join("\n") ?? "- None"}\n\n### Acceptance criteria\n${task.plan?.acceptanceCriteria?.map((item: string) => `- ${item}`).join("\n") ?? "- None"}\n\n## Execution transition\n- Owner: ${task.executionTransition?.owner ?? "n/a"}\n- Next action: ${task.executionTransition?.nextAction ?? "n/a"}\n- Notes: ${task.executionTransition?.notes ?? "n/a"}\n`;
        downloadFile(markdown, `task-${task._id}.md`, "text/markdown");
        return;
      }

      const reviewPack = `TASK REVIEW PACK\n\nTitle: ${task.title}\nAssignee: ${task.assignee ?? "Unassigned"}\nPriority: ${task.priority ?? "n/a"}\nStatus: ${task.status}\nStage: ${task.stage ?? "execution"}\nDue: ${task.dueDate ?? "n/a"}\n\nDESCRIPTION\n${task.description || "No description"}\n\nPLANNING QUALITY\n${qualityState} - ${qualityHint}\n\nPLAN SUMMARY\n${task.plan?.summary ?? "No generated plan"}\n\nSTEPS\n${task.plan?.steps?.map((step: string, index: number) => `${index + 1}. ${step}`).join("\n") ?? "None"}\n\nACCEPTANCE CRITERIA\n${task.plan?.acceptanceCriteria?.map((item: string, index: number) => `${index + 1}. ${item}`).join("\n") ?? "None"}\n\nQUESTION AND ANSWER LOG\n${planningSession?.questions?.map((question: string, index: number) => `Q${index + 1}: ${question}\nA${index + 1}: ${planningSession.answers[index] || "No answer captured."}`).join("\n\n") ?? "No planning session"}\n`;
      downloadFile(reviewPack, `task-${task._id}-review-pack.txt`, "text/plain");
    } catch (error) {
      console.error("Failed to export task", error);
      setExportMessage("Export failed. Check browser download permissions and try again.");
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Task Detail"
        subtitle="Edit the task, answer clarifying questions, and move into execution with a stored plan."
        action={<DetailBackLink href="/tasks" label="Back to tasks" />}
      />

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`rounded-full px-3 py-1 text-sm font-medium ${activeTab === "overview" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("planning")}
            className={`rounded-full px-3 py-1 text-sm font-medium ${activeTab === "planning" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
          >
            Planning
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("evidence")}
            className={`rounded-full px-3 py-1 text-sm font-medium ${activeTab === "evidence" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
          >
            Evidence
          </button>
          <StagePill stage={(task.stage ?? "execution") as TaskStage} />
          {planningSession ? (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              Session {planningSession.status}
            </span>
          ) : null}
          <div className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleExport("json")}
              className="rounded border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Export JSON
            </button>
            <button
              type="button"
              onClick={() => handleExport("md")}
              className="rounded border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Export MD
            </button>
            <button
              type="button"
              onClick={() => handleExport("txt")}
              className="rounded border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Review pack
            </button>
          </div>
        </div>

        {exportMessage ? <p className="text-sm text-emerald-700">{exportMessage}</p> : null}
        {transitionMessage ? <p className="text-sm text-blue-700">{transitionMessage}</p> : null}
        {artifactMessage ? <p className="text-sm text-purple-700">{artifactMessage}</p> : null}

        {activeTab === "overview" ? (
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 md:col-span-2"><span className="text-sm">Title</span><input value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} className="w-full rounded border border-slate-300 px-3 py-2" /></label>
            <label className="space-y-1"><span className="text-sm">Assignee</span><input value={form.assignee} onChange={(e)=>setForm({...form,assignee:e.target.value})} className="w-full rounded border border-slate-300 px-3 py-2" /></label>
            <label className="space-y-1"><span className="text-sm">Due date</span><input type="date" value={form.dueDate} onChange={(e)=>setForm({...form,dueDate:e.target.value})} className="w-full rounded border border-slate-300 px-3 py-2" /></label>
            <label className="space-y-1"><span className="text-sm">Priority</span><select value={form.priority} onChange={(e)=>setForm({...form,priority:e.target.value})} className="w-full rounded border border-slate-300 px-3 py-2"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
            <label className="space-y-1"><span className="text-sm">Status</span><select value={form.status} onChange={(e)=>setForm({...form,status:e.target.value as TaskStatus})} className="w-full rounded border border-slate-300 px-3 py-2">{TASK_STATUSES.map((s)=><option key={s} value={s}>{s}</option>)}</select></label>
            <label className="space-y-1 md:col-span-2"><span className="text-sm">Description</span><textarea value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} className="h-48 w-full rounded border border-slate-300 px-3 py-2" /></label>
            <button className="rounded bg-blue-600 px-3 py-2 text-white md:col-span-2" onClick={() => updateTask({ taskId, title: form.title, description: form.description, assignee: form.assignee || undefined, dueDate: form.dueDate || undefined, priority: form.priority || undefined, status: form.status })}>Save</button>
          </div>
        ) : activeTab === "planning" ? (
          <div className="space-y-4">
            {planningSession === undefined ? <p className="text-sm text-slate-600">Loading planning session...</p> : null}
            {planningSession === null ? <p className="text-sm text-slate-600">No planning session found for this task.</p> : null}

            {planningSession ? (
              <>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Clarifying Q&A</div>
                      <p className="text-xs text-slate-600">
                        {answeredNow} answered • {skippedCount} skipped • {questionCount} total
                      </p>
                    </div>
                    <div className="text-sm font-medium text-slate-700">{progress}%</div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-slate-900 transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Planning quality</div>
                      <div className="mt-1 text-sm font-medium text-slate-900">{qualityState}</div>
                    </div>
                    <div className="max-w-xl text-sm text-slate-600">{qualityHint}</div>
                  </div>
                </div>

                {planningSession.status === "active" && currentQuestion ? (
                  <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                    <div className="rounded-lg border border-amber-200 bg-white/80 p-3 text-sm text-slate-700">
                      Aim for answers that reduce ambiguity, preserve important constraints, and make validation obvious. If the question is weak, regenerate before moving on.
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                        Question {planningSession.currentIndex + 1}
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-900">{currentQuestion}</p>
                    </div>
                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Add the detail the planner should carry into execution."
                      className="h-32 w-full rounded border border-amber-200 bg-white px-3 py-2 text-sm"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          await answerCurrent({ taskId, answer });
                          setAnswer("");
                        }}
                        className="rounded bg-slate-900 px-3 py-2 text-sm text-white"
                      >
                        Answer & next
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await skipCurrent({ taskId });
                          setAnswer("");
                        }}
                        className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700"
                      >
                        Skip
                      </button>
                      <button
                        type="button"
                        onClick={() => regenerateQuestions({ taskId })}
                        className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700"
                      >
                        Regenerate questions
                      </button>
                      <button
                        type="button"
                        onClick={() => markPlanningComplete({ taskId })}
                        className="rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
                      >
                        Mark planning complete
                      </button>
                      <button
                        type="button"
                        onClick={() => stopPlanning({ taskId })}
                        className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                      >
                        Stop planning
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 lg:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Execution transition</div>
                        <p className="text-xs text-slate-600">Make the move into execution explicit with an owner, next action, and readiness check.</p>
                      </div>
                      <div className={`rounded-full px-2 py-1 text-xs font-medium ${readiness?.ready ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {readiness?.ready ? "Execution-ready" : "Needs attention"}
                      </div>
                    </div>
                    {readiness?.blockers?.length ? (
                      <div className="rounded-lg border border-amber-200 bg-white p-3 text-sm text-slate-700">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">Readiness blockers</div>
                        <ul className="list-disc space-y-1 pl-5">
                          {readiness.blockers.map((blocker) => <li key={String(blocker)}>{blocker}</li>)}
                        </ul>
                      </div>
                    ) : null}
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="space-y-1">
                        <span className="text-sm">Execution owner</span>
                        <input value={transitionForm.owner} onChange={(e)=>setTransitionForm({...transitionForm, owner:e.target.value})} className="w-full rounded border border-slate-300 px-3 py-2" placeholder="Who owns execution?" />
                      </label>
                      <label className="space-y-1">
                        <span className="text-sm">Next action</span>
                        <input value={transitionForm.nextAction} onChange={(e)=>setTransitionForm({...transitionForm, nextAction:e.target.value})} className="w-full rounded border border-slate-300 px-3 py-2" placeholder="First concrete execution step" />
                      </label>
                      <label className="space-y-1 md:col-span-2">
                        <span className="text-sm">Transition notes</span>
                        <textarea value={transitionForm.notes} onChange={(e)=>setTransitionForm({...transitionForm, notes:e.target.value})} className="h-24 w-full rounded border border-slate-300 px-3 py-2" placeholder="Optional handoff notes, dependencies, or schedule detail" />
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          await transitionToExecution({
                            taskId,
                            owner: transitionForm.owner || undefined,
                            nextAction: transitionForm.nextAction,
                            notes: transitionForm.notes || undefined
                          });
                          setTransitionMessage("Execution transition recorded.");
                        }}
                        className="rounded bg-emerald-600 px-3 py-2 text-sm text-white"
                      >
                        Transition to execution
                      </button>
                      {task.executionTransition ? (
                        <div className="rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                          Last transition: {new Date(task.executionTransition.transitionedAt).toLocaleString()} by {task.executionTransition.transitionedBy}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="space-y-2 rounded-xl border border-slate-200 p-4">
                    <div className="text-sm font-semibold text-slate-900">Questions</div>
                    {planningSession.questions.map((question: string, index: number) => (
                      <div key={`${index}-${question}`} className="rounded-lg border border-slate-200 bg-white p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Q{index + 1}</div>
                        <p className="mt-1 text-sm text-slate-900">{question}</p>
                        <p className="mt-2 text-xs text-slate-600">
                          {planningSession.answers[index]?.trim() ? planningSession.answers[index] : "No answer captured."}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-900">Execution plan</div>
                      <div className="text-xs text-slate-500">Generated from planning answers</div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <div className="rounded border border-slate-200 p-2 text-sm">Questions: {questionCount}</div>
                      <div className="rounded border border-slate-200 p-2 text-sm">Answered: {answeredNow}</div>
                      <div className="rounded border border-slate-200 p-2 text-sm">Quality: {qualityState}</div>
                    </div>
                    {task.plan ? (
                      <div className="space-y-3">
                        <p className="text-sm text-slate-700">{task.plan.summary}</p>
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Steps</div>
                          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-700">
                            {task.plan.steps.map((step: string) => (
                              <li key={step}>{step}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Acceptance criteria</div>
                          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-700">
                            {task.plan.acceptanceCriteria.map((item: string) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600">Complete or stop planning to transition this task into execution.</p>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[1.1fr_1.4fr]">
              <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Add evidence artifact</div>
                  <p className="text-xs text-slate-600">Capture proof, output, links, and notes directly on the task.</p>
                </div>
                <label className="space-y-1">
                  <span className="text-sm">Kind</span>
                  <select value={artifactForm.kind} onChange={(e)=>setArtifactForm({...artifactForm, kind: e.target.value as ArtifactKind})} className="w-full rounded border border-slate-300 px-3 py-2">
                    <option value="note">note</option>
                    <option value="link">link</option>
                    <option value="snippet">snippet</option>
                    <option value="output">output</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-sm">Title</span>
                  <input value={artifactForm.title} onChange={(e)=>setArtifactForm({...artifactForm, title: e.target.value})} className="w-full rounded border border-slate-300 px-3 py-2" placeholder="Build output, PR link, decision note..." />
                </label>
                <label className="space-y-1">
                  <span className="text-sm">Body</span>
                  <textarea value={artifactForm.body} onChange={(e)=>setArtifactForm({...artifactForm, body: e.target.value})} className="h-40 w-full rounded border border-slate-300 px-3 py-2" placeholder="Paste logs, summarize what changed, or capture evidence text" />
                </label>
                <label className="space-y-1">
                  <span className="text-sm">Link</span>
                  <input value={artifactForm.link} onChange={(e)=>setArtifactForm({...artifactForm, link: e.target.value})} className="w-full rounded border border-slate-300 px-3 py-2" placeholder="Optional URL or file path" />
                </label>
                <label className="space-y-1">
                  <span className="text-sm">Source</span>
                  <input value={artifactForm.source} onChange={(e)=>setArtifactForm({...artifactForm, source: e.target.value})} className="w-full rounded border border-slate-300 px-3 py-2" placeholder="terminal, github, mission-control, manual..." />
                </label>
                <button
                  type="button"
                  className="rounded bg-slate-900 px-3 py-2 text-white disabled:bg-slate-300"
                  disabled={!artifactForm.title.trim() || !artifactForm.body.trim()}
                  onClick={async () => {
                    await addArtifact({
                      taskId,
                      kind: artifactForm.kind,
                      title: artifactForm.title.trim(),
                      body: artifactForm.body.trim(),
                      link: artifactForm.link.trim() || undefined,
                      source: artifactForm.source.trim() || undefined,
                      createdBy: "MacBot"
                    });
                    setArtifactForm({ kind: "note", title: "", body: "", link: "", source: "" });
                    setArtifactMessage("Evidence artifact captured.");
                  }}
                >
                  Add artifact
                </button>
              </div>

              <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Evidence thread</div>
                    <p className="text-xs text-slate-600">Ordered execution artifacts for audits, handoffs, and review.</p>
                  </div>
                  <div className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">{artifacts?.length ?? 0} artifacts</div>
                </div>
                <div className="space-y-3">
                  {artifacts?.map((artifact: any) => (
                    <div key={artifact._id} className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-slate-900">{artifact.title}</div>
                          <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-500">
                            <span>{new Date(artifact.createdAt).toLocaleString()}</span>
                            <span>{artifact.createdBy}</span>
                            {artifact.source ? <span>source: {artifact.source}</span> : null}
                          </div>
                        </div>
                        <ArtifactBadge kind={artifact.kind} />
                      </div>
                      {artifact.link ? <div className="mt-2 text-xs text-blue-700 break-all">{artifact.link}</div> : null}
                      <pre className="mt-2 whitespace-pre-wrap rounded bg-slate-50 p-3 text-xs text-slate-700">{artifact.body}</pre>
                    </div>
                  ))}
                  {artifacts?.length === 0 ? <p className="text-sm text-slate-500">No evidence artifacts yet.</p> : null}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
