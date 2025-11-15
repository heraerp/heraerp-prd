// src/ui/theme/ThemePicker.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { useHeraTheme } from '@/lib/hera-ui-preset/theme/ThemeProvider'
import { ThemeTokens } from '@/lib/hera-ui-preset/theme/types'

export default function ThemePicker() {
  const { theme, isLoading, saveTheme, isSaving } = useHeraTheme()
  const [draft, setDraft] = useState<ThemeTokens>(theme)

  useEffect(() => setDraft(theme), [theme]) // sync when server value changes

  if (isLoading) return <div className="opacity-70">Loading theme…</div>

  const update = <K extends keyof ThemeTokens>(key: K, value: ThemeTokens[K]) =>
    setDraft(prev => ({ ...prev, [key]: value }))

  const updateColor = (key: keyof ThemeTokens['colors'], value: string) =>
    setDraft(prev => ({ ...prev, colors: { ...prev.colors, [key]: value } }))

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="p-4 rounded-xl border border-white/10 bg-[color:rgb(var(--hera-surface)/1)]">
        <h3 className="text-lg font-semibold mb-3">Colors</h3>
        <div className="grid grid-cols-2 gap-3">
          {(
            ['primary', 'bg', 'surface', 'text', 'muted', 'success', 'warning', 'danger'] as const
          ).map(k => (
            <label
              key={k}
              className="flex items-center justify-between gap-3 p-2 rounded-lg bg-black/10"
            >
              <span className="capitalize">{k}</span>
              <input
                type="color"
                value={draft.colors[k] || '#000000'}
                onChange={e => updateColor(k, e.target.value)}
                className="h-8 w-12 cursor-pointer border rounded"
              />
            </label>
          ))}
        </div>
      </section>

      <section className="p-4 rounded-xl border border-white/10 bg-[color:rgb(var(--hera-surface)/1)]">
        <h3 className="text-lg font-semibold mb-3">Typography & Radius</h3>
        <div className="grid gap-3">
          <label className="grid gap-1">
            <span className="text-sm opacity-80">Sans Font</span>
            <input
              className="px-3 py-2 rounded bg-black/20 border border-white/10"
              value={draft.typography?.fontSans || ''}
              onChange={e =>
                update('typography', { ...draft.typography, fontSans: e.target.value })
              }
              placeholder="e.g. Inter, system-ui, sans-serif"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm opacity-80">Monospace Font</span>
            <input
              className="px-3 py-2 rounded bg-black/20 border border-white/10"
              value={draft.typography?.fontMono || ''}
              onChange={e =>
                update('typography', { ...draft.typography, fontMono: e.target.value })
              }
              placeholder="e.g. ui-monospace, SFMono-Regular, monospace"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm opacity-80">Scale</span>
            <select
              className="px-3 py-2 rounded bg-black/20 border border-white/10"
              value={draft.typography?.scale || 'md'}
              onChange={e =>
                update('typography', { ...draft.typography, scale: e.target.value as any })
              }
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm opacity-80">Radius: {draft.radius ?? 12}px</span>
            <input
              type="range"
              min={0}
              max={24}
              value={draft.radius ?? 12}
              onChange={e => update('radius', parseInt(e.target.value))}
            />
          </label>
        </div>
      </section>

      <section className="md:col-span-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full" style={{ background: draft.colors.primary }} />
          <span className="opacity-70">Preview uses live CSS variables</span>
        </div>
        <button
          onClick={async () => {
            await saveTheme(draft)
          }}
          disabled={isSaving}
          className="px-4 py-2 rounded-lg border border-white/10 bg-[color:rgb(var(--hera-primary)/1)] text-black font-medium disabled:opacity-60"
        >
          {isSaving ? 'Saving…' : 'Save Theme'}
        </button>
      </section>
    </div>
  )
}
