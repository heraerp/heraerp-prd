'use client'

import { HeraMCPChat } from '@/components/chat/HeraMCPChat'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Sparkles, 
  Code2, 
  Users, 
  Settings, 
  BarChart3,
  FileText,
  CheckCircle,
  AlertCircle,
  Zap
} from 'lucide-react'

export default function MCPChatPage() {
  const apiUrl = process.env.NEXT_PUBLIC_MCP_API_URL || 'http://localhost:3000'
  const isProduction = apiUrl.includes('railway.app')

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              HERA MCP Intelligence Hub
            </h1>
            <p className="text-muted-foreground mt-2">
              Natural language control for your universal ERP system
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isProduction ? (
              <Badge className="gap-1">
                <CheckCircle size={12} />
                Production
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <AlertCircle size={12} />
                Development
              </Badge>
            )}
            <Badge variant="outline">
              API: {apiUrl}
            </Badge>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-primary" />
              <h3 className="font-medium">Instant Operations</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Create entities, query data, and manage transactions with natural language
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="font-medium">Real-time Analytics</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Get instant insights and summaries of your business data
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="font-medium">Multi-tenant Ready</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Perfect organization isolation with intelligent context switching
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="font-medium">Smart Documentation</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              AI understands your business context and provides relevant help
            </p>
          </Card>
        </div>
      </div>

      {/* Main Chat Interface */}
      <Tabs defaultValue="customer" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="customer" className="gap-2">
            <Users size={16} />
            Customer Mode
          </TabsTrigger>
          <TabsTrigger value="internal" className="gap-2">
            <Code2 size={16} />
            Developer Mode
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customer" className="mt-0">
          <div className="space-y-4">
            <Card className="p-4 bg-muted/50">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Users size={16} />
                Customer Mode
              </h3>
              <p className="text-sm text-muted-foreground">
                Simplified interface for business users. Natural language commands for everyday operations
                like creating customers, booking appointments, and generating reports.
              </p>
            </Card>
            <HeraMCPChat 
              mode="customer" 
              apiUrl={apiUrl}
              className="shadow-lg"
            />
          </div>
        </TabsContent>

        <TabsContent value="internal" className="mt-0">
          <div className="space-y-4">
            <Card className="p-4 bg-muted/50">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Code2 size={16} />
                Developer Mode
              </h3>
              <p className="text-sm text-muted-foreground">
                Advanced debugging interface with full access to interpretation data, raw results, 
                and performance metrics. Perfect for testing and validating the universal architecture.
              </p>
            </Card>
            <HeraMCPChat 
              mode="internal" 
              apiUrl={apiUrl}
              showDebugInfo={true}
              className="shadow-lg"
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Reference */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Settings size={16} />
            Common Commands
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="mt-0.5">Entity</Badge>
              <div>
                <p className="font-medium">Create & Manage Entities</p>
                <p className="text-muted-foreground">
                  "Create a customer named John", "Show all products", "Update employee details"
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="mt-0.5">Transaction</Badge>
              <div>
                <p className="font-medium">Process Transactions</p>
                <p className="text-muted-foreground">
                  "Create a sale for $500", "Book appointment tomorrow", "Process payment"
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="mt-0.5">Analytics</Badge>
              <div>
                <p className="font-medium">Get Insights</p>
                <p className="text-muted-foreground">
                  "Show today's revenue", "List pending appointments", "Generate monthly report"
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <BarChart3 size={16} />
            Performance Metrics
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm">Response Time</span>
                <Badge variant="outline">< 200ms</Badge>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[85%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm">Accuracy</span>
                <Badge variant="outline">92%</Badge>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[92%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm">Uptime</span>
                <Badge variant="outline">99.9%</Badge>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[99%]" />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Powered by HERA Universal Architecture with AI-enhanced natural language processing
          </p>
        </Card>
      </div>
    </div>
  )
}