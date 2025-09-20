'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
  Scissors,
  Brain,
  Calculator,
  Sparkles,
  MessageSquare,
  Shield,
  Search,
  Clock,
  TrendingUp,
  Users,
  Package,
  Heart,
  Briefcase,
  Palette,
  Code,
  ChevronRight,
  Star,
  IceCream
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MCPChat {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  path: string
  category: 'business' | 'analytics' | 'creative' | 'technical'
  features: string[]
  status: 'production' | 'beta' | 'coming-soon'
  gradient: string
  popular?: boolean
  demo?: boolean
}

const MCP_CHATS: MCPChat[] = [
  {
    id: 'salon-manager',
    title: 'Salon Manager',
    description:
      'AI-powered salon operations with appointment booking, inventory tracking, and revenue analytics',
    icon: Scissors,
    path: '/salon-manager',
    category: 'business',
    features: [
      'Appointment Booking',
      'Inventory Management',
      'Revenue Analytics',
      'Staff Performance'
    ],
    status: 'production',
    gradient: 'from-purple-600 to-pink-400',
    popular: true
  },
  {
    id: 'analytics-chat-v2',
    title: 'Analytics Chat v2',
    description: 'Advanced business intelligence and data analysis with AI-powered insights',
    icon: Brain,
    path: '/analytics-chat-v2',
    category: 'analytics',
    features: ['Data Analysis', 'Pattern Recognition', 'Predictive Insights', 'Custom Reports'],
    status: 'production',
    gradient: 'from-blue-600 to-cyan-400'
  },
  {
    id: 'digital-accountant',
    title: 'Digital Accountant',
    description:
      'Enterprise accounting automation with journal entries, GL posting, and financial reporting',
    icon: Calculator,
    path: '/digital-accountant',
    category: 'business',
    features: ['Auto-Journal', 'GL Management', 'Financial Reports', 'IFRS Compliance'],
    status: 'production',
    gradient: 'from-green-600 to-emerald-400',
    popular: true
  },
  {
    id: 'icecream-manager',
    title: 'Ice Cream Manager',
    description:
      'Complete ice cream factory operations with cold chain monitoring, production planning, and distribution',
    icon: IceCream,
    path: '/icecream-manager',
    category: 'business',
    features: [
      'Cold Chain Monitoring',
      'Production Planning',
      'Inventory Tracking',
      'Distribution Routes'
    ],
    status: 'production',
    gradient: 'from-blue-600 to-cyan-400',
    popular: true,
    demo: true
  },
  {
    id: 'healthcare-assistant',
    title: 'Healthcare Assistant',
    description: 'Patient management, appointment scheduling, and medical record organization',
    icon: Heart,
    path: '/healthcare-assistant',
    category: 'business',
    features: [
      'Patient Records',
      'Appointment Management',
      'Prescription Tracking',
      'Insurance Processing'
    ],
    status: 'coming-soon',
    gradient: 'from-red-600 to-pink-400'
  },
  {
    id: 'retail-manager',
    title: 'Retail Manager',
    description: 'Complete retail operations with POS, inventory, and customer management',
    icon: Package,
    path: '/retail-manager',
    category: 'business',
    features: ['Point of Sale', 'Inventory Control', 'Customer Loyalty', 'Sales Analytics'],
    status: 'coming-soon',
    gradient: 'from-orange-600 to-amber-400'
  },
  {
    id: 'hr-assistant',
    title: 'HR Assistant',
    description: 'Employee management, recruitment, and performance tracking',
    icon: Users,
    path: '/hr-assistant',
    category: 'business',
    features: [
      'Employee Records',
      'Recruitment Pipeline',
      'Performance Reviews',
      'Leave Management'
    ],
    status: 'coming-soon',
    gradient: 'from-indigo-600 to-purple-400'
  },
  {
    id: 'project-planner',
    title: 'Project Planner',
    description:
      'Project management with task tracking, resource allocation, and timeline visualization',
    icon: Briefcase,
    path: '/project-planner',
    category: 'analytics',
    features: ['Task Management', 'Resource Planning', 'Gantt Charts', 'Team Collaboration'],
    status: 'coming-soon',
    gradient: 'from-teal-600 to-cyan-400'
  },
  {
    id: 'creative-studio',
    title: 'Creative Studio',
    description: 'AI-powered creative assistance for design, writing, and content generation',
    icon: Palette,
    path: '/creative-studio',
    category: 'creative',
    features: ['Content Generation', 'Design Suggestions', 'Brand Guidelines', 'Creative Briefs'],
    status: 'coming-soon',
    gradient: 'from-violet-600 to-purple-400'
  },
  {
    id: 'code-assistant',
    title: 'Code Assistant',
    description: 'Smart coding companion with HERA-specific patterns and best practices',
    icon: Code,
    path: '/code-assistant',
    category: 'technical',
    features: ['Code Generation', 'Pattern Recognition', 'Bug Detection', 'HERA Integration'],
    status: 'coming-soon',
    gradient: 'from-slate-600 to-gray-400'
  }
]

