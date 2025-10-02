// app/examples/settings/theme/page.tsx
'use client'
import { ThemePicker } from '@/ui'
import { useRouter } from 'next/navigation'

export default function ThemeSettingsPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-[color:rgb(var(--hera-bg)/1)] text-[color:rgb(var(--hera-text)/1)]">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Theme Settings</h1>
            <p className="text-sm text-[color:rgb(var(--hera-muted)/1)] mt-1">
              Customize your organization's theme
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5"
          >
            Back
          </button>
        </div>

        <ThemePicker />

        <div className="mt-8 space-y-4">
          <h2 className="text-lg font-semibold">Live Preview</h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 rounded-[var(--hera-radius)] bg-[color:rgb(var(--hera-surface)/1)] border border-white/10">
              <h3 className="font-medium mb-2">Surface Card</h3>
              <p className="text-sm text-[color:rgb(var(--hera-muted)/1)]">
                This uses the surface background color
              </p>
            </div>

            <div className="p-4 rounded-[var(--hera-radius)] bg-[color:rgb(var(--hera-primary)/1)] text-black">
              <h3 className="font-medium mb-2">Primary Card</h3>
              <p className="text-sm opacity-80">This uses the primary color</p>
            </div>

            <div className="p-4 rounded-[var(--hera-radius)] border-2 border-[color:rgb(var(--hera-primary)/1)]">
              <h3 className="font-medium mb-2">Outlined Card</h3>
              <p className="text-sm text-[color:rgb(var(--hera-muted)/1)]">
                Border uses primary color
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 rounded-[var(--hera-radius)] bg-[color:rgb(var(--hera-primary)/1)] text-black font-medium">
              Primary Button
            </button>
            <button className="px-4 py-2 rounded-[var(--hera-radius)] bg-[color:rgb(var(--hera-success)/1)] text-white font-medium">
              Success
            </button>
            <button className="px-4 py-2 rounded-[var(--hera-radius)] bg-[color:rgb(var(--hera-warning)/1)] text-black font-medium">
              Warning
            </button>
            <button className="px-4 py-2 rounded-[var(--hera-radius)] bg-[color:rgb(var(--hera-danger)/1)] text-white font-medium">
              Danger
            </button>
          </div>

          <div className="space-y-2">
            <p className="font-[family-name:var(--hera-font-sans)]">
              This text uses the Sans font family
            </p>
            <p className="font-[family-name:var(--hera-font-mono)] text-sm">
              This text uses the Monospace font family
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
