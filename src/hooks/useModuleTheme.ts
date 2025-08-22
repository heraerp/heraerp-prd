'use client'

import { usePathname } from 'next/navigation'
import { getModuleTheme, ModuleTheme } from '@/lib/theme/module-themes'

export function useModuleTheme(): ModuleTheme & { moduleName: string } {
  const pathname = usePathname()
  
  // Extract module name from pathname
  const moduleMatch = pathname.match(/^\/(?:~[^\/]+\/)?([^\/]+)/)
  const moduleName = moduleMatch?.[1] || 'default'
  
  // Get theme for the module
  const theme = getModuleTheme(moduleName)
  
  return {
    ...theme,
    moduleName
  }
}