import Link from 'next/link'
import { Search, CheckCircle, Rocket, Globe } from 'lucide-react'

const steps = [
  {
    icon: Search,
    title: 'Discover',
    description: 'Explore our demo apps or describe your business needs',
    link: '/demo',
    linkText: 'View Demos'
  },
  {
    icon: CheckCircle,
    title: 'Validate',
    description: 'Test drive with real data in our sandbox environment',
    link: '/get-started',
    linkText: 'Try Sandbox'
  },
  {
    icon: Rocket,
    title: 'Build',
    description: 'Customize and configure your perfect solution',
    link: '/pricing-request',
    linkText: 'Get Started'
  },
  {
    icon: Globe,
    title: 'Deploy',
    description: 'Go live in minutes with automatic scaling',
    link: '/book-a-meeting',
    linkText: 'Book Demo'
  }
]

export default function Journey() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {steps.map((step, index) => {
        const Icon = step.icon
        return (
          <div key={index} className="card-glass p-5 rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="ink font-semibold text-lg">{step.title}</h3>
            </div>
            <p className="ink-muted text-sm mb-3">{step.description}</p>
            <Link
              href={step.link}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              {step.linkText} →
            </Link>
          </div>
        )
      })}
    </div>
  )
}
