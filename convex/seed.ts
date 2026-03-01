import { mutation } from "./_generated/server";

const defaultRoles = [
  {
    key: "orchestrator",
    name: "Orchestrator",
    description: "Breaks down goals, delegates to subagents, merges results, and maintains system memory.",
    tools: ["memory_search", "sessions_spawn", "exec", "message"]
  },
  {
    key: "developer",
    name: "Developer",
    description: "Builds/ships features, fixes bugs, writes tests.",
    tools: ["exec", "read", "write", "edit"]
  },
  {
    key: "writer",
    name: "Writer",
    description: "Drafts docs, scripts, release notes, and structured summaries.",
    tools: ["write", "edit", "memory_search"]
  },
  {
    key: "designer",
    name: "Designer",
    description: "UI/UX structure, component breakdown, layout conventions.",
    tools: ["browser", "image", "write"]
  },
  {
    key: "researcher",
    name: "Researcher",
    description: "Web research, competitive analysis, fact checking.",
    tools: ["web_search", "web_fetch", "write"]
  },
  {
    key: "operator",
    name: "Operator",
    description: "Reliability, cron jobs, monitoring, incident response.",
    tools: ["openclaw", "exec", "logs"]
  }
] as const;

function svgAvatar(bg: string, text: string) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="64" fill="${bg}" />
  <text x="50%" y="54%" text-anchor="middle" font-family="Verdana" font-size="56" fill="white">${text}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const defaults = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // TEAM roles + agents
    const existingRoles = await ctx.db.query("teamRoles").collect();
    if (existingRoles.length === 0) {
      for (const r of defaultRoles) {
        await ctx.db.insert("teamRoles", {
          key: r.key,
          name: r.name,
          description: r.description,
          defaultTools: [...r.tools],
          createdAt: now,
          updatedAt: now
        });
      }

      const agents = [
        {
          key: "macbot",
          name: "MacBot",
          roleKey: "orchestrator",
          description: "Jay Jay 的专属 AI 助手（主控）。负责拆任务、调度 subagents、收敛结果、写回记忆。",
          typicalTasks: ["Plan", "Delegate", "Summarize", "Sync mission control"],
          modelPreference: "openai-codex/gpt-5.2"
        },
        {
          key: "dev-frontend",
          name: "Dev Agent (Frontend)",
          roleKey: "developer",
          description: "Next.js/React/Tailwind UI 实现与组件化。",
          typicalTasks: ["UI implementation", "State management", "Bug fixes"],
          modelPreference: "anthropic/claude-opus-4-5"
        },
        {
          key: "dev-backend",
          name: "Dev Agent (Backend)",
          roleKey: "developer",
          description: "Convex schema/functions、脚本同步、数据治理。",
          typicalTasks: ["Convex functions", "Sync scripts", "Data migrations"],
          modelPreference: "openai-codex/gpt-5.2"
        },
        {
          key: "writer",
          name: "Writer Agent",
          roleKey: "writer",
          description: "内容脚本、文档、复盘、对外说明。",
          typicalTasks: ["Docs", "Scripts", "Release notes"],
          modelPreference: "moonshot/kimi-k2.5"
        },
        {
          key: "designer",
          name: "Designer Agent",
          roleKey: "designer",
          description: "UI/UX 信息架构、组件拆分、风格一致性。",
          typicalTasks: ["Component breakdown", "Layout", "Design review"],
          modelPreference: "openai-codex/gpt-5.2"
        },
        {
          key: "operator",
          name: "Ops Agent",
          roleKey: "operator",
          description: "Cron/可靠性/告警/运行状态。",
          typicalTasks: ["Cron", "Monitoring", "Incident response"],
          modelPreference: "anthropic/claude-haiku-4-5"
        }
      ];

      for (const a of agents) {
        await ctx.db.insert("teamAgents", {
          key: a.key,
          name: a.name,
          roleKey: a.roleKey,
          description: a.description,
          typicalTasks: a.typicalTasks,
          modelPreference: a.modelPreference,
          enabled: true,
          createdAt: now,
          updatedAt: now
        });
      }
    }

    // OFFICE desks
    const existingDesks = await ctx.db.query("officeDesks").collect();
    if (existingDesks.length === 0) {
      for (let row = 1; row <= 3; row += 1) {
        for (let col = 1; col <= 4; col += 1) {
          const code = `D${row}${col}`;
          await ctx.db.insert("officeDesks", {
            code,
            label: `Desk ${row}-${col}`,
            row,
            col,
            agentName: undefined,
            avatar: undefined,
            presence: "idle",
            updatedAt: now
          });
        }
      }

      // Assign a few desks
      const desks = await ctx.db.query("officeDesks").collect();
      const deskByCode = Object.fromEntries(desks.map((d) => [d.code, d]));
      const assignments = [
        { code: "D11", name: "MacBot", avatar: svgAvatar("#0ea5e9", "M") },
        { code: "D12", name: "Dev Frontend", avatar: svgAvatar("#22c55e", "F") },
        { code: "D13", name: "Dev Backend", avatar: svgAvatar("#16a34a", "B") },
        { code: "D21", name: "Writer", avatar: svgAvatar("#a855f7", "W") },
        { code: "D22", name: "Designer", avatar: svgAvatar("#f97316", "D") },
        { code: "D23", name: "Ops", avatar: svgAvatar("#64748b", "O") }
      ];

      for (const a of assignments) {
        const desk = deskByCode[a.code];
        if (!desk) continue;
        await ctx.db.patch(desk._id, {
          agentName: a.name,
          avatar: a.avatar,
          updatedAt: Date.now()
        });
      }
    }

    // TASKS seed
    const existingTasks = await ctx.db.query("tasks").collect();
    if (existingTasks.length === 0) {
      const tasks = [
        {
          title: "[Mission Control] Stabilize sync-all + dashboard previews",
          description: "Ensure sync:all runs clean and dashboard shows real data.",
          status: "Doing" as const,
          priority: "P0"
        },
        {
          title: "[ADAS HMI] Status main screen – component breakdown",
          description: "Source: projects/adas-hmi-ux/ui/status-main.html\nState: projects/adas-hmi-ux/WORKING_STATE.md",
          status: "Backlog" as const,
          priority: "P1"
        },
        {
          title: "[ADAS HMI] Align Figma components/tokens with design system",
          description: "When Figma MCP quota permits, map components and tokens.",
          status: "Backlog" as const,
          priority: "P1"
        }
      ];

      for (const t of tasks) {
        await ctx.db.insert("tasks", {
          title: t.title,
          description: t.description,
          status: t.status,
          assignee: undefined,
          dueDate: undefined,
          priority: t.priority,
          createdAt: now,
          updatedAt: now
        });
      }
    }

    // PIPELINE seed
    const existingItems = await ctx.db.query("contentItems").collect();
    if (existingItems.length === 0) {
      await ctx.db.insert("contentItems", {
        title: "Mission Control: roadmap & rules",
        channel: "Internal",
        targetDate: "",
        owner: "MacBot",
        brief: "Define the rules: any scheduled task/cron must be visible in Calendar; keep memory synced.",
        script: "",
        stage: "Idea",
        attachmentIds: [],
        createdAt: now,
        updatedAt: now
      });
    }

    // CALENDAR seed
    const existingEvents = await ctx.db.query("calendarEvents").collect();
    if (existingEvents.length === 0) {
      const today = new Date().toISOString().slice(0, 10);
      await ctx.db.insert("calendarEvents", {
        title: "Mission Control daily check",
        description: "Review tasks/pipeline/calendar/memory/team/office.",
        date: today,
        time: "09:30",
        type: "openclaw-task",
        createdAt: now,
        updatedAt: now
      });
    }

    return { ok: true };
  }
});
