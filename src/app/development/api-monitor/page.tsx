'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  Server, 
  Zap, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Database,
  Cpu,
  Code,
  Gauge,
  BarChart3,
  GitBranch,
  Layers
} from 'lucide-react'

export default function APIMonitorPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [systemMetrics, setSystemMetrics] = useState({
    uptime: '99.98%',
    totalRequests: 127842,
    avgResponseTime: 45,
    errorRate: 0.12,
    throughput: 2340
  })

  const handleLogin = () => {
    if (password === 'developer@123') {
      setIsAuthenticated(true)
    } else {
      const input = document.querySelector('input[type="password"]') as HTMLInputElement
      input?.classList.add('shake')
      setTimeout(() => input?.classList.remove('shake'), 600)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-light text-white mb-2">HERA API Monitor</h1>
              <p className="text-gray-300 text-sm">System Performance Dashboard</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:bg-white/20"
                  placeholder="Enter developer access code"
                />
              </div>
              
              <Button
                onClick={handleLogin}
                className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white border-0 py-3 rounded-xl font-medium"
              >
                Access Monitor Dashboard
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // Mock real-time API performance data - Jobs would want this to be beautiful and functional
  const apiEndpoints = [
    {
      name: 'Smart Code Validation',
      endpoint: '/api/v1/smart-code/validate',
      status: 'healthy',
      responseTime: 42,
      requests24h: 1247,
      errorRate: 0.08,
      successRate: 99.92,
      icon: CheckCircle,
      color: 'emerald'
    },
    {
      name: 'DAG Execution Engine',
      endpoint: '/api/v1/dag/execute',
      status: 'healthy',
      responseTime: 78,
      requests24h: 892,
      errorRate: 0.15,
      successRate: 99.85,
      icon: GitBranch,
      color: 'blue'
    },
    {
      name: 'Template Management',
      endpoint: '/api/v1/templates',
      status: 'healthy',
      responseTime: 156,
      requests24h: 634,
      errorRate: 0.23,
      successRate: 99.77,
      icon: Database,
      color: 'purple'
    },
    {
      name: 'BOM Calculation',
      endpoint: '/api/v1/bom/calculate',
      status: 'degraded',
      responseTime: 234,
      requests24h: 445,
      errorRate: 2.1,
      successRate: 97.9,
      icon: BarChart3,
      color: 'amber'
    },
    {
      name: 'Pricing Engine',
      endpoint: '/api/v1/pricing/calculate',
      status: 'healthy',
      responseTime: 89,
      requests24h: 723,
      errorRate: 0.31,
      successRate: 99.69,
      icon: TrendingUp,
      color: 'cyan'
    },
    {
      name: '4-Level Validation',
      endpoint: '/api/v1/validation/4-level',
      status: 'healthy',
      responseTime: 67,
      requests24h: 1034,
      errorRate: 0.19,
      successRate: 99.81,
      icon: Layers,
      color: 'indigo'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30'
      case 'degraded': return 'text-amber-400 bg-amber-500/20 border-amber-500/30'
      case 'down': return 'text-red-400 bg-red-500/20 border-red-500/30'
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
    }
  }

  const getResponseTimeColor = (time: number) => {
    if (time < 50) return 'text-emerald-400'
    if (time < 100) return 'text-blue-400'
    if (time < 200) return 'text-amber-400'
    return 'text-red-400'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-light">HERA API Monitor</h1>
                <p className="text-sm text-gray-400">Real-time Performance Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-emerald-400">Live</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* System Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Uptime</p>
                  <p className="text-2xl font-light text-emerald-400">{systemMetrics.uptime}</p>
                </div>
                <Server className="w-8 h-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Requests</p>
                  <p className="text-2xl font-light text-blue-400">{systemMetrics.totalRequests.toLocaleString()}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Avg Response</p>
                  <p className="text-2xl font-light text-purple-400">{systemMetrics.avgResponseTime}ms</p>
                </div>
                <Clock className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Error Rate</p>
                  <p className="text-2xl font-light text-amber-400">{systemMetrics.errorRate}%</p>
                </div>
                <AlertCircle className="w-8 h-8 text-amber-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Throughput</p>
                  <p className="text-2xl font-light text-cyan-400">{systemMetrics.throughput}/min</p>
                </div>
                <Zap className="w-8 h-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API Endpoints Performance */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Gauge className="w-5 h-5" />
              <span>API Endpoint Performance</span>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Real-time monitoring of all HERA-SPEAR endpoints
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {apiEndpoints.map((api, index) => {
                const Icon = api.icon
                return (
                  <motion.div
                    key={api.endpoint}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 bg-gradient-to-r from-${api.color}-400 to-${api.color}-600 rounded-lg flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-white">{api.name}</h3>
                          <p className="text-sm text-gray-400 font-mono">{api.endpoint}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <p className="text-sm text-gray-400">Response Time</p>
                          <p className={`text-lg font-mono ${getResponseTimeColor(api.responseTime)}`}>
                            {api.responseTime}ms
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm text-gray-400">24h Requests</p>
                          <p className="text-lg font-mono text-white">{api.requests24h.toLocaleString()}</p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm text-gray-400">Success Rate</p>
                          <p className="text-lg font-mono text-emerald-400">{api.successRate}%</p>
                        </div>
                        
                        <Badge className={getStatusColor(api.status)}>
                          {api.status}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Success Rate Progress Bar */}
                    <div className="mt-3">
                      <Progress 
                        value={api.successRate} 
                        className="h-2 bg-white/10"
                      />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Performance Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-emerald-400 font-medium">Excellent Performance</span>
                </div>
                <p className="text-sm text-gray-300">
                  All Phase 1 APIs are performing within optimal ranges. Smart Code validation averaging 42ms.
                </p>
              </div>
              
              <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-amber-400 font-medium">Attention Needed</span>
                </div>
                <p className="text-sm text-gray-300">
                  BOM Calculation showing higher latency (234ms). Consider template optimization.
                </p>
              </div>
              
              <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="flex items-center space-x-2 mb-2">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-blue-400 font-medium">System Health</span>
                </div>
                <p className="text-sm text-gray-300">
                  DAG Engine showing excellent parallel execution efficiency with 78ms average.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Code className="w-5 h-5" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border-white/20">
                <Activity className="w-4 h-4 mr-2" />
                View Detailed Logs
              </Button>
              <Button className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border-white/20">
                <BarChart3 className="w-4 h-4 mr-2" />
                Performance Analytics
              </Button>
              <Button className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border-white/20">
                <AlertCircle className="w-4 h-4 mr-2" />
                Configure Alerts
              </Button>
              <Button className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border-white/20">
                <Server className="w-4 h-4 mr-2" />
                System Diagnostics
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer Status */}
        <div className="p-4 bg-black/20 rounded-xl border border-white/10">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                16 APIs Monitored
              </Badge>
              <span className="text-gray-400">Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
            <div className="text-gray-500">
              "Performance is not just about speed, it's about reliability" - Steve Jobs
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .shake {
          animation: shake 0.6s ease-in-out;
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  )
}