'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, MessageCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function TestWhatsAppMessages() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const orgId = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258' // Hair Talkz demo org

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/v1/whatsapp/messages-v2?org_id=${orgId}`)
        const result = await response.json()
        
        if (result.status === 'error') {
          throw new Error(result.error || 'Failed to fetch messages')
        }
        
        setData(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-red-600">Error: {error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">WhatsApp Messages Test</h1>
        <Link href="/salon-data/whatsapp">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to WhatsApp
          </Button>
        </Link>
      </div>
      
      <div className="grid gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Conversations</p>
                <p className="text-2xl font-bold">{data?.totalConversations || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Messages</p>
                <p className="text-2xl font-bold">{data?.totalMessages || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Conversations</h2>
        {data?.conversationsWithMessages?.map((conv: any) => (
          <Card key={conv.conversation.id} className="overflow-hidden">
            <CardHeader className="bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{conv.conversation.entity_name}</CardTitle>
                  <p className="text-sm text-gray-600">
                    {conv.conversation.metadata?.phone} | Messages: {conv.messageCount}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={conv.conversation.metadata?.window_state === 'open' ? 'default' : 'secondary'}>
                    Window: {conv.conversation.metadata?.window_state || 'closed'}
                  </Badge>
                  {conv.conversation.metadata?.conversation_cost > 0 && (
                    <Badge variant="outline">
                      Cost: ${conv.conversation.metadata.conversation_cost.toFixed(2)}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-sm mb-2">Messages:</h3>
                {conv.messages.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg ${
                      msg.direction === 'inbound' 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'bg-green-50 border border-green-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <Badge variant={msg.direction === 'inbound' ? 'default' : 'secondary'}>
                        {msg.direction === 'inbound' ? (
                          <>
                            <MessageCircle className="w-3 h-3 mr-1" />
                            Incoming
                          </>
                        ) : (
                          'Outgoing'
                        )}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.occurred_at || msg.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm mt-2 whitespace-pre-wrap">{msg.text}</p>
                    {msg.metadata?.status && (
                      <p className="text-xs text-gray-500 mt-1">Status: {msg.metadata.status}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Raw API Response</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
              {JSON.stringify(data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}