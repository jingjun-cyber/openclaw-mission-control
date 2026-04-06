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

type TabKey = "overview" | "planning";

function StagePill({ stage }: { stage: TaskStage }) {
  const cls = stage === "planning" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-700";
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>{stage}</span>;
}

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const taskId = params.id as never;
  const task = useQuery(api.tasks.get, { taskId });
  const planningSession = useQuery(api.planning.getByTask, { taskId });
  const updateTask = useMutation(api.tasks.update);
  const answerCurrent = useMutation(api.planning.answerCurrent);
  const skipCurrent = useMutation(api.planning.skipCurrent);
  const stopPlanning = useMutation(api.planning.stop);
  const regenerateQuestions = useMutation(api.planning.regenerateQuestions);
  const markPlanningComplete = useMutation(api.planning.markComplete);
  const [form, setForm] = useState<Form | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [answer, setAnswer] = useState("");
  const [exportMessage, setExportMessage] = useState<string | null>(null);

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
    if (!planningSession || planningSession.status !== "active") {
      setAnswer("");
      return;
    }

    setAnswer(planningSession.answers[planningSession.currentIndex] ?? "");
  }, [planningSession]);

  if (task === null) return <p className="text-sm text-red-600">Task not found.</p>;
  if (task === undefined || !form) return <p className="text-sm text-slate-600">Loading task...</p>;

  const questionCount = planningSession?.questions.length ?? 0;
  const answeredCount = Math.min(planningSession?.currentIndex ?? 0, questionCount);
  const progress = questionCount > 0 ? Math.round((answeredCount / questionCount) * 100) : 0;
  const currentQuestion =
    planningSession && planningSession.status === "active" ? planningSession.questions[planningSession.currentIndex] : null;

  const handleExport = async () => {
    try {
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
            "Task detail page renders an Export button.",
            "Clicking Export downloads a JSON file for the current task.",
            "Export includes task fields, plan, and planning session details when present.",
            "Existing task editing and planning flows still work after the change.",
          ],
        },
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `task-${task._id}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setExportMessage(`Exported task-${task._id}.json`);
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
          <StagePill stage={(task.stage ?? "execution") as TaskStage} />
          {planningSession ? (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              Session {planningSession.status}
            </span>
          ) : null}
          <button
            type="button"
            onClick={handleExport}
            className="ml-auto rounded border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Export JSON
          </button>
        </div>

        {exportMessage ? <p className="text-sm text-emerald-700">{exportMessage}</p> : null}

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
        ) : (
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
                        {answeredCount} of {questionCount} questions answered
                      </p>
                    </div>
                    <div className="text-sm font-medium text-slate-700">{progress}%</div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-slate-900 transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                {planningSession.status === "active" && currentQuestion ? (
                  <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
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
                    <div className="text-sm font-semibold text-slate-900">Execution plan</div>
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
        )}
      </Card>
    </div>
  );
}
