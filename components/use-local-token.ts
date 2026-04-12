"use client";

import { useEffect, useState } from "react";
import { useSafety } from "./safety-provider";

const TOKEN_KEY = "mission_control_local_token";

export function useLocalToken() {
  const [token, setToken] = useState<string | null>(null);
  const safety = useSafety();

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    setToken(stored);
  }, []);

  const saveToken = (newToken: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, newToken);
      setToken(newToken);
    }
  };

  const clearToken = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
    }
  };

  return {
    token,
    saveToken,
    clearToken,
    required: safety.requireToken
  };
}