const CATEGORIES = [
  { id: 'all', label: 'All Assistants', icon: Sparkles },
  { id: 'business', label: 'Business', icon: Briefcase },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'creative', label: 'Creative', icon: Palette },
  { id: 'technical', label: 'Technical', icon: Code }
]

export default function MCPHubPage() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [recentChats, setRecentChats] = useState<string[]>([])

  // Load recent chats from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recent-mcp-chats')
    if (stored) {
      setRecentChats(JSON.parse(stored))
    }
  }, [])

  // Filter chats based on category and search
  const filteredChats = MCP_CHATS.filter(chat => {
    const matchesCategory = selectedCategory === 'all' || chat.category === selectedCategory
    const matchesSearch =
      searchQuery === '' ||
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.features.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesCategory && matchesSearch
  })

  const handleChatClick = (chat: MCPChat) => {
    if (chat.status === 'coming-soon') return

    // Update recent chats
    const newRecent = [chat.id, ...recentChats.filter(id => id !== chat.id)].slice(0, 3)
    setRecentChats(newRecent)
    localStorage.setItem('recent-mcp-chats', JSON.stringify(newRecent))

    router.push(chat.path)
  }

  const recentChatObjects = recentChats
    .map(id => MCP_CHATS.find(chat => chat.id === id))
    .filter(Boolean) as MCPChat[]

  return (
    <div
      className={cn('min-h-screen bg-gray-900', isDarkMode && 'dark')}
      style={{ backgroundColor: isDarkMode ? '#0a0a0a' : '#fafafa' }}
    >
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative container mx-auto px-6 py-12 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-400 flex items-center justify-center shadow-xl">
                <MessageSquare className="h-8 w-8 text-foreground" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              HERA AI Assistants
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose your AI-powered assistant for specialized business operations, analytics, and
              creative tasks
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search assistants by name, feature, or category..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
          </div>

          {/* Recent Chats */}
          {recentChatObjects.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                Recently Used
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentChatObjects.map(chat => (
                  <Card
                    key={chat.id}
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2"
                    onClick={() => handleChatClick(chat)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center',
                            chat.gradient
                          )}
                        >
                          <chat.icon className="h-5 w-5 text-foreground" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{chat.title}</h4>
                          <p className="text-xs text-muted-foreground">{chat.features[0]}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
            <TabsList className="grid grid-cols-5 w-full max-w-2xl mx-auto">
              {CATEGORIES.map(category => (
                <TabsTrigger key={category.id} value={category.id} className="gap-2">
                  <category.icon className="h-4 w-4" />
                  <span className="hidden md:inline">{category.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Assistant Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredChats.map(chat => (
              <Card
                key={chat.id}
                className={cn(
                  'relative overflow-hidden transition-all duration-300',
                  chat.status === 'production'
                    ? 'cursor-pointer hover:shadow-xl hover:scale-105 border-2'
                    : 'opacity-75'
                )}
                onClick={() => handleChatClick(chat)}
              >
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  {chat.popular && (
                    <Badge variant="secondary" className="gap-1">
                      <Star className="h-3 w-3" />
                      Popular
                    </Badge>
                  )}
                  {chat.demo && (
                    <Badge variant="outline" className="gap-1 border-blue-500 text-primary">
                      <Sparkles className="h-3 w-3" />
                      Demo
                    </Badge>
                  )}
                </div>

                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        'w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg',
                        chat.gradient
                      )}
                    >
                      <chat.icon className="h-7 w-7 text-foreground" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1">{chat.title}</CardTitle>
                      <Badge
                        variant={
                          chat.status === 'production'
                            ? 'default'
                            : chat.status === 'beta'
                              ? 'secondary'
                              : 'outline'
                        }
                        className="text-xs"
                      >
                        {chat.status === 'coming-soon' ? 'Coming Soon' : chat.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <CardDescription className="mb-4 line-clamp-2">
                    {chat.description}
                  </CardDescription>

                  {chat.demo && (
                    <div className="mb-3 text-xs text-primary flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      <span>Try our demo with real ice cream factory data</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-2">
                        Key Features
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {chat.features.slice(0, 3).map((feature, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {chat.features.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{chat.features.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {chat.status === 'production' && (
                      <Button className="w-full group" variant="outline">
                        <span>Open Assistant</span>
                        <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    )}
                  </div>
                </CardContent>

                {/* Gradient Border Effect on Hover */}
                <div
                  className={cn(
                    'absolute inset-0 opacity-0 hover:opacity-10 transition-opacity duration-300 pointer-events-none',
                    `bg-gradient-to-br ${chat.gradient}`
                  )}
                />
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {filteredChats.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Search className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-medium mb-2">No assistants found</h3>
              <p className="text-muted-foreground">Try adjusting your search or category filter</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-16 pb-8">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Powered by HERA Universal Architecture</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              All assistants use secure, multi-tenant data isolation
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
