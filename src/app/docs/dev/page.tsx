import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Code, Database, Cpu, TestTube, Upload, GitBranch, Settings, Users } from 'lucide-react'
import DocLayout from '@/components/docs/DocLayout'
import { getDocNavigation } from '@/lib/hera-docs'

const sections = [
  {
    title: 'Setup & Installation',
    description: 'Environment setup, dependencies, and initial configuration',
    href: '/docs/dev/getting-started',
    icon: Settings,
    items: ['Environment Setup', 'Dependencies', 'Configuration']
  },
  {
    title: 'Architecture Overview',
    description: 'HERA 6-table system, project structure, and design patterns',
    href: '/docs/dev/architecture/overview',
    icon: Cpu,
    items: ['Universal Tables', 'Project Structure', 'Design Patterns']
  },
  {
    title: 'Database Development',
    description: 'Working with universal tables, migrations, and data modeling',
    href: '/docs/dev/database/setup',
    icon: Database,
    items: ['Universal Schema', 'Migrations', 'Data Modeling']
  },
  {
    title: 'API Development',
    description: 'Creating endpoints, authentication, and API best practices',
    href: '/docs/dev/api/development',
    icon: Code,
    items: ['Endpoints', 'Authentication', 'Best Practices']
  },
  {
    title: 'Component Development',
    description: 'Building UI components with React and TypeScript',
    href: '/docs/dev/components/development',
    icon: Users,
    items: ['React Components', 'TypeScript', 'Styling']
  },
  {
    title: 'Testing Guide',
    description: 'Unit tests, integration tests, and testing strategies',
    href: '/docs/dev/testing/guide',
    icon: TestTube,
    items: ['Unit Tests', 'Integration Tests', 'E2E Testing']
  },
  {
    title: 'Deployment Guide',
    description: 'Production deployment, CI/CD, and monitoring',
    href: '/docs/dev/deployment/guide',
    icon: Upload,
    items: ['Production Setup', 'CI/CD', 'Monitoring']
  },
  {
    title: 'Contributing',
    description: 'Git workflow, code standards, and contribution guidelines',
    href: '/docs/dev/contributing',
    icon: GitBranch,
    items: ['Git Workflow', 'Code Standards', 'Pull Requests']
  }
]

export default async function DeveloperGuidePage() {
  const navigation = await getDocNavigation('dev')

  return (
    <DocLayout navigation={navigation} docType="dev" currentPath="">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-hera-primary">
            Developer Guide
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to know to build, extend, and deploy applications 
            using HERA's revolutionary universal architecture.
          </p>
        </div>

        <div className="mb-8">
          <div className="hera-card p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Start</h2>
            <p className="text-muted-foreground mb-4">
              New to HERA development? Start with our comprehensive getting started guide 
              to set up your environment and understand the core concepts.
            </p>
            <Button asChild className="hera-button">
              <Link href="/docs/dev/getting-started">
                Get Started →
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => (
            <div key={section.title} className="hera-card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-2 rounded-lg bg-hera-primary/10">
                  <section.icon className="w-6 h-6 text-hera-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">
                    <Link 
                      href={section.href}
                      className="text-hera-primary hover:underline"
                    >
                      {section.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {section.description}
                  </p>
                </div>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                {section.items.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-hera-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="hera-card p-8">
            <h2 className="text-2xl font-semibold mb-4">Need Help?</h2>
            <p className="text-muted-foreground mb-6">
              Can't find what you're looking for? Check out our troubleshooting guide 
              or reach out to the development team.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild variant="outline">
                <Link href="/docs/dev/troubleshooting">
                  Troubleshooting
                </Link>
              </Button>
              <Button asChild>
                <Link href="/docs/dev/contributing">
                  Contribute
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DocLayout>
  )
}