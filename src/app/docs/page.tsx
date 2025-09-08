import Link from 'next/link'
import { 
  Book, 
  Code2, 
  Rocket, 
  Shield, 
  Database, 
  Globe,
  Building2,
  FileText,
  Calculator,
  MessageSquare,
  TrendingUp,
  Banknote,
  GitBranch
} from 'lucide-react'

export default function DocsHome() {
  return (
    <div className="docs-container">
      <nav className="docs-sidebar">
        <div className="docs-nav-section">
          <h3 className="docs-nav-section-title">Getting Started</h3>
          <Link href="/docs/overview" className="docs-nav-link">Overview</Link>
          <Link href="/docs/quickstart" className="docs-nav-link">Quick Start</Link>
          <Link href="/docs/methodology" className="docs-nav-link">Implementation Methodology</Link>
          <Link href="/docs/architecture" className="docs-nav-link">Architecture</Link>
        </div>
        
        <div className="docs-nav-section">
          <h3 className="docs-nav-section-title">Core Features</h3>
          <Link href="/docs/features/universal-api" className="docs-nav-link">Universal API</Link>
          <Link href="/docs/features/multi-tenant" className="docs-nav-link">Multi-Tenant SaaS</Link>
          <Link href="/docs/features/smart-codes" className="docs-nav-link">Intelligent Classification</Link>
          <Link href="/docs/features/ai-integration" className="docs-nav-link">AI Integration</Link>
        </div>
        
        <div className="docs-nav-section">
          <h3 className="docs-nav-section-title">Financial Modules</h3>
          <Link href="/docs/features/chart-of-accounts" className="docs-nav-link">Chart of Accounts</Link>
          <Link href="/docs/features/auto-journal" className="docs-nav-link">Auto-Journal Engine</Link>
          <Link href="/docs/features/budgeting" className="docs-nav-link">Budgeting System</Link>
          <Link href="/docs/features/ifrs-compliance" className="docs-nav-link">IFRS Compliance</Link>
        </div>
        
        <div className="docs-nav-section">
          <h3 className="docs-nav-section-title">Industry Solutions</h3>
          <Link href="/docs/industries/restaurant" className="docs-nav-link">Restaurant</Link>
          <Link href="/docs/industries/healthcare" className="docs-nav-link">Healthcare</Link>
          <Link href="/docs/industries/retail" className="docs-nav-link">Retail</Link>
          <Link href="/docs/industries/manufacturing" className="docs-nav-link">Manufacturing</Link>
        </div>
        
        <div className="docs-nav-section">
          <h3 className="docs-nav-section-title">Integrations</h3>
          <Link href="/docs/integrations/whatsapp" className="docs-nav-link">WhatsApp Business</Link>
          <Link href="/docs/integrations/progressive-pwa" className="docs-nav-link">Progressive PWA</Link>
          <Link href="/docs/integrations/mcp-server" className="docs-nav-link">MCP Server</Link>
        </div>
        
        <div className="docs-nav-section">
          <h3 className="docs-nav-section-title">API Reference</h3>
          <Link href="/docs/api/rest" className="docs-nav-link">REST API</Link>
          <Link href="/docs/api/typescript-client" className="docs-nav-link">TypeScript Client</Link>
          <Link href="/docs/api/webhooks" className="docs-nav-link">Webhooks</Link>
        </div>
      </nav>
      
      <main className="docs-main">
        <h1>HERA Documentation</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Enterprise Resource Planning with Universal Architecture
        </p>
        
        <div className="docs-feature-grid">
          <div className="docs-feature-card">
            <GitBranch className="docs-feature-icon" />
            <h3 className="docs-card-title">Implementation Methodology</h3>
            <p className="docs-card-description">
              21-day implementation journey with MCP orchestration. From requirements to production with flexible architecture.
            </p>
            <Link href="/docs/methodology" className="text-accent-fg hover:underline">
              View Methodology →
            </Link>
          </div>
          
          <div className="docs-feature-card">
            <Database className="docs-feature-icon" />
            <h3 className="docs-card-title">Universal Architecture</h3>
            <p className="docs-card-description">
              Revolutionary architecture handles infinite business complexity. Learn how HERA's innovative approach works.
            </p>
            <Link href="/docs/architecture" className="text-accent-fg hover:underline">
              Explore Architecture →
            </Link>
          </div>
          
          <div className="docs-feature-card">
            <Globe className="docs-feature-icon" />
            <h3 className="docs-card-title">Multi-Tenant SaaS</h3>
            <p className="docs-card-description">
              Production-ready multi-tenant system with subdomain routing and perfect data isolation.
            </p>
            <Link href="/docs/features/multi-tenant" className="text-accent-fg hover:underline">
              Learn More →
            </Link>
          </div>
          
          <div className="docs-feature-card">
            <Calculator className="docs-feature-icon" />
            <h3 className="docs-card-title">Financial Accounting</h3>
            <p className="docs-card-description">
              Complete Chart of Accounts with IFRS compliance and AI-powered auto-journal engine.
            </p>
            <Link href="/docs/features/chart-of-accounts" className="text-accent-fg hover:underline">
              Explore COA →
            </Link>
          </div>
          
          <div className="docs-feature-card">
            <Building2 className="docs-feature-icon" />
            <h3 className="docs-card-title">Industry Solutions</h3>
            <p className="docs-card-description">
              Pre-configured solutions for restaurant, healthcare, retail, and manufacturing industries.
            </p>
            <Link href="/docs/industries/restaurant" className="text-accent-fg hover:underline">
              View Solutions →
            </Link>
          </div>
          
          <div className="docs-feature-card">
            <MessageSquare className="docs-feature-icon" />
            <h3 className="docs-card-title">WhatsApp Integration</h3>
            <p className="docs-card-description">
              Enterprise-ready WhatsApp Business integration with desktop-style interface.
            </p>
            <Link href="/docs/integrations/whatsapp" className="text-accent-fg hover:underline">
              Setup WhatsApp →
            </Link>
          </div>
          
          <div className="docs-feature-card">
            <Code2 className="docs-feature-icon" />
            <h3 className="docs-card-title">API Reference</h3>
            <p className="docs-card-description">
              Complete API documentation with TypeScript client library and code examples.
            </p>
            <Link href="/docs/api/rest" className="text-accent-fg hover:underline">
              View API Docs →
            </Link>
          </div>
        </div>
        
        <div className="mt-12 p-6 border rounded-lg bg-canvas-subtle">
          <h2 className="text-xl font-semibold mb-3">Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium mb-2">Popular Features</h4>
              <ul className="space-y-1 text-sm">
                <li><Link href="/docs/features/auto-journal" className="text-accent-fg hover:underline">Auto-Journal Engine</Link></li>
                <li><Link href="/docs/features/smart-codes" className="text-accent-fg hover:underline">Intelligent Classification</Link></li>
                <li><Link href="/docs/features/budgeting" className="text-accent-fg hover:underline">Universal Budgeting</Link></li>
                <li><Link href="/docs/features/ifrs-compliance" className="text-accent-fg hover:underline">IFRS Compliance</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Developer Resources</h4>
              <ul className="space-y-1 text-sm">
                <li><Link href="/docs/api/typescript-client" className="text-accent-fg hover:underline">TypeScript Client</Link></li>
                <li><Link href="/docs/integrations/mcp-server" className="text-accent-fg hover:underline">MCP Server</Link></li>
                <li><Link href="/docs/api/webhooks" className="text-accent-fg hover:underline">Webhooks</Link></li>
                <li><Link href="/docs/architecture" className="text-accent-fg hover:underline">Schema Reference</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Implementation Resources</h4>
              <ul className="space-y-1 text-sm">
                <li><Link href="/docs/methodology" className="text-accent-fg hover:underline">21-Day Methodology</Link></li>
                <li><Link href="/docs/methodology/complete-guide" className="text-accent-fg hover:underline">Complete Guide (PDF)</Link></li>
                <li><Link href="/docs/methodology/detailed-flow" className="text-accent-fg hover:underline">Visual Diagrams</Link></li>
                <li><Link href="/docs/quickstart" className="text-accent-fg hover:underline">Quick Start</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Getting Help</h4>
              <ul className="space-y-1 text-sm">
                <li><a href="https://github.com/anthropics/claude-code/issues" className="text-accent-fg hover:underline">Report Issues</a></li>
                <li><Link href="/docs/overview" className="text-accent-fg hover:underline">Overview</Link></li>
                <li><a href="mailto:support@heraerp.com" className="text-accent-fg hover:underline">Contact Support</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex items-center justify-between text-sm text-muted-foreground">
          <div>
            <span className="docs-badge docs-badge-success">Production Ready</span>
            <span className="docs-badge ml-2">Version 1.0</span>
          </div>
          <div>
            Built with HERA Universal Architecture
          </div>
        </div>
      </main>
    </div>
  )
}