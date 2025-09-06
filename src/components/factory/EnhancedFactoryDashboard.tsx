/**
 * Enhanced HERA Factory Dashboard with Improved Drilldown
 * Improvements:
 * 1. Module Context with Smart Code display
 * 2. Pipeline Timeline Visualization (Gantt-style)
 * 3. Real-Time Status Indicators
 * 4. Guardrail Detail Drilldown
 * 5. Coverage Trend Sparklines
 * 6. Fiscal Integration Information
 * 7. Notifications & Alerts
 * 8. Advanced Filtering
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Factory, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Bell,
  Filter,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
  Info,
  Shield,
  Package,
  TestTube,
  Rocket,
  FileCheck,
  BarChart3,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useFactoryDashboard } from '@/lib/hooks/use-factory-dashboard';
import { GuardrailDetailDialog } from './GuardrailDetailDialog';
import { NotificationCenter } from './NotificationCenter';
import { ModulePipelineView } from './ModulePipelineView';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Module metadata
const moduleInfo: Record<string, { name: string; icon: any; color: string }> = {
  'LOYALTY': { name: 'Loyalty System', icon: Sparkles, color: 'purple' },
  'INVENTORY': { name: 'Inventory Management', icon: Package, color: 'blue' },
  'POS': { name: 'Point of Sale', icon: Factory, color: 'green' },
  'CRM': { name: 'Customer Relations', icon: FileCheck, color: 'orange' },
  'FIN': { name: 'Financial Module', icon: BarChart3, color: 'cyan' },
  'HR': { name: 'Human Resources', icon: Shield, color: 'pink' },
};

const stageOrder = ['PLAN', 'BUILD', 'TEST', 'COMPLY', 'RELEASE'];

interface FilterState {
  modules: string[];
  stages: string[];
  status: string[];
  timeRange: '24h' | '7d' | '30d' | '90d';
  showFailedOnly: boolean;
}

export default function EnhancedFactoryDashboard() {
  const { filters: baseFilters, data, actions } = useFactoryDashboard();
  const [selectedView, setSelectedView] = useState<'pipeline' | 'table' | 'analytics'>('pipeline');
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    modules: [],
    stages: [],
    status: [],
    timeRange: '30d',
    showFailedOnly: false,
  });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [guardrailDialog, setGuardrailDialog] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const { 
    transactions, 
    modules, 
    relationships, 
    fiscalPeriods, 
    transactionLines, 
    kpis, 
    loading, 
    error 
  } = data;

  // Process transactions by module and stage
  const moduleData = React.useMemo(() => {
    const result = new Map<string, {
      stages: Map<string, any[]>;
      coverage: number[];
      guardrailPass: number[];
      status: 'running' | 'passed' | 'failed' | 'partial';
    }>();

    transactions.forEach(txn => {
      const moduleCode = txn.smart_code.split('.')[2];
      const stage = txn.smart_code.split('.')[3];

      if (!result.has(moduleCode)) {
        result.set(moduleCode, {
          stages: new Map(),
          coverage: [],
          guardrailPass: [],
          status: 'running',
        });
      }

      const module = result.get(moduleCode)!;
      if (!module.stages.has(stage)) {
        module.stages.set(stage, []);
      }

      module.stages.get(stage)!.push(txn);

      // Extract metrics
      const lines = transactionLines.get(txn.id) || [];
      lines.forEach(line => {
        if (line.metadata?.coverage) {
          module.coverage.push(line.metadata.coverage * 100);
        }
      });
    });

    return result;
  }, [transactions, transactionLines]);

  // Calculate sparkline data for coverage trends
  const getCoverageSparkline = (coverage: number[]) => {
    return coverage.slice(-10).map((value, index) => ({
      value,
      index
    }));
  };

  // Initialize component
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Check for alerts
  useEffect(() => {
    if (!isInitialized) return;
    
    const alerts = [];

    // Low coverage alert
    if (kpis.coverageAvg < 60) {
      alerts.push({
        id: 'low-coverage',
        type: 'error',
        title: 'Low Test Coverage',
        message: `Average test coverage is ${kpis.coverageAvg.toFixed(1)}% (target: 85%)`,
        timestamp: new Date(),
      });
    }

    // Guardrail failures
    if (kpis.guardrailPassRate < 95) {
      alerts.push({
        id: 'guardrail-fail',
        type: 'warning',
        title: 'Guardrail Compliance Issue',
        message: `Guardrail pass rate is ${kpis.guardrailPassRate.toFixed(1)}% (target: 95%)`,
        timestamp: new Date(),
      });
    }

    // Fiscal period closed
    if (!kpis.fiscalAligned) {
      alerts.push({
        id: 'fiscal-closed',
        type: 'warning',
        title: 'Fiscal Period Closed',
        message: 'Promotion blocked until fiscal period reopens',
        timestamp: new Date(),
      });
    }

    setNotifications(alerts);
  }, [kpis, isInitialized]);

  // Prevent rendering until data is loaded
  if (loading && !isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-500" />
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 dark:text-red-400">Error loading dashboard: {error.message}</p>
        <Button onClick={actions.refresh} className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Enhanced Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                <Factory className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  HERA Universal Factory
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Pipeline Monitor • {baseFilters.organization_id}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Filter Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                    {(filters.modules.length > 0 || filters.showFailedOnly) && (
                      <Badge className="ml-2" variant="secondary">
                        {filters.modules.length + (filters.showFailedOnly ? 1 : 0)}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72">
                  <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Module Filter */}
                  <div className="p-2 space-y-2">
                    <p className="text-sm font-medium">Modules</p>
                    {Object.entries(moduleInfo).map(([code, info]) => (
                      <label key={code} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={filters.modules.includes(code)}
                          onCheckedChange={(checked) => {
                            setFilters(prev => ({
                              ...prev,
                              modules: checked 
                                ? [...prev.modules, code]
                                : prev.modules.filter(m => m !== code)
                            }));
                          }}
                        />
                        <info.icon className="w-4 h-4" />
                        <span className="text-sm">{info.name}</span>
                      </label>
                    ))}
                  </div>

                  <DropdownMenuSeparator />

                  {/* Status Filter */}
                  <div className="p-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={filters.showFailedOnly}
                        onCheckedChange={(checked) => {
                          setFilters(prev => ({
                            ...prev,
                            showFailedOnly: !!checked
                          }));
                        }}
                      />
                      <span className="text-sm">Show failed only</span>
                    </label>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Time Range */}
              <Select
                value={filters.timeRange}
                onValueChange={(value) => {
                  if (value !== filters.timeRange) {
                    setFilters(prev => ({ ...prev, timeRange: value as any }));
                  }
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>

              {/* Notifications */}
              <NotificationCenter 
                notifications={notifications}
                onDismiss={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
              />

              {/* Refresh */}
              <Button
                variant="outline"
                size="sm"
                onClick={actions.refresh}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced KPI Cards with Trends */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Lead Time */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Lead Time</p>
                  <p className="text-2xl font-bold">{kpis.leadTimeDays}d</p>
                  <p className="text-xs text-gray-500">PLAN → RELEASE</p>
                </div>
                <Clock className={cn(
                  "w-8 h-8",
                  kpis.leadTimeDays <= 3 ? "text-green-500" : "text-orange-500"
                )} />
              </div>
            </CardContent>
          </Card>

          {/* Coverage with Trend */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Coverage</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{kpis.coverageAvg.toFixed(1)}%</p>
                    {kpis.coverageAvg < 60 ? (
                      <ArrowDownRight className="w-4 h-4 text-red-500" />
                    ) : kpis.coverageAvg > 85 ? (
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                    ) : null}
                  </div>
                  <div className="h-8 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getCoverageSparkline(Array.from(moduleData.values()).flatMap(m => m.coverage))}>
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke={kpis.coverageAvg >= 85 ? "#10b981" : "#f59e0b"} 
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <TrendingUp className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          {/* Guardrail Pass */}
          <Card>
            <CardContent className="p-4">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setGuardrailDialog({ open: true })}
              >
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Guardrail Pass</p>
                  <p className="text-2xl font-bold">{kpis.guardrailPassRate.toFixed(1)}%</p>
                  <p className="text-xs text-blue-600 hover:underline">View details →</p>
                </div>
                <Shield className={cn(
                  "w-8 h-8",
                  kpis.guardrailPassRate >= 95 ? "text-green-500" : "text-red-500"
                )} />
              </div>
            </CardContent>
          </Card>

          {/* Audit Ready */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Audit Ready</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    kpis.auditReady ? "text-green-600" : "text-red-600"
                  )}>
                    {kpis.auditReady ? 'YES' : 'NO'}
                  </p>
                  <p className="text-xs text-gray-500">SBOM + Attestations</p>
                </div>
                <FileCheck className={cn(
                  "w-8 h-8",
                  kpis.auditReady ? "text-green-500" : "text-red-500"
                )} />
              </div>
            </CardContent>
          </Card>

          {/* Fiscal Aligned */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Fiscal Period</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    kpis.fiscalAligned ? "text-green-600" : "text-orange-600"
                  )}>
                    {kpis.fiscalAligned ? 'OPEN' : 'CLOSED'}
                  </p>
                  {!kpis.fiscalAligned && (
                    <p className="text-xs text-orange-600">Opens Jan 31</p>
                  )}
                </div>
                <Calendar className={cn(
                  "w-8 h-8",
                  kpis.fiscalAligned ? "text-green-500" : "text-orange-500"
                )} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* View Tabs */}
      <div className="max-w-7xl mx-auto px-6">
        <Tabs value={selectedView} onValueChange={(v: any) => setSelectedView(v)}>
          <TabsList className="grid grid-cols-3 w-fit">
            <TabsTrigger value="pipeline">Pipeline View</TabsTrigger>
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="mt-6">
            <ModulePipelineView 
              moduleData={moduleData}
              moduleInfo={moduleInfo}
              stageOrder={stageOrder}
              transactions={transactions}
              transactionLines={transactionLines}
              filters={filters}
              onSelectModule={setSelectedModule}
              onOpenGuardrail={(data) => setGuardrailDialog(data)}
            />
          </TabsContent>

          <TabsContent value="table" className="mt-6">
            {/* Original table view with enhancements */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction Details</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Table implementation */}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            {/* Analytics view */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Coverage Trends by Module</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Module coverage charts */}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pipeline Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Performance metrics */}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Guardrail Detail Dialog */}
      {guardrailDialog && (
        <GuardrailDetailDialog 
          {...guardrailDialog}
          onClose={() => setGuardrailDialog(null)}
          onCreateWaiver={(policy, reason) => {
            // Handle waiver creation
            console.log('Creating waiver:', { policy, reason });
          }}
        />
      )}
    </div>
  );
}