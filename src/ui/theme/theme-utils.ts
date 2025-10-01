// src/ui/theme/theme-utils.ts
import { ThemeTokens } from './types';

export function applyThemeToDOM(theme: ThemeTokens) {
  if (typeof document === 'undefined') return;
  const r = document.documentElement;

  const { colors, typography, radius } = theme;

  // Use CSS variables Tailwind can reference (see tailwind.config below)
  r.style.setProperty('--hera-primary', toRGB(colors.primary));
  r.style.setProperty('--hera-bg', toRGB(colors.bg || '#0b0f15'));
  r.style.setProperty('--hera-surface', toRGB(colors.surface || '#111827'));
  r.style.setProperty('--hera-text', toRGB(colors.text || '#e5e7eb'));
  r.style.setProperty('--hera-muted', toRGB(colors.muted || '#94a3b8'));
  r.style.setProperty('--hera-success', toRGB(colors.success || colors.primary));
  r.style.setProperty('--hera-warning', toRGB(colors.warning || '#f59e0b'));
  r.style.setProperty('--hera-danger', toRGB(colors.danger || '#ef4444'));

  r.style.setProperty('--hera-radius', `${radius ?? 12}px`);
  r.style.setProperty('--hera-font-sans', typography?.fontSans || 'Inter, system-ui, sans-serif');
  r.style.setProperty('--hera-font-mono', typography?.fontMono || 'ui-monospace, SFMono-Regular, monospace');
  r.style.setProperty('--hera-type-scale', typography?.scale || 'md');
}

// "#16a34a" -> "22 163 74"
function toRGB(hex: string) {
  const h = hex.replace('#','');
  const bigint = parseInt(h.length === 3 ? h.split('').map(x=>x+x).join('') : h, 16);
  const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255;
  return `${r} ${g} ${b}`;
}