'use client';

import { useState, useEffect } from 'react';
// import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'; // Not needed for demo
import { universalApi } from '@/lib/universal-api-v2';
import { Plus, Edit2, Trash2, Clock, DollarSign, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { UniversalInlineLoading } from '@/components/universal/ui/UniversalLoadingStates';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Hardcoded organization ID from the SQL setup
const SALON_ORG_ID = '84a3654b-907b-472a-ac8f-a1ffb6fb711b';

interface Service {
  id: string;
  entity_name: string;
  entity_code: string;
  metadata?: any;
  dynamic_data?: Record<string, any>;
  status: string;
}

interface ServiceStats {
  totalServices: number;
  activeServices: number;
  averagePrice: number;
  totalBookings: number;
}

export default function ServicesManagementPage() {
  // Demo mode - no auth needed
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ServiceStats>({
    totalServices: 0,
    activeServices: 0,
    averagePrice: 0,
    totalBookings: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingService, setIsAddingService] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    category: 'hair',
    duration: '30',
    price: '',
    description: ''
  });

  const organizationId = SALON_ORG_ID;

  useEffect(() => {
    if (!organizationId) return;
    loadServices();
  }, [organizationId]);

  const loadServices = async () => {
    if (!organizationId) return;
    
    try {
      setLoading(true);
      universalApi.setOrganizationId(organizationId);
      
      // Load service entities
      const servicesData = await universalApi.read('core_entities', {
        filter: `entity_type:service`
      });

      // Load dynamic data for each service
      const servicesWithDetails = await Promise.all(
        servicesData.map(async (s: any) => {
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

      const activeServices = servicesWithDetails.filter(s => s.status === 'active');
      const totalPrice = servicesWithDetails.reduce((sum, s) => sum + (s.dynamic_data?.price || 0), 0);

      setServices(servicesWithDetails);
      setStats({
        totalServices: servicesWithDetails.length,
        activeServices: activeServices.length,
        averagePrice: servicesWithDetails.length > 0 ? totalPrice / servicesWithDetails.length : 0,
        totalBookings: Math.floor(Math.random() * 500) + 100 // Placeholder
      });
    } catch (error) {
      console.error('Error loading services:', error);
      toast({
        title: 'Error',
        description: 'Failed to load services',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveService = async () => {
    if (!organizationId || !serviceForm.name || !serviceForm.price) return;

    try {
      setIsAddingService(true);
      universalApi.setOrganizationId(organizationId);

      if (editingService) {
        // Update existing service
        await universalApi.updateEntity(editingService.id, {
          entity_name: serviceForm.name,
          metadata: { 
            category: serviceForm.category,
            description: serviceForm.description 
          }
        });

        // Update dynamic fields
        await universalApi.setDynamicField(editingService.id, 'price', parseFloat(serviceForm.price));
        await universalApi.setDynamicField(editingService.id, 'duration', parseInt(serviceForm.duration));
        await universalApi.setDynamicField(editingService.id, 'category', serviceForm.category);
        await universalApi.setDynamicField(editingService.id, 'description', serviceForm.description);

        toast({
          title: 'Success',
          description: 'Service updated successfully'
        });
      } else {
        // Create new service
        const serviceEntity = await universalApi.createEntity({
          entity_type: 'service',
          entity_name: serviceForm.name,
          entity_code: `SVC-${Date.now()}`,
          smart_code: 'HERA.SALON.SERVICE.ENTITY.V1',
          metadata: { 
            category: serviceForm.category,
            description: serviceForm.description 
          }
        });

        // Add dynamic fields
        await universalApi.setDynamicField(serviceEntity.id, 'price', parseFloat(serviceForm.price));
        await universalApi.setDynamicField(serviceEntity.id, 'duration', parseInt(serviceForm.duration));
        await universalApi.setDynamicField(serviceEntity.id, 'category', serviceForm.category);
        await universalApi.setDynamicField(serviceEntity.id, 'description', serviceForm.description);

        toast({
          title: 'Success',
          description: 'Service added successfully'
        });
      }

      // Reset form and reload
      setServiceForm({
        name: '',
        category: 'hair',
        duration: '30',
        price: '',
        description: ''
      });
      setEditingService(null);
      loadServices();
    } catch (error) {
      console.error('Error saving service:', error);
      toast({
        title: 'Error',
        description: 'Failed to save service',
        variant: 'destructive'
      });
    } finally {
      setIsAddingService(false);
    }
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setServiceForm({
      name: service.entity_name,
      category: service.dynamic_data?.category || 'hair',
      duration: service.dynamic_data?.duration?.toString() || '30',
      price: service.dynamic_data?.price?.toString() || '',
      description: service.dynamic_data?.description || ''
    });
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!organizationId) return;

    try {
      universalApi.setOrganizationId(organizationId);
      await universalApi.updateEntity(serviceId, { status: 'deleted' });
      
      toast({
        title: 'Success',
        description: 'Service deleted successfully'
      });
      
      loadServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete service',
        variant: 'destructive'
      });
    }
  };

  const filteredServices = services.filter(s => 
    s.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.dynamic_data?.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Demo mode - no checks needed

  const categoryColors: Record<string, string> = {
    hair: 'bg-purple-100 text-purple-800',
    nails: 'bg-pink-100 text-pink-800',
    skin: 'bg-blue-100 text-blue-800',
    makeup: 'bg-red-100 text-red-800',
    spa: 'bg-green-100 text-green-800'
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Service Menu</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your salon services and pricing</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingService(null);
              setServiceForm({
                name: '',
                category: 'hair',
                duration: '30',
                price: '',
                description: ''
              });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Service Name</Label>
                <Input
                  id="name"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  placeholder="e.g., Hair Cut & Style"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  className="w-full px-3 py-2 border rounded-md"
                  value={serviceForm.category}
                  onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                >
                  <option value="hair">Hair</option>
                  <option value="nails">Nails</option>
                  <option value="skin">Skin</option>
                  <option value="makeup">Makeup</option>
                  <option value="spa">Spa</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={serviceForm.duration}
                    onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })}
                    placeholder="30"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price (AED)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                    placeholder="100"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  placeholder="Describe the service..."
                  rows={3}
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleSaveService}
                disabled={isAddingService || !serviceForm.name || !serviceForm.price}
              >
                {isAddingService ? 'Saving...' : (editingService ? 'Update Service' : 'Add Service')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServices}</div>
            <p className="text-xs text-muted-foreground">In catalog</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Services</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeServices}</div>
            <p className="text-xs text-muted-foreground">Available now</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AED {stats.averagePrice.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Per service</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder="Search services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Services Table */}
      {loading ? (
        <UniversalInlineLoading text="Loading services..." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{service.entity_name}</div>
                        {service.dynamic_data?.description && (
                          <div className="text-sm text-gray-500">{service.dynamic_data.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={categoryColors[service.dynamic_data?.category || 'hair']}>
                        {service.dynamic_data?.category || 'hair'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1 text-gray-400" />
                        {service.dynamic_data?.duration || 30} min
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">AED {service.dynamic_data?.price || 0}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={service.status === 'active' ? 'default' : 'secondary'}>
                        {service.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditService(service)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteService(service.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}