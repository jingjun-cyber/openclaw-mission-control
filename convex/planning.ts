import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const sessionStatus = v.union(
  v.literal("active"),
  v.literal("completed"),
  v.literal("cancelled")
);

const taskStage = v.union(v.literal("planning"), v.literal("execution"));

function normalizeText(value: string | undefined) {
  return value?.trim() ?? "";
}

function createQuestionPool(title: string, description: string, answered: string[]) {
  const text = `${title}\n${description}`.toLowerCase();
  const answeredText = answered.join("\n").toLowerCase();
  const hasProductSignals = /(ui|ux|page|screen|component|design|tailwind|next\.js|app router)/.test(text);
  const hasDataSignals = /(convex|schema|migration|data|api|query|mutation|model)/.test(text);
  const hasDeliverySignals = /(test|ship|deploy|release|route|module|refactor|bug|fix)/.test(text);

  const questions = [
    "What concrete outcome should be true when this task is done?",
    "What constraints or non-goals should the implementation avoid?",
    hasProductSignals
      ? "Which user flow or screen state matters most for the first implementation?"
      : "Which part of the system should be treated as the primary surface for this work?",
    hasDataSignals
      ? "What existing data model or API contract must remain compatible?"
      : "What existing route, module, or behavior must remain unchanged?",
    hasDeliverySignals
      ? "What evidence would you accept as done: type checks, tests, manual flows, or screenshots?"
      : "How should success be verified once the work is complete?"
  ];

  if (!description.trim()) {
    questions.splice(1, 0, "Add any missing context or examples that would reduce ambiguity before implementation.");
  }

  if (!answeredText.includes("deadline") && !answeredText.includes("priority")) {
    questions.push("Are there any sequencing, deadline, or priority constraints that should shape the plan?");
  }

  return Array.from(new Set(questions)).slice(0, 5);
}

function ensureNonEmpty(values: string[], fallback: string[]) {
  const cleaned = values.map((value) => value.trim()).filter(Boolean);
  return cleaned.length ? cleaned : fallback;
}

function buildPlan(task: { title: string; description: string }, answers: string[]) {
  const answerSummary = answers
    .map((answer, index) => `${index + 1}. ${answer.trim() || "Skipped"}`)
    .join(" ");

  const steps = ensureNonEmpty(
    [
      `Review the current implementation for "${task.title}" and confirm the affected routes, Convex functions, and UI states.`,
      task.description.trim()
        ? `Translate the task description and planning answers into concrete changes: ${task.description.trim().slice(0, 180)}${task.description.trim().length > 180 ? "..." : ""}`
        : "",
      "Implement the agreed data model and UI updates in the smallest safe sequence, preserving existing behavior outside the scoped task.",
      "Validate the result with type checks and the user-facing flow that this task changes.",
      "Document any operational notes, constraints, or follow-up work discovered during implementation."
    ],
    [
      `Complete the scoped implementation for "${task.title}".`,
      "Validate the updated behavior.",
      "Capture follow-up notes."
    ]
  );

  const acceptanceCriteria = ensureNonEmpty(
    [
      "The requested outcome is implemented without breaking existing routes or modules.",
      "The task has a clear execution-ready plan captured on the task record.",
      `Validation reflects the task scope${answerSummary ? ` and planning answers (${answerSummary})` : ""}.`
    ],
    ["The task outcome is clear, implemented safely, and validated."]
  );

  return {
    summary: `Execution plan generated from ${answers.length} planning response${answers.length === 1 ? "" : "s"}.`,
    steps,
    acceptanceCriteria,
    generatedAt: Date.now()
  };
}

async function getSessionByTaskId(ctx: { db: any }, taskId: any) {
  return await ctx.db.query("planningSessions").withIndex("by_taskId", (q: any) => q.eq("taskId", taskId)).unique();
}

async function completePlanning(ctx: { db: any }, task: any, session: any, answers: string[]) {
  const now = Date.now();
  const plan = buildPlan(task, answers);

  await ctx.db.patch(session._id, {
    status: "completed",
    stage: "execution",
    answers,
    currentIndex: session.questions.length,
    updatedAt: now
  });

  await ctx.db.patch(task._id, {
    stage: "execution",
    plan,
    updatedAt: now
  });
}

function isExecutionReady(task: any, session: any) {
  const answeredCount = (session?.answers ?? []).filter((value: string) => value?.trim()).length;
  const hasPlan = !!task?.plan;
  const hasOwner = !!task?.assignee?.trim();
  return hasPlan && answeredCount >= 2 && hasOwner;
}

export const getByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await getSessionByTaskId(ctx, args.taskId);
  }
});

export const answerCurrent = mutation({
  args: {
    taskId: v.id("tasks"),
    answer: v.string()
  },
  handler: async (ctx, args) => {
    const [task, session] = await Promise.all([ctx.db.get(args.taskId), getSessionByTaskId(ctx, args.taskId)]);
    if (!task) throw new Error("Task not found.");
    if (!session) throw new Error("Planning session not found.");
    if (session.status !== "active") return session._id;

    const now = Date.now();
    const nextAnswers = [...session.answers];
    nextAnswers[session.currentIndex] = normalizeText(args.answer);
    const nextIndex = session.currentIndex + 1;

    if (nextIndex >= session.questions.length) {
      await completePlanning(ctx, task, session, nextAnswers);
      return session._id;
    }

    await ctx.db.patch(session._id, {
      answers: nextAnswers,
      currentIndex: nextIndex,
      updatedAt: now
    });

    return session._id;
  }
});

export const skipCurrent = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const [task, session] = await Promise.all([ctx.db.get(args.taskId), getSessionByTaskId(ctx, args.taskId)]);
    if (!task) throw new Error("Task not found.");
    if (!session) throw new Error("Planning session not found.");
    if (session.status !== "active") return session._id;

    const nextAnswers = [...session.answers];
    nextAnswers[session.currentIndex] = "";
    const nextIndex = session.currentIndex + 1;

    if (nextIndex >= session.questions.length) {
      await completePlanning(ctx, task, session, nextAnswers);
      return session._id;
    }

    await ctx.db.patch(session._id, {
      answers: nextAnswers,
      currentIndex: nextIndex,
      updatedAt: Date.now()
    });

    return session._id;
  }
});

export const regenerateQuestions = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const [task, session] = await Promise.all([ctx.db.get(args.taskId), getSessionByTaskId(ctx, args.taskId)]);
    if (!task) throw new Error("Task not found.");
    if (!session) throw new Error("Planning session not found.");
    if (session.status !== "active") return session._id;

    const answeredCount = Math.min(session.currentIndex, session.answers.length);
    const preservedAnswers = session.answers.slice(0, answeredCount);
    const nextQuestions = createQuestionPool(task.title, task.description, preservedAnswers);

    if (answeredCount >= nextQuestions.length) {
      await completePlanning(ctx, task, session, preservedAnswers);
      return session._id;
    }

    await ctx.db.patch(session._id, {
      questions: nextQuestions,
      answers: preservedAnswers,
      currentIndex: answeredCount,
      updatedAt: Date.now()
    });

    return session._id;
  }
});

export const markComplete = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const [task, session] = await Promise.all([ctx.db.get(args.taskId), getSessionByTaskId(ctx, args.taskId)]);
    if (!task) throw new Error("Task not found.");
    if (!session) throw new Error("Planning session not found.");
    if (session.status === "completed") return session._id;

    await completePlanning(ctx, task, session, session.answers);
    return session._id;
  }
});

export const stop = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const [task, session] = await Promise.all([ctx.db.get(args.taskId), getSessionByTaskId(ctx, args.taskId)]);
    if (!task) throw new Error("Task not found.");
    if (!session) throw new Error("Planning session not found.");
    if (session.status !== "active") return session._id;

    const now = Date.now();
    await ctx.db.patch(session._id, {
      status: "cancelled",
      stage: "execution",
      updatedAt: now
    });
    await ctx.db.patch(task._id, {
      stage: "execution",
      updatedAt: now
    });

    return session._id;
  }
});

export const transitionToExecution = mutation({
  args: {
    taskId: v.id("tasks"),
    owner: v.optional(v.string()),
    nextAction: v.string(),
    notes: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const [task, session] = await Promise.all([ctx.db.get(args.taskId), getSessionByTaskId(ctx, args.taskId)]);
    if (!task) throw new Error("Task not found.");
    if (!session) throw new Error("Planning session not found.");

    const now = Date.now();
    const owner = args.owner?.trim() || task.assignee;
    const nextAction = args.nextAction.trim();
    if (!nextAction) throw new Error("Next action is required.");

    if (session.status === "active") {
      await completePlanning(ctx, task, session, session.answers);
    }

    const refreshedTask = (await ctx.db.get(args.taskId)) ?? task;
    const refreshedSession = (await getSessionByTaskId(ctx, args.taskId)) ?? session;
    const ready = isExecutionReady({ ...refreshedTask, assignee: owner ?? refreshedTask.assignee }, refreshedSession);

    await ctx.db.patch(args.taskId, {
      stage: "execution",
      assignee: owner,
      executionTransition: {
        ready,
        owner,
        nextAction,
        transitionedAt: now,
        transitionedBy: "MacBot",
        notes: args.notes?.trim() || undefined
      },
      updatedAt: now
    });

    return args.taskId;
  }
});

export const executionReadiness = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const [task, session] = await Promise.all([ctx.db.get(args.taskId), getSessionByTaskId(ctx, args.taskId)]);
    if (!task || !session) return null;

    const answeredCount = (session.answers ?? []).filter((value: string) => value?.trim()).length;
    const blockers = [
      task.plan ? null : "Complete planning to generate an execution plan.",
      task.assignee?.trim() ? null : "Assign an owner before execution.",
      answeredCount >= 2 ? null : "Capture at least two meaningful planning answers."
    ].filter(Boolean);

    return {
      ready: blockers.length === 0,
      blockers,
      answeredCount,
      hasPlan: !!task.plan,
      hasOwner: !!task.assignee?.trim(),
      transition: task.executionTransition ?? null
    };
  }
});

export const ensureForTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found.");

    const existing = await getSessionByTaskId(ctx, args.taskId);
    if (existing) return existing._id;

    const now = Date.now();
    const questions = createQuestionPool(task.title, task.description, []);

    await ctx.db.patch(task._id, {
      stage: "planning",
      updatedAt: now
    });

    return await ctx.db.insert("planningSessions", {
      taskId: args.taskId,
      status: "active",
      stage: "planning",
      questions,
      answers: [],
      currentIndex: 0,
      createdAt: now,
      updatedAt: now
    });
  }
});

export const migrateExistingTasks = mutation({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").collect();
    let patched = 0;
    let sessionsCreated = 0;

    for (const task of tasks) {
      const existing = await getSessionByTaskId(ctx, task._id);
      const patch: Record<string, unknown> = {};

      if (!("stage" in task) || !task.stage) {
        patch.stage = existing?.status === "active" && task.status !== "Done" ? "planning" : "execution";
      }

      if (Object.keys(patch).length > 0) {
        patch.updatedAt = Date.now();
        await ctx.db.patch(task._id, patch);
        patched += 1;
      }

      if (!existing && task.status !== "Done") {
        const now = Date.now();
        await ctx.db.insert("planningSessions", {
          taskId: task._id,
          status: "active",
          stage: "planning",
          questions: createQuestionPool(task.title, task.description, []),
          answers: [],
          currentIndex: 0,
          createdAt: now,
          updatedAt: now
        });
        await ctx.db.patch(task._id, {
          stage: "planning",
          updatedAt: now
        });
        sessionsCreated += 1;
      }
    }

    return { patched, sessionsCreated };
  }
});
