/**
 * HERA DNA High Contrast UI Generator
 * Implements learnings from Ice Cream Manufacturing UI
 * Ensures all generated UIs have proper contrast and visibility
 */

import { cn } from '@/src/lib/utils'

export interface ColorScheme {
  backgrounds: {
    primary: string
    card: string
    cardNested: string
    sidebar: string
    header: string
  }
  text: {
    primary: string
    primaryNumbers: string
    secondary: string
    tertiary: string
    zeroValues: string
    sidebarPrimary: string
    sidebarSecondary: string
    sidebarInactive: string
  }
  borders: {
    primary: string
    sidebar: string
    subtle: string
  }
  accents: {
    primaryGradient: string
    secondaryGradient: string
    successGradient: string
    warningGradient: string
  }
}

// High Contrast Color Scheme based on Ice Cream UI learnings
export const HERA_HIGH_CONTRAST_SCHEME: ColorScheme = {
  backgrounds: {
    primary: 'bg-gray-50 dark:bg-gray-900',
    card: 'bg-white dark:bg-gray-800',
    cardNested: 'bg-gray-50 dark:bg-gray-900',
    sidebar: 'bg-gradient-to-b from-gray-900 to-gray-950',
    header: 'bg-white dark:bg-gray-900'
  },
  text: {
    primary: 'text-gray-900 dark:text-white',
    primaryNumbers: 'text-black dark:text-white',
    secondary: 'text-gray-700 dark:text-gray-300',
    tertiary: 'text-gray-600 dark:text-gray-400',
    zeroValues: 'text-gray-500 dark:text-gray-300',
    sidebarPrimary: 'text-gray-100',
    sidebarSecondary: 'text-gray-300',
    sidebarInactive: 'text-gray-300 hover:text-gray-100'
  },
  borders: {
    primary: 'border-gray-200 dark:border-gray-700',
    sidebar: 'border-gray-800',
    subtle: 'border-gray-100 dark:border-gray-800'
  },
  accents: {
    primaryGradient: 'from-pink-500 to-purple-600',
    secondaryGradient: 'from-cyan-500 to-blue-600',
    successGradient: 'from-green-500 to-emerald-600',
    warningGradient: 'from-yellow-500 to-orange-600'
  }
}

/**
 * Generate a high contrast stats card component
 */
export function generateStatsCard(config: {
  title: string
  valueKey: string
  icon: string
  gradient?: string
  changeLogic?: (value: number) => string
}) {
  const gradient = config.gradient || HERA_HIGH_CONTRAST_SCHEME.accents.primaryGradient

  return `
<Card className="${HERA_HIGH_CONTRAST_SCHEME.backgrounds.card} border ${HERA_HIGH_CONTRAST_SCHEME.borders.primary} shadow-sm hover:shadow-md transition-shadow">
  <CardHeader className="pb-2">
    <div className="flex items-center justify-between">
      <CardTitle className="text-sm font-medium ${HERA_HIGH_CONTRAST_SCHEME.text.secondary}">
        {${JSON.stringify(config.title)}}
      </CardTitle>
      <div className={cn(
        "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-sm",
        "${gradient}"
      )}>
        <${config.icon} className="w-5 h-5 text-white" />
      </div>
    </div>
  </CardHeader>
  <CardContent className="pt-0">
    {loading ? (
      <div className="space-y-2">
        <div className="h-8 w-20 bg-gray-700 rounded animate-pulse" />
        <div className="h-3 w-24 bg-gray-700 rounded animate-pulse" />
      </div>
    ) : (
      <div>
        <div className="text-4xl font-black tracking-tight">
          <span className={${config.valueKey} === 0 ? "${HERA_HIGH_CONTRAST_SCHEME.text.zeroValues}" : "${HERA_HIGH_CONTRAST_SCHEME.text.primaryNumbers}"}>
            {${config.valueKey}}
          </span>
        </div>
        <p className="text-xs font-medium ${HERA_HIGH_CONTRAST_SCHEME.text.tertiary} mt-1">
          {${config.changeLogic ? `(${config.changeLogic.toString()})(${config.valueKey})` : `${config.valueKey} > 0 ? "Active" : "None"`}}
        </p>
      </div>
    )}
  </CardContent>
</Card>`
}

/**
 * Generate a high contrast sidebar navigation
 */
export function generateSidebar(config: {
  appName: string
  appSubtitle: string
  navItems: Array<{ name: string; href: string; icon: string }>
  logoIcon?: string
}) {
  return `
<div className={cn(
  "fixed inset-y-0 left-0 z-50 w-72 ${HERA_HIGH_CONTRAST_SCHEME.backgrounds.sidebar} border-r ${HERA_HIGH_CONTRAST_SCHEME.borders.sidebar} transform transition-transform duration-300 ease-in-out lg:translate-x-0",
  sidebarOpen ? "translate-x-0" : "-translate-x-full"
)}>
  {/* Logo */}
  <div className="flex items-center justify-between h-16 px-6 border-b ${HERA_HIGH_CONTRAST_SCHEME.borders.sidebar}">
    <div className="flex items-center space-x-3">
      ${
        config.logoIcon
          ? `
      <div className="relative">
        <div className="w-10 h-10 bg-gradient-to-br ${HERA_HIGH_CONTRAST_SCHEME.accents.primaryGradient} rounded-full flex items-center justify-center shadow-lg">
          <${config.logoIcon} className="w-6 h-6 text-white" />
        </div>
      </div>`
          : ''
      }
      <div>
        <h2 className="text-lg font-bold ${HERA_HIGH_CONTRAST_SCHEME.text.sidebarPrimary}">
          ${config.appName}
        </h2>
        <p className="text-xs ${HERA_HIGH_CONTRAST_SCHEME.text.tertiary}">${config.appSubtitle}</p>
      </div>
    </div>
  </div>

  {/* Navigation */}
  <nav className="mt-6 px-4">
    <div className="space-y-1">
      {${JSON.stringify(config.navItems)}.map((item) => {
        const isActive = pathname === item.href || 
                       (item.href !== '${config.navItems[0]?.href || '/'}' && pathname.startsWith(item.href))
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
              isActive 
                ? "bg-gradient-to-r ${HERA_HIGH_CONTRAST_SCHEME.accents.primaryGradient} text-white shadow-lg" 
                : "${HERA_HIGH_CONTRAST_SCHEME.text.sidebarInactive} hover:bg-gray-800"
            )}
          >
            <div className={cn(
              "mr-3 p-1.5 rounded-md transition-all duration-200",
              isActive 
                ? "bg-white/20" 
                : "bg-gray-800 group-hover:bg-gray-700"
            )}>
              <item.icon className={cn(
                "h-4 w-4 transition-all duration-200",
                isActive 
                  ? "text-white" 
                  : "text-gray-400 group-hover:text-gray-200"
              )} />
            </div>
            {item.name}
          </Link>
        )
      })}
    </div>
  </nav>
</div>`
}

/**
 * Generate a complete dashboard with high contrast
 */
export function generateDashboard(config: {
  title: string
  subtitle: string
  stats: Array<{
    title: string
    valueKey: string
    icon: string
    gradient?: string
  }>
}) {
  return `
export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    ${config.stats.map(stat => `${stat.valueKey}: 0`).join(',\n    ')}
  })

  return (
    <div className="${HERA_HIGH_CONTRAST_SCHEME.backgrounds.primary} min-h-screen">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold ${HERA_HIGH_CONTRAST_SCHEME.text.primary}">
            ${config.title}
          </h1>
          <p className="${HERA_HIGH_CONTRAST_SCHEME.text.tertiary} mt-2">
            ${config.subtitle}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          ${config.stats.map(stat => generateStatsCard(stat)).join('\n          ')}
        </div>
      </div>
    </div>
  )
}`
}

/**
 * Key learnings embedded in generator:
 * 1. Always use high contrast colors (white/black on appropriate backgrounds)
 * 2. Special handling for zero values (gray-300 instead of gray-500)
 * 3. Dark sidebar with light text throughout
 * 4. Icon containers for better visibility
 * 5. Larger font sizes for numbers (text-4xl)
 * 6. Proper loading states with appropriate colors
 * 7. Consistent color hierarchy across components
 */

export const HIGH_CONTRAST_GUIDELINES = {
  numbers: {
    regular: 'text-black dark:text-white',
    zero: 'text-gray-500 dark:text-gray-300',
    size: 'text-4xl font-black'
  },
  cards: {
    background: 'bg-white dark:bg-gray-800',
    border: 'border border-gray-200 dark:border-gray-700'
  },
  sidebar: {
    background: 'bg-gradient-to-b from-gray-900 to-gray-950',
    text: 'text-gray-100 to text-gray-300',
    border: 'border-gray-800'
  },
  readability: {
    avoidLowContrast: ['text-gray-500 on dark backgrounds', 'glass morphism with low opacity'],
    ensureHighContrast: ['text-white on dark', 'text-black on light', 'special zero handling']
  }
}
