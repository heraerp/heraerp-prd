import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BookOpen, Code, Users } from 'lucide-react'

export default function DocsHomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-hera-primary">
            HERA Documentation
          </h1>
          <p className="text-xl text-muted-foreground">
            Comprehensive guides for developers and users of the HERA platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="hera-card p-8 text-center">
            <div className="mb-6">
              <Code className="w-16 h-16 mx-auto text-hera-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">Developer Guide</h2>
            <p className="text-muted-foreground mb-6">
              Learn how to build, extend, and deploy applications using HERA&apos;s universal architecture.
            </p>
            <Button asChild size="lg" className="hera-button">
              <Link href="/docs/dev">
                Explore Developer Docs
              </Link>
            </Button>
          </div>

          <div className="hera-card p-8 text-center">
            <div className="mb-6">
              <Users className="w-16 h-16 mx-auto text-hera-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">User Guide</h2>
            <p className="text-muted-foreground mb-6">
              Step-by-step instructions for using HERA applications effectively.
            </p>
            <Button asChild size="lg" className="hera-button" variant="outline">
              <Link href="/docs/user">
                Browse User Guides
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div className="hera-card p-6 text-center">
            <BookOpen className="w-8 h-8 mx-auto mb-4 text-hera-accent" />
            <h3 className="text-lg font-semibold mb-2">Quick Start</h3>
            <p className="text-muted-foreground">
              New to HERA? Start with our{' '}
              <Link href="/docs/dev/getting-started" className="text-hera-primary hover:underline">
                Getting Started Guide
              </Link>{' '}
              or jump into the{' '}
              <Link href="/docs/user/overview" className="text-hera-primary hover:underline">
                User Overview
              </Link>
            </p>
          </div>

          <div className="hera-card p-6 text-center">
            <Code className="w-8 h-8 mx-auto mb-4 text-hera-secondary" />
            <h3 className="text-lg font-semibold mb-2">Update Documentation</h3>
            <p className="text-muted-foreground mb-4">
              Create and manage documentation with automatic page generation
            </p>
            <Button asChild size="sm" className="hera-button">
              <Link href="/docs/update">
                Update Docs
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}