// src/ui/theme/ThemeProvider.tsx
'use client';
import { createContext, useContext, useEffect, useMemo } from 'react';
import { ThemeTokens } from './types';
import { useTheme } from './useTheme';
import { applyThemeToDOM } from './theme-utils';

type Ctx = {
  theme: ThemeTokens;
  isLoading: boolean;
  saveTheme: (t: ThemeTokens) => Promise<any>;
  isSaving: boolean;
};

const ThemeCtx = createContext<Ctx | null>(null);

export function useHeraTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useHeraTheme must be used within <HeraThemeProvider>');
  return ctx;
}

export function HeraThemeProvider({ orgId, children }: { orgId: string; children: React.ReactNode; }) {
  const { theme, isLoading, saveTheme, isSaving } = useTheme(orgId);

  // Apply to DOM whenever theme changes
  useEffect(() => { applyThemeToDOM(theme); }, [theme]);

  const value = useMemo(() => ({ theme, isLoading, saveTheme, isSaving }), [theme, isLoading, saveTheme, isSaving]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}