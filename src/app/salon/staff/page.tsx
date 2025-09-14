'use client';

import { useState, useEffect } from 'react';
// import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'; // Not needed for demo
import { universalApi } from '@/lib/universal-api-v2';
import { Plus, Clock, Calendar, UserCheck, TrendingUp, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { UniversalInlineLoading } from '@/components/universal/ui/UniversalLoadingStates';
import { format } from 'date-fns';

// Hardcoded organization ID from the SQL setup
const SALON_ORG_ID = '84a3654b-907b-472a-ac8f-a1ffb6fb711b';

interface Staff {
  id: string;
  entity_name: string;
  entity_code: string;
  metadata?: any;
  dynamic_data?: Record<string, any>;
  created_at: string;
}

interface StaffStats {
  totalStaff: number;
  activeToday: number;
  onLeave: number;
  averageRating: number;
}

export default function StaffManagementPage() {
  // Demo mode - no auth needed
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StaffStats>({
    totalStaff: 0,
    activeToday: 0,
    onLeave: 0,
    averageRating: 4.8
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    role: 'stylist',
    phone: '',
    email: '',
    hourly_rate: '',
    commission_rate: ''
  });

  const organizationId = SALON_ORG_ID;

  useEffect(() => {
    if (!organizationId) return;
    loadStaff();
  }, [organizationId]);

  const loadStaff = async () => {
    if (!organizationId) return;
    
    try {
      setLoading(true);
      universalApi.setOrganizationId(organizationId);
      
      // Load staff entities
      const staffData = await universalApi.read('core_entities', {
        filter: `entity_type:staff`
      });

      // Load dynamic data for each staff member
      const staffWithDetails = await Promise.all(
        staffData.map(async (s: any) => {
          const dynamicData = await universalApi.read('core_dynamic_data', {
            filter: `entity_id:${s.id}`
          });
          
          const dynamicDataMap = dynamicData.reduce((acc: any, dd: any) => {
            acc[dd.field_name] = dd.field_value_text || dd.field_value_number || dd.field_value_boolean;
            return acc;
          }, {});
          
          return { ...s, dynamic_data: dynamicDataMap };
        })
      );

      setStaff(staffWithDetails);
      setStats({
        totalStaff: staffWithDetails.length,
        activeToday: Math.floor(staffWithDetails.length * 0.8),
        onLeave: Math.floor(staffWithDetails.length * 0.2),
        averageRating: 4.8
      });
    } catch (error) {
      console.error('Error loading staff:', error);
      toast({
        title: 'Error',
        description: 'Failed to load staff members',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async () => {
    if (!organizationId || !newStaff.name) return;

    try {
      setIsAddingStaff(true);
      universalApi.setOrganizationId(organizationId);

      // Create staff entity
      const staffEntity = await universalApi.createEntity({
        entity_type: 'staff',
        entity_name: newStaff.name,
        entity_code: `STAFF-${Date.now()}`,
        smart_code: 'HERA.SALON.STAFF.ENTITY.v1',
        metadata: { role: newStaff.role }
      });

      // Add dynamic fields
      const dynamicFields = [
        { field_name: 'phone', value: newStaff.phone },
        { field_name: 'email', value: newStaff.email },
        { field_name: 'hourly_rate', value: parseFloat(newStaff.hourly_rate) || 0 },
        { field_name: 'commission_rate', value: parseFloat(newStaff.commission_rate) || 0 },
        { field_name: 'role', value: newStaff.role }
      ];

      for (const field of dynamicFields) {
        if (field.value) {
          await universalApi.setDynamicField(staffEntity.id, field.field_name, field.value);
        }
      }

      toast({
        title: 'Success',
        description: 'Staff member added successfully'
      });

      // Reset form and reload
      setNewStaff({
        name: '',
        role: 'stylist',
        phone: '',
        email: '',
        hourly_rate: '',
        commission_rate: ''
      });
      loadStaff();
    } catch (error) {
      console.error('Error adding staff:', error);
      toast({
        title: 'Error',
        description: 'Failed to add staff member',
        variant: 'destructive'
      });
    } finally {
      setIsAddingStaff(false);
    }
  };

  const filteredStaff = staff.filter(s => 
    s.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.dynamic_data?.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Demo mode - no checks needed

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Staff Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your salon team members</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  placeholder="Staff member name"
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  className="w-full px-3 py-2 border rounded-md"
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                >
                  <option value="stylist">Stylist</option>
                  <option value="senior_stylist">Senior Stylist</option>
                  <option value="manager">Manager</option>
                  <option value="receptionist">Receptionist</option>
                </select>
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  placeholder="+971 50 123 4567"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  placeholder="staff@salon.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hourly_rate">Hourly Rate (AED)</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    value={newStaff.hourly_rate}
                    onChange={(e) => setNewStaff({ ...newStaff, hourly_rate: e.target.value })}
                    placeholder="50"
                  />
                </div>
                <div>
                  <Label htmlFor="commission_rate">Commission %</Label>
                  <Input
                    id="commission_rate"
                    type="number"
                    value={newStaff.commission_rate}
                    onChange={(e) => setNewStaff({ ...newStaff, commission_rate: e.target.value })}
                    placeholder="20"
                  />
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={handleAddStaff}
                disabled={isAddingStaff || !newStaff.name}
              >
                {isAddingStaff ? 'Adding...' : 'Add Staff Member'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStaff}</div>
            <p className="text-xs text-muted-foreground">Team members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeToday}</div>
            <p className="text-xs text-muted-foreground">Working now</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Leave</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.onLeave}</div>
            <p className="text-xs text-muted-foreground">Away today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating}</div>
            <p className="text-xs text-muted-foreground">Out of 5.0</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder="Search by name or role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Staff List */}
      {loading ? (
        <UniversalInlineLoading text="Loading staff data..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((member) => (
            <Card key={member.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {member.entity_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{member.entity_name}</h3>
                    <Badge variant="secondary" className="mt-1">
                      {member.dynamic_data?.role || 'Stylist'}
                    </Badge>
                    <div className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      {member.dynamic_data?.phone && (
                        <div>📱 {member.dynamic_data.phone}</div>
                      )}
                      {member.dynamic_data?.email && (
                        <div>✉️ {member.dynamic_data.email}</div>
                      )}
                      <div className="flex gap-4 mt-2">
                        {member.dynamic_data?.hourly_rate && (
                          <span>💰 AED {member.dynamic_data.hourly_rate}/hr</span>
                        )}
                        {member.dynamic_data?.commission_rate && (
                          <span>📊 {member.dynamic_data.commission_rate}%</span>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-gray-500">
                      Joined {format(new Date(member.created_at), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}