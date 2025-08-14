import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Play, LayoutDashboard, Star, User, Database, HelpCircle, MessageSquare, Smartphone } from 'lucide-react'
import DocLayout from '@/components/docs/DocLayout'
import { getDocNavigation } from '@/lib/hera-docs'

const sections = [
  {
    title: 'Getting Started',
    description: 'Account setup, first steps, and basic navigation',
    href: '/docs/user/getting-started',
    icon: Play,
    items: ['Account Setup', 'First Login', 'Basic Navigation']
  },
  {
    title: 'Dashboard Overview',
    description: 'UI walkthrough, navigation, and customization options',
    href: '/docs/user/dashboard/overview',
    icon: LayoutDashboard,
    items: ['Interface Tour', 'Navigation Menu', 'Customization']
  },
  {
    title: 'Core Features',
    description: 'Step-by-step guides for essential platform features',
    href: '/docs/user/features/core',
    icon: Star,
    items: ['Entity Management', 'Transactions', 'Relationships']
  },
  {
    title: 'Account Management',
    description: 'Profile settings, security, and preferences',
    href: '/docs/user/account/management',
    icon: User,
    items: ['Profile Settings', 'Security', 'Preferences']
  },
  {
    title: 'Data Management',
    description: 'Import/export, backup, and data organization',
    href: '/docs/user/data/management',
    icon: Database,
    items: ['Import Data', 'Export Options', 'Backup & Restore']
  },
  {
    title: 'Troubleshooting',
    description: 'Common issues, solutions, and error resolution',
    href: '/docs/user/troubleshooting',
    icon: HelpCircle,
    items: ['Common Issues', 'Error Messages', 'Performance Tips']
  },
  {
    title: 'FAQ',
    description: 'Frequently asked questions and quick answers',
    href: '/docs/user/faq',
    icon: MessageSquare,
    items: ['General Questions', 'Feature Questions', 'Technical FAQ']
  },
  {
    title: 'Mobile Guide',
    description: 'Using HERA on mobile devices and tablets',
    href: '/docs/user/mobile/guide',
    icon: Smartphone,
    items: ['Mobile Interface', 'Touch Navigation', 'Offline Features']
  }
]

export default async function UserGuidePage() {
  const navigation = await getDocNavigation('user')

  return (
    <DocLayout navigation={navigation} docType="user" currentPath="">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-hera-primary">
            User Guide
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Learn how to use HERA applications effectively with step-by-step guides, 
            tips, and best practices for all users.
          </p>
        </div>

        <div className="mb-8">
          <div className="hera-card p-6">
            <h2 className="text-xl font-semibold mb-4">New to HERA?</h2>
            <p className="text-muted-foreground mb-4">
              Start with our getting started guide to create your account, learn the basics, 
              and get comfortable with the HERA interface.
            </p>
            <Button asChild className="hera-button">
              <Link href="/docs/user/getting-started">
                Start Here →
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

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div className="hera-card p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Reference</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/docs/user/keyboard-shortcuts" className="text-hera-primary hover:underline">
                  Keyboard Shortcuts
                </Link>
              </li>
              <li>
                <Link href="/docs/user/glossary" className="text-hera-primary hover:underline">
                  Glossary of Terms
                </Link>
              </li>
              <li>
                <Link href="/docs/user/tips-tricks" className="text-hera-primary hover:underline">
                  Tips & Tricks
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="hera-card p-6">
            <h3 className="text-lg font-semibold mb-4">Need More Help?</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Still have questions? Check our FAQ or contact support for personalized assistance.
            </p>
            <div className="flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/docs/user/faq">
                  View FAQ
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/support">
                  Contact Support
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DocLayout>
  )
}