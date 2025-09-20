'use client'

import { Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useCivicFlowTheme, CivicFlowTheme } from './CivicFlowThemeProvider'

const themes: Array<{ value: CivicFlowTheme; label: string; description: string }> = [
  {
    value: 'civic-navy',
    label: 'Professional Dark',
    description: 'Deep navy and vibrant teal'
  },
  {
    value: 'civic-light',
    label: 'Professional Light',
    description: 'Clean and bright interface'
  },
  {
    value: 'civic-indigo',
    label: 'Civic Indigo',
    description: 'Professional indigo and violet'
  },
  {
    value: 'emerald-slate',
    label: 'Emerald Slate',
    description: 'Natural emerald and teal'
  },
  {
    value: 'royal-iris',
    label: 'Royal Iris',
    description: 'Elegant violet and purple'
  }
]

export function CivicFlowThemeSwitcher() {
  const { theme, setTheme } = useCivicFlowTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3 text-text-300 hover:text-text-100 hover:bg-accent-soft"
        >
          <Palette className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline-block">Theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-panel border-border">
        {themes.map(t => (
          <DropdownMenuItem
            key={t.value}
            onClick={() => setTheme(t.value)}
            className="cursor-pointer"
          >
            <div className="flex items-center w-full">
              <div
                className={`w-2 h-2 rounded-full mr-3 ${
                  t.value === 'civic-navy'
                    ? 'bg-blue-900'
                    : t.value === 'civic-light'
                      ? 'bg-gray-300'
                      : t.value === 'civic-indigo'
                        ? 'bg-indigo-500'
                        : t.value === 'emerald-slate'
                          ? 'bg-emerald-500'
                          : 'bg-violet-600'
                }`}
              />
              <div className="flex-1">
                <div className="font-medium text-text-100">
                  {t.label}
                  {theme === t.value && ' ✓'}
                </div>
                <div className="text-xs text-text-500">{t.description}</div>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
