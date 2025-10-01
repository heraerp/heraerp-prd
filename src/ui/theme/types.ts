// src/ui/theme/types.ts
export type ThemeTokens = {
  colors: {
    primary: string;        // e.g. "#16a34a"
    bg?: string;            // page background
    surface?: string;       // cards/panels
    text?: string;          // primary text
    muted?: string;         // secondary text
    success?: string;
    warning?: string;
    danger?: string;
  };
  typography?: {
    fontSans?: string;      // CSS font-family
    fontMono?: string;
    scale?: 'sm' | 'md' | 'lg';
  };
  radius?: number;          // px (e.g. 12)
};

export const defaultTheme: ThemeTokens = {
  colors: {
    primary: '#16a34a',
    bg: '#0b0f15',
    surface: '#111827',
    text: '#e5e7eb',
    muted: '#94a3b8',
    success: '#16a34a',
    warning: '#f59e0b',
    danger: '#ef4444',
  },
  typography: {
    fontSans: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
    fontMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono","Courier New", monospace',
    scale: 'md',
  },
  radius: 12,
};