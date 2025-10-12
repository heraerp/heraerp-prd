'use client';

import { useState, useEffect } from 'react';
// import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'; // Not needed for demo
import { universalApi } from '@/lib/universal-api-v2';
import { DollarSign, TrendingUp, User, Calendar, Settings, Award } from 'lucide-react';
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
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// Hardcoded organization ID from the SQL setup
const SALON_ORG_ID = '84a3654b-907b-472a-ac8f-a1ffb6fb711b';

interface StaffCommission {
  id: string;
  staff_id: string;
  staff_name: string;
  role: string;
  service_revenue: number;
  product_revenue: number;
  total_revenue: number;
  commission_rate: number;
  commission_earned: number;
  services_count: number;
  target: number;
  achievement_percent: number;
}

interface CommissionRule {
  id: string;
  name: string;
  type: 'service' | 'product' | 'tiered';
  base_rate: number;
  tiers?: Array<{ threshold: number; rate: number }>;
}

interface CommissionSummary {
  totalCommissions: number;
  totalRevenue: number;
  avgCommissionRate: number;
  topPerformer: string;
  totalServices: number;
}

export default function CommissionsPage() {
  // Demo mode - no auth needed
  const [commissions, setCommissions] = useState<StaffCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<CommissionSummary>({
    totalCommissions: 0,
    totalRevenue: 0,
    avgCommissionRate: 0,
    topPerformer: '',
    totalServices: 0
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    type: 'service',
    base_rate: '',
    tier_1_threshold: '',
    tier_1_rate: '',
    tier_2_threshold: '',
    tier_2_rate: ''
  });

  const organizationId = SALON_ORG_ID;

  useEffect(() => {
    if (!organizationId) return;
    loadCommissionData();
  }, [organizationId, selectedMonth]);

  const loadCommissionData = async () => {
    if (!organizationId) return;

    try {
      setLoading(true);
      universalApi.setOrganizationId(organizationId);

      // Load staff entities
      const staffData = await universalApi.read('core_entities', {
        filter: `entity_type:staff`
      });

      // Load transactions for the period
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);
      
      const transactions = await universalApi.read('universal_transactions', {
        filter: `transaction_date:gte:${monthStart.toISOString()},transaction_date:lte:${monthEnd.toISOString()}`
      });

      // Calculate commission data for each staff member
      const commissionsData = await Promise.all(
        staffData.map(async (staff: any) => {
          // Get staff dynamic data
          const dynamicData = await universalApi.read('core_dynamic_data', {
            filter: `entity_id:${staff.id}`
          });
          
          const dynamicDataMap = dynamicData.reduce((acc: any, dd: any) => {
            acc[dd.field_name] = dd.field_value_text || dd.field_value_number || dd.field_value_boolean;
            return acc;
          }, {});

          // Calculate revenues (simulated for demo)
          const serviceRevenue = Math.random() * 15000 + 5000;
          const productRevenue = Math.random() * 3000 + 500;
          const totalRevenue = serviceRevenue + productRevenue;
          const commissionRate = dynamicDataMap.commission_rate || 20;
          const commissionEarned = (totalRevenue * commissionRate) / 100;
          const target = 20000; // Monthly target
          const servicesCount = Math.floor(Math.random() * 100) + 20;

          return {
            id: staff.id,
            staff_id: staff.id,
            staff_name: staff.entity_name,
            role: dynamicDataMap.role || 'Stylist',
            service_revenue: serviceRevenue,
            product_revenue: productRevenue,
            total_revenue: totalRevenue,
            commission_rate: commissionRate,
            commission_earned: commissionEarned,
            services_count: servicesCount,
            target,
            achievement_percent: (totalRevenue / target) * 100
          };
        })
      );

      // Calculate summary
      const totalCommissions = commissionsData.reduce((sum, c) => sum + c.commission_earned, 0);
      const totalRevenue = commissionsData.reduce((sum, c) => sum + c.total_revenue, 0);
      const totalServices = commissionsData.reduce((sum, c) => sum + c.services_count, 0);
      const topPerformer = commissionsData.reduce((max, c) => 
        c.commission_earned > (max?.commission_earned || 0) ? c : max
      , commissionsData[0])?.staff_name || '';

      setCommissions(commissionsData.sort((a, b) => b.commission_earned - a.commission_earned));
      setSummary({
        totalCommissions,
        totalRevenue,
        avgCommissionRate: commissionsData.length > 0 
          ? commissionsData.reduce((sum, c) => sum + c.commission_rate, 0) / commissionsData.length 
          : 0,
        topPerformer,
        totalServices
      });
    } catch (error) {
      console.error('Error loading commission data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load commission data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCommissionRule = async () => {
    if (!organizationId || !ruleForm.name || !ruleForm.base_rate) return;

    try {
      universalApi.setOrganizationId(organizationId);

      // Create commission rule entity
      const rule = await universalApi.createEntity({
        entity_type: 'commission_rule',
        entity_name: ruleForm.name,
        entity_code: `RULE-${Date.now()}`,
        smart_code: 'HERA.SALON.COMMISSION.RULE.V1',
        metadata: {
          type: ruleForm.type,
          base_rate: parseFloat(ruleForm.base_rate)
        }
      });

      toast({
        title: 'Success',
        description: 'Commission rule created successfully',
      });

      setShowRuleDialog(false);
      setRuleForm({
        name: '',
        type: 'service',
        base_rate: '',
        tier_1_threshold: '',
        tier_1_rate: '',
        tier_2_threshold: '',
        tier_2_rate: ''
      });
    } catch (error) {
      console.error('Error saving commission rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to save commission rule',
        variant: 'destructive'
      });
    }
  };

  // Demo mode - no checks needed

  // Prepare chart data
  const chartData = commissions.slice(0, 5).map(c => ({
    name: c.staff_name.split(' ')[0],
    revenue: c.total_revenue,
    commission: c.commission_earned
  }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Commission Tracking</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {format(selectedMonth, 'MMMM yyyy')} Performance
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Commission Rules
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Commission Rule</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="rule_name">Rule Name</Label>
                  <Input
                    id="rule_name"
                    value={ruleForm.name}
                    onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                    placeholder="e.g., Senior Stylist Commission"
                  />
                </div>
                <div>
                  <Label htmlFor="rule_type">Rule Type</Label>
                  <select
                    id="rule_type"
                    className="w-full px-3 py-2 border rounded-md"
                    value={ruleForm.type}
                    onChange={(e) => setRuleForm({ ...ruleForm, type: e.target.value })}
                  >
                    <option value="service">Service Commission</option>
                    <option value="product">Product Commission</option>
                    <option value="tiered">Tiered Commission</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="base_rate">Base Rate (%)</Label>
                  <Input
                    id="base_rate"
                    type="number"
                    value={ruleForm.base_rate}
                    onChange={(e) => setRuleForm({ ...ruleForm, base_rate: e.target.value })}
                    placeholder="20"
                  />
                </div>
                {ruleForm.type === 'tiered' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Tier 1 Threshold (AED)</Label>
                        <Input
                          type="number"
                          value={ruleForm.tier_1_threshold}
                          onChange={(e) => setRuleForm({ ...ruleForm, tier_1_threshold: e.target.value })}
                          placeholder="10000"
                        />
                      </div>
                      <div>
                        <Label>Tier 1 Rate (%)</Label>
                        <Input
                          type="number"
                          value={ruleForm.tier_1_rate}
                          onChange={(e) => setRuleForm({ ...ruleForm, tier_1_rate: e.target.value })}
                          placeholder="25"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Tier 2 Threshold (AED)</Label>
                        <Input
                          type="number"
                          value={ruleForm.tier_2_threshold}
                          onChange={(e) => setRuleForm({ ...ruleForm, tier_2_threshold: e.target.value })}
                          placeholder="20000"
                        />
                      </div>
                      <div>
                        <Label>Tier 2 Rate (%)</Label>
                        <Input
                          type="number"
                          value={ruleForm.tier_2_rate}
                          onChange={(e) => setRuleForm({ ...ruleForm, tier_2_rate: e.target.value })}
                          placeholder="30"
                        />
                      </div>
                    </div>
                  </>
                )}
                <Button 
                  className="w-full" 
                  onClick={handleSaveCommissionRule}
                  disabled={!ruleForm.name || !ruleForm.base_rate}
                >
                  Save Rule
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button>
            <Calendar className="w-4 h-4 mr-2" />
            Calculate Commissions
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AED {summary.totalCommissions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AED {summary.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Generated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Commission</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.avgCommissionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{summary.topPerformer}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalServices}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers Chart */}
      {!loading && (
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `AED ${value.toFixed(0)}`} />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                  <Bar dataKey="commission" fill="#10b981" name="Commission" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Commission Details Table */}
      {loading ? (
        <UniversalInlineLoading text="Loading commission data..." />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Commission Details</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Service Revenue</TableHead>
                  <TableHead>Product Revenue</TableHead>
                  <TableHead>Total Revenue</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Target Achievement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell className="font-medium">{commission.staff_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{commission.role}</Badge>
                    </TableCell>
                    <TableCell>{commission.services_count}</TableCell>
                    <TableCell>AED {commission.service_revenue.toFixed(0)}</TableCell>
                    <TableCell>AED {commission.product_revenue.toFixed(0)}</TableCell>
                    <TableCell className="font-medium">
                      AED {commission.total_revenue.toFixed(0)}
                    </TableCell>
                    <TableCell>{commission.commission_rate}%</TableCell>
                    <TableCell className="font-semibold text-green-600">
                      AED {commission.commission_earned.toFixed(0)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={commission.achievement_percent} className="w-20" />
                        <span className="text-sm">{commission.achievement_percent.toFixed(0)}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Commission Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Service Revenue</span>
                <span className="font-medium">
                  AED {commissions.reduce((sum, c) => sum + c.service_revenue, 0).toFixed(0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Product Revenue</span>
                <span className="font-medium">
                  AED {commissions.reduce((sum, c) => sum + c.product_revenue, 0).toFixed(0)}
                </span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center font-semibold">
                  <span>Total Revenue</span>
                  <span className="text-blue-600">
                    AED {summary.totalRevenue.toFixed(0)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Commission by Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Senior Stylists</span>
                <span className="font-medium">
                  AED {commissions
                    .filter(c => c.role === 'senior_stylist')
                    .reduce((sum, c) => sum + c.commission_earned, 0)
                    .toFixed(0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Stylists</span>
                <span className="font-medium">
                  AED {commissions
                    .filter(c => c.role === 'stylist')
                    .reduce((sum, c) => sum + c.commission_earned, 0)
                    .toFixed(0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Other Staff</span>
                <span className="font-medium">
                  AED {commissions
                    .filter(c => c.role !== 'stylist' && c.role !== 'senior_stylist')
                    .reduce((sum, c) => sum + c.commission_earned, 0)
                    .toFixed(0)}
                </span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center font-semibold">
                  <span>Total Commissions</span>
                  <span className="text-green-600">
                    AED {summary.totalCommissions.toFixed(0)}
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