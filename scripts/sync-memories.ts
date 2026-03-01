import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

type MemoryDoc = {
  path: string;
  title: string;
  content: string;
  tags: string[];
  sourceUpdatedAt?: number;
};

function walkMarkdown(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".git" || entry.startsWith(".")) continue;
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walkMarkdown(full, out);
    } else if (entry.endsWith(".md")) {
      out.push(full);
    }
  }
  return out;
}

function parseDoc(file: string, root: string): MemoryDoc {
  const content = readFileSync(file, "utf-8");
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch?.[1]?.trim() || path.basename(file, ".md");
  const tags = Array.from(content.matchAll(/#([a-zA-Z0-9_-]+)/g)).map((m) => m[1]);
  const sourceUpdatedAt = statSync(file).mtimeMs;
  return {
    path: path.relative(root, file),
    title,
    content,
    tags,
    sourceUpdatedAt
  };
}

async function main() {
  const root = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(process.cwd(), "..");
  const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) throw new Error("Missing CONVEX_URL or NEXT_PUBLIC_CONVEX_URL");

  const files = walkMarkdown(root);
  const docs = files.map((file) => parseDoc(file, root));

  const client = new ConvexHttpClient(convexUrl);
  const result = await client.mutation(api.memory.upsertDocs, { docs });
  console.log(`Synced ${result.updated} memory documents from ${root}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
