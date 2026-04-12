"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type SafetyState = {
  readOnly: boolean;
  mutationGuard: boolean;
  requireToken: boolean;
  checkedAt?: string;
  message?: string;
};

const SafetyContext = createContext<SafetyState>({
  readOnly: false,
  mutationGuard: true,
  requireToken: false
});

export function SafetyProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<SafetyState>({ 
    readOnly: false, 
    mutationGuard: true, 
    requireToken: false 
  });

  useEffect(() => {
    setMounted(true);
    
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
    
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => state, [state]);
  
  // Always render children, even before mount
  return <SafetyContext.Provider value={value}>{children}</SafetyContext.Provider>;
}

export function useSafety() {
  return useContext(SafetyContext);
}
