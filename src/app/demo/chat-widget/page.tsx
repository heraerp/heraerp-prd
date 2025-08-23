import { HeraChatWidget } from '@/components/chat/HeraChatWidget'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function ChatWidgetDemo() {
  return (
    <div className="container max-w-6xl mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">HERA Chat Widget Integration</h1>
        <p className="text-muted-foreground">
          Add intelligent AI assistance to any page with a single component
        </p>
      </div>

      <Tabs defaultValue="example" className="w-full">
        <TabsList>
          <TabsTrigger value="example">Live Example</TabsTrigger>
          <TabsTrigger value="code">Integration Code</TabsTrigger>
          <TabsTrigger value="options">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="example" className="mt-6">
          <Card className="p-8 min-h-[400px] relative">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Your Application Page</h2>
              <p className="text-muted-foreground">
                This is a demo of how the HERA chat widget integrates into your application.
                Look for the chat button in the bottom-right corner.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <Card className="p-4">
                  <h3 className="font-medium mb-2">Natural Language</h3>
                  <p className="text-sm text-muted-foreground">
                    Users can interact with your ERP using everyday language
                  </p>
                </Card>
                <Card className="p-4">
                  <h3 className="font-medium mb-2">Context Aware</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatically uses the current organization context
                  </p>
                </Card>
                <Card className="p-4">
                  <h3 className="font-medium mb-2">Instant Actions</h3>
                  <p className="text-sm text-muted-foreground">
                    Create entities, query data, and run reports instantly
                  </p>
                </Card>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="code" className="mt-6">
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="font-medium mb-4">Basic Integration</h3>
              <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                <code>{`import { HeraChatWidget } from '@/components/chat/HeraChatWidget'

export default function MyPage() {
  return (
    <div>
      {/* Your page content */}
      
      {/* Add the chat widget */}
      <HeraChatWidget />
    </div>
  )
}`}</code>
              </pre>
            </Card>

            <Card className="p-6">
              <h3 className="font-medium mb-4">With Custom Configuration</h3>
              <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                <code>{`<HeraChatWidget 
  apiUrl="https://your-mcp-server.railway.app"
  position="bottom-left"
  defaultOpen={true}
  mode="internal" // or "customer"
/>`}</code>
              </pre>
            </Card>

            <Card className="p-6">
              <h3 className="font-medium mb-4">Environment Variables</h3>
              <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                <code>{`# .env.local
NEXT_PUBLIC_MCP_API_URL=https://your-mcp-server.railway.app`}</code>
              </pre>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="options" className="mt-6">
          <Card className="p-6">
            <h3 className="font-medium mb-4">Configuration Options</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <code className="text-sm bg-muted px-2 py-1 rounded">apiUrl</code>
                  <Badge variant="outline">string</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  MCP server URL. Defaults to environment variable or localhost.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <code className="text-sm bg-muted px-2 py-1 rounded">position</code>
                  <Badge variant="outline">'bottom-right' | 'bottom-left'</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Widget position on the page. Default: 'bottom-right'
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <code className="text-sm bg-muted px-2 py-1 rounded">defaultOpen</code>
                  <Badge variant="outline">boolean</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Whether the chat starts open. Default: false
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <code className="text-sm bg-muted px-2 py-1 rounded">mode</code>
                  <Badge variant="outline">'customer' | 'internal'</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  UI mode - customer for simplified, internal for debug. Default: 'customer'
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add the actual widget to this demo page */}
      <HeraChatWidget defaultOpen={true} />
    </div>
  )
}