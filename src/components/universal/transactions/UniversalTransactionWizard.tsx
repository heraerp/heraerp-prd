'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Info, ArrowLeft, ArrowRight, Plus, Trash2, Calculator, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useUniversalTransactionV1 } from '@/hooks/useUniversalTransactionV1';

interface TransactionWizardProps {
  moduleCode: string;
  onComplete: (transactionData: any) => void;
  onCancel: () => void;
  initialData?: any;
}

interface TransactionLine {
  id: string;
  line_amount: number;
  line_data: {
    side: 'DR' | 'CR';
    account_code?: string;
    description?: string;
    dimensions?: Record<string, any>;
  };
  entity_references: Array<{
    entity_id: string;
    role: string;
  }>;
}

interface TransactionData {
  // Header
  smart_code: string;
  transaction_type: string;
  transaction_date: string;
  transaction_currency_code: string;
  exchange_rate: number;
  fiscal_period: string;
  reference_number?: string;
  description?: string;
  
  // Context
  business_context: Record<string, any>;
  
  // Lines
  lines: TransactionLine[];
  
  // Totals
  total_amount: number;
  currency_totals: Record<string, { dr: number; cr: number; }>;
}

const TRANSACTION_TYPES = [
  { value: 'SALE', label: 'Sales Transaction', smartCode: 'HERA.FINANCE.TXN.SALE.v1' },
  { value: 'PURCHASE', label: 'Purchase Transaction', smartCode: 'HERA.FINANCE.TXN.PURCHASE.v1' },
  { value: 'PAYMENT', label: 'Payment Transaction', smartCode: 'HERA.FINANCE.TXN.PAYMENT.v1' },
  { value: 'RECEIPT', label: 'Receipt Transaction', smartCode: 'HERA.FINANCE.TXN.RECEIPT.v1' },
  { value: 'JOURNAL', label: 'Journal Entry', smartCode: 'HERA.FINANCE.TXN.JOURNAL.v1' },
  { value: 'TRANSFER', label: 'Transfer Transaction', smartCode: 'HERA.FINANCE.TXN.TRANSFER.v1' }
];

export default function UniversalTransactionWizard({ 
  moduleCode, 
  onComplete, 
  onCancel, 
  initialData 
}: TransactionWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [transactionData, setTransactionData] = useState<TransactionData>({
    smart_code: '',
    transaction_type: '',
    transaction_date: new Date().toISOString().split('T')[0],
    transaction_currency_code: 'USD',
    exchange_rate: 1.0,
    fiscal_period: new Date().getFullYear().toString(),
    business_context: {},
    lines: [],
    total_amount: 0,
    currency_totals: { USD: { dr: 0, cr: 0 } }
  });

  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize v1 hook for tested transaction creation
  const transactionHook = useUniversalTransactionV1({
    filters: {
      transaction_type: transactionData.transaction_type || undefined,
      include_lines: true
    }
  });

  const steps = [
    { id: 'type', title: 'Select Type', description: 'Choose transaction type and smart code' },
    { id: 'header', title: 'Header Details', description: 'Date, currency, and business context' },
    { id: 'lines', title: 'Transaction Lines', description: 'DR/CR entries with AI assistance' },
    { id: 'validate', title: 'Validate & Post', description: 'Final validation and posting' }
  ];

  // Auto-calculate totals when lines change
  useEffect(() => {
    const totals = transactionData.lines.reduce((acc, line) => {
      const currency = transactionData.transaction_currency_code;
      if (!acc[currency]) acc[currency] = { dr: 0, cr: 0 };
      
      if (line.line_data.side === 'DR') {
        acc[currency].dr += line.line_amount;
      } else {
        acc[currency].cr += line.line_amount;
      }
      
      return acc;
    }, {} as Record<string, { dr: number; cr: number; }>);

    const totalAmount = Object.values(totals).reduce((sum, curr) => sum + curr.dr, 0);

    setTransactionData(prev => ({
      ...prev,
      currency_totals: totals,
      total_amount: totalAmount
    }));
  }, [transactionData.lines, transactionData.transaction_currency_code]);

  const validateStep = (stepIndex: number): string[] => {
    const errors: string[] = [];
    
    switch (stepIndex) {
      case 0: // Type
        if (!transactionData.transaction_type) errors.push('Transaction type is required');
        if (!transactionData.smart_code) errors.push('Smart code is required');
        break;
      case 1: // Header
        if (!transactionData.transaction_date) errors.push('Transaction date is required');
        if (!transactionData.transaction_currency_code) errors.push('Currency is required');
        if (!transactionData.fiscal_period) errors.push('Fiscal period is required');
        break;
      case 2: // Lines
        if (transactionData.lines.length === 0) errors.push('At least one transaction line is required');
        
        // Validate GL balance
        const currencyTotals = transactionData.currency_totals;
        Object.entries(currencyTotals).forEach(([currency, totals]) => {
          if (Math.abs(totals.dr - totals.cr) > 0.01) {
            errors.push(`GL not balanced for ${currency}: DR ${totals.dr.toFixed(2)} ≠ CR ${totals.cr.toFixed(2)}`);
          }
        });
        
        // Validate individual lines
        transactionData.lines.forEach((line, index) => {
          if (!line.line_amount || line.line_amount <= 0) {
            errors.push(`Line ${index + 1}: Amount must be greater than 0`);
          }
          if (!line.line_data.side) {
            errors.push(`Line ${index + 1}: DR/CR side is required`);
          }
        });
        break;
      case 3: // Validate
        // All validations from previous steps
        break;
    }
    
    return errors;
  };

  const handleNext = async () => {
    const errors = validateStep(currentStep);
    setValidationErrors(prev => ({ ...prev, [currentStep]: errors }));

    if (errors.length === 0) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        await handlePost();
      }
    }
  };

  const handlePost = async () => {
    setIsProcessing(true);
    try {
      // Use tested v1 hook for transaction creation
      const transactionPayload = {
        transaction_type: transactionData.transaction_type,
        smart_code: transactionData.smart_code,
        transaction_date: transactionData.transaction_date,
        total_amount: transactionData.total_amount,
        transaction_status: 'draft',
        metadata: {
          transaction_currency_code: transactionData.transaction_currency_code,
          exchange_rate: transactionData.exchange_rate,
          fiscal_period: transactionData.fiscal_period,
          reference_number: transactionData.reference_number,
          description: transactionData.description
        },
        business_context: transactionData.business_context,
        lines: transactionData.lines.map((line, index) => ({
          line_number: index + 1,
          line_type: 'gl',
          description: line.line_data.description || '',
          quantity: 1,
          unit_amount: line.line_amount,
          line_amount: line.line_amount,
          smart_code: `HERA.${moduleCode.toUpperCase()}.TXN.LINE.${line.line_data.side}.v1`,
          line_data: line.line_data
        }))
      };

      const result = await transactionHook.create(transactionPayload);
      
      // Capture AI insights if available
      if (result.ai_insights) {
        setAiInsights(result.ai_insights);
      }
      
      onComplete(result);
    } catch (error) {
      console.error('Error posting transaction:', error);
      setValidationErrors(prev => ({ 
        ...prev, 
        [currentStep]: ['Failed to post transaction. Please try again.'] 
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  const addTransactionLine = () => {
    const newLine: TransactionLine = {
      id: `line_${Date.now()}`,
      line_amount: 0,
      line_data: {
        side: 'DR',
        description: ''
      },
      entity_references: []
    };
    
    setTransactionData(prev => ({
      ...prev,
      lines: [...prev.lines, newLine]
    }));
  };

  const removeTransactionLine = (lineId: string) => {
    setTransactionData(prev => ({
      ...prev,
      lines: prev.lines.filter(line => line.id !== lineId)
    }));
  };

  const updateTransactionLine = (lineId: string, updates: Partial<TransactionLine>) => {
    setTransactionData(prev => ({
      ...prev,
      lines: prev.lines.map(line => 
        line.id === lineId ? { ...line, ...updates } : line
      )
    }));
  };

  const generateAILineItems = async () => {
    // Simulate AI assistance for line item generation
    if (transactionData.transaction_type === 'SALE') {
      const aiLines: TransactionLine[] = [
        {
          id: `ai_line_${Date.now()}_1`,
          line_amount: 1000,
          line_data: {
            side: 'DR',
            account_code: '1200',
            description: 'Accounts Receivable'
          },
          entity_references: []
        },
        {
          id: `ai_line_${Date.now()}_2`,
          line_amount: 1000,
          line_data: {
            side: 'CR',
            account_code: '4000',
            description: 'Sales Revenue'
          },
          entity_references: []
        }
      ];
      
      setTransactionData(prev => ({
        ...prev,
        lines: [...prev.lines, ...aiLines]
      }));
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <TypeSelectionStep transactionData={transactionData} setTransactionData={setTransactionData} />;
      case 1:
        return <HeaderDetailsStep transactionData={transactionData} setTransactionData={setTransactionData} />;
      case 2:
        return (
          <TransactionLinesStep 
            transactionData={transactionData} 
            updateTransactionLine={updateTransactionLine}
            addTransactionLine={addTransactionLine}
            removeTransactionLine={removeTransactionLine}
            generateAILineItems={generateAILineItems}
          />
        );
      case 3:
        return <ValidatePostStep transactionData={transactionData} aiInsights={aiInsights} />;
      default:
        return null;
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepErrors = validationErrors[currentStep] || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* SAP Fiori-style Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Create Transaction
              </h1>
              <p className="text-gray-600">
                S/4HANA-inspired transaction creation with AI assistance
              </p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="text-sm mb-2">
                {transactionData.smart_code || 'Smart code will be set'}
              </Badge>
              <div className="text-sm text-gray-500">
                Module: {moduleCode}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Header */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-medium">{steps[currentStep].title}</h2>
              <span className="text-sm text-gray-500">Step {currentStep + 1} of {steps.length}</span>
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-600 mt-2">{steps[currentStep].description}</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="col-span-8">
            <Card className="min-h-[600px]">
              <CardContent className="p-6">
                {currentStepErrors.length > 0 && (
                  <Alert className="mb-6 border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription>
                      <div className="font-medium text-red-800 mb-2">Please fix the following errors:</div>
                      <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                        {currentStepErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
                
                {renderStepContent()}
              </CardContent>
              
              <div className="p-6 border-t flex justify-between">
                <Button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  disabled={currentStep === 0}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex gap-2">
                  <Button onClick={onCancel} variant="outline">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={isProcessing}
                    className="flex items-center gap-2"
                  >
                    {isProcessing ? (
                      'Processing...'
                    ) : currentStep === steps.length - 1 ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Post Transaction
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="col-span-4 space-y-6">
            {/* Transaction Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transaction Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span>{transactionData.transaction_type || 'Not selected'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Currency:</span>
                    <span>{transactionData.transaction_currency_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lines:</span>
                    <span>{transactionData.lines.length}</span>
                  </div>
                </div>
                
                <Separator />
                
                {Object.entries(transactionData.currency_totals).map(([currency, totals]) => (
                  <div key={currency} className="text-sm">
                    <div className="font-medium mb-1">{currency} Totals:</div>
                    <div className="flex justify-between text-green-600">
                      <span>DR:</span>
                      <span>{totals.dr.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>CR:</span>
                      <span>{totals.cr.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-1">
                      <span>Balance:</span>
                      <span className={Math.abs(totals.dr - totals.cr) < 0.01 ? 'text-green-600' : 'text-red-600'}>
                        {(totals.dr - totals.cr).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* AI Assistant */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-lg">AI Assistant</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {currentStep === 2 && (
                  <Button
                    onClick={generateAILineItems}
                    variant="outline"
                    size="sm"
                    className="w-full mb-3"
                  >
                    Generate AI Line Items
                  </Button>
                )}
                
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    AI assistance will help validate your transaction and suggest optimal posting patterns.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step Components
const TypeSelectionStep = ({ transactionData, setTransactionData }: any) => (
  <div className="space-y-6">
    <h3 className="text-lg font-medium">Select Transaction Type</h3>
    
    <div className="grid grid-cols-2 gap-4">
      {TRANSACTION_TYPES.map((type) => (
        <Card 
          key={type.value}
          className={`cursor-pointer transition-all ${
            transactionData.transaction_type === type.value 
              ? 'border-blue-500 bg-blue-50' 
              : 'hover:border-gray-300'
          }`}
          onClick={() => setTransactionData((prev: any) => ({
            ...prev,
            transaction_type: type.value,
            smart_code: type.smartCode
          }))}
        >
          <CardContent className="p-4">
            <h4 className="font-medium">{type.label}</h4>
            <p className="text-xs text-gray-500 mt-1 font-mono">{type.smartCode}</p>
          </CardContent>
        </Card>
      ))}
    </div>
    
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>
        Smart codes follow HERA v2 pattern and determine the transaction posting rules and validations.
      </AlertDescription>
    </Alert>
  </div>
);

const HeaderDetailsStep = ({ transactionData, setTransactionData }: any) => (
  <div className="space-y-6">
    <h3 className="text-lg font-medium">Header Details</h3>
    
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="transaction_date">Transaction Date *</Label>
        <Input
          id="transaction_date"
          type="date"
          value={transactionData.transaction_date}
          onChange={(e) => setTransactionData((prev: any) => ({ ...prev, transaction_date: e.target.value }))}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="transaction_currency_code">Currency *</Label>
        <Select 
          value={transactionData.transaction_currency_code}
          onValueChange={(value) => setTransactionData((prev: any) => ({ ...prev, transaction_currency_code: value }))}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">USD - US Dollar</SelectItem>
            <SelectItem value="EUR">EUR - Euro</SelectItem>
            <SelectItem value="GBP">GBP - British Pound</SelectItem>
            <SelectItem value="INR">INR - Indian Rupee</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="fiscal_period">Fiscal Period *</Label>
        <Input
          id="fiscal_period"
          value={transactionData.fiscal_period}
          onChange={(e) => setTransactionData((prev: any) => ({ ...prev, fiscal_period: e.target.value }))}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="reference_number">Reference Number</Label>
        <Input
          id="reference_number"
          value={transactionData.reference_number || ''}
          onChange={(e) => setTransactionData((prev: any) => ({ ...prev, reference_number: e.target.value }))}
          placeholder="Optional reference"
          className="mt-1"
        />
      </div>
    </div>
    
    <div>
      <Label htmlFor="description">Description</Label>
      <Input
        id="description"
        value={transactionData.description || ''}
        onChange={(e) => setTransactionData((prev: any) => ({ ...prev, description: e.target.value }))}
        placeholder="Transaction description"
        className="mt-1"
      />
    </div>
  </div>
);

const TransactionLinesStep = ({ 
  transactionData, 
  updateTransactionLine, 
  addTransactionLine, 
  removeTransactionLine,
  generateAILineItems 
}: any) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-medium">Transaction Lines</h3>
      <div className="flex gap-2">
        <Button onClick={generateAILineItems} variant="outline" size="sm">
          <Sparkles className="h-4 w-4 mr-2" />
          AI Assist
        </Button>
        <Button onClick={addTransactionLine} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Line
        </Button>
      </div>
    </div>
    
    {transactionData.lines.length === 0 ? (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <p className="text-gray-500">No transaction lines yet</p>
        <p className="text-sm text-gray-400 mt-1">Add lines to create your transaction</p>
      </div>
    ) : (
      <div className="space-y-4">
        {transactionData.lines.map((line: TransactionLine, index: number) => (
          <Card key={line.id} className="p-4">
            <div className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-2">
                <Label className="text-xs">Side</Label>
                <Select 
                  value={line.line_data.side}
                  onValueChange={(value: 'DR' | 'CR') => 
                    updateTransactionLine(line.id, {
                      line_data: { ...line.line_data, side: value }
                    })
                  }
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DR">DR</SelectItem>
                    <SelectItem value="CR">CR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Amount</Label>
                <Input
                  type="number"
                  value={line.line_amount}
                  onChange={(e) => 
                    updateTransactionLine(line.id, { line_amount: parseFloat(e.target.value) || 0 })
                  }
                  className="h-8"
                  step="0.01"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Account</Label>
                <Input
                  value={line.line_data.account_code || ''}
                  onChange={(e) => 
                    updateTransactionLine(line.id, {
                      line_data: { ...line.line_data, account_code: e.target.value }
                    })
                  }
                  className="h-8"
                  placeholder="Account code"
                />
              </div>
              <div className="col-span-5">
                <Label className="text-xs">Description</Label>
                <Input
                  value={line.line_data.description || ''}
                  onChange={(e) => 
                    updateTransactionLine(line.id, {
                      line_data: { ...line.line_data, description: e.target.value }
                    })
                  }
                  className="h-8"
                  placeholder="Line description"
                />
              </div>
              <div className="col-span-1">
                <Button
                  onClick={() => removeTransactionLine(line.id)}
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    )}
    
    <Alert>
      <Calculator className="h-4 w-4" />
      <AlertDescription>
        All transactions must be balanced (DR = CR) per currency. GL balance validation follows HERA v2 guardrails.
      </AlertDescription>
    </Alert>
  </div>
);

const ValidatePostStep = ({ transactionData, aiInsights }: any) => (
  <div className="space-y-6">
    <h3 className="text-lg font-medium">Validate & Post</h3>
    
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="font-medium mb-2">Transaction Summary</h4>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Type:</span> {transactionData.transaction_type}
        </div>
        <div>
          <span className="text-gray-600">Date:</span> {transactionData.transaction_date}
        </div>
        <div>
          <span className="text-gray-600">Currency:</span> {transactionData.transaction_currency_code}
        </div>
        <div>
          <span className="text-gray-600">Lines:</span> {transactionData.lines.length}
        </div>
        <div className="col-span-2">
          <span className="text-gray-600">Smart Code:</span> 
          <code className="ml-2 font-mono text-xs bg-white px-2 py-1 rounded">
            {transactionData.smart_code}
          </code>
        </div>
      </div>
    </div>
    
    {aiInsights && (
      <Alert className="border-purple-200 bg-purple-50">
        <Sparkles className="h-4 w-4 text-purple-600" />
        <AlertDescription>
          <div className="font-medium text-purple-800 mb-2">AI Insights</div>
          <pre className="text-xs text-purple-700 whitespace-pre-wrap">
            {JSON.stringify(aiInsights, null, 2)}
          </pre>
        </AlertDescription>
      </Alert>
    )}
    
    <Alert>
      <CheckCircle2 className="h-4 w-4" />
      <AlertDescription>
        Transaction validation completed. Ready to post to HERA v2 system with full audit trail.
      </AlertDescription>
    </Alert>
  </div>
);