/**
 * HERA Finance DNA - Salon Finance Management Page
 * 
 * Daily Sales → GL Journals and Owner Expenses UI
 * Tabs: Daily Posting | Expenses
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Calendar, CheckCircle, AlertCircle, DollarSign, Receipt, Upload, Plus, Trash2 } from 'lucide-react';
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider';
import { getDailyPostingStatus } from '@/lib/finance/dailySales';
import { createExpense, getExpenseHistory } from '@/lib/finance/expenses';
import { getGLAccounts } from '@/lib/finance/policy';
import { PageLayout } from '@/components/universal/PageLayout';
import { PageHeader } from '@/components/universal/PageHeader';

interface DailyPostingStatusItem {
  branch_id: string;
  day: string;
  posted: boolean;
  total_amount?: number;
  transaction_count?: number;
  transaction_id?: string;
}

interface ExpenseHistoryItem {
  id: string;
  date: string;
  vendor?: string;
  memo: string;
  total_amount: number;
  currency: string;
  status: string;
  line_count: number;
}

interface GLAccount {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface ExpenseLine {
  account_id: string;
  amount: number;
  tax_rate?: number;
  description?: string;
  attachment_url?: string;
}

export default function SalonFinancePage() {
  const { currentOrganization, isAuthenticated } = useMultiOrgAuth();
  const { toast } = useToast();
  
  // State for daily posting
  const [dailyStatus, setDailyStatus] = useState<DailyPostingStatusItem[]>([]);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  
  // State for expenses
  const [expenseHistory, setExpenseHistory] = useState<ExpenseHistoryItem[]>([]);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(true);
  const [isCreatingExpense, setIsCreatingExpense] = useState(false);
  const [glAccounts, setGLAccounts] = useState<GLAccount[]>([]);
  
  // Expense form state
  const [expenseForm, setExpenseForm] = useState({
    vendor: '',
    memo: '',
    payment_method: 'cash' as 'cash' | 'bank' | 'credit_card' | 'pay_later',
    payment_account_id: '',
    lines: [{ account_id: '', amount: 0, tax_rate: 5, description: '', attachment_url: '' }] as ExpenseLine[]
  });

  // Load data on mount
  useEffect(() => {
    if (currentOrganization?.id) {
      loadDailyStatus();
      loadExpenseHistory();
      loadGLAccounts();
    }
  }, [currentOrganization?.id]);

  const loadDailyStatus = async () => {
    if (!currentOrganization?.id) return;
    
    setIsLoadingStatus(true);
    try {
      // Get last 7 days
      const days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().slice(0, 10);
      });

      // Mock branch ID - in real implementation, get from organization
      const branchIds = [currentOrganization.id]; // Use org as branch for now
      
      const status = await getDailyPostingStatus({
        organization_id: currentOrganization.id,
        branch_ids: branchIds,
        days
      });
      
      setDailyStatus(status);
    } catch (error) {
      console.error('Error loading daily status:', error);
      toast({
        title: 'Error',
        description: 'Failed to load daily posting status',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const loadExpenseHistory = async () => {
    if (!currentOrganization?.id) return;
    
    setIsLoadingExpenses(true);
    try {
      const result = await getExpenseHistory({
        organization_id: currentOrganization.id,
        limit: 20
      });
      
      setExpenseHistory(result.expenses);
    } catch (error) {
      console.error('Error loading expense history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load expense history',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingExpenses(false);
    }
  };

  const loadGLAccounts = async () => {
    if (!currentOrganization?.id) return;
    
    try {
      const accounts = await getGLAccounts(currentOrganization.id);
      setGLAccounts(accounts);
    } catch (error) {
      console.error('Error loading GL accounts:', error);
    }
  };

  const handlePostNow = async (branchId: string, day: string) => {
    if (!currentOrganization?.id) return;
    
    setIsPosting(true);
    try {
      const response = await fetch('/api/finance/daily-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_id: currentOrganization.id,
          branch_id: branchId,
          day
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Success',
          description: `Daily sales journal posted for ${day}`,
        });
        await loadDailyStatus(); // Refresh status
      } else {
        throw new Error(result.error || 'Failed to post journal');
      }
    } catch (error) {
      console.error('Error posting journal:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to post journal',
        variant: 'destructive'
      });
    } finally {
      setIsPosting(false);
    }
  };

  const handleCreateExpense = async () => {
    if (!currentOrganization?.id) return;
    
    setIsCreatingExpense(true);
    try {
      const result = await createExpense({
        organization_id: currentOrganization.id,
        branch_id: currentOrganization.id, // Use org as branch for now
        when_ts: new Date().toISOString(),
        currency: 'AED',
        vendor: expenseForm.vendor,
        memo: expenseForm.memo,
        payment_method: expenseForm.payment_method,
        payment_account_id: expenseForm.payment_account_id || undefined,
        lines: expenseForm.lines.filter(line => line.account_id && line.amount > 0)
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Expense created and posted to GL',
        });
        
        // Reset form
        setExpenseForm({
          vendor: '',
          memo: '',
          payment_method: 'cash',
          payment_account_id: '',
          lines: [{ account_id: '', amount: 0, tax_rate: 5, description: '', attachment_url: '' }]
        });
        
        await loadExpenseHistory(); // Refresh history
      } else {
        throw new Error(result.error || 'Failed to create expense');
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create expense',
        variant: 'destructive'
      });
    } finally {
      setIsCreatingExpense(false);
    }
  };

  const addExpenseLine = () => {
    setExpenseForm(prev => ({
      ...prev,
      lines: [...prev.lines, { account_id: '', amount: 0, tax_rate: 5, description: '', attachment_url: '' }]
    }));
  };

  const removeExpenseLine = (index: number) => {
    setExpenseForm(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index)
    }));
  };

  const updateExpenseLine = (index: number, field: keyof ExpenseLine, value: any) => {
    setExpenseForm(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) => 
        i === index ? { ...line, [field]: value } : line
      )
    }));
  };

  // Auth check
  if (!isAuthenticated || !currentOrganization) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please log in and select an organization to access finance management.
        </AlertDescription>
      </Alert>
    );
  }

  const totalExpenseAmount = expenseForm.lines.reduce((sum, line) => {
    const gross = line.amount || 0;
    const tax = gross * ((line.tax_rate || 0) / 100);
    return sum + gross + tax;
  }, 0);

  return (
    <PageLayout>
      <PageHeader
        title="Finance Management"
        breadcrumbs={[
          { label: 'HERA' },
          { label: 'SALON OS' },
          { label: 'Finance', isActive: true }
        ]}
      />

      <Tabs defaultValue="daily-posting" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily-posting" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Daily Posting
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Expenses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily-posting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Sales Posting Status</CardTitle>
              <CardDescription>
                Last 7 days posting status per branch. Click "Post Now" to create GL journals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStatus ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">Loading status...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {dailyStatus.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No posting data available for the last 7 days.
                    </p>
                  ) : (
                    <div className="grid gap-3">
                      {dailyStatus.map((item) => (
                        <div
                          key={`${item.branch_id}-${item.day}`}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              {item.posted ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <AlertCircle className="h-5 w-5 text-orange-600" />
                              )}
                              <span className="font-medium">{item.day}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {item.transaction_count || 0} transactions
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              <span>{(item.total_amount || 0).toFixed(2)} AED</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={item.posted ? "default" : "secondary"}>
                              {item.posted ? "Posted" : "Pending"}
                            </Badge>
                            {!item.posted && (item.total_amount || 0) > 0 && (
                              <Button
                                size="sm"
                                onClick={() => handlePostNow(item.branch_id, item.day)}
                                disabled={isPosting}
                              >
                                {isPosting ? "Posting..." : "Post Now"}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create Expense Form */}
            <Card>
              <CardHeader>
                <CardTitle>Create New Expense</CardTitle>
                <CardDescription>
                  Enter expense details with GL account allocation and attachments.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vendor">Vendor</Label>
                    <Input
                      id="vendor"
                      value={expenseForm.vendor}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, vendor: e.target.value }))}
                      placeholder="Vendor name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment_method">Payment Method</Label>
                    <Select
                      value={expenseForm.payment_method}
                      onValueChange={(value: any) => setExpenseForm(prev => ({ ...prev, payment_method: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="pay_later">Pay Later (AP)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="memo">Memo</Label>
                  <Textarea
                    id="memo"
                    value={expenseForm.memo}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, memo: e.target.value }))}
                    placeholder="Description of the expense"
                    rows={2}
                  />
                </div>

                {['cash', 'bank', 'credit_card'].includes(expenseForm.payment_method) && (
                  <div>
                    <Label htmlFor="payment_account">Payment Account</Label>
                    <Select
                      value={expenseForm.payment_account_id}
                      onValueChange={(value) => setExpenseForm(prev => ({ ...prev, payment_account_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment account" />
                      </SelectTrigger>
                      <SelectContent>
                        {glAccounts
                          .filter(acc => ['asset', 'bank', 'cash'].includes(acc.type.toLowerCase()))
                          .map(account => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.code} - {account.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Expense Lines */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Expense Lines</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addExpenseLine}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Line
                    </Button>
                  </div>

                  {expenseForm.lines.map((line, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Line {index + 1}</span>
                        {expenseForm.lines.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExpenseLine(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>GL Account</Label>
                          <Select
                            value={line.account_id}
                            onValueChange={(value) => updateExpenseLine(index, 'account_id', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select account" />
                            </SelectTrigger>
                            <SelectContent>
                              {glAccounts
                                .filter(acc => acc.type.toLowerCase() === 'expense')
                                .map(account => (
                                  <SelectItem key={account.id} value={account.id}>
                                    {account.code} - {account.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Amount (excl. VAT)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={line.amount || ''}
                            onChange={(e) => updateExpenseLine(index, 'amount', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>VAT Rate (%)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={line.tax_rate || ''}
                            onChange={(e) => updateExpenseLine(index, 'tax_rate', parseFloat(e.target.value) || 0)}
                            placeholder="5"
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Input
                            value={line.description || ''}
                            onChange={(e) => updateExpenseLine(index, 'description', e.target.value)}
                            placeholder="Line description"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Attachment URL</Label>
                        <div className="flex gap-2">
                          <Input
                            value={line.attachment_url || ''}
                            onChange={(e) => updateExpenseLine(index, 'attachment_url', e.target.value)}
                            placeholder="https://..."
                          />
                          <Button variant="outline" size="sm">
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>Total Amount (incl. VAT):</span>
                    <span>{totalExpenseAmount.toFixed(2)} AED</span>
                  </div>
                </div>

                <Button
                  onClick={handleCreateExpense}
                  disabled={isCreatingExpense || !expenseForm.memo || expenseForm.lines.every(l => !l.account_id || l.amount <= 0)}
                  className="w-full"
                >
                  {isCreatingExpense ? "Creating..." : "Create Expense"}
                </Button>
              </CardContent>
            </Card>

            {/* Expense History */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Expenses</CardTitle>
                <CardDescription>
                  Last 20 expenses with GL posting status.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingExpenses ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {expenseHistory.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No expenses recorded yet.
                      </p>
                    ) : (
                      expenseHistory.map((expense) => (
                        <div
                          key={expense.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <div className="font-medium">{expense.memo}</div>
                            <div className="text-sm text-muted-foreground">
                              {expense.date} • {expense.vendor || 'No vendor'} • {expense.line_count} line(s)
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {expense.total_amount.toFixed(2)} {expense.currency}
                            </div>
                            <Badge variant={expense.status === 'posted' ? 'default' : 'secondary'} className="text-xs">
                              {expense.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}