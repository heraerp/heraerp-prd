// Force dynamic rendering
export const dynamic = 'force-dynamic'

// HERA Universal Learning Platform - Main Page
// Complete Universal Learning System for ANY educational domain

import { Metadata } from 'next'
import { UniversalLearningInterface } from '@/components/universal-learning/UniversalLearningInterface'

export const metadata: Metadata = {
  title: 'HERA Universal Learning Platform',
  description:
    "Process ANY educational content across all domains with AI-powered analysis, adaptive learning paths, and cross-domain intelligence. Built on HERA's universal 6-table architecture.",
  keywords: [
    'universal learning',
    'educational AI',
    'adaptive learning',
    'cross-domain learning',
    'HERA platform',
    'learning management',
    'educational technology',
    'AI-powered education',
    'learning analytics',
    'domain specialization'
  ]
}

export default function UniversalLearningPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />

      {/* Hero Section */}
      <div className="relative pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-6 mb-12">
            <div className="inline-flex items-center space-x-2 bg-background/60 backdrop-blur-sm rounded-full px-4 py-2 border border-blue-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-700">
                Revolutionary Universal Learning Model
              </span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                Universal Learning
              </span>
              <br />
              <span className="text-gray-100">for ANY Domain</span>
            </h1>

            <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Process educational content from <strong>any field</strong> with{' '}
              <strong>95% code reuse</strong>. From CA to Medicine, Law to Engineering - one
              universal platform transforms how we learn.
            </p>

            <div className="flex flex-wrap justify-center gap-3 text-sm">
              {[
                { label: 'Chartered Accountancy', color: 'bg-blue-100 text-blue-700' },
                { label: 'Medical Education', color: 'bg-green-100 text-green-700' },
                { label: 'Legal Studies', color: 'bg-purple-100 text-purple-700' },
                { label: 'Engineering', color: 'bg-orange-100 text-orange-700' },
                { label: 'Language Learning', color: 'bg-pink-100 text-pink-700' },
                { label: 'Any Domain', color: 'bg-muted text-gray-700' }
              ].map((domain, index) => (
                <span key={index} className={`px-3 py-1 rounded-full font-medium ${domain.color}`}>
                  {domain.label}
                </span>
              ))}
            </div>
          </div>

          {/* Key Features */}
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            <div className="bg-background/60 backdrop-blur-sm rounded-2xl p-8 border border-blue-100 hover:border-blue-200 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-2">AI-Powered Analysis</h3>
              <p className="text-muted-foreground">
                Multi-provider AI orchestration with intelligent routing. Automatic fallback ensures
                99.9% uptime across OpenAI, Claude, and Gemini.
              </p>
            </div>

            <div className="bg-background/60 backdrop-blur-sm rounded-2xl p-8 border border-purple-100 hover:border-purple-200 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-2">95% Code Reuse</h3>
              <p className="text-muted-foreground">
                Universal-first architecture with domain specialization. Build once, deploy across
                infinite educational domains with minimal customization.
              </p>
            </div>

            <div className="bg-background/60 backdrop-blur-sm rounded-2xl p-8 border border-green-100 hover:border-green-200 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-2">
                Cross-Domain Intelligence
              </h3>
              <p className="text-muted-foreground">
                Revolutionary learning transfer engine. Insights from medical education enhance CA
                learning, legal reasoning improves engineering problem-solving.
              </p>
            </div>
          </div>

          {/* Architecture Highlight */}
          <div className="bg-background/80 backdrop-blur-sm rounded-3xl p-8 border border-border mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-100 mb-4">Universal Architecture</h2>
              <p className="text-lg text-muted-foreground">
                Built on HERA's revolutionary 6-table universal database architecture
              </p>
            </div>

            <div className="grid lg:grid-cols-6 gap-4 text-center">
              {[
                {
                  name: 'Content Processing',
                  desc: 'Extract universal learning elements',
                  icon: '📚'
                },
                { name: 'AI Analysis', desc: 'Multi-provider intelligent routing', icon: '🧠' },
                { name: 'Entity Creation', desc: 'HERA 6-table architecture', icon: '🏗️' },
                { name: 'Learning Paths', desc: 'Adaptive personalized sequences', icon: '🛤️' },
                {
                  name: 'Domain Specialization',
                  desc: 'Professional context enhancement',
                  icon: '🎯'
                },
                {
                  name: 'Cross-Domain Intelligence',
                  desc: 'Learning transfer optimization',
                  icon: '🔗'
                }
              ].map((step, index) => (
                <div key={index} className="p-4">
                  <div className="text-3xl mb-2">{step.icon}</div>
                  <h4 className="font-semibold text-gray-100 mb-1">{step.name}</h4>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Interface */}
      <UniversalLearningInterface />

      {/* Footer */}
      <footer className="mt-20 border-t bg-background/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">
                HERA Universal Learning Platform
              </h3>
              <p className="text-muted-foreground mb-4">
                Revolutionary AI-powered learning system that processes ANY educational content
                across all domains with 95% code reuse and cross-domain intelligence.
              </p>
              <div className="flex space-x-4 text-sm text-muted-foreground">
                <span>Built with HERA Universal Architecture</span>
                <span>•</span>
                <span>Powered by Multi-Provider AI</span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-100 mb-4">Supported Domains</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Chartered Accountancy (CA)</li>
                <li>Medical Education</li>
                <li>Legal Studies</li>
                <li>Engineering</li>
                <li>Language Learning</li>
                <li>General Education</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-100 mb-4">Key Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Universal Content Processing</li>
                <li>AI-Powered Analysis</li>
                <li>Adaptive Learning Paths</li>
                <li>Domain Specialization</li>
                <li>Cross-Domain Intelligence</li>
                <li>HERA Integration</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>
              © 2024 HERA Software Systems. Universal Learning Platform - Processing ANY
              educational content across infinite domains.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
