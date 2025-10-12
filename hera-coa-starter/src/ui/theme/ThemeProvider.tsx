import React, { createContext, useContext, useMemo } from "react";
import type { ThemeTokens } from "./tokens";

const ThemeCtx = createContext<ThemeTokens | null>(null);
export const useThemeTokens = () => {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("ThemeProvider missing");
  return ctx;
};

type Props = { tokens: ThemeTokens; children: React.ReactNode };

export const ThemeProvider: React.FC<Props> = ({ tokens, children }) => {
  const style = useMemo(() => ({
    ["--surface-bg" as any]: tokens.surfaceBg,
    ["--surface-alt"]: tokens.surfaceAlt,
    ["--surface-raised"]: tokens.surfaceRaised,
    ["--text-primary"]: tokens.textPrimary,
    ["--text-secondary"]: tokens.textSecondary,
    ["--text-muted"]: tokens.textMuted,
    ["--accent"]: tokens.accent,
    ["--accent-fg"]: tokens.accentFg,
    ["--info"]: tokens.info,
    ["--success"]: tokens.success,
    ["--warning"]: tokens.warning,
    ["--danger"]: tokens.danger,
    ["--debit"]: tokens.debit,
    ["--credit"]: tokens.credit,
    ["--negative"]: tokens.negative,
    ["--border"]: tokens.border,
    ["--focus"]: tokens.focus,
    ["--shadow"]: tokens.shadow,
  }), [tokens]);

  return (
    <ThemeCtx.Provider value={tokens}>
      <div style={style} className="min-h-screen bg-[var(--surface-bg)] text-[var(--text-primary)]">
        {children}
      </div>
    </ThemeCtx.Provider>
  );
};
