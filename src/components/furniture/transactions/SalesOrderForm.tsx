'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Calculator, CheckCircle, AlertCircle } from 'lucide-react';
import { universalApi } from '@/lib/universal-api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/date-utils'
;

interface SalesOrderLineItem {
  entity_id: string;
  product_name: string;
  quantity: number;
  unit_amount: number;
  line_amount?: number;
  discount_percent?: number;
  discount_amount?: number;
  specifications?: {
    finish?: string;
    dimensions?: string;
    [key: string]: any;
  };
}

interface UCRValidationResult {
  valid: boolean;
  errors: string[];
}

interface UCRPricingResult {
  totalAmount: number;
  lineItems: SalesOrderLineItem[];
}

interface UCRApprovalResult {
  required: boolean;
  rule?: string;
  threshold?: number;
  approvers?: string[];
}

export function SalesOrderForm() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [customerPO, setCustomerPO] = useState('');
  const [lineItems, setLineItems] = useState<SalesOrderLineItem[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    country: '',
    postal: ''
  });
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [pricingSummary, setPricingSummary] = useState<UCRPricingResult | null>(null);
  const [approvalRequired, setApprovalRequired] = useState<UCRApprovalResult | null>(null);
  const [promisedDeliveryDate, setPromisedDeliveryDate] = useState<Date | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load customers
      const customersData = await universalApi.read({
        table: 'core_entities',
        filter: { entity_type: 'furniture_customer' }
      });
      setCustomers(customersData.data || []);

      // Load products with pricing
      const productsData = await universalApi.read({
        table: 'core_entities',
        filter: { entity_type: 'furniture_product' }
      });
      
      // Load dynamic pricing data for each product
      for (const product of productsData.data || []) {
        const dynamicData = await universalApi.read({
          table: 'core_dynamic_data',
          filter: { 
            entity_id: product.id,
            field_name: 'selling_price'
          }
        });
        
        if (dynamicData.data && dynamicData.data.length > 0) {
          product.selling_price = dynamicData.data[0].field_value_number;
        }
      }
      
      setProducts(productsData.data || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    }
  };

  const addLineItem = () => {
    setLineItems([...lineItems, {
      entity_id: '',
      product_name: '',
      quantity: 1,
      unit_amount: 0
    }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'entity_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        updated[index].product_name = product.entity_name;
        updated[index].unit_amount = product.selling_price || 0;
      }
    }
    
    if (field === 'quantity' || field === 'unit_amount') {
      updated[index].line_amount = updated[index].quantity * updated[index].unit_amount;
    }
    
    setLineItems(updated);
  };

  const validateAndCalculate = async () => {
    setValidationErrors([]);
    setPricingSummary(null);
    setApprovalRequired(null);
    setPromisedDeliveryDate(null);
    
    try {
      // Simulate UCR validation
      const validation: UCRValidationResult = await simulateUCRValidation();
      if (!validation.valid) {
        setValidationErrors(validation.errors);
        return false;
      }

      // Simulate UCR pricing calculation
      const pricing: UCRPricingResult = await simulateUCRPricing();
      setPricingSummary(pricing);
      
      // Simulate approval check
      const approval: UCRApprovalResult = await simulateUCRApproval(pricing.totalAmount);
      setApprovalRequired(approval);
      
      // Simulate delivery date calculation
      const deliveryDate = await simulateDeliveryDateCalculation();
      setPromisedDeliveryDate(deliveryDate);
      
      return true;
    } catch (err) {
      setError('Validation failed');
      return false;
    }
  };

  const simulateUCRValidation = async (): Promise<UCRValidationResult> => {
    const errors: string[] = [];
    
    // Minimum order value check
    const totalAmount = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_amount), 0);
    if (totalAmount < 5000) {
      errors.push('Minimum order value is AED 5,000');
    }
    
    // Product availability check
    for (const item of lineItems) {
      if (item.quantity > 50) {
        errors.push(`Maximum quantity per item is 50 units`);
      }
    }
    
    // Customer credit check
    if (!selectedCustomer) {
      errors.push('Customer selection is required');
    }
    
    if (lineItems.length === 0) {
      errors.push('At least one product must be selected');
    }
    
    return { valid: errors.length === 0, errors };
  };

  const simulateUCRPricing = async (): Promise<UCRPricingResult> => {
    const pricedItems = lineItems.map(item => {
      let discountPercent = 0;
      
      // Volume discounts
      if (item.quantity >= 10) discountPercent = 5;
      if (item.quantity >= 25) discountPercent = 10;
      if (item.quantity >= 50) discountPercent = 15;
      
      const discountAmount = item.unit_amount * (discountPercent / 100) * item.quantity;
      const lineAmount = (item.unit_amount * item.quantity) - discountAmount;
      
      return {
        ...item,
        discount_percent: discountPercent,
        discount_amount: discountAmount,
        line_amount: lineAmount
      };
    });
    
    const totalAmount = pricedItems.reduce((sum, item) => sum + (item.line_amount || 0), 0);
    
    return {
      totalAmount,
      lineItems: pricedItems
    };
  };

  const simulateUCRApproval = async (totalAmount: number): Promise<UCRApprovalResult> => {
    if (totalAmount >= 50000) {
      return {
        required: true,
        rule: 'High Value Order Approval',
        threshold: 50000,
        approvers: ['Sales Manager', 'Finance Manager']
      };
    }
    
    return { required: false };
  };

  const simulateDeliveryDateCalculation = async (): Promise<Date> => {
    // Base lead time: 7 days
    let leadTimeDays = 7;
    
    // Add time for custom products
    const hasCustom = lineItems.some(item => item.specifications?.custom);
    if (hasCustom) {
      leadTimeDays += 7;
    }
    
    // Add time for large quantities
    const totalQuantity = lineItems.reduce((sum, item) => sum + item.quantity, 0);
    if (totalQuantity > 20) {
      leadTimeDays += 3;
    }
    
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + leadTimeDays);
    
    return deliveryDate;
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    
    // Validate and calculate
    const isValid = await validateAndCalculate();
    if (!isValid) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Create sales order transaction
      const transaction = await universalApi.createTransaction({
        transaction_type: 'sales_order',
        transaction_code: `SO-${Date.now()}`,
        transaction_date: new Date().toISOString(),
        from_entity_id: selectedCustomer,
        total_amount: pricingSummary?.totalAmount || 0,
        smart_code: 'HERA.IND.FURN.TXN.SALESORDER.V1',
        metadata: {
          customer_po: customerPO,
          delivery_address: deliveryAddress,
          special_instructions: specialInstructions,
          status: approvalRequired?.required ? 'pending_approval' : 'confirmed',
          approval_required: approvalRequired,
          promised_delivery_date: promisedDeliveryDate?.toISOString()
        },
        line_items: (pricingSummary?.lineItems || []).map((item, index) => ({
          line_number: index + 1,
          entity_id: item.entity_id,
          quantity: item.quantity,
          unit_price: item.unit_amount,
          line_amount: item.line_amount || 0,
          smart_code: 'HERA.IND.FURN.TXN.SALESORDER.LINE.V1',
          metadata: {
            product_name: item.product_name,
            specifications: item.specifications,
            discount_percent: item.discount_percent,
            discount_amount: item.discount_amount
          }
        }))
      });
      
      setSuccess(`Sales Order ${transaction.transaction_code} created successfully!`);
      
      // Reset form
      setSelectedCustomer('');
      setCustomerPO('');
      setLineItems([]);
      setDeliveryAddress({
        line1: '',
        line2: '',
        city: '',
        state: '',
        country: '',
        postal: ''
      });
      setSpecialInstructions('');
      setPricingSummary(null);
      setApprovalRequired(null);
      setPromisedDeliveryDate(null);
      
    } catch (err: any) {
      setError(err.message || 'Failed to create sales order');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_amount), 0);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            New Sales Order
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Customer Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.entity_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Customer PO Number</Label>
              <Input
                value={customerPO}
                onChange={(e) => setCustomerPO(e.target.value)}
                placeholder="CUST-PO-2025-001"
              />
            </div>
          </div>
          
          {/* Line Items */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Products</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLineItem}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Product
              </Button>
            </div>
            
            {lineItems.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="w-24">Quantity</TableHead>
                    <TableHead className="w-32">Unit Price</TableHead>
                    <TableHead className="w-32">Line Total</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Select 
                          value={item.entity_id} 
                          onValueChange={(value) => updateLineItem(index, 'entity_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map(product => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.entity_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value))}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.unit_amount}
                          onChange={(e) => updateLineItem(index, 'unit_amount', parseFloat(e.target.value))}
                        />
                      </TableCell>
                      <TableCell>
                        {(item.quantity * item.unit_amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLineItem(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            
            {lineItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No products added. Click "Add Product" to start.
              </div>
            )}
          </div>
          
          {/* Delivery Address */}
          <div className="space-y-2">
            <Label>Delivery Address</Label>
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Address Line 1"
                value={deliveryAddress.line1}
                onChange={(e) => setDeliveryAddress({...deliveryAddress, line1: e.target.value})}
              />
              <Input
                placeholder="Address Line 2"
                value={deliveryAddress.line2}
                onChange={(e) => setDeliveryAddress({...deliveryAddress, line2: e.target.value})}
              />
              <Input
                placeholder="City"
                value={deliveryAddress.city}
                onChange={(e) => setDeliveryAddress({...deliveryAddress, city: e.target.value})}
              />
              <Input
                placeholder="State"
                value={deliveryAddress.state}
                onChange={(e) => setDeliveryAddress({...deliveryAddress, state: e.target.value})}
              />
              <Input
                placeholder="Country"
                value={deliveryAddress.country}
                onChange={(e) => setDeliveryAddress({...deliveryAddress, country: e.target.value})}
              />
              <Input
                placeholder="Postal Code"
                value={deliveryAddress.postal}
                onChange={(e) => setDeliveryAddress({...deliveryAddress, postal: e.target.value})}
              />
            </div>
          </div>
          
          {/* Special Instructions */}
          <div className="space-y-2">
            <Label>Special Instructions</Label>
            <Textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any special delivery or packaging instructions..."
              rows={3}
            />
          </div>
          
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Pricing Summary */}
          {pricingSummary && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>AED {calculateTotal().toFixed(2)}</span>
                  </div>
                  {pricingSummary.lineItems.some(item => item.discount_amount) && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Total Discounts:</span>
                      <span>
                        - AED {pricingSummary.lineItems.reduce((sum, item) => sum + (item.discount_amount || 0), 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                    <span>Total Amount:</span>
                    <span>AED {pricingSummary.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Approval Required */}
          {approvalRequired?.required && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Approval Required:</strong> {approvalRequired.rule}
                <br />
                This order exceeds AED {approvalRequired.threshold} and requires approval from: {approvalRequired.approvers?.join(', ')}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Promised Delivery Date */}
          {promisedDeliveryDate && (
            <Alert className="border-blue-200 bg-blue-50">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Promised Delivery Date:</strong> {formatDate(promisedDeliveryDate, 'PPP')}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Success/Error Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}
          
          {/* Actions */}
          <div className="flex justify-between">
            <div className="text-lg font-semibold">
              Total: AED {calculateTotal().toFixed(2)}
            </div>
            <div className="space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={validateAndCalculate}
                disabled={loading || lineItems.length === 0}
              >
                Validate & Calculate
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || lineItems.length === 0 || !selectedCustomer}
              >
                {loading ? 'Creating...' : 'Create Sales Order'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}