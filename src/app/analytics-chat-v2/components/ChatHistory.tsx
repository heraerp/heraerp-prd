'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  History, 
  Trash2, 
  MessageSquare, 
  Clock,
  Search,
  Plus,
  Star,
  MoreVertical
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatSession {
  id: string
  title: string
  timestamp: Date
  messageCount: number
  lastMessage: string
  isStarred?: boolean
}

interface ChatHistoryProps {
  sessions: ChatSession[]
  currentSessionId: string | null
  onSelectSession: (sessionId: string) => void
  onDeleteSession: (sessionId: string) => void
  onNewSession: () => void
  className?: string
}

export function ChatHistory({
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onNewSession,
  className
}: ChatHistoryProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  
  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const starredSessions = filteredSessions.filter(s => s.isStarred)
  const recentSessions = filteredSessions.filter(s => !s.isStarred)

  return (
    <Card className={cn("border-purple-200 dark:border-purple-800 shadow-sm", className)}>
      <CardHeader className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <History className="h-4 w-4 text-white" />
            </div>
            Chat History
          </CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={onNewSession}
            className="h-7 w-7 p-0 hover:bg-purple-100 dark:hover:bg-purple-900"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-sm bg-muted/50 border border-purple-100 dark:border-purple-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {/* Starred Sessions */}
            {starredSessions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-2">
                  <Star className="h-3 w-3" />
                  Starred
                </p>
                <div className="space-y-1">
                  {starredSessions.map((session) => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      isActive={session.id === currentSessionId}
                      onSelect={() => onSelectSession(session.id)}
                      onDelete={() => onDeleteSession(session.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Recent Sessions */}
            {recentSessions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  Recent
                </p>
                <div className="space-y-1">
                  {recentSessions.map((session) => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      isActive={session.id === currentSessionId}
                      onSelect={() => onSelectSession(session.id)}
                      onDelete={() => onDeleteSession(session.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {filteredSessions.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No conversations found</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

function SessionItem({
  session,
  isActive,
  onSelect,
  onDelete
}: {
  session: ChatSession
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const [showActions, setShowActions] = React.useState(false)

  return (
    <div
      className={cn(
        "group relative p-2 rounded-lg cursor-pointer transition-all",
        isActive
          ? "bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 border border-purple-300 dark:border-purple-700"
          : "hover:bg-purple-50 dark:hover:bg-purple-950 border border-transparent"
      )}
      onClick={onSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start gap-2">
        <div className="w-7 h-7 rounded-md bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 flex items-center justify-center flex-shrink-0 mt-0.5">
          <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{session.title}</p>
          <p className="text-xs text-muted-foreground truncate">{session.lastMessage}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">
              {session.timestamp.toLocaleDateString()}
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">
              {session.messageCount} messages
            </span>
          </div>
        </div>
        {showActions && (
          <div className="absolute right-2 top-2 flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 hover:bg-red-100 dark:hover:bg-red-900"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
            >
              <Trash2 className="h-3 w-3 text-red-600 dark:text-red-400" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}