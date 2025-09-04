'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Zap, 
  Clock, 
  Calendar,
  MessageSquare,
  TrendingUp,
  Users,
  DollarSign,
  ChevronRight,
  Play,
  Pause,
  Settings,
  BarChart,
  Target,
  Sparkles,
  Bot,
  Timer,
  Star
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  BookingScenario, 
  ConversationFlow,
  SmartSuggestion,
  BookingAutomationService,
  BOOKING_PATTERNS 
} from '@/lib/whatsapp/booking-automation'

interface BookingAutomationPanelProps {
  organizationId: string
  onScenarioSelect?: (scenario: BookingScenario) => void
  onFlowStart?: (flow: ConversationFlow) => void
}

export default function BookingAutomationPanel({ 
  organizationId,
  onScenarioSelect,
  onFlowStart 
}: BookingAutomationPanelProps) {
  const [activeScenarios, setActiveScenarios] = useState<string[]>(['quick_booking', 'smart_rebooking'])
  const [selectedTab, setSelectedTab] = useState('scenarios')
  const [automationStats, setAutomationStats] = useState({
    totalAutomated: 145,
    successRate: 92,
    timeSaved: 18.5, // hours
    revenue: 12450
  })

  const toggleScenario = (scenarioId: string) => {
    setActiveScenarios(prev => 
      prev.includes(scenarioId) 
        ? prev.filter(id => id !== scenarioId)
        : [...prev, scenarioId]
    )
  }

  const getScenarioIcon = (scenarioId: string) => {
    const icons: Record<string, any> = {
      quick_booking: Calendar,
      service_inquiry: MessageSquare,
      smart_rebooking: TrendingUp,
      group_booking: Users
    }
    return icons[scenarioId] || Zap
  }

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-[#202c33] border-[#2a3942] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#8696a0] text-sm">Automated</p>
              <p className="text-2xl font-semibold text-[#e9edef]">{automationStats.totalAutomated}</p>
            </div>
            <Bot className="w-8 h-8 text-[#00a884]" />
          </div>
        </Card>

        <Card className="bg-[#202c33] border-[#2a3942] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#8696a0] text-sm">Success Rate</p>
              <p className="text-2xl font-semibold text-[#e9edef]">{automationStats.successRate}%</p>
            </div>
            <Target className="w-8 h-8 text-[#00a884]" />
          </div>
        </Card>

        <Card className="bg-[#202c33] border-[#2a3942] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#8696a0] text-sm">Time Saved</p>
              <p className="text-2xl font-semibold text-[#e9edef]">{automationStats.timeSaved}h</p>
            </div>
            <Timer className="w-8 h-8 text-[#00a884]" />
          </div>
        </Card>

        <Card className="bg-[#202c33] border-[#2a3942] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#8696a0] text-sm">Revenue</p>
              <p className="text-2xl font-semibold text-[#e9edef]">${automationStats.revenue}</p>
            </div>
            <DollarSign className="w-8 h-8 text-[#00a884]" />
          </div>
        </Card>
      </div>

      {/* Main Automation Panel */}
      <Card className="bg-[#111b21] border-[#2a3942]">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <div className="border-b border-[#2a3942]">
            <TabsList className="grid grid-cols-4 w-full rounded-none bg-[#202c33]">
              <TabsTrigger value="scenarios" className="text-[#8696a0] data-[state=active]:text-[#00a884]">
                <Zap className="w-4 h-4 mr-2" />
                Scenarios
              </TabsTrigger>
              <TabsTrigger value="flows" className="text-[#8696a0] data-[state=active]:text-[#00a884]">
                <MessageSquare className="w-4 h-4 mr-2" />
                Flows
              </TabsTrigger>
              <TabsTrigger value="suggestions" className="text-[#8696a0] data-[state=active]:text-[#00a884]">
                <Sparkles className="w-4 h-4 mr-2" />
                Smart Suggestions
              </TabsTrigger>
              <TabsTrigger value="patterns" className="text-[#8696a0] data-[state=active]:text-[#00a884]">
                <BarChart className="w-4 h-4 mr-2" />
                Patterns
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Scenarios Tab */}
          <TabsContent value="scenarios" className="p-4 m-0">
            <div className="space-y-3">
              {BookingAutomationService.SCENARIOS.map(scenario => {
                const Icon = getScenarioIcon(scenario.id)
                const isActive = activeScenarios.includes(scenario.id)
                
                return (
                  <Card 
                    key={scenario.id} 
                    className={cn(
                      "bg-[#202c33] border-[#2a3942] p-4 transition-all",
                      isActive && "border-[#00a884]"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          isActive ? "bg-[#00a884]/20" : "bg-[#2a3942]"
                        )}>
                          <Icon className={cn(
                            "w-5 h-5",
                            isActive ? "text-[#00a884]" : "text-[#8696a0]"
                          )} />
                        </div>
                        <div>
                          <h4 className="font-medium text-[#e9edef]">{scenario.name}</h4>
                          <p className="text-sm text-[#8696a0] mt-1">{scenario.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs bg-[#2a3942] text-[#8696a0] border-[#2a3942]">
                              {scenario.actions.length} actions
                            </Badge>
                            {scenario.followUp && (
                              <Badge variant="outline" className="text-xs bg-[#2a3942] text-[#8696a0] border-[#2a3942]">
                                {scenario.followUp.steps.length} follow-ups
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {scenario.triggers.map(trigger => (
                              <Badge 
                                key={trigger}
                                variant="secondary" 
                                className="text-xs bg-[#00a884]/10 text-[#00a884] border-0"
                              >
                                "{trigger}"
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onScenarioSelect?.(scenario)}
                          className="text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]"
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleScenario(scenario.id)}
                          className={cn(
                            "hover:bg-[#2a3942]",
                            isActive ? "text-[#00a884]" : "text-[#8696a0]"
                          )}
                        >
                          {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* Flows Tab */}
          <TabsContent value="flows" className="p-4 m-0">
            <div className="space-y-3">
              {BookingAutomationService.FLOWS.map(flow => (
                <Card key={flow.id} className="bg-[#202c33] border-[#2a3942] p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-[#e9edef]">{flow.name}</h4>
                      <p className="text-sm text-[#8696a0] mt-1">{flow.description}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1 text-sm text-[#8696a0]">
                          <MessageSquare className="w-4 h-4" />
                          {flow.nodes.length} steps
                        </div>
                        <div className="flex items-center gap-1 text-sm text-[#8696a0]">
                          <ChevronRight className="w-4 h-4" />
                          {flow.edges.length} paths
                        </div>
                      </div>
                      {/* Visual flow preview */}
                      <div className="flex items-center gap-2 mt-3">
                        {flow.nodes.slice(0, 4).map((node, index) => (
                          <React.Fragment key={node.id}>
                            <div className="flex items-center gap-1">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                                node.type === 'message' ? "bg-[#00a884]/20 text-[#00a884]" :
                                node.type === 'question' ? "bg-[#f9b82f]/20 text-[#f9b82f]" :
                                node.type === 'action' ? "bg-[#00a884]/20 text-[#00a884]" :
                                "bg-[#2a3942] text-[#8696a0]"
                              )}>
                                {index + 1}
                              </div>
                            </div>
                            {index < flow.nodes.length - 1 && index < 3 && (
                              <ChevronRight className="w-4 h-4 text-[#8696a0]" />
                            )}
                          </React.Fragment>
                        ))}
                        {flow.nodes.length > 4 && (
                          <span className="text-xs text-[#8696a0]">+{flow.nodes.length - 4} more</span>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => onFlowStart?.(flow)}
                      className="bg-[#00a884] hover:bg-[#00957a] text-white"
                      size="sm"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Flow
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Smart Suggestions Tab */}
          <TabsContent value="suggestions" className="p-4 m-0">
            <Alert className="mb-4 border-[#2a3942] bg-[#202c33]">
              <Sparkles className="w-4 h-4 text-[#f9b82f]" />
              <AlertDescription className="text-[#e9edef]">
                <strong>AI-Powered Suggestions</strong>
                <p className="text-sm text-[#8696a0] mt-1">
                  Smart appointment suggestions based on customer history, preferences, and real-time availability.
                </p>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {/* Service Suggestions */}
              <div>
                <h4 className="text-sm font-medium text-[#8696a0] mb-3">Recommended Services</h4>
                <div className="space-y-2">
                  {[
                    { name: 'Signature Color & Style', match: 95, reason: 'Most booked service' },
                    { name: 'Express Blowdry', match: 88, reason: 'Quick appointment' },
                    { name: 'Hair Treatment', match: 82, reason: 'Due for maintenance' }
                  ].map(service => (
                    <Card key={service.name} className="bg-[#202c33] border-[#2a3942] p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-[#00a884]/10 flex items-center justify-center">
                            <span className="text-lg font-semibold text-[#00a884]">{service.match}%</span>
                          </div>
                          <div>
                            <p className="font-medium text-[#e9edef]">{service.name}</p>
                            <p className="text-xs text-[#8696a0]">{service.reason}</p>
                          </div>
                        </div>
                        <Star className="w-4 h-4 text-[#f9b82f]" />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Time Suggestions */}
              <div>
                <h4 className="text-sm font-medium text-[#8696a0] mb-3">Best Time Slots</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { time: 'Today 2:00 PM', score: 95, label: 'Best Match' },
                    { time: 'Tomorrow 10:00 AM', score: 90, label: 'Preferred Time' },
                    { time: 'Friday 3:00 PM', score: 85, label: 'Weekend Eve' },
                    { time: 'Saturday 11:00 AM', score: 80, label: 'Weekend' }
                  ].map(slot => (
                    <Card key={slot.time} className="bg-[#202c33] border-[#2a3942] p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Clock className="w-4 h-4 text-[#00a884]" />
                        <Badge 
                          variant="secondary" 
                          className="text-xs bg-[#00a884]/10 text-[#00a884] border-0"
                        >
                          {slot.label}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-[#e9edef]">{slot.time}</p>
                      <Progress value={slot.score} className="h-1 mt-2" />
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Patterns Tab */}
          <TabsContent value="patterns" className="p-4 m-0">
            <div className="space-y-4">
              {Object.entries(BOOKING_PATTERNS).map(([key, pattern]) => (
                <Card key={key} className="bg-[#202c33] border-[#2a3942] p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-[#e9edef]">{pattern.name}</h4>
                      {pattern.message && (
                        <p className="text-sm text-[#8696a0] mt-1">{pattern.message}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        {pattern.discount && (
                          <Badge variant="secondary" className="bg-[#00a884]/10 text-[#00a884] border-0">
                            {pattern.discount}% off
                          </Badge>
                        )}
                        {pattern.surcharge && (
                          <Badge variant="secondary" className="bg-[#f9b82f]/10 text-[#f9b82f] border-0">
                            +{pattern.surcharge}% peak
                          </Badge>
                        )}
                        {pattern.benefits && (
                          <div className="text-xs text-[#8696a0]">
                            {pattern.benefits.length} benefits
                          </div>
                        )}
                      </div>
                    </div>
                    <BarChart className="w-5 h-5 text-[#8696a0]" />
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}