"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
type Ctx = { theme: Theme; setTheme: (t: Theme) => void };

const ThemeCtx = createContext<Ctx | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = (localStorage.getItem("theme") as Theme) || "dark";
    const root = document.documentElement;
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const effective = saved === "system" ? (systemDark ? "dark" : "light") : saved;
    root.classList.remove("light", "dark");
    root.classList.add(effective);
    setTheme(saved);

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e: MediaQueryListEvent) => {
      if ((localStorage.getItem("theme") as Theme) === "system") {
        root.classList.remove("light", "dark");
        root.classList.add(e.matches ? "dark" : "light");
      }
    };
    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  }, []);

  const handleSet = (t: Theme) => {
    localStorage.setItem("theme", t);
    const root = document.documentElement;
    if (t === "system") {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.remove("light", "dark");
      root.classList.add(systemDark ? "dark" : "light");
    } else {
      root.classList.remove("light", "dark");
      root.classList.add(t);
    }
    setTheme(t);
  };

  return <ThemeCtx.Provider value={{ theme, setTheme: handleSet }}>{children}</ThemeCtx.Provider>;
}