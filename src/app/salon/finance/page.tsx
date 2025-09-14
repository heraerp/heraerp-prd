'use client';

import { useState, useEffect } from 'react';
// import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'; // Not needed for demo
import { universalApi } from '@/lib/universal-api-v2';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Users, Receipt, BarChart3, Calendar } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UniversalInlineLoading } from '@/components/universal/ui/UniversalLoadingStates';
import Link from 'next/link';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

// Hardcoded organization ID from the SQL setup
const SALON_ORG_ID = '84a3654b-907b-472a-ac8f-a1ffb6fb711b';

interface FinanceStats {
  revenue: number;
  expenses: number;
  netProfit: number;
  profitMargin: number;
  cashBalance: number;
  pendingPayables: number;
  pendingReceivables: number;
  monthlyTrend: any[];
}

export default function SalonFinancePage() {
  // Demo mode - no auth needed
  const [stats, setStats] = useState<FinanceStats>({
    revenue: 0,
    expenses: 0,
    netProfit: 0,
    profitMargin: 0,
    cashBalance: 15000,
    pendingPayables: 0,
    pendingReceivables: 0,
    monthlyTrend: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  });

  const organizationId = SALON_ORG_ID;

  useEffect(() => {
    if (!organizationId) return;
    loadFinanceData();
  }, [organizationId, dateRange]);

  const loadFinanceData = async () => {
    if (!organizationId) return;

    try {
      setLoading(true);
      universalApi.setOrganizationId(organizationId);

      // Load transactions for the period
      const transactions = await universalApi.read('universal_transactions', {
        filter: `transaction_date:gte:${dateRange.start.toISOString()},transaction_date:lte:${dateRange.end.toISOString()}`
      });

      // Calculate revenue (POS sales)
      const revenue = transactions
        .filter((t: any) => t.transaction_type === 'pos_sale' || t.transaction_type === 'service_sale')
        .reduce((sum: number, t: any) => sum + (t.total_amount || 0), 0);

      // Load expense transactions
      const expenses = transactions
        .filter((t: any) => 
          t.transaction_type === 'expense' || 
          t.transaction_type === 'purchase' ||
          t.transaction_type === 'payroll'
        )
        .reduce((sum: number, t: any) => sum + (t.total_amount || 0), 0);

      // Generate monthly trend data (last 6 months)
      const monthlyTrend = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthEnd = endOfMonth(subMonths(new Date(), i));
        
        const monthTransactions = await universalApi.read('universal_transactions', {
          filter: `transaction_date:gte:${monthStart.toISOString()},transaction_date:lte:${monthEnd.toISOString()}`
        });

        const monthRevenue = monthTransactions
          .filter((t: any) => t.transaction_type === 'pos_sale' || t.transaction_type === 'service_sale')
          .reduce((sum: number, t: any) => sum + (t.total_amount || 0), 0);

        const monthExpenses = monthTransactions
          .filter((t: any) => t.transaction_type === 'expense' || t.transaction_type === 'purchase')
          .reduce((sum: number, t: any) => sum + (t.total_amount || 0), 0);

        monthlyTrend.push({
          month: format(monthStart, 'MMM'),
          revenue: monthRevenue,
          expenses: monthExpenses,
          profit: monthRevenue - monthExpenses
        });
      }

      const netProfit = revenue - expenses;
      const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

      setStats({
        revenue,
        expenses,
        netProfit,
        profitMargin,
        cashBalance: 15000 + netProfit, // Simulated
        pendingPayables: expenses * 0.2, // Simulated
        pendingReceivables: revenue * 0.1, // Simulated
        monthlyTrend
      });
    } catch (error) {
      console.error('Error loading finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Demo mode - no checks needed

  const quickActions = [
    { title: 'Payroll', href: '/salon/finance/payroll', icon: Users, color: 'text-blue-600' },
    { title: 'Commissions', href: '/salon/finance/commissions', icon: TrendingUp, color: 'text-green-600' },
    { title: 'Reports', href: '/salon/finance/reports', icon: BarChart3, color: 'text-purple-600' },
    { title: 'Expenses', href: '/salon/finance/expenses', icon: Receipt, color: 'text-red-600' }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Finance Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            const start = startOfMonth(subMonths(new Date(), 1));
            const end = endOfMonth(subMonths(new Date(), 1));
            setDateRange({ start, end });
          }}>
            <Calendar className="w-4 h-4 mr-2" />
            Last Month
          </Button>
          <Button variant="outline" onClick={() => {
            const start = startOfMonth(new Date());
            const end = endOfMonth(new Date());
            setDateRange({ start, end });
          }}>
            This Month
          </Button>
        </div>
      </div>

      {loading ? (
        <UniversalInlineLoading text="Loading finance data..." />
      ) : (
        <>
          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  AED {stats.revenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  +12% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expenses</CardTitle>
                <Receipt className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  AED {stats.expenses.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  <TrendingDown className="w-3 h-3 inline mr-1" />
                  -5% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  AED {stats.netProfit.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.profitMargin.toFixed(1)}% margin
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cash Balance</CardTitle>
                <CreditCard className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  AED {stats.cashBalance.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Available funds
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="flex items-center justify-between p-6">
                    <div>
                      <p className="text-lg font-semibold">{action.title}</p>
                      <p className="text-sm text-gray-500">Manage {action.title.toLowerCase()}</p>
                    </div>
                    <action.icon className={`h-8 w-8 ${action.color}`} />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Revenue & Expense Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Expense Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `AED ${value.toLocaleString()}`} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Revenue"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      name="Expenses"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Profit"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Pending Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Payables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Supplier Invoices</span>
                    <span className="font-medium">AED {(stats.pendingPayables * 0.6).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Utility Bills</span>
                    <span className="font-medium">AED {(stats.pendingPayables * 0.3).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Other</span>
                    <span className="font-medium">AED {(stats.pendingPayables * 0.1).toFixed(0)}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total Payables</span>
                      <span className="text-red-600">AED {stats.pendingPayables.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending Receivables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Corporate Clients</span>
                    <span className="font-medium">AED {(stats.pendingReceivables * 0.7).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Memberships</span>
                    <span className="font-medium">AED {(stats.pendingReceivables * 0.2).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Other</span>
                    <span className="font-medium">AED {(stats.pendingReceivables * 0.1).toFixed(0)}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total Receivables</span>
                      <span className="text-green-600">AED {stats.pendingReceivables.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}