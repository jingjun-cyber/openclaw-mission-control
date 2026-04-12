"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/overview", label: "Overview" },
  { href: "/daily", label: "Daily" },
  { href: "/tasks", label: "Tasks" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/calendar", label: "Calendar" },
  { href: "/memory", label: "Memory" },
  { href: "/team", label: "Team" },
  { href: "/office", label: "Office" },
  { href: "/settings", label: "Settings" },
  { href: "/sync", label: "Sync" },
  { href: "/connectors", label: "Connectors" },
  { href: "/usage", label: "Usage" },
  { href: "/approvals", label: "Approvals" },
  { href: "/incidents", label: "Incidents" }
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/overview" className="font-semibold tracking-tight">
          Mission Control
        </Link>
        <ul className="flex flex-wrap items-center gap-2 text-sm">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`rounded-md px-3 py-1.5 transition ${
                    active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
