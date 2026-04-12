import Link from "next/link";
import { useSafety } from "@/components/safety-provider";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </header>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`}>{children}</section>;
}

export function DetailBackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link className="text-sm text-blue-600 hover:underline" href={href}>
      ← {label}
    </Link>
  );
}

export function SafetyBanner() {
  const safety = useSafety();
  if (!safety.readOnly && !safety.mutationGuard) return null;

  return (
    <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${safety.readOnly ? "border-amber-200 bg-amber-50 text-amber-900" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
      <div className="font-medium">{safety.readOnly ? "Read-only mode enabled" : "Mutation safety guard enabled"}</div>
      <div className="mt-1">{safety.message ?? "Write operations are currently gated."}</div>
    </div>
  );
}
