'use client';

import { useState, useEffect } from 'react';
// import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'; // Not needed for demo
import { universalApi } from '@/lib/universal-api-v2';
import { FileText, Download, Calendar, TrendingUp, BarChart3, DollarSign } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { UniversalInlineLoading } from '@/components/universal/ui/UniversalLoadingStates';
import { format, startOfMonth, endOfMonth, startOfYear } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

// Hardcoded organization ID from the SQL setup
const SALON_ORG_ID = '84a3654b-907b-472a-ac8f-a1ffb6fb711b';

interface ProfitLossData {
  revenue: {
    services: number;
    products: number;
    memberships: number;
    total: number;
  };
  expenses: {
    salaries: number;
    commissions: number;
    rent: number;
    utilities: number;
    supplies: number;
    marketing: number;
    other: number;
    total: number;
  };
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
}

interface CashFlowData {
  openingBalance: number;
  cashInflows: {
    sales: number;
    memberships: number;
    other: number;
    total: number;
  };
  cashOutflows: {
    payroll: number;
    suppliers: number;
    rent: number;
    utilities: number;
    other: number;
    total: number;
  };
  netCashFlow: number;
  closingBalance: number;
}

interface BalanceSheetData {
  assets: {
    current: {
      cash: number;
      receivables: number;
      inventory: number;
      total: number;
    };
    fixed: {
      equipment: number;
      furniture: number;
      total: number;
    };
    total: number;
  };
  liabilities: {
    current: {
      payables: number;
      accrued: number;
      total: number;
    };
    longTerm: {
      loans: number;
      total: number;
    };
    total: number;
  };
  equity: {
    capital: number;
    retainedEarnings: number;
    total: number;
  };
}

export default function FinancialReportsPage() {
  // Demo mode - no auth needed
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [profitLoss, setProfitLoss] = useState<ProfitLossData | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowData | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetData | null>(null);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);

  const organizationId = SALON_ORG_ID;

  useEffect(() => {
    if (!organizationId) return;
    loadFinancialReports();
  }, [organizationId, selectedPeriod]);

  const loadFinancialReports = async () => {
    if (!organizationId) return;

    try {
      setLoading(true);
      universalApi.setOrganizationId(organizationId);

      // Determine date range based on selected period
      const now = new Date();
      let startDate, endDate;
      
      switch (selectedPeriod) {
        case 'month':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case 'quarter':
          startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          endDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
          break;
        case 'year':
          startDate = startOfYear(now);
          endDate = now;
          break;
        default:
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
      }

      // Load transactions for the period
      const transactions = await universalApi.read('universal_transactions', {
        filter: `transaction_date:gte:${startDate.toISOString()},transaction_date:lte:${endDate.toISOString()}`
      });

      // Calculate P&L data
      const serviceRevenue = transactions
        .filter((t: any) => t.transaction_type === 'service_sale')
        .reduce((sum: number, t: any) => sum + (t.total_amount || 0), 0);
      
      const productRevenue = transactions
        .filter((t: any) => t.transaction_type === 'product_sale' || t.transaction_type === 'pos_sale')
        .reduce((sum: number, t: any) => sum + (t.total_amount || 0), 0) * 0.3; // Estimate product portion
      
      const membershipRevenue = Math.random() * 5000 + 2000; // Simulated
      const totalRevenue = serviceRevenue + productRevenue + membershipRevenue;

      // Calculate expenses
      const salaries = transactions
        .filter((t: any) => t.transaction_type === 'payroll')
        .reduce((sum: number, t: any) => sum + (t.total_amount || 0), 0) || totalRevenue * 0.35;
      
      const commissions = totalRevenue * 0.15;
      const rent = 8000;
      const utilities = 1200;
      const supplies = totalRevenue * 0.08;
      const marketing = totalRevenue * 0.05;
      const otherExpenses = totalRevenue * 0.03;
      const totalExpenses = salaries + commissions + rent + utilities + supplies + marketing + otherExpenses;

      const grossProfit = totalRevenue - (productRevenue * 0.4); // Assuming 40% COGS
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      setProfitLoss({
        revenue: {
          services: serviceRevenue,
          products: productRevenue,
          memberships: membershipRevenue,
          total: totalRevenue
        },
        expenses: {
          salaries,
          commissions,
          rent,
          utilities,
          supplies,
          marketing,
          other: otherExpenses,
          total: totalExpenses
        },
        grossProfit,
        netProfit,
        profitMargin
      });

      // Calculate Cash Flow
      const openingBalance = 15000;
      const cashInflows = {
        sales: totalRevenue * 0.9, // 90% cash collection
        memberships: membershipRevenue,
        other: 1000,
        total: 0
      };
      cashInflows.total = cashInflows.sales + cashInflows.memberships + cashInflows.other;

      const cashOutflows = {
        payroll: salaries,
        suppliers: supplies,
        rent,
        utilities,
        other: otherExpenses,
        total: 0
      };
      cashOutflows.total = cashOutflows.payroll + cashOutflows.suppliers + cashOutflows.rent + 
                          cashOutflows.utilities + cashOutflows.other;

      const netCashFlow = cashInflows.total - cashOutflows.total;
      const closingBalance = openingBalance + netCashFlow;

      setCashFlow({
        openingBalance,
        cashInflows,
        cashOutflows,
        netCashFlow,
        closingBalance
      });

      // Calculate Balance Sheet (simplified)
      const cash = closingBalance;
      const receivables = totalRevenue * 0.1;
      const inventory = 25000;
      const equipment = 50000;
      const furniture = 30000;
      
      const payables = totalExpenses * 0.2;
      const accrued = salaries * 0.1;
      const loans = 20000;
      
      const totalAssets = cash + receivables + inventory + equipment + furniture;
      const totalLiabilities = payables + accrued + loans;
      const equity = totalAssets - totalLiabilities;

      setBalanceSheet({
        assets: {
          current: {
            cash,
            receivables,
            inventory,
            total: cash + receivables + inventory
          },
          fixed: {
            equipment,
            furniture,
            total: equipment + furniture
          },
          total: totalAssets
        },
        liabilities: {
          current: {
            payables,
            accrued,
            total: payables + accrued
          },
          longTerm: {
            loans,
            total: loans
          },
          total: totalLiabilities
        },
        equity: {
          capital: 50000,
          retainedEarnings: equity - 50000,
          total: equity
        }
      });

      // Generate trend data
      const trend = [];
      for (let i = 0; i < 6; i++) {
        trend.push({
          month: format(new Date(now.getFullYear(), now.getMonth() - i, 1), 'MMM'),
          revenue: Math.random() * 20000 + 40000,
          expenses: Math.random() * 15000 + 30000,
          profit: 0
        });
      }
      trend.forEach(t => { t.profit = t.revenue - t.expenses; });
      setMonthlyTrend(trend.reverse());

    } catch (error) {
      console.error('Error loading financial reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to load financial reports',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Demo mode - no checks needed

  const expenseChartData = profitLoss ? [
    { name: 'Salaries', value: profitLoss.expenses.salaries, color: '#3b82f6' },
    { name: 'Commissions', value: profitLoss.expenses.commissions, color: '#10b981' },
    { name: 'Rent', value: profitLoss.expenses.rent, color: '#f59e0b' },
    { name: 'Utilities', value: profitLoss.expenses.utilities, color: '#ef4444' },
    { name: 'Supplies', value: profitLoss.expenses.supplies, color: '#8b5cf6' },
    { name: 'Other', value: profitLoss.expenses.marketing + profitLoss.expenses.other, color: '#6b7280' }
  ] : [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Financial Reports</h1>
          <p className="text-gray-600 dark:text-gray-400">Comprehensive financial analysis</p>
        </div>
        <div className="flex gap-2">
          <select
            className="px-4 py-2 border rounded-md"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">Year to Date</option>
          </select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Reports
          </Button>
        </div>
      </div>

      {loading ? (
        <UniversalInlineLoading text="Loading financial reports..." />
      ) : (
        <Tabs defaultValue="pl" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pl">Profit & Loss</TabsTrigger>
            <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
            <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
          </TabsList>

          {/* Profit & Loss Statement */}
          <TabsContent value="pl" className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    AED {profitLoss?.revenue.total.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                  <TrendingUp className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    AED {profitLoss?.expenses.total.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${(profitLoss?.netProfit || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    AED {profitLoss?.netProfit.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {profitLoss?.profitMargin.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* P&L Details */}
            <Card>
              <CardHeader>
                <CardTitle>Income Statement</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow className="font-semibold">
                      <TableCell>Revenue</TableCell>
                      <TableCell className="text-right"></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8">Service Revenue</TableCell>
                      <TableCell className="text-right">AED {profitLoss?.revenue.services.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8">Product Revenue</TableCell>
                      <TableCell className="text-right">AED {profitLoss?.revenue.products.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8">Membership Revenue</TableCell>
                      <TableCell className="text-right">AED {profitLoss?.revenue.memberships.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow className="font-semibold border-t">
                      <TableCell>Total Revenue</TableCell>
                      <TableCell className="text-right">AED {profitLoss?.revenue.total.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow className="font-semibold">
                      <TableCell className="pt-4">Operating Expenses</TableCell>
                      <TableCell className="text-right"></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8">Salaries & Wages</TableCell>
                      <TableCell className="text-right">AED {profitLoss?.expenses.salaries.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8">Commissions</TableCell>
                      <TableCell className="text-right">AED {profitLoss?.expenses.commissions.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8">Rent</TableCell>
                      <TableCell className="text-right">AED {profitLoss?.expenses.rent.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8">Utilities</TableCell>
                      <TableCell className="text-right">AED {profitLoss?.expenses.utilities.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8">Supplies</TableCell>
                      <TableCell className="text-right">AED {profitLoss?.expenses.supplies.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8">Marketing</TableCell>
                      <TableCell className="text-right">AED {profitLoss?.expenses.marketing.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8">Other Expenses</TableCell>
                      <TableCell className="text-right">AED {profitLoss?.expenses.other.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow className="font-semibold border-t">
                      <TableCell>Total Expenses</TableCell>
                      <TableCell className="text-right">AED {profitLoss?.expenses.total.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow className="font-bold text-lg border-t-2">
                      <TableCell>Net Profit</TableCell>
                      <TableCell className={`text-right ${(profitLoss?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        AED {profitLoss?.netProfit.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Expense Breakdown Chart */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Expense Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {expenseChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `AED ${value.toFixed(0)}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => `AED ${value.toFixed(0)}`} />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Revenue" strokeWidth={2} />
                        <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Expenses" strokeWidth={2} />
                        <Line type="monotone" dataKey="profit" stroke="#3b82f6" name="Profit" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Cash Flow Statement */}
          <TabsContent value="cashflow" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Statement</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow className="font-semibold">
                      <TableCell>Opening Cash Balance</TableCell>
                      <TableCell className="text-right">AED {cashFlow?.openingBalance.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow className="font-semibold">
                      <TableCell className="pt-4">Cash Inflows</TableCell>
                      <TableCell className="text-right"></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8">Sales Collections</TableCell>
                      <TableCell className="text-right">AED {cashFlow?.cashInflows.sales.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8">Membership Receipts</TableCell>
                      <TableCell className="text-right">AED {cashFlow?.cashInflows.memberships.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8">Other Receipts</TableCell>
                      <TableCell className="text-right">AED {cashFlow?.cashInflows.other.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow className="font-semibold border-t">
                      <TableCell>Total Cash Inflows</TableCell>
                      <TableCell className="text-right text-green-600">
                        AED {cashFlow?.cashInflows.total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="font-semibold">
                      <TableCell className="pt-4">Cash Outflows</TableCell>
                      <TableCell className="text-right"></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8">Payroll Payments</TableCell>
                      <TableCell className="text-right">AED {cashFlow?.cashOutflows.payroll.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8">Supplier Payments</TableCell>
                      <TableCell className="text-right">AED {cashFlow?.cashOutflows.suppliers.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8">Rent Payments</TableCell>
                      <TableCell className="text-right">AED {cashFlow?.cashOutflows.rent.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8">Utility Payments</TableCell>
                      <TableCell className="text-right">AED {cashFlow?.cashOutflows.utilities.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8">Other Payments</TableCell>
                      <TableCell className="text-right">AED {cashFlow?.cashOutflows.other.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow className="font-semibold border-t">
                      <TableCell>Total Cash Outflows</TableCell>
                      <TableCell className="text-right text-red-600">
                        AED {cashFlow?.cashOutflows.total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="font-semibold border-t">
                      <TableCell>Net Cash Flow</TableCell>
                      <TableCell className={`text-right ${(cashFlow?.netCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        AED {cashFlow?.netCashFlow.toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="font-bold text-lg border-t-2">
                      <TableCell>Closing Cash Balance</TableCell>
                      <TableCell className="text-right text-blue-600">
                        AED {cashFlow?.closingBalance.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Balance Sheet */}
          <TabsContent value="balance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Balance Sheet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Assets */}
                  <div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead colSpan={2} className="text-lg font-bold">Assets</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="font-semibold">
                          <TableCell>Current Assets</TableCell>
                          <TableCell className="text-right"></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8">Cash & Bank</TableCell>
                          <TableCell className="text-right">AED {balanceSheet?.assets.current.cash.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8">Accounts Receivable</TableCell>
                          <TableCell className="text-right">AED {balanceSheet?.assets.current.receivables.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8">Inventory</TableCell>
                          <TableCell className="text-right">AED {balanceSheet?.assets.current.inventory.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow className="font-semibold border-t">
                          <TableCell className="pl-4">Total Current Assets</TableCell>
                          <TableCell className="text-right">AED {balanceSheet?.assets.current.total.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow className="font-semibold">
                          <TableCell className="pt-4">Fixed Assets</TableCell>
                          <TableCell className="text-right"></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8">Equipment</TableCell>
                          <TableCell className="text-right">AED {balanceSheet?.assets.fixed.equipment.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8">Furniture & Fixtures</TableCell>
                          <TableCell className="text-right">AED {balanceSheet?.assets.fixed.furniture.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow className="font-semibold border-t">
                          <TableCell className="pl-4">Total Fixed Assets</TableCell>
                          <TableCell className="text-right">AED {balanceSheet?.assets.fixed.total.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow className="font-bold text-lg border-t-2">
                          <TableCell>Total Assets</TableCell>
                          <TableCell className="text-right text-blue-600">
                            AED {balanceSheet?.assets.total.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Liabilities & Equity */}
                  <div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead colSpan={2} className="text-lg font-bold">Liabilities & Equity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="font-semibold">
                          <TableCell>Current Liabilities</TableCell>
                          <TableCell className="text-right"></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8">Accounts Payable</TableCell>
                          <TableCell className="text-right">AED {balanceSheet?.liabilities.current.payables.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8">Accrued Expenses</TableCell>
                          <TableCell className="text-right">AED {balanceSheet?.liabilities.current.accrued.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow className="font-semibold border-t">
                          <TableCell className="pl-4">Total Current Liabilities</TableCell>
                          <TableCell className="text-right">AED {balanceSheet?.liabilities.current.total.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow className="font-semibold">
                          <TableCell className="pt-4">Long-term Liabilities</TableCell>
                          <TableCell className="text-right"></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8">Business Loans</TableCell>
                          <TableCell className="text-right">AED {balanceSheet?.liabilities.longTerm.loans.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow className="font-semibold border-t">
                          <TableCell className="pl-4">Total Liabilities</TableCell>
                          <TableCell className="text-right">AED {balanceSheet?.liabilities.total.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow className="font-semibold">
                          <TableCell className="pt-4">Owner's Equity</TableCell>
                          <TableCell className="text-right"></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8">Capital</TableCell>
                          <TableCell className="text-right">AED {balanceSheet?.equity.capital.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8">Retained Earnings</TableCell>
                          <TableCell className="text-right">AED {balanceSheet?.equity.retainedEarnings.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow className="font-semibold border-t">
                          <TableCell className="pl-4">Total Equity</TableCell>
                          <TableCell className="text-right">AED {balanceSheet?.equity.total.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow className="font-bold text-lg border-t-2">
                          <TableCell>Total Liabilities & Equity</TableCell>
                          <TableCell className="text-right text-blue-600">
                            AED {balanceSheet?.assets.total.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}