'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Activity, 
  Plus, 
  Filter,
  Download,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ModuleConfig } from '../module-config';

interface ModuleDashboardProps {
  moduleConfig: ModuleConfig;
  onNavigate: (path: string) => void;
}

interface DashboardMetrics {
  total_entities: number;
  total_transactions: number;
  active_workflows: number;
  recent_activities: ActivityItem[];
  entity_statistics: EntityStatistics[];
  transaction_trends: TransactionTrend[];
  workflow_status: WorkflowStatus[];
}

interface ActivityItem {
  id: string;
  type: 'entity_created' | 'transaction_posted' | 'workflow_completed' | 'approval_pending';
  description: string;
  timestamp: string;
  user: string;
  entity_type?: string;
}

interface EntityStatistics {
  entity_type: string;
  count: number;
  growth_percentage: number;
  status_breakdown: { status: string; count: number; }[];
}

interface TransactionTrend {
  period: string;
  count: number;
  amount: number;
  currency: string;
}

interface WorkflowStatus {
  workflow_type: string;
  total: number;
  pending: number;
  completed: number;
  failed: number;
}

export default function ModuleDashboard({ moduleConfig, onNavigate }: ModuleDashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  useEffect(() => {
    loadDashboardMetrics();
  }, [selectedPeriod]);

  const loadDashboardMetrics = async () => {
    setIsLoading(true);
    try {
      // Simulate API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockMetrics: DashboardMetrics = {
        total_entities: 1248,
        total_transactions: 3567,
        active_workflows: 23,
        recent_activities: [
          {
            id: '1',
            type: 'entity_created',
            description: 'New customer "ABC Corp" created',
            timestamp: new Date(Date.now() - 300000).toISOString(),
            user: 'John Smith',
            entity_type: 'CUSTOMER'
          },
          {
            id: '2',
            type: 'transaction_posted',
            description: 'Invoice #INV-2024-001 posted for $15,000',
            timestamp: new Date(Date.now() - 600000).toISOString(),
            user: 'Sarah Johnson'
          },
          {
            id: '3',
            type: 'workflow_completed',
            description: 'Customer approval workflow completed',
            timestamp: new Date(Date.now() - 900000).toISOString(),
            user: 'Mike Davis'
          },
          {
            id: '4',
            type: 'approval_pending',
            description: 'Credit assessment requires manager approval',
            timestamp: new Date(Date.now() - 1200000).toISOString(),
            user: 'Lisa Chen'
          }
        ],
        entity_statistics: moduleConfig.entities.map((entity, index) => ({
          entity_type: entity.entity_type,
          count: Math.floor(Math.random() * 1000) + 100,
          growth_percentage: (Math.random() - 0.5) * 20,
          status_breakdown: [
            { status: 'active', count: Math.floor(Math.random() * 500) + 200 },
            { status: 'pending', count: Math.floor(Math.random() * 100) + 20 },
            { status: 'inactive', count: Math.floor(Math.random() * 50) + 10 }
          ]
        })),
        transaction_trends: Array.from({ length: 12 }, (_, i) => ({
          period: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short' }),
          count: Math.floor(Math.random() * 200) + 50,
          amount: Math.floor(Math.random() * 100000) + 10000,
          currency: 'USD'
        })),
        workflow_status: moduleConfig.workflows.map(workflow => ({
          workflow_type: workflow.workflow_type,
          total: Math.floor(Math.random() * 100) + 20,
          pending: Math.floor(Math.random() * 20) + 5,
          completed: Math.floor(Math.random() * 80) + 15,
          failed: Math.floor(Math.random() * 5) + 1
        }))
      };

      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error loading dashboard metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'entity_created':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'transaction_posted':
        return <FileText className="h-4 w-4 text-green-600" />;
      case 'workflow_completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'approval_pending':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / 60000);
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-gray-500">Loading dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{moduleConfig.module_name}</h1>
            <p className="text-gray-600">{moduleConfig.module_description}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => onNavigate('/entities/create')} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Entity
            </Button>
            <Button onClick={() => onNavigate('/transactions/create')} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Transaction
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Entities</p>
                  <p className="text-2xl font-bold">{metrics?.total_entities.toLocaleString()}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowUpRight className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600">+12.5%</span>
                  </div>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Transactions</p>
                  <p className="text-2xl font-bold">{metrics?.total_transactions.toLocaleString()}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowUpRight className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600">+8.3%</span>
                  </div>
                </div>
                <FileText className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Workflows</p>
                  <p className="text-2xl font-bold">{metrics?.active_workflows}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowDownRight className="h-3 w-3 text-red-600" />
                    <span className="text-xs text-red-600">-2.1%</span>
                  </div>
                </div>
                <Activity className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold">97.2%</p>
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowUpRight className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600">+1.2%</span>
                  </div>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="col-span-8 space-y-6">
            {/* Entity Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Entity Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.entity_statistics.map((stat) => (
                    <div key={stat.entity_type} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{stat.entity_type.replace('_', ' ')}</h4>
                          <Badge variant={stat.growth_percentage > 0 ? 'default' : 'secondary'}>
                            {stat.growth_percentage > 0 ? '+' : ''}{stat.growth_percentage.toFixed(1)}%
                          </Badge>
                        </div>
                        <span className="text-2xl font-bold">{stat.count.toLocaleString()}</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        {stat.status_breakdown.map((status) => (
                          <div key={status.status} className="text-center">
                            <div className="text-gray-600 capitalize">{status.status}</div>
                            <div className="font-medium">{status.count}</div>
                          </div>
                        ))}
                      </div>
                      
                      <Button
                        onClick={() => onNavigate(`/entities?type=${stat.entity_type}`)}
                        variant="outline"
                        size="sm"
                        className="w-full mt-3"
                      >
                        View {stat.entity_type.replace('_', ' ')} List
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Workflow Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Workflow Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.workflow_status.map((workflow) => (
                    <div key={workflow.workflow_type} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{workflow.workflow_type.replace('_', ' ')}</h4>
                        <span className="text-lg font-bold">{workflow.total}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Completed: {workflow.completed}</span>
                          <span>Pending: {workflow.pending}</span>
                          <span>Failed: {workflow.failed}</span>
                        </div>
                        
                        <Progress 
                          value={(workflow.completed / workflow.total) * 100} 
                          className="h-2"
                        />
                      </div>
                      
                      <Button
                        onClick={() => onNavigate(`/workflows?type=${workflow.workflow_type}`)}
                        variant="outline"
                        size="sm"
                        className="w-full mt-3"
                      >
                        Manage Workflow
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="col-span-4 space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {moduleConfig.entities.map((entity) => (
                  <Button
                    key={entity.entity_type}
                    onClick={() => onNavigate(`/entities/create?type=${entity.entity_type}`)}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create {entity.display_name}
                  </Button>
                ))}
                
                <Button
                  onClick={() => onNavigate('/transactions/create')}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  New Transaction
                </Button>
                
                <Button
                  onClick={() => onNavigate('/workflows')}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Manage Workflows
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics?.recent_activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-2 rounded hover:bg-gray-50">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{activity.user}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{formatRelativeTime(activity.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button
                  onClick={() => onNavigate('/activities')}
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                >
                  View All Activities
                </Button>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    All systems operational. Last sync: 2 minutes ago.
                  </AlertDescription>
                </Alert>
                
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">API Response Time:</span>
                    <span className="text-green-600 font-medium">125ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Database Performance:</span>
                    <span className="text-green-600 font-medium">Excellent</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data Sync Status:</span>
                    <span className="text-green-600 font-medium">Up to date</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}