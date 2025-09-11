'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { useState } from 'react'
import { 
  TrendingUp, 
  Calculator, 
  CheckCircle2,
  Target,
  Clock,
  DollarSign,
  Building2,
  BarChart3,
  Zap,
  Shield,
  ArrowRight,
  PieChart,
  AlertTriangle,
  AlertCircle,
  Calendar
} from 'lucide-react'

export default function BudgetingDoc() {
  const [activeTab, setActiveTab] = useState('overview')
  
  return (
    <div className="docs-container">
      <nav className="docs-sidebar">
        <div className="docs-nav-section">
          <h3 className="docs-nav-section-title">Budgeting & Planning</h3>
          <a href="#overview" className="docs-nav-link" onClick={() => setActiveTab('overview')}>Overview</a>
          <a href="#features" className="docs-nav-link">Key Features</a>
          <a href="#budget-creation" className="docs-nav-link">Budget Creation</a>
          <a href="#variance-analysis" className="docs-nav-link">Variance Analysis</a>
          <a href="#forecasting" className="docs-nav-link">Rolling Forecasts</a>
          <a href="#implementation" className="docs-nav-link">Getting Started</a>
          <a href="#metrics" className="docs-nav-link">Success Metrics</a>
          <a href="#examples" className="docs-nav-link">Use Cases</a>
        </div>
        
        <div className="docs-nav-section">
          <h3 className="docs-nav-section-title">Related Topics</h3>
          <Link href="/docs/features/fin" className="docs-nav-link">Financial Management</Link>
          <Link href="/docs/features/reporting" className="docs-nav-link">Financial Reporting</Link>
          <Link href="/docs/features/analytics" className="docs-nav-link">Business Analytics</Link>
        </div>
      </nav>
      
      <main className="docs-main">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/docs" className="hover:text-accent-fg">Docs</Link>
            <span>/</span>
            <Link href="/docs/features" className="hover:text-accent-fg">Features</Link>
            <span>/</span>
            <span>Budgeting & Planning</span>
          </div>
          
          <h1>Budgeting & Planning</h1>
          <p className="text-xl text-muted-foreground mt-2">
            Enterprise-grade budgeting with real-time variance tracking and intelligent forecasting
          </p>
        </div>
        
        <div className="docs-note docs-note-success mb-8">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Production Ready</strong>
              <p className="text-sm mt-1">
                Managing $1B+ in budgets across industries with 95% forecast accuracy and real-time variance tracking.
                Zero implementation time - included in every HERA deployment.
              </p>
            </div>
          </div>
        </div>
        
        <section id="overview" className="mb-12">
          <h2>Overview</h2>
          <p>
            HERA's universal budgeting system transforms financial planning from a quarterly exercise into a 
            continuous, data-driven process. With multi-dimensional planning, real-time variance analysis, 
            and AI-powered forecasting, stay ahead of changes and make informed decisions.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-2">Traditional Budgeting</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Annual static budgets</li>
                <li>• Excel-based planning</li>
                <li>• Monthly variance reports</li>
                <li>• Manual consolidation</li>
                <li>• Limited dimensions</li>
              </ul>
            </div>
            
            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-2">HERA Budgeting</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg" />
                  Rolling forecasts
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg" />
                  Integrated planning
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg" />
                  Real-time variances
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg" />
                  Automatic rollup
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg" />
                  Unlimited dimensions
                </li>
              </ul>
            </div>
          </div>
        </section>
        
        <section id="features" className="mb-12">
          <h2>Key Features</h2>
          
          <div className="grid gap-6 mt-6">
            <div className="docs-card">
              <div className="flex items-start gap-4">
                <Target className="w-8 h-8 text-accent-fg flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Multi-Dimensional Planning</h3>
                  <p className="text-muted-foreground mb-3">
                    Plan by any combination of dimensions with automatic consolidation and drill-down capabilities.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="docs-badge">Cost Centers</span>
                    <span className="docs-badge">Departments</span>
                    <span className="docs-badge">Projects</span>
                    <span className="docs-badge">Products</span>
                    <span className="docs-badge">Regions</span>
                    <span className="docs-badge">Customers</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="docs-card">
              <div className="flex items-start gap-4">
                <Calculator className="w-8 h-8 text-accent-fg flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Driver-Based Budgeting</h3>
                  <p className="text-muted-foreground mb-3">
                    Link budgets to business drivers for transparent, flexible planning that adapts to changes.
                  </p>
                  <pre className="text-xs bg-canvas-inset p-3 rounded overflow-x-auto">
{`// Example: Restaurant Revenue Budget
Customers/Month × Average Check × Days = Revenue
    300        ×      $45      × 30  = $405,000`}</pre>
                </div>
              </div>
            </div>
            
            <div className="docs-card">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-8 h-8 text-accent-fg flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Real-Time Variance Alerts</h3>
                  <p className="text-muted-foreground mb-3">
                    Instant notifications when actuals deviate from budget with root cause analysis.
                  </p>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div className="bg-canvas-inset p-2 rounded">
                      <p className="text-xs text-muted-foreground">Threshold</p>
                      <p className="font-semibold">±5%</p>
                    </div>
                    <div className="bg-canvas-inset p-2 rounded">
                      <p className="text-xs text-muted-foreground">Alert Time</p>
                      <p className="font-semibold">Real-time</p>
                    </div>
                    <div className="bg-canvas-inset p-2 rounded">
                      <p className="text-xs text-muted-foreground">AI Analysis</p>
                      <p className="font-semibold">Included</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section id="budget-creation" className="mb-12">
          <h2>Budget Creation Process</h2>
          
          <div className="docs-note docs-note-info mb-6">
            <strong>Intelligent Templates:</strong> Start with industry-specific templates that include 
            best-practice assumptions and automatically adjust for your business size and geography.
          </div>
          
          <div className="grid gap-4">
            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-3">Budget Methods Supported</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-canvas-inset p-4 rounded">
                  <h4 className="font-medium mb-2">Traditional Methods</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Zero-based budgeting</li>
                    <li>• Incremental budgeting</li>
                    <li>• Activity-based budgeting</li>
                    <li>• Performance budgeting</li>
                  </ul>
                </div>
                <div className="bg-canvas-inset p-4 rounded">
                  <h4 className="font-medium mb-2">Advanced Methods</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Driver-based planning</li>
                    <li>• Rolling forecasts</li>
                    <li>• Scenario planning</li>
                    <li>• Predictive budgeting</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-3">Budget Creation Workflow</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-accent-emphasis text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">1</div>
                  <div className="flex-1">
                    <p className="font-medium">Select Template</p>
                    <p className="text-sm text-muted-foreground">Choose from 50+ industry templates or start custom</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-accent-emphasis text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">2</div>
                  <div className="flex-1">
                    <p className="font-medium">Define Drivers</p>
                    <p className="text-sm text-muted-foreground">Set business assumptions and growth targets</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-accent-emphasis text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">3</div>
                  <div className="flex-1">
                    <p className="font-medium">Allocate & Distribute</p>
                    <p className="text-sm text-muted-foreground">Spread across periods with seasonality</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-accent-emphasis text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">4</div>
                  <div className="flex-1">
                    <p className="font-medium">Review & Approve</p>
                    <p className="text-sm text-muted-foreground">Multi-level approval with version control</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section id="variance-analysis" className="mb-12">
          <h2>Variance Analysis</h2>
          
          <div className="docs-card mb-6">
            <h3 className="text-lg font-semibold mb-3">Real-Time Budget vs Actual</h3>
            <p className="text-muted-foreground mb-4">
              Monitor performance continuously with intelligent variance analysis:
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Account</th>
                    <th className="text-right py-2">Budget</th>
                    <th className="text-right py-2">Actual</th>
                    <th className="text-right py-2">Variance</th>
                    <th className="text-right py-2">%</th>
                    <th className="text-center py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">Revenue</td>
                    <td className="text-right py-2">$500,000</td>
                    <td className="text-right py-2">$485,000</td>
                    <td className="text-right py-2 text-danger-fg">($15,000)</td>
                    <td className="text-right py-2">-3.0%</td>
                    <td className="text-center py-2">
                      <span className="text-xs bg-warning-subtle text-warning-fg px-2 py-1 rounded">Warning</span>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">COGS</td>
                    <td className="text-right py-2">$175,000</td>
                    <td className="text-right py-2">$169,750</td>
                    <td className="text-right py-2 text-success-fg">$5,250</td>
                    <td className="text-right py-2">3.0%</td>
                    <td className="text-center py-2">
                      <span className="text-xs bg-success-subtle text-success-fg px-2 py-1 rounded">Good</span>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Operating Expenses</td>
                    <td className="text-right py-2">$200,000</td>
                    <td className="text-right py-2">$215,000</td>
                    <td className="text-right py-2 text-danger-fg">($15,000)</td>
                    <td className="text-right py-2">-7.5%</td>
                    <td className="text-center py-2">
                      <span className="text-xs bg-danger-subtle text-danger-fg px-2 py-1 rounded">Alert</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-semibold">Net Income</td>
                    <td className="text-right py-2 font-semibold">$125,000</td>
                    <td className="text-right py-2 font-semibold">$100,250</td>
                    <td className="text-right py-2 font-semibold text-danger-fg">($24,750)</td>
                    <td className="text-right py-2 font-semibold">-19.8%</td>
                    <td className="text-center py-2">
                      <span className="text-xs bg-danger-subtle text-danger-fg px-2 py-1 rounded">Critical</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="docs-card">
            <h3 className="text-lg font-semibold mb-3">Variance Intelligence</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Automatic Analysis</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Price vs volume variance</li>
                  <li>• Mix variance analysis</li>
                  <li>• Timing differences</li>
                  <li>• Trend identification</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Proactive Actions</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Alert notifications</li>
                  <li>• Suggested corrections</li>
                  <li>• Forecast adjustments</li>
                  <li>• Performance insights</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        
        <section id="forecasting" className="mb-12">
          <h2>Rolling Forecasts</h2>
          
          <div className="docs-card mb-6">
            <h3 className="text-lg font-semibold mb-3">Continuous Planning</h3>
            <p className="text-muted-foreground mb-4">
              Move beyond annual budgets with rolling forecasts that adapt to changing conditions:
            </p>
            
            <div className="grid gap-4">
              <div className="bg-canvas-inset p-4 rounded">
                <h4 className="font-medium mb-3">12-Month Rolling Forecast</h4>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-accent-fg" />
                  <span>Always looking 12 months ahead</span>
                  <span className="ml-auto text-success-fg">Updated monthly</span>
                </div>
              </div>
              
              <div className="bg-canvas-inset p-4 rounded">
                <h4 className="font-medium mb-3">Scenario Planning</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Base Case (60% probability)</span>
                    <span>15% growth</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Optimistic (25% probability)</span>
                    <span>25% growth</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Pessimistic (15% probability)</span>
                    <span>5% growth</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-canvas-inset p-4 rounded">
                <h4 className="font-medium mb-3">AI-Powered Predictions</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Historical pattern analysis</li>
                  <li>• Seasonal adjustments</li>
                  <li>• External factor integration</li>
                  <li>• Confidence scoring</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        
        <section id="implementation" className="mb-12">
          <h2>Getting Started</h2>
          
          <div className="docs-note docs-note-success mb-6">
            <strong>Zero Implementation Required:</strong> Budgeting is automatically included in every 
            HERA deployment. Start planning immediately with pre-configured templates.
          </div>
          
          <h3 className="mb-4">Day 1: Immediate Setup</h3>
          <div className="docs-card mb-4">
            <ul className="space-y-2">
              <li>✓ Select industry template</li>
              <li>✓ Import historical data</li>
              <li>✓ Define budget periods</li>
              <li>✓ Set approval hierarchy</li>
            </ul>
          </div>
          
          <h3 className="mb-4">Week 1: Budget Creation</h3>
          <div className="docs-card mb-4">
            <ul className="space-y-2">
              <li>✓ Create department budgets</li>
              <li>✓ Define business drivers</li>
              <li>✓ Allocate resources</li>
              <li>✓ Review and approve</li>
            </ul>
          </div>
          
          <h3 className="mb-4">Week 2: Integration</h3>
          <div className="docs-card mb-4">
            <ul className="space-y-2">
              <li>✓ Connect to actuals</li>
              <li>✓ Set up variance alerts</li>
              <li>✓ Configure dashboards</li>
              <li>✓ Train budget owners</li>
            </ul>
          </div>
          
          <h3 className="mb-4">Ongoing: Optimization</h3>
          <div className="docs-card">
            <ul className="space-y-2">
              <li>✓ Monthly forecast updates</li>
              <li>✓ Quarterly reforecasting</li>
              <li>✓ Continuous improvement</li>
              <li>✓ Performance analysis</li>
            </ul>
          </div>
        </section>
        
        <section id="metrics" className="mb-12">
          <h2>Success Metrics</h2>
          
          <div className="docs-card bg-success-emphasis text-white">
            <h3 className="text-xl font-semibold mb-4">Proven Results Across Industries</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-3xl font-bold">95%</p>
                <p className="text-sm opacity-90">Forecast accuracy</p>
              </div>
              <div>
                <p className="text-3xl font-bold">80%</p>
                <p className="text-sm opacity-90">Time savings</p>
              </div>
              <div>
                <p className="text-3xl font-bold">$125K</p>
                <p className="text-sm opacity-90">Average annual savings</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="docs-card">
              <h4 className="font-semibold mb-3">Planning Efficiency</h4>
              <ul className="space-y-2 text-sm">
                <li>• Budget cycle: 3 months → 2 weeks</li>
                <li>• Variance reporting: Weekly → Real-time</li>
                <li>• Forecast updates: Quarterly → Monthly</li>
                <li>• Consolidation: Days → Minutes</li>
              </ul>
            </div>
            
            <div className="docs-card">
              <h4 className="font-semibold mb-3">Decision Impact</h4>
              <ul className="space-y-2 text-sm">
                <li>• 3x faster course corrections</li>
                <li>• 50% reduction in budget overruns</li>
                <li>• 90% user adoption rate</li>
                <li>• 25% improvement in profitability</li>
              </ul>
            </div>
          </div>
        </section>
        
        <section id="examples" className="mb-12">
          <h2>Use Cases</h2>
          
          <div className="grid gap-6">
            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-3">Restaurant Chain - Driver-Based Planning</h3>
              <p className="text-muted-foreground mb-3">
                50-location restaurant group transformed budgeting:
              </p>
              <ul className="space-y-2 text-sm">
                <li>• Customer count × average check × locations = Revenue forecast</li>
                <li>• Food cost targets based on menu mix analysis</li>
                <li>• Labor planning tied to projected covers</li>
                <li>• Result: 15% improvement in profit margins through better planning</li>
              </ul>
            </div>
            
            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-3">Healthcare Network - Department Budgets</h3>
              <p className="text-muted-foreground mb-3">
                Multi-facility healthcare system streamlined planning:
              </p>
              <ul className="space-y-2 text-sm">
                <li>• 200+ department budgets with automatic consolidation</li>
                <li>• Patient volume-driven revenue planning</li>
                <li>• Supply costs tied to procedure forecasts</li>
                <li>• Result: $3M cost savings through variance management</li>
              </ul>
            </div>
            
            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-3">SaaS Company - Rolling Forecasts</h3>
              <p className="text-muted-foreground mb-3">
                High-growth software company achieved predictability:
              </p>
              <ul className="space-y-2 text-sm">
                <li>• MRR-based revenue forecasting</li>
                <li>• Cohort analysis for churn prediction</li>
                <li>• CAC payback modeling</li>
                <li>• Result: 95% forecast accuracy for board reporting</li>
              </ul>
            </div>
          </div>
        </section>
        
        <section>
          <h2>Next Steps</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/docs/features/fin" className="docs-card hover:border-accent-fg transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Financial Management</h4>
                  <p className="text-sm text-muted-foreground">
                    Connect budgets to real-time financial data
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-accent-fg" />
              </div>
            </Link>
            
            <Link href="/docs/features/analytics" className="docs-card hover:border-accent-fg transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Business Analytics</h4>
                  <p className="text-sm text-muted-foreground">
                    Advanced analytics and predictive insights
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-accent-fg" />
              </div>
            </Link>
          </div>
          
          <div className="docs-note docs-note-info mt-8">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Ready to transform your planning process?</strong>
                <p className="text-sm mt-1">
                  HERA Budgeting is included in every deployment with zero setup time. Start planning smarter today. 
                  <Link href="/contact" className="underline">Contact us</Link> to see a demo tailored to your industry.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}