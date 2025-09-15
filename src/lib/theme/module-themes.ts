/**
 * Module Theme Configuration
 * Defines color schemes and gradients for different business modules
 */

export interface ModuleTheme {
  brandGradient: string
  accentGradient: string
  backgroundGradient: string
  primaryColor: string
  secondaryColor: string
}

export const moduleThemes: Record<string, ModuleTheme> = {
  // Pink/Purple theme (Salon, Beauty, Fashion)
  salon: {
    brandGradient: 'from-pink-400 to-purple-600',
    accentGradient: 'from-pink-50/90 to-purple-50/90',
    backgroundGradient: 'from-pink-50 via-purple-50 to-white',
    primaryColor: 'pink',
    secondaryColor: 'purple'
  },

  // Blue/Cyan theme (Healthcare, Medical)
  healthcare: {
    brandGradient: 'from-blue-400 to-cyan-600',
    accentGradient: 'from-blue-50/90 to-cyan-50/90',
    backgroundGradient: 'from-blue-50 via-cyan-50 to-white',
    primaryColor: 'blue',
    secondaryColor: 'cyan'
  },

  // Green/Emerald theme (Finance, Banking)
  finance: {
    brandGradient: 'from-green-400 to-emerald-600',
    accentGradient: 'from-green-50/90 to-emerald-50/90',
    backgroundGradient: 'from-green-50 via-emerald-50 to-white',
    primaryColor: 'green',
    secondaryColor: 'emerald'
  },

  // Orange/Red theme (Restaurant, Food)
  restaurant: {
    brandGradient: 'from-orange-400 to-red-600',
    accentGradient: 'from-orange-50/90 to-red-50/90',
    backgroundGradient: 'from-orange-50 via-red-50 to-white',
    primaryColor: 'orange',
    secondaryColor: 'red'
  },

  // Indigo/Violet theme (Professional Services)
  professional: {
    brandGradient: 'from-indigo-400 to-violet-600',
    accentGradient: 'from-indigo-50/90 to-violet-50/90',
    backgroundGradient: 'from-indigo-50 via-violet-50 to-white',
    primaryColor: 'indigo',
    secondaryColor: 'violet'
  },

  // Teal/Blue theme (Manufacturing, Industry)
  manufacturing: {
    brandGradient: 'from-teal-400 to-blue-600',
    accentGradient: 'from-teal-50/90 to-blue-50/90',
    backgroundGradient: 'from-teal-50 via-blue-50 to-white',
    primaryColor: 'teal',
    secondaryColor: 'blue'
  },

  // Yellow/Amber theme (Retail, Shopping)
  retail: {
    brandGradient: 'from-yellow-400 to-amber-600',
    accentGradient: 'from-yellow-50/90 to-amber-50/90',
    backgroundGradient: 'from-yellow-50 via-amber-50 to-white',
    primaryColor: 'yellow',
    secondaryColor: 'amber'
  },

  // Purple/Pink theme (Creative, Design)
  creative: {
    brandGradient: 'from-purple-400 to-pink-600',
    accentGradient: 'from-purple-50/90 to-pink-50/90',
    backgroundGradient: 'from-purple-50 via-pink-50 to-white',
    primaryColor: 'purple',
    secondaryColor: 'pink'
  },

  // Gray/Slate theme (Default, Corporate)
  default: {
    brandGradient: 'from-gray-600 to-slate-800',
    accentGradient: 'from-gray-50/90 to-slate-50/90',
    backgroundGradient: 'from-gray-50 via-slate-50 to-white',
    primaryColor: 'gray',
    secondaryColor: 'slate'
  }
}

export function getModuleTheme(moduleName: string): ModuleTheme {
  return moduleThemes[moduleName] || moduleThemes.default
}
