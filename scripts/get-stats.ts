import { api } from "../convex/_generated/api.js";
import { ConvexClient } from "convex/browser";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = new ConvexClient(process.env.CONVEX_URL || "");

async function getStats() {
  try {
    const tasks = await client.query(api.tasks.list, {});
    const contentItems = await client.query(api.content.getBoard, {});
    const memoryDocs = await client.query(api.memory.list, {});
    const teamSessions = await client.query(api.team.listSessions, { limit: 1000 });
    const cronJobs = await client.query(api.calendar.listJobs, {});

    const byProject: Record<string, { pipeline: number; docs: number }> = {};
    for (const item of contentItems) {
      const key = item.projectKey || "(no project)";
      byProject[key] = byProject[key] || { pipeline: 0, docs: 0 };
      byProject[key].pipeline++;
    }

    for (const doc of memoryDocs) {
      const key = doc.path.split("/")[0] || "(root)";
      byProject[key] = byProject[key] || { pipeline: 0, docs: 0 };
      byProject[key].docs++;
    }

    const tasksByStatus: Record<string, number> = {};
    for (const task of tasks) {
      tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1;
    }

    const activeSessions = teamSessions.filter((s) => s.status === "active" || !s.endedAt).length;
    const completedSessions = teamSessions.filter((s) => s.status === "completed" || !!s.endedAt).length;

    const cronByStatus: Record<string, number> = {};
    for (const job of cronJobs) {
      cronByStatus[job.status] = (cronByStatus[job.status] || 0) + 1;
    }

    const stats = {
      totalTasks: tasks.length,
      tasksByStatus,
      totalPipeline: contentItems.length,
      totalDocs: memoryDocs.length,
      totalSessions: teamSessions.length,
      activeSessions,
      completedSessions,
      totalCronJobs: cronJobs.length,
      cronByStatus,
      byProject,
    };

    console.log(JSON.stringify(stats, null, 2));
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  } finally {
    client.close();
  }
}

getStats();
