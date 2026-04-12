"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type SafetyState = {
  readOnly: boolean;
  mutationGuard: boolean;
  checkedAt?: string;
  message?: string;
};

const SafetyContext = createContext<SafetyState>({
  readOnly: false,
  mutationGuard: true
});

export function SafetyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SafetyState>({ readOnly: false, mutationGuard: true });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/safety/status", { cache: "no-store" });
        const json = await res.json();
        if (!cancelled) setState(json);
      } catch {
        if (!cancelled) setState((prev) => ({ ...prev, message: "Safety status unavailable" }));
      }
    };
    load();
  }, []);

  const value = useMemo(() => state, [state]);
  return <SafetyContext.Provider value={value}>{children}</SafetyContext.Provider>;
}

export function useSafety() {
  return useContext(SafetyContext);
}
