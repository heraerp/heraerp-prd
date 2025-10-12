'use client';

import { useState, useEffect } from 'react';
// import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'; // Not needed for demo
import { universalApi } from '@/lib/universal-api-v2';
import { DollarSign, Users, Calendar, Download, Plus, Calculator } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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

// Hardcoded organization ID from the SQL setup
const SALON_ORG_ID = '84a3654b-907b-472a-ac8f-a1ffb6fb711b';

interface StaffPayroll {
  id: string;
  staff_id: string;
  staff_name: string;
  role: string;
  base_salary: number;
  commission: number;
  tips: number;
  deductions: number;
  net_pay: number;
  hours_worked: number;
  status: 'pending' | 'approved' | 'paid';
}

interface PayrollSummary {
  totalPayroll: number;
  totalStaff: number;
  averagePay: number;
  totalCommissions: number;
  pendingApproval: number;
  paidThisMonth: number;
}

export default function PayrollManagementPage() {
  // Demo mode - no auth needed
  const [payrollData, setPayrollData] = useState<StaffPayroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PayrollSummary>({
    totalPayroll: 0,
    totalStaff: 0,
    averagePay: 0,
    totalCommissions: 0,
    pendingApproval: 0,
    paidThisMonth: 0
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [isProcessingPayroll, setIsProcessingPayroll] = useState(false);
  const [payrollForm, setPayrollForm] = useState({
    staff_id: '',
    hours_worked: '',
    overtime_hours: '',
    tips: '',
    deductions: '',
    notes: ''
  });

  const organizationId = SALON_ORG_ID;

  useEffect(() => {
    if (!organizationId) return;
    loadPayrollData();
  }, [organizationId, selectedMonth]);

  const loadPayrollData = async () => {
    if (!organizationId) return;

    try {
      setLoading(true);
      universalApi.setOrganizationId(organizationId);

      // Load staff entities
      const staffData = await universalApi.read('core_entities', {
        filter: `entity_type:staff`
      });

      // Load dynamic data for each staff member
      const staffWithPayroll = await Promise.all(
        staffData.map(async (staff: any) => {
          const dynamicData = await universalApi.read('core_dynamic_data', {
            filter: `entity_id:${staff.id}`
          });
          
          const dynamicDataMap = dynamicData.reduce((acc: any, dd: any) => {
            acc[dd.field_name] = dd.field_value_text || dd.field_value_number || dd.field_value_boolean;
            return acc;
          }, {});

          // Calculate payroll (simulated for demo)
          const hourlyRate = dynamicDataMap.hourly_rate || 50;
          const hoursWorked = 160; // Full time
          const baseSalary = hourlyRate * hoursWorked;
          const commission = Math.random() * 2000; // Simulated
          const tips = Math.random() * 500; // Simulated
          const deductions = baseSalary * 0.15; // 15% deductions
          const netPay = baseSalary + commission + tips - deductions;

          return {
            id: staff.id,
            staff_id: staff.id,
            staff_name: staff.entity_name,
            role: dynamicDataMap.role || 'Stylist',
            base_salary: baseSalary,
            commission,
            tips,
            deductions,
            net_pay: netPay,
            hours_worked: hoursWorked,
            status: 'pending' as const
          };
        })
      );

      // Calculate summary
      const totalPayroll = staffWithPayroll.reduce((sum, p) => sum + p.net_pay, 0);
      const totalCommissions = staffWithPayroll.reduce((sum, p) => sum + p.commission, 0);
      
      setPayrollData(staffWithPayroll);
      setSummary({
        totalPayroll,
        totalStaff: staffWithPayroll.length,
        averagePay: staffWithPayroll.length > 0 ? totalPayroll / staffWithPayroll.length : 0,
        totalCommissions,
        pendingApproval: staffWithPayroll.filter(p => p.status === 'pending').length,
        paidThisMonth: 0
      });
    } catch (error) {
      console.error('Error loading payroll data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payroll data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayroll = async () => {
    if (!organizationId) return;

    try {
      setIsProcessingPayroll(true);
      universalApi.setOrganizationId(organizationId);

      // Create payroll transaction for each staff member
      for (const payroll of payrollData.filter(p => p.status === 'pending')) {
        await universalApi.createTransaction({
          transaction_type: 'payroll',
          smart_code: 'HERA.SALON.PAYROLL.PAYMENT.V1',
          total_amount: payroll.net_pay,
          from_entity_id: payroll.staff_id,
          metadata: {
            month: format(selectedMonth, 'yyyy-MM'),
            base_salary: payroll.base_salary,
            commission: payroll.commission,
            tips: payroll.tips,
            deductions: payroll.deductions,
            hours_worked: payroll.hours_worked
          }
        });
      }

      toast({
        title: 'Success',
        description: 'Payroll processed successfully',
      });

      // Update status to paid
      setPayrollData(prev => prev.map(p => ({ ...p, status: 'paid' })));
    } catch (error) {
      console.error('Error processing payroll:', error);
      toast({
        title: 'Error',
        description: 'Failed to process payroll',
        variant: 'destructive'
      });
    } finally {
      setIsProcessingPayroll(false);
    }
  };

  const handleApprovePayroll = (payrollId: string) => {
    setPayrollData(prev => 
      prev.map(p => p.id === payrollId ? { ...p, status: 'approved' } : p)
    );
    toast({
      title: 'Success',
      description: 'Payroll approved',
    });
  };

  // Demo mode - no checks needed

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'approved':
        return <Badge variant="default">Approved</Badge>;
      case 'paid':
        return <Badge variant="outline" className="text-green-600">Paid</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Payroll Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {format(selectedMonth, 'MMMM yyyy')} Payroll
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Payroll
          </Button>
          <Button 
            onClick={handleProcessPayroll}
            disabled={isProcessingPayroll || payrollData.filter(p => p.status === 'pending').length === 0}
          >
            <Calculator className="w-4 h-4 mr-2" />
            {isProcessingPayroll ? 'Processing...' : 'Process Payroll'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AED {summary.totalPayroll.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff Count</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalStaff}</div>
            <p className="text-xs text-muted-foreground">Active employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Pay</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AED {summary.averagePay.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Per employee</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commissions</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AED {summary.totalCommissions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Table */}
      <Tabs defaultValue="current" className="space-y-4">
        <TabsList>
          <TabsTrigger value="current">Current Payroll</TabsTrigger>
          <TabsTrigger value="history">Payroll History</TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          {loading ? (
            <UniversalInlineLoading text="Loading payroll data..." />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Base Salary</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Tips</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Net Pay</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollData.map((payroll) => (
                      <TableRow key={payroll.id}>
                        <TableCell className="font-medium">{payroll.staff_name}</TableCell>
                        <TableCell>{payroll.role}</TableCell>
                        <TableCell>{payroll.hours_worked}</TableCell>
                        <TableCell>AED {payroll.base_salary.toFixed(2)}</TableCell>
                        <TableCell>AED {payroll.commission.toFixed(2)}</TableCell>
                        <TableCell>AED {payroll.tips.toFixed(2)}</TableCell>
                        <TableCell className="text-red-600">-AED {payroll.deductions.toFixed(2)}</TableCell>
                        <TableCell className="font-semibold">AED {payroll.net_pay.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(payroll.status)}</TableCell>
                        <TableCell className="text-right">
                          {payroll.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleApprovePayroll(payroll.id)}
                            >
                              Approve
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Payroll history will appear here after processing</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payroll Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Payroll Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Base Salaries</span>
                <span className="font-medium">
                  AED {payrollData.reduce((sum, p) => sum + p.base_salary, 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Commissions</span>
                <span className="font-medium">
                  AED {payrollData.reduce((sum, p) => sum + p.commission, 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Tips</span>
                <span className="font-medium">
                  AED {payrollData.reduce((sum, p) => sum + p.tips, 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Deductions</span>
                <span className="font-medium text-red-600">
                  -AED {payrollData.reduce((sum, p) => sum + p.deductions, 0).toFixed(2)}
                </span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center font-semibold">
                  <span>Net Payroll</span>
                  <span className="text-blue-600">
                    AED {payrollData.reduce((sum, p) => sum + p.net_pay, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deductions Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Income Tax</span>
                <span className="font-medium">
                  AED {(payrollData.reduce((sum, p) => sum + p.deductions, 0) * 0.4).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Social Insurance</span>
                <span className="font-medium">
                  AED {(payrollData.reduce((sum, p) => sum + p.deductions, 0) * 0.3).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Health Insurance</span>
                <span className="font-medium">
                  AED {(payrollData.reduce((sum, p) => sum + p.deductions, 0) * 0.2).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Other</span>
                <span className="font-medium">
                  AED {(payrollData.reduce((sum, p) => sum + p.deductions, 0) * 0.1).toFixed(2)}
                </span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center font-semibold">
                  <span>Total Deductions</span>
                  <span className="text-red-600">
                    AED {payrollData.reduce((sum, p) => sum + p.deductions, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}