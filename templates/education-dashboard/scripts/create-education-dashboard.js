#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Command line arguments parsing
const args = process.argv.slice(2)
const config = {
  name: 'My Education Platform',
  domain: 'general',
  subject: 'General Studies',
  examDate: null,
  brandingColor: '#3b82f6',
  aiProvider: 'auto'
}

// Parse command line arguments
args.forEach((arg, index) => {
  if (arg.startsWith('--name=')) {
    config.name = arg.split('=')[1].replace(/"/g, '')
  } else if (arg.startsWith('--domain=')) {
    config.domain = arg.split('=')[1]
  } else if (arg.startsWith('--subject=')) {
    config.subject = arg.split('=')[1].replace(/"/g, '')
  } else if (arg.startsWith('--exam-date=')) {
    config.examDate = arg.split('=')[1]
  } else if (arg.startsWith('--branding-color=')) {
    config.brandingColor = arg.split('=')[1]
  } else if (arg.startsWith('--ai-provider=')) {
    config.aiProvider = arg.split('=')[1]
  }
})

// Domain-specific configurations
const domainConfigs = {
  accounting: {
    primaryColor: '#3b82f6',
    secondaryColor: '#6366f1',
    topics: [
      { id: 'financial-accounting', name: 'Financial Accounting', difficulty: 'medium' },
      { id: 'taxation', name: 'Taxation', difficulty: 'hard' },
      { id: 'auditing', name: 'Auditing', difficulty: 'hard' },
      { id: 'corporate-law', name: 'Corporate Law', difficulty: 'medium' }
    ],
    smartCodes: ['HERA.CA.EDU.TOPIC', 'HERA.ACCOUNTING.EDU']
  },
  medical: {
    primaryColor: '#dc2626',
    secondaryColor: '#ef4444',
    topics: [
      { id: 'anatomy', name: 'Anatomy', difficulty: 'hard' },
      { id: 'physiology', name: 'Physiology', difficulty: 'medium' },
      { id: 'pathology', name: 'Pathology', difficulty: 'hard' },
      { id: 'pharmacology', name: 'Pharmacology', difficulty: 'medium' }
    ],
    smartCodes: ['HERA.MED.EDU.TOPIC', 'HERA.MEDICAL.EDU']
  },
  legal: {
    primaryColor: '#7c3aed',
    secondaryColor: '#8b5cf6',
    topics: [
      { id: 'constitutional-law', name: 'Constitutional Law', difficulty: 'hard' },
      { id: 'contract-law', name: 'Contract Law', difficulty: 'medium' },
      { id: 'tort-law', name: 'Tort Law', difficulty: 'medium' },
      { id: 'criminal-law', name: 'Criminal Law', difficulty: 'hard' }
    ],
    smartCodes: ['HERA.LAW.EDU.TOPIC', 'HERA.LEGAL.EDU']
  },
  engineering: {
    primaryColor: '#059669',
    secondaryColor: '#10b981',
    topics: [
      { id: 'mathematics', name: 'Engineering Mathematics', difficulty: 'hard' },
      { id: 'mechanics', name: 'Mechanics', difficulty: 'medium' },
      { id: 'materials', name: 'Materials Science', difficulty: 'medium' },
      { id: 'design', name: 'Engineering Design', difficulty: 'hard' }
    ],
    smartCodes: ['HERA.ENG.EDU.TOPIC', 'HERA.ENGINEERING.EDU']
  }
}

const domainConfig = domainConfigs[config.domain] || domainConfigs.general || {
  primaryColor: config.brandingColor,
  secondaryColor: '#6366f1',
  topics: [
    { id: 'general-studies', name: 'General Studies', difficulty: 'medium' }
  ],
  smartCodes: ['HERA.GENERAL.EDU.TOPIC']
}

console.log(`🎓 Creating HERA Education Dashboard: ${config.name}`)
console.log(`📚 Domain: ${config.domain} | Subject: ${config.subject}`)

// Generate project directory name
const projectName = config.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
const projectDir = path.join(process.cwd(), projectName)

// Create project directory
if (!fs.existsSync(projectDir)) {
  fs.mkdirSync(projectDir, { recursive: true })
  console.log(`📁 Created project directory: ${projectName}`)
} else {
  console.log(`⚠️  Directory ${projectName} already exists. Contents will be updated.`)
}

// Copy template files
const templateDir = path.join(__dirname, '..', 'templates')

// Create directory structure
const directories = [
  'src/app',
  'src/components/education',
  'src/lib/ai',
  'src/lib/education',
  'public/icons',
  'config'
]

directories.forEach(dir => {
  const fullPath = path.join(projectDir, dir)
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true })
  }
})

// Generate package.json
const packageJson = {
  "name": projectName,
  "version": "1.0.0",
  "description": `${config.name} - AI-powered learning platform built with HERA`,
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15.4.2",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-progress": "^1.0.3",
    "lucide-react": "^0.263.1",
    "tailwindcss": "^4.1.11",
    "typescript": "^5.8.3",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18"
  }
}

fs.writeFileSync(
  path.join(projectDir, 'package.json'),
  JSON.stringify(packageJson, null, 2)
)

// Generate education.config.js
const educationConfig = `// ${config.name} Configuration
export default {
  // Basic Configuration
  name: '${config.name}',
  domain: '${config.domain}',
  subject: '${config.subject}',
  examDate: ${config.examDate ? `'${config.examDate}'` : 'null'},
  
  // AI Configuration
  aiProvider: '${config.aiProvider}',
  difficulty: 'adaptive',
  
  // Gamification
  pointsSystem: true,
  achievements: true,
  leaderboards: true,
  
  // Learning Modes
  modes: ['concept', 'story', 'drill', 'mock'],
  
  // Branding
  primaryColor: '${domainConfig.primaryColor}',
  secondaryColor: '${domainConfig.secondaryColor}',
  logo: '/logo.png',
  
  // Smart Codes
  smartCodes: ${JSON.stringify(domainConfig.smartCodes, null, 2)},
  
  // Topics Configuration
  topics: ${JSON.stringify(domainConfig.topics, null, 2)}
}
`

fs.writeFileSync(
  path.join(projectDir, 'config', 'education.config.js'),
  educationConfig
)

// Generate Next.js configuration
const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  env: {
    EDUCATION_PLATFORM_NAME: '${config.name}',
    EDUCATION_DOMAIN: '${config.domain}',
  }
}

module.exports = nextConfig
`

fs.writeFileSync(
  path.join(projectDir, 'next.config.js'),
  nextConfig
)

// Generate Tailwind configuration
const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '${domainConfig.primaryColor}',
        secondary: '${domainConfig.secondaryColor}',
        'education-bg': '#f8fafc',
        'education-text': '#1e293b',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
`

fs.writeFileSync(
  path.join(projectDir, 'tailwind.config.js'),
  tailwindConfig
)

// Generate TypeScript configuration
const tsConfig = `{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
`

fs.writeFileSync(
  path.join(projectDir, 'tsconfig.json'),
  tsConfig
)

// Generate main page
const mainPage = `'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  BookOpen, 
  Brain, 
  Trophy, 
  BarChart3, 
  Gamepad2,
  Clock,
  Target,
  Zap
} from 'lucide-react'
import educationConfig from '../../config/education.config'

export default function EducationDashboard() {
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResponse, setAiResponse] = useState('')
  const [studentProgress, setStudentProgress] = useState({
    totalProgress: 65,
    streakDays: 12,
    pointsEarned: 2450,
    rank: 8
  })

  // AI Integration
  const callAI = async (action: string, prompt: string) => {
    setAiLoading(true)
    try {
      const response = await fetch('/api/v1/ai/universal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'custom_request',
          smart_code: educationConfig.smartCodes[0] + '.AI.TUTOR.v1',
          task_type: 'learning',
          prompt: \`\${action}: \${prompt} in \${educationConfig.subject}\`,
          fallback_enabled: true
        })
      })
      
      const result = await response.json()
      if (result.success) {
        setAiResponse(result.data.content)
      } else {
        setAiResponse('AI tutor is currently unavailable. Please try again later.')
      }
    } catch (error) {
      setAiResponse('Failed to connect to AI tutor. Check your internet connection.')
    }
    setAiLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-education-bg to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-education-text mb-2">
            {educationConfig.name}
          </h1>
          <p className="text-lg text-gray-600">
            AI-powered learning for {educationConfig.subject}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Progress</p>
                <p className="text-2xl font-bold text-primary">{studentProgress.totalProgress}%</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Streak</p>
                <p className="text-2xl font-bold text-orange-500">{studentProgress.streakDays} days</p>
              </div>
              <Zap className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Points</p>
                <p className="text-2xl font-bold text-green-500">{studentProgress.pointsEarned.toLocaleString()}</p>
              </div>
              <Trophy className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rank</p>
                <p className="text-2xl font-bold text-purple-500">#{studentProgress.rank}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="study">Study</TabsTrigger>
            <TabsTrigger value="practice">Practice</TabsTrigger>
            <TabsTrigger value="compete">Compete</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI Tutor */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">AI Tutor</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => callAI('Explain', 'core concepts')}
                      disabled={aiLoading}
                      className="p-3 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                    >
                      Explain Concepts
                    </button>
                    <button
                      onClick={() => callAI('Generate', 'practice questions')}
                      disabled={aiLoading}
                      className="p-3 text-sm bg-secondary text-white rounded-lg hover:bg-secondary/90 disabled:opacity-50"
                    >
                      Practice Questions
                    </button>
                  </div>
                  
                  {aiLoading && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                      AI is thinking...
                    </div>
                  )}
                  
                  {aiResponse && (
                    <div className="p-4 bg-gray-50 rounded-lg text-sm">
                      <p className="whitespace-pre-wrap">{aiResponse}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Topics */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Recent Topics</h3>
                <div className="space-y-3">
                  {educationConfig.topics.slice(0, 4).map((topic) => (
                    <div key={topic.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{topic.name}</p>
                        <p className="text-sm text-gray-600 capitalize">{topic.difficulty} level</p>
                      </div>
                      <div className="text-right">
                        <Progress value={Math.random() * 100} className="w-20 mb-1" />
                        <p className="text-xs text-gray-500">{Math.floor(Math.random() * 100)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Study Tab */}
          <TabsContent value="study" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {educationConfig.topics.map((topic) => (
                <div key={topic.id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">{topic.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 capitalize">Difficulty: {topic.difficulty}</p>
                  <div className="space-y-2">
                    <button 
                      onClick={() => callAI('Explain', topic.name)}
                      className="w-full p-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90"
                    >
                      Study Now
                    </button>
                    <Progress value={Math.random() * 100} className="w-full" />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Practice Tab */}
          <TabsContent value="practice" className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center gap-2 mb-4">
                <Gamepad2 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Practice Modes</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {educationConfig.modes.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => callAI('Generate', \`\${mode} mode questions\`)}
                    className="p-4 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <h4 className="font-medium capitalize">{mode} Mode</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {mode === 'concept' && 'Learn fundamental concepts'}
                      {mode === 'story' && 'Learn through stories'}
                      {mode === 'drill' && 'Practice with repetition'}
                      {mode === 'mock' && 'Take practice exams'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Compete Tab */}
          <TabsContent value="compete" className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Leaderboard</h3>
              </div>
              
              <div className="space-y-3">
                {[
                  { rank: 1, name: 'You', score: studentProgress.pointsEarned, isUser: true },
                  { rank: 2, name: 'Sarah M.', score: 2380 },
                  { rank: 3, name: 'John D.', score: 2245 },
                  { rank: 4, name: 'Emma R.', score: 2156 },
                  { rank: 5, name: 'Mike K.', score: 2089 }
                ].map((player) => (
                  <div
                    key={player.rank}
                    className={\`flex items-center justify-between p-3 rounded-lg \${
                      player.isUser ? 'bg-primary/10 border border-primary/20' : 'bg-gray-50'
                    }\`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg">#{player.rank}</span>
                      <span className={\`font-medium \${player.isUser ? 'text-primary' : ''}\`}>
                        {player.name}
                      </span>
                    </div>
                    <span className="font-semibold">{player.score.toLocaleString()} pts</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Learning Progress</h3>
                <div className="space-y-4">
                  {educationConfig.topics.map((topic) => {
                    const progress = Math.floor(Math.random() * 100)
                    return (
                      <div key={topic.id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{topic.name}</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="w-full" />
                      </div>
                    )
                  })}
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Achievements</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                    <Trophy className="h-6 w-6 text-yellow-500" />
                    <div>
                      <p className="font-medium">7-Day Streak</p>
                      <p className="text-sm text-gray-600">Keep up the momentum!</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Target className="h-6 w-6 text-blue-500" />
                    <div>
                      <p className="font-medium">First Topic Complete</p>
                      <p className="text-sm text-gray-600">Great start to your journey</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
`

fs.writeFileSync(
  path.join(projectDir, 'src', 'app', 'page.tsx'),
  mainPage
)

// Generate UI components (basic ones needed)
const tabsComponent = `"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
`

const progressComponent = `"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: \`translateX(-\${100 - (value || 0)}%)\` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
`

const utilsFile = `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`

// Create components directory structure
fs.mkdirSync(path.join(projectDir, 'src', 'components', 'ui'), { recursive: true })

fs.writeFileSync(
  path.join(projectDir, 'src', 'components', 'ui', 'tabs.tsx'),
  tabsComponent
)

fs.writeFileSync(
  path.join(projectDir, 'src', 'components', 'ui', 'progress.tsx'),
  progressComponent
)

fs.mkdirSync(path.join(projectDir, 'src', 'lib'), { recursive: true })
fs.writeFileSync(
  path.join(projectDir, 'src', 'lib', 'utils.ts'),
  utilsFile
)

// Generate layout file
const layoutFile = `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import educationConfig from '../../config/education.config'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: educationConfig.name,
  description: \`AI-powered learning platform for \${educationConfig.subject}\`,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
`

fs.writeFileSync(
  path.join(projectDir, 'src', 'app', 'layout.tsx'),
  layoutFile
)

// Generate globals.css
const globalsCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 94.1%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* Education Platform Specific Styles */
.education-dashboard {
  font-family: 'Inter', system-ui, sans-serif;
}

/* Animations for learning elements */
@keyframes pulse-learning {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.learning-pulse {
  animation: pulse-learning 2s ease-in-out infinite;
}

/* Custom scrollbar for better UX */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
`

fs.writeFileSync(
  path.join(projectDir, 'src', 'app', 'globals.css'),
  globalsCss
)

// Generate README for the created project
const projectReadme = `# ${config.name}

AI-powered learning platform built with HERA Universal Education Dashboard.

## Quick Start

\`\`\`bash
npm install
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view your education platform.

## Features

- 🤖 **AI-Powered Learning**: Intelligent tutoring with multi-provider AI
- 🎮 **Gamification**: Points, badges, streaks, and leaderboards
- 📊 **Progress Tracking**: Detailed analytics and performance insights
- 📱 **Mobile-First**: Responsive design for all devices
- 🏗️ **HERA Universal**: Built on revolutionary 6-table architecture

## Configuration

Edit \`config/education.config.js\` to customize:
- Learning topics and difficulty levels
- AI provider preferences
- Branding colors and themes
- Smart Codes for HERA integration

## Domain: ${config.domain}
Subject: ${config.subject}
${config.examDate ? `Exam Date: ${config.examDate}` : ''}

## AI Integration

This platform integrates with HERA's Universal AI system for:
- Concept explanations
- Question generation
- Performance analysis
- Adaptive learning paths

## Deployment

Deploy to Vercel, Railway, or any Next.js hosting platform:

\`\`\`bash
npm run build
npm start
\`\`\`

## Support

- Documentation: https://docs.hera.dev/education
- Community: https://community.hera.dev
- Issues: https://github.com/heraerp/heraprd/issues

---

*Built with ❤️ using HERA Universal Systems*
`

fs.writeFileSync(
  path.join(projectDir, 'README.md'),
  projectReadme
)

// Generate environment template
const envTemplate = `# ${config.name} Environment Configuration

# HERA API Configuration (Required)
NEXT_PUBLIC_HERA_API_URL=https://your-hera-instance.com
HERA_API_KEY=your-hera-api-key

# AI Providers (Configure at least one)
OPENAI_API_KEY=sk-your-openai-key
CLAUDE_API_KEY=your-claude-key
GEMINI_API_KEY=your-gemini-key

# Education Platform Settings
NEXT_PUBLIC_EDUCATION_DOMAIN=${config.domain}
NEXT_PUBLIC_EDUCATION_SUBJECT="${config.subject}"
NEXT_PUBLIC_PLATFORM_NAME="${config.name}"

# Optional: Database (for production)
DATABASE_URL=your-database-url

# Optional: Analytics
NEXT_PUBLIC_GA_ID=your-google-analytics-id
`

fs.writeFileSync(
  path.join(projectDir, '.env.local.example'),
  envTemplate
)

console.log(`✅ Project created successfully!`)
console.log(`\nNext steps:`)
console.log(`1. cd ${projectName}`)
console.log(`2. cp .env.local.example .env.local`)
console.log(`3. Configure your API keys in .env.local`)
console.log(`4. npm install`)
console.log(`5. npm run dev`)
console.log(`\n🚀 Your AI-powered education platform will be running at http://localhost:3000`)
console.log(`\n📚 Customize your platform by editing config/education.config.js`)
console.log(`🤖 AI features require HERA Universal AI system setup`)
console.log(`📖 Full documentation: https://docs.hera.dev/education`)