'use client';

import { useState, useEffect } from 'react';
// import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'; // Not needed for demo
import { universalApi } from '@/lib/universal-api-v2';
import { Receipt, Plus, TrendingDown, Calendar, FileText, AlertCircle, DollarSign, Search, Filter, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { UniversalInlineLoading } from '@/components/universal/ui/UniversalLoadingStates';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { cn } from '@/lib/utils';

// Hardcoded organization ID from the SQL setup
const SALON_ORG_ID = '84a3654b-907b-472a-ac8f-a1ffb6fb711b';

interface Expense {
  id: string;
  transaction_date: string;
  vendor_name: string;
  category: string;
  description: string;
  amount: number;
  payment_method: string;
  status: 'pending' | 'approved' | 'paid';
  invoice_number?: string;
  due_date?: string;
}

interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

interface ExpenseSummary {
  totalExpenses: number;
  pendingApproval: number;
  unpaidInvoices: number;
  overdueAmount: number;
  categoriesBreakdown: ExpenseCategory[];
}

export default function ExpensesTrackingPage() {
  // Demo mode - no auth needed
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ExpenseSummary>({
    totalExpenses: 0,
    pendingApproval: 0,
    unpaidInvoices: 0,
    overdueAmount: 0,
    categoriesBreakdown: []
  });
  const [selectedMonth] = useState(new Date());
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    vendor_name: '',
    category: 'supplies',
    description: '',
    amount: '',
    payment_method: 'bank_transfer',
    invoice_number: '',
    due_date: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  const organizationId = SALON_ORG_ID;

  useEffect(() => {
    if (!organizationId) return;
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, selectedMonth]);

  const loadExpenses = async () => {
    if (!organizationId) return;

    try {
      setLoading(true);
      universalApi.setOrganizationId(organizationId);

      // Load expense transactions
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);
      
      const transactions = await universalApi.read('universal_transactions', {
        filter: `transaction_type:expense,transaction_date:gte:${monthStart.toISOString()},transaction_date:lte:${monthEnd.toISOString()}`
      });

      // Transform transactions to expense format (simulated for demo)
      const expenseData: Expense[] = transactions.map((t: Record<string, any>) => ({
        id: t.id,
        transaction_date: t.transaction_date,
        vendor_name: t.metadata?.vendor_name || 'Unknown Vendor',
        category: t.metadata?.category || 'other',
        description: t.metadata?.description || '',
        amount: t.total_amount,
        payment_method: t.metadata?.payment_method || 'bank_transfer',
        status: t.metadata?.status || 'pending',
        invoice_number: t.metadata?.invoice_number,
        due_date: t.metadata?.due_date
      }));

      // No demo data - use only real Supabase data
      // If no expenses exist, the page will show appropriate empty state

      // Calculate summary
      const totalExpenses = expenseData.reduce((sum, e) => sum + e.amount, 0);
      const pendingApproval = expenseData.filter(e => e.status === 'pending').length;
      const unpaidInvoices = expenseData.filter(e => e.status !== 'paid').length;
      const overdueAmount = expenseData
        .filter(e => e.due_date && new Date(e.due_date) < new Date() && e.status !== 'paid')
        .reduce((sum, e) => sum + e.amount, 0);

      // Calculate category breakdown
      const categoryTotals: Record<string, number> = {};
      expenseData.forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
      });

      const categoryColors: Record<string, string> = {
        supplies: '#6C63FF',
        rent: '#6C63FF',
        utilities: '#6C63FF',
        marketing: '#6C63FF',
        payroll: '#6C63FF',
        other: '#6C63FF'
      };

      const categoriesBreakdown: ExpenseCategory[] = Object.entries(categoryTotals).map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalExpenses) * 100,
        color: categoryColors[category] || '#6b7280'
      }));

      setExpenses(expenseData);
      setSummary({
        totalExpenses,
        pendingApproval,
        unpaidInvoices,
        overdueAmount,
        categoriesBreakdown
      });
    } catch (error) {
      console.error('Error loading expenses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load expenses',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!organizationId || !expenseForm.vendor_name || !expenseForm.amount) return;

    try {
      setIsAddingExpense(true);
      universalApi.setOrganizationId(organizationId);

      // Create expense transaction
      await universalApi.createTransaction({
        transaction_type: 'expense',
        smart_code: 'HERA.SALON.EXPENSE.PAYMENT.v1',
        total_amount: parseFloat(expenseForm.amount),
        metadata: {
          vendor_name: expenseForm.vendor_name,
          category: expenseForm.category,
          description: expenseForm.description,
          payment_method: expenseForm.payment_method,
          invoice_number: expenseForm.invoice_number,
          due_date: expenseForm.due_date,
          status: 'pending'
        }
      });

      toast({
        title: 'Success',
        description: 'Expense recorded successfully',
      });

      // Reset form and reload
      setExpenseForm({
        vendor_name: '',
        category: 'supplies',
        description: '',
        amount: '',
        payment_method: 'bank_transfer',
        invoice_number: '',
        due_date: ''
      });
      loadExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to add expense',
        variant: 'destructive'
      });
    } finally {
      setIsAddingExpense(false);
    }
  };

  const handleApproveExpense = (expenseId: string) => {
    setExpenses(prev => 
      prev.map(e => e.id === expenseId ? { ...e, status: 'approved' } : e)
    );
    toast({
      title: 'Success',
      description: 'Expense approved',
    });
  };

  const handleMarkAsPaid = (expenseId: string) => {
    setExpenses(prev => 
      prev.map(e => e.id === expenseId ? { ...e, status: 'paid' } : e)
    );
    toast({
      title: 'Success',
      description: 'Expense marked as paid',
    });
  };

  const filteredExpenses = expenses.filter(e => 
    e.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Demo mode - no checks needed

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-[#EAE6F8] text-[#6C63FF] border border-[#6C63FF]/20">
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-[#D9D4F2] text-[#6C63FF] border border-[#6C63FF]/30">
            Approved
          </Badge>
        );
      case 'paid':
        return (
          <Badge className="bg-[#6C63FF]/10 text-[#6C63FF] border border-[#6C63FF]/20">
            <DollarSign className="w-3 h-3 mr-1" />
            Paid
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryMap: Record<string, string> = {
      supplies: '📦',
      rent: '🏢',
      utilities: '💡',
      marketing: '📢',
      payroll: '👥',
      other: '📌'
    };
    return categoryMap[category] || '📌';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F3FA] via-[#EAE6F8] to-[#D9D4F2] dark:from-slate-950 dark:via-[#603f8b]/20 dark:to-[#a16ae8]/10">
      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2280%22%20height%3D%2280%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cdefs%3E%3Cpattern%20id%3D%22dots%22%20width%3D%2280%22%20height%3D%2280%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Ccircle%20cx%3D%224%22%20cy%3D%224%22%20r%3D%221%22%20fill%3D%22%236C63FF%22%20opacity%3D%220.1%22%2F%3E%3C%2Fpattern%3E%3C%2Fdefs%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22url(%23dots)%22%2F%3E%3C%2Fsvg%3E')] bg-center" />
        <div className="absolute top-0 -left-4 w-96 h-96 bg-[#6C63FF] rounded-full mix-blend-multiply filter blur-3xl opacity-8 animate-blob" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-[#D9D4F2] rounded-full mix-blend-multiply filter blur-3xl opacity-12 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-[#EAE6F8] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000" />
      </div>

      {/* Main Content Container - Full Width Box */}
      <div className="min-h-screen bg-white/60 backdrop-blur-sm shadow-2xl border-l border-white/30">
        <div className="container mx-auto p-8 space-y-8">
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/40">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold text-[#2B2B2B] dark:from-[#a16ae8] dark:via-[#fd49a0] dark:to-[#b4fee7] dark:bg-clip-text dark:text-transparent">
                  Expense Tracking
                </h1>
                <p className="text-[#2B2B2B]/70 dark:text-slate-400 mt-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#6C63FF]" />
                  {format(selectedMonth, 'MMMM yyyy')} Financial Overview
                </p>
              </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-[#6C63FF] hover:bg-[#6C63FF]/90 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0 rounded-xl px-6 py-2">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Expense
                </Button>
              </DialogTrigger>
          <DialogContent className="backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border border-white/20 dark:border-slate-800/20">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-[#2B2B2B] dark:from-[#a16ae8] dark:via-[#fd49a0] dark:to-[#b4fee7] dark:bg-clip-text dark:text-transparent">
                Record New Expense
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-6">
              <div>
                <Label htmlFor="vendor">Vendor Name</Label>
                <Input
                  id="vendor"
                  value={expenseForm.vendor_name}
                  onChange={(e) => setExpenseForm({ ...expenseForm, vendor_name: e.target.value })}
                  placeholder="e.g., Beauty Supplies Co."
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  className="w-full px-3 py-2 border rounded-md"
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                >
                  <option value="supplies">Supplies</option>
                  <option value="rent">Rent</option>
                  <option value="utilities">Utilities</option>
                  <option value="marketing">Marketing</option>
                  <option value="payroll">Payroll</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label htmlFor="amount">Amount (AED)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="Brief description of the expense..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="payment_method">Payment Method</Label>
                  <select
                    id="payment_method"
                    className="w-full px-3 py-2 border rounded-md"
                    value={expenseForm.payment_method}
                    onChange={(e) => setExpenseForm({ ...expenseForm, payment_method: e.target.value })}
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="cash">Cash</option>
                    <option value="auto_debit">Auto Debit</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="invoice_number">Invoice Number</Label>
                  <Input
                    id="invoice_number"
                    value={expenseForm.invoice_number}
                    onChange={(e) => setExpenseForm({ ...expenseForm, invoice_number: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={expenseForm.due_date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, due_date: e.target.value })}
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleAddExpense}
                disabled={isAddingExpense || !expenseForm.vendor_name || !expenseForm.amount}
              >
                {isAddingExpense ? 'Recording...' : 'Record Expense'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="group bg-[#F5F3FA] hover:bg-[#EAE6F8] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-white/60 hover:scale-105">
              <div className="flex flex-row items-center justify-between space-y-0">
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#2B2B2B]/70">Total Expenses</p>
                  <div className="text-3xl font-bold text-[#2B2B2B] mt-2">
                    AED {summary.totalExpenses.toLocaleString()}
                  </div>
                  <p className="text-xs text-[#2B2B2B]/60 mt-1">This month</p>
                </div>
                <div className="p-3 bg-[#6C63FF]/10 rounded-xl">
                  <Receipt className="h-6 w-6 text-[#6C63FF]" />
                </div>
              </div>
            </div>

            <div className="group bg-[#EAE6F8] hover:bg-[#D9D4F2] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-white/60 hover:scale-105">
              <div className="flex flex-row items-center justify-between space-y-0">
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#2B2B2B]/70">Pending Approval</p>
                  <div className="text-3xl font-bold text-[#6C63FF] mt-2">
                    {summary.pendingApproval}
                  </div>
                  <p className="text-xs text-[#2B2B2B]/60 mt-1">Expenses to review</p>
                </div>
                <div className="p-3 bg-[#6C63FF]/10 rounded-xl">
                  <FileText className="h-6 w-6 text-[#6C63FF]" />
                </div>
              </div>
            </div>

            <div className="group bg-[#D9D4F2] hover:bg-[#EAE6F8] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-white/60 hover:scale-105">
              <div className="flex flex-row items-center justify-between space-y-0">
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#2B2B2B]/70">Unpaid Invoices</p>
                  <div className="text-3xl font-bold text-[#6C63FF] mt-2">
                    {summary.unpaidInvoices}
                  </div>
                  <p className="text-xs text-[#2B2B2B]/60 mt-1">Awaiting payment</p>
                </div>
                <div className="p-3 bg-[#6C63FF]/10 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-[#6C63FF]" />
                </div>
              </div>
            </div>

            <div className="group bg-[#F5F3FA] hover:bg-[#EAE6F8] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-white/60 hover:scale-105">
              <div className="flex flex-row items-center justify-between space-y-0">
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#2B2B2B]/70">Overdue Amount</p>
                  <div className="text-3xl font-bold text-[#6C63FF] mt-2">
                    AED {summary.overdueAmount.toLocaleString()}
                  </div>
                  <p className="text-xs text-[#2B2B2B]/60 mt-1">Past due date</p>
                </div>
                <div className="p-3 bg-[#6C63FF]/10 rounded-xl">
                  <TrendingDown className="h-6 w-6 text-[#6C63FF]" />
                </div>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          {!loading && summary.categoriesBreakdown.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/40">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-[#2B2B2B] mb-4">
                    Expense Distribution
                  </h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summary.categoriesBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="amount"
                        label={({ percentage }) => `${percentage.toFixed(0)}%`}
                      >
                        {summary.categoriesBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => `AED ${value.toFixed(0)}`}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/40">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-[#2B2B2B] mb-4">
                    Category Details
                  </h3>
                <div className="space-y-4">
                  {summary.categoriesBreakdown.map((cat) => (
                    <div key={cat.category} className="group">
                      <div className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F5F3FA] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{getCategoryIcon(cat.category)}</div>
                          <div>
                            <p className="capitalize font-medium text-[#2B2B2B]">
                              {cat.category}
                            </p>
                            <p className="text-sm text-[#2B2B2B]/60">
                              {cat.percentage.toFixed(1)}% of total
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-lg text-[#2B2B2B]">
                            AED {cat.amount.toFixed(0)}
                          </div>
                        </div>
                      </div>
                      <div className="mx-3 mt-2">
                        <div className="w-full bg-[#EAE6F8]/50 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-500 bg-[#6C63FF]"
                            style={{
                              width: `${cat.percentage}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

          {/* Search & Filters */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/40">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C63FF]" />
                <Input
                  placeholder="Search vendors, categories, descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[#F5F3FA] border-[#6C63FF]/20 text-[#2B2B2B] focus:bg-white focus:border-[#6C63FF]/50"
                />
              </div>
              <Button variant="outline" className="bg-[#F5F3FA] border-[#6C63FF]/20 text-[#6C63FF] hover:bg-[#6C63FF]/10">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/40">
            <Tabs defaultValue="all" className="p-6">
              <TabsList className="bg-[#F5F3FA] p-1 rounded-xl border border-[#6C63FF]/10">
                <TabsTrigger value="all" className="data-[state=active]:bg-[#6C63FF] data-[state=active]:text-white data-[state=active]:shadow-sm text-[#2B2B2B] transition-all">
                  All Expenses
                </TabsTrigger>
                <TabsTrigger value="pending" className="data-[state=active]:bg-[#6C63FF] data-[state=active]:text-white data-[state=active]:shadow-sm text-[#2B2B2B] transition-all">
                  Pending Approval
                </TabsTrigger>
                <TabsTrigger value="unpaid" className="data-[state=active]:bg-[#6C63FF] data-[state=active]:text-white data-[state=active]:shadow-sm text-[#2B2B2B] transition-all">
                  Unpaid
                </TabsTrigger>
              </TabsList>

            <TabsContent value="all" className="mt-6">
              {loading ? (
                <div className="flex justify-center py-12">
                  <UniversalInlineLoading text="Loading expense data..." />
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#F5F3FA] border-b border-[#6C63FF]/10">
                        <TableHead className="font-semibold text-[#2B2B2B]">Date</TableHead>
                        <TableHead className="font-semibold text-[#2B2B2B]">Vendor</TableHead>
                        <TableHead className="font-semibold text-[#2B2B2B]">Category</TableHead>
                        <TableHead className="font-semibold text-[#2B2B2B]">Description</TableHead>
                        <TableHead className="font-semibold text-[#2B2B2B]">Amount</TableHead>
                        <TableHead className="font-semibold text-[#2B2B2B]">Invoice</TableHead>
                        <TableHead className="font-semibold text-[#2B2B2B]">Status</TableHead>
                        <TableHead className="text-right font-semibold text-[#2B2B2B]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpenses.length > 0 ? (
                        filteredExpenses.map((expense, index) => (
                          <TableRow 
                            key={expense.id} 
                            className={cn(
                              "border-b border-[#6C63FF]/5 hover:bg-[#F5F3FA]/50 transition-colors",
                              index % 2 === 0 ? "bg-white/50" : "bg-[#F5F3FA]/30"
                            )}
                          >
                            <TableCell className="text-[#2B2B2B]/70">
                              {format(new Date(expense.transaction_date), 'MMM d')}
                            </TableCell>
                            <TableCell className="font-medium text-[#2B2B2B]">
                              {expense.vendor_name}
                            </TableCell>
                            <TableCell>
                              <span className="flex items-center gap-2">
                                <span className="text-xl">{getCategoryIcon(expense.category)}</span>
                                <span className="capitalize text-[#2B2B2B]/80">{expense.category}</span>
                              </span>
                            </TableCell>
                            <TableCell className="text-[#2B2B2B]/70">
                              {expense.description || '-'}
                            </TableCell>
                            <TableCell className="font-semibold text-[#2B2B2B]">
                              AED {expense.amount.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-[#2B2B2B]/70">
                              {expense.invoice_number || '-'}
                            </TableCell>
                            <TableCell>{getStatusBadge(expense.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {expense.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleApproveExpense(expense.id)}
                                    className="bg-[#F5F3FA] border-[#6C63FF]/30 text-[#6C63FF] hover:bg-[#6C63FF] hover:text-white transition-all"
                                  >
                                    Approve
                                  </Button>
                                )}
                                {expense.status === 'approved' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleMarkAsPaid(expense.id)}
                                    className="bg-[#6C63FF] hover:bg-[#6C63FF]/90 text-white shadow-sm"
                                  >
                                    Mark Paid
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-[#6C63FF] hover:bg-[#F5F3FA]"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12">
                            <div className="flex flex-col items-center gap-3">
                              <Receipt className="h-12 w-12 text-[#6C63FF]/30" />
                              <div>
                                <p className="text-[#2B2B2B]/60 font-medium">No expenses found</p>
                                <p className="text-sm text-[#2B2B2B]/40">Start by recording your first expense</p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="pending" className="mt-6">
              <div className="overflow-hidden rounded-xl">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#F5F3FA] border-b border-[#6C63FF]/10">
                      <TableHead className="font-semibold text-[#2B2B2B]">Date</TableHead>
                      <TableHead className="font-semibold text-[#2B2B2B]">Vendor</TableHead>
                      <TableHead className="font-semibold text-[#2B2B2B]">Category</TableHead>
                      <TableHead className="font-semibold text-[#2B2B2B]">Description</TableHead>
                      <TableHead className="font-semibold text-[#2B2B2B]">Amount</TableHead>
                      <TableHead className="text-right font-semibold text-[#2B2B2B]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.filter(e => e.status === 'pending').map((expense, index) => (
                      <TableRow 
                        key={expense.id}
                        className={cn(
                          "border-b border-[#6C63FF]/5 hover:bg-[#F5F3FA]/50 transition-colors",
                          index % 2 === 0 ? "bg-white/50" : "bg-[#F5F3FA]/30"
                        )}
                      >
                        <TableCell className="text-[#2B2B2B]/70">
                          {format(new Date(expense.transaction_date), 'MMM d')}
                        </TableCell>
                        <TableCell className="font-medium text-[#2B2B2B]">
                          {expense.vendor_name}
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-2">
                            <span className="text-xl">{getCategoryIcon(expense.category)}</span>
                            <span className="capitalize text-[#2B2B2B]/80">{expense.category}</span>
                          </span>
                        </TableCell>
                        <TableCell className="text-[#2B2B2B]/70">
                          {expense.description || '-'}
                        </TableCell>
                        <TableCell className="font-semibold text-[#2B2B2B]">
                          AED {expense.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApproveExpense(expense.id)}
                            className="bg-[#F5F3FA] border-[#6C63FF]/30 text-[#6C63FF] hover:bg-[#6C63FF] hover:text-white transition-all"
                          >
                            Approve
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="unpaid" className="mt-6">
              <div className="overflow-hidden rounded-xl">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#F5F3FA] border-b border-[#6C63FF]/10">
                      <TableHead className="font-semibold text-[#2B2B2B]">Date</TableHead>
                      <TableHead className="font-semibold text-[#2B2B2B]">Vendor</TableHead>
                      <TableHead className="font-semibold text-[#2B2B2B]">Category</TableHead>
                      <TableHead className="font-semibold text-[#2B2B2B]">Amount</TableHead>
                      <TableHead className="font-semibold text-[#2B2B2B]">Due Date</TableHead>
                      <TableHead className="text-right font-semibold text-[#2B2B2B]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.filter(e => e.status !== 'paid').map((expense, index) => (
                      <TableRow 
                        key={expense.id}
                        className={cn(
                          "border-b border-[#6C63FF]/5 hover:bg-[#F5F3FA]/50 transition-colors",
                          index % 2 === 0 ? "bg-white/50" : "bg-[#F5F3FA]/30"
                        )}
                      >
                        <TableCell className="text-[#2B2B2B]/70">
                          {format(new Date(expense.transaction_date), 'MMM d')}
                        </TableCell>
                        <TableCell className="font-medium text-[#2B2B2B]">
                          {expense.vendor_name}
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-2">
                            <span className="text-xl">{getCategoryIcon(expense.category)}</span>
                            <span className="capitalize text-[#2B2B2B]/80">{expense.category}</span>
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold text-[#2B2B2B]">
                          AED {expense.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {expense.due_date ? (
                            <span className={cn(
                              "font-medium",
                              new Date(expense.due_date) < new Date() ? 'text-[#6C63FF] font-semibold' : 'text-[#2B2B2B]/70'
                            )}>
                              {format(new Date(expense.due_date), 'MMM d')}
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {expense.status === 'approved' && (
                            <Button
                              size="sm"
                              onClick={() => handleMarkAsPaid(expense.id)}
                              className="bg-[#6C63FF] hover:bg-[#6C63FF]/90 text-white shadow-sm"
                            >
                              Mark Paid
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
