'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import {
  Grid3X3,
  Brain,
  Plug,
  Database,
  Shield,
  Settings,
  FileText,
  BarChart3,
  Workflow,
  Palette,
  Code,
  Sparkles,
  ArrowRight,
  ExternalLink,
  TrendingUp,
  Zap,
  Cloud,
  Lock,
  Globe,
  Users,
  Mail
} from 'lucide-react'

interface AppItem {
  id: string
  title: string
  description: string
  href: string
  icon: React.ElementType
  category: 'productivity' | 'integrations' | 'developer' | 'analytics' | 'security'
  status?: 'new' | 'beta' | 'coming-soon'
  external?: boolean
}

const apps: AppItem[] = [
  {
    id: 'ai-manager',
    title: 'AI Manager',
    description: 'Fast answers and proactive insights across all your data',
    href: '/civicflow/ai-manager',
    icon: Brain,
    category: 'productivity',
    status: 'beta'
  },
  {
    id: 'integrations',
    title: 'Integrations Hub',
    description: 'Connect with external services and APIs',
    href: '/civicflow/integrations',
    icon: Plug,
    category: 'integrations'
  },
  {
    id: 'comm-integrations',
    title: 'Communication APIs',
    description: 'Email, SMS, and webhook integrations',
    href: '/civicflow/communications/integrations',
    icon: Mail,
    category: 'integrations'
  },
  {
    id: 'workflow-builder',
    title: 'Workflow Builder',
    description: 'Create custom automation workflows',
    href: '/civicflow/workflows',
    icon: Workflow,
    category: 'productivity',
    status: 'coming-soon'
  },
  {
    id: 'api-explorer',
    title: 'API Explorer',
    description: 'Test and explore CivicFlow APIs',
    href: '/civicflow/api-explorer',
    icon: Code,
    category: 'developer',
    status: 'coming-soon'
  },
  {
    id: 'data-studio',
    title: 'Data Studio',
    description: 'Advanced data manipulation and queries',
    href: '/civicflow/seed-test',
    icon: Database,
    category: 'developer'
  },
  {
    id: 'insights-engine',
    title: 'Insights Engine',
    description: 'AI-powered analytics and recommendations',
    href: '/civicflow/insights',
    icon: Sparkles,
    category: 'analytics',
    status: 'new'
  },
  {
    id: 'audit-logs',
    title: 'Audit Logs',
    description: 'Track all system activities and changes',
    href: '/civicflow/audit',
    icon: Shield,
    category: 'security'
  },
  {
    id: 'theme-studio',
    title: 'Theme Studio',
    description: 'Customize your CivicFlow appearance',
    href: '/civicflow/theme',
    icon: Palette,
    category: 'developer',
    status: 'coming-soon'
  },
  {
    id: 'cloud-sync',
    title: 'Cloud Sync',
    description: 'Sync data across multiple instances',
    href: '/civicflow/cloud-sync',
    icon: Cloud,
    category: 'integrations',
    status: 'coming-soon'
  },
  {
    id: 'advanced-security',
    title: 'Advanced Security',
    description: '2FA, SSO, and enterprise security features',
    href: '/civicflow/security/advanced',
    icon: Lock,
    category: 'security',
    status: 'beta'
  },
  {
    id: 'global-search',
    title: 'Global Search',
    description: 'Search across all your CivicFlow data',
    href: '/civicflow/search',
    icon: Globe,
    category: 'productivity',
    status: 'new'
  }
]

const categories = {
  productivity: {
    label: 'Productivity',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20'
  },
  integrations: {
    label: 'Integrations',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20'
  },
  developer: {
    label: 'Developer Tools',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20'
  },
  analytics: {
    label: 'Analytics',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20'
  },
  security: {
    label: 'Security',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20'
  }
}

interface MoreAppsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MoreAppsModal({ open, onOpenChange }: MoreAppsModalProps) {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [hoveredApp, setHoveredApp] = useState<string | null>(null)

  const filteredApps =
    selectedCategory === 'all' ? apps : apps.filter(app => app.category === selectedCategory)

  const handleAppClick = (app: AppItem) => {
    if (app.status === 'coming-soon') {
      return
    }
    onOpenChange(false)
    if (app.external) {
      window.open(app.href, '_blank')
    } else {
      router.push(app.href)
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">New</Badge>
      case 'beta':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Beta</Badge>
      case 'coming-soon':
        return (
          <Badge className="bg-gray-500/20 ink-muted border-gray-500/30">Coming Soon</Badge>
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-transparent border-0 shadow-2xl">
        {/* Glassmorphism container */}
        <div className="bg-white/10 dark:bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden">
          <DialogHeader className="p-6 pb-4 bg-gradient-to-b from-white/5 to-transparent">
            <DialogTitle className="text-2xl font-bold text-text-100 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[rgb(0,166,166)]/20 backdrop-blur-sm">
                <Grid3X3 className="h-6 w-6 text-[rgb(0,166,166)]" />
              </div>
              Discover More Apps
            </DialogTitle>
            <DialogDescription className="text-text-200 mt-2">
              Explore additional tools and features to enhance your CivicFlow experience
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 pt-0">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCategory('all')}
                className={cn(
                  'rounded-full px-4 transition-all',
                  selectedCategory === 'all'
                    ? 'bg-[rgb(0,166,166)]/20 text-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/30'
                    : 'bg-white/5 hover:bg-white/10 text-text-200'
                )}
              >
                All Apps
              </Button>
              {Object.entries(categories).map(([key, category]) => (
                <Button
                  key={key}
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategory(key)}
                  className={cn(
                    'rounded-full px-4 transition-all',
                    selectedCategory === key
                      ? `${category.bgColor} ${category.color} hover:opacity-80`
                      : 'bg-white/5 hover:bg-white/10 text-text-200'
                  )}
                >
                  {category.label}
                </Button>
              ))}
            </div>

            {/* Apps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {filteredApps.map(app => {
                const category = categories[app.category]
                const isHovered = hoveredApp === app.id
                const isDisabled = app.status === 'coming-soon'

                return (
                  <div
                    key={app.id}
                    className={cn(
                      'group relative rounded-xl border transition-all duration-300 cursor-pointer',
                      isDisabled && 'opacity-50 cursor-not-allowed',
                      isHovered && !isDisabled && 'scale-[1.02] shadow-xl',
                      'bg-white/5 hover:bg-white/10 backdrop-blur-sm',
                      'border-white/10 hover:border-white/20'
                    )}
                    onClick={() => !isDisabled && handleAppClick(app)}
                    onMouseEnter={() => setHoveredApp(app.id)}
                    onMouseLeave={() => setHoveredApp(null)}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className={cn(
                            'p-2.5 rounded-xl transition-colors',
                            category.bgColor,
                            isHovered && !isDisabled && 'scale-110'
                          )}
                        >
                          <app.icon className={cn('h-6 w-6', category.color)} />
                        </div>
                        {app.status && getStatusBadge(app.status)}
                      </div>

                      <h3 className="font-semibold text-text-100 mb-1 flex items-center gap-2">
                        {app.title}
                        {app.external && <ExternalLink className="h-3 w-3 text-text-300" />}
                      </h3>
                      <p className="text-sm text-text-300 line-clamp-2">{app.description}</p>

                      {!isDisabled && (
                        <div
                          className={cn(
                            'mt-3 flex items-center gap-1 text-xs font-medium transition-all',
                            category.color,
                            isHovered ? 'opacity-100 translate-x-1' : 'opacity-0'
                          )}
                        >
                          Open App
                          <ArrowRight className="h-3 w-3" />
                        </div>
                      )}
                    </div>

                    {/* Hover effect overlay */}
                    {isHovered && !isDisabled && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
              <p className="text-sm text-text-300">Can't find what you're looking for?</p>
              <Button
                variant="ghost"
                size="sm"
                className="text-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/10"
                onClick={() => {
                  onOpenChange(false)
                  router.push('/civicflow/help')
                }}
              >
                <Zap className="h-4 w-4 mr-2" />
                Request a Feature
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* Custom scrollbar styles */
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`

// Add styles to the document
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = scrollbarStyles
  document.head.appendChild(style)
}
