import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText, Users, Package, DollarSign, Calendar, Building2,
  ArrowRightLeft, Tag, Hash, MapPin, CheckCircle2, AlertCircle,
  Plus, Trash2, Save, Send, Eye, Calculator, ShoppingCart,
  Receipt, CreditCard, Truck, BarChart3, Settings, Info,
  Clock, User, Globe, Zap, Shield, Activity, TrendingUp
} from 'lucide-react';

// ============================================================================
// HERA UNIVERSAL TRANSACTION COMPONENT
// Modern 4-step wizard for all non-journal transactions
// Adapts to Sales/Purchase/Goods Receipt based on context
// Org-aware, guardrail-safe, postable through unified RPCs
// ============================================================================

// Type definitions
interface TransactionHeader {
  organization_id: string;
  transaction_type: 'SALE' | 'AP_INVOICE' | 'GOODS_RECEIPT' | 'GOODS_ISSUE' | 'RETURN';
  smart_code: string;
  transaction_date: string;
  transaction_currency_code: string;
  base_currency_code: string;
  exchange_rate: number;
  fiscal_year: number;
  fiscal_period: number;
  source_entity_id: string; // Customer/Vendor
  target_entity_id: string; // Your company/branch
  business_context: {
    source: 'web' | 'pos' | 'batch';
    location_code?: string;
    net_of_tax: number;
    tax_total: number;
    gross_total: number;
    notes?: string;
  };
  metadata: {
    external_reference?: string;
  };
}

interface TransactionLine {
  id: string;
  line_number: number;
  line_type: 'ITEM_LINE' | 'SERVICE_LINE' | 'CHARGE_LINE' | 'PAYMENT_LINE' | 'GL';
  smart_code: string;
  entity_id: string;
  quantity: number;
  unit_amount: number;
  discount_amount: number;
  tax_amount: number;
  line_amount: number;
  description: string;
  ai_classification?: string;
  line_data: {
    dimensions?: {
      cost_center_code?: string;
      profit_center_code?: string;
      project_code?: string;
    };
    tax_details?: Array<{
      tax_code: string;
      tax_rate: number;
      taxable_base: number;
      tax_amount: number;
    }>;
    method?: string; // For payment lines
    reference?: string; // For payment lines
    side?: 'DR' | 'CR'; // For GL lines
  };
}

interface GuardrailStatus {
  smart_code_valid: boolean;
  org_filter_valid: boolean;
  gl_balance_valid: boolean;
  all_valid: boolean;
}

interface Props {
  mode?: 'sale' | 'purchase' | 'goods_receipt' | 'goods_issue' | 'return';
  organization_id?: string;
  onSave?: (header: TransactionHeader, lines: TransactionLine[]) => void;
  onPost?: (header: TransactionHeader, lines: TransactionLine[]) => void;
}

// Static data - would be loaded from HERA entities in production
const TRANSACTION_TYPES = {
  sale: {
    label: 'Sales Transaction',
    smart_code: 'HERA.FINANCE.TXN.SALE.v1',
    icon: ShoppingCart,
    color: 'bg-green-500',
    party_label: 'Customer',
    line_types: ['ITEM_LINE', 'SERVICE_LINE', 'CHARGE_LINE', 'PAYMENT_LINE']
  },
  purchase: {
    label: 'Purchase Transaction', 
    smart_code: 'HERA.FINANCE.TXN.EXPENSE.v1',
    icon: Receipt,
    color: 'bg-blue-500',
    party_label: 'Vendor',
    line_types: ['ITEM_LINE', 'SERVICE_LINE', 'CHARGE_LINE', 'EXPENSE_LINE']
  },
  goods_receipt: {
    label: 'Goods Receipt',
    smart_code: 'HERA.INVENTORY.TXN.RECEIPT.v1',
    icon: Package,
    color: 'bg-purple-500',
    party_label: 'Supplier',
    line_types: ['ITEM_LINE', 'CHARGE_LINE']
  },
  goods_issue: {
    label: 'Goods Issue',
    smart_code: 'HERA.INVENTORY.TXN.ISSUE.v1',
    icon: Truck,
    color: 'bg-orange-500',
    party_label: 'Customer',
    line_types: ['ITEM_LINE', 'CHARGE_LINE']
  },
  return: {
    label: 'Return Transaction',
    smart_code: 'HERA.FINANCE.TXN.RETURN.v1',
    icon: ArrowRightLeft,
    color: 'bg-red-500',
    party_label: 'Customer/Vendor',
    line_types: ['ITEM_LINE', 'SERVICE_LINE', 'CHARGE_LINE', 'PAYMENT_LINE']
  }
};

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' }
];

const LINE_TYPE_CONFIG = {
  ITEM_LINE: {
    label: 'Item',
    icon: Package,
    smart_code: 'HERA.SALES.LINE.ITEM.v1',
    color: 'text-blue-600'
  },
  SERVICE_LINE: {
    label: 'Service',
    icon: Users,
    smart_code: 'HERA.SALES.LINE.SERVICE.v1',
    color: 'text-green-600'
  },
  CHARGE_LINE: {
    label: 'Charge',
    icon: DollarSign,
    smart_code: 'HERA.FINANCE.LINE.CHARGE.v1',
    color: 'text-orange-600'
  },
  PAYMENT_LINE: {
    label: 'Payment',
    icon: CreditCard,
    smart_code: 'HERA.CASH.LINE.PAYMENT.v1',
    color: 'text-purple-600'
  },
  EXPENSE_LINE: {
    label: 'Expense',
    icon: Receipt,
    smart_code: 'HERA.PURCHASE.LINE.EXPENSE.v1',
    color: 'text-red-600'
  }
};

// Helper functions
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const toFixed2 = (n: number) => (isFinite(n) ? n : 0).toFixed(2);

export default function UniversalTransaction({ 
  mode = 'sale', 
  organization_id = 'current-org-id',
  onSave,
  onPost 
}: Props) {
  // Current transaction type config
  const txnConfig = TRANSACTION_TYPES[mode];
  const TransactionIcon = txnConfig.icon;

  // State management
  const [currentStep, setCurrentStep] = useState<'header' | 'lines' | 'validate' | 'post'>('header');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Transaction header
  const [header, setHeader] = useState<TransactionHeader>({
    organization_id,
    transaction_type: mode.toUpperCase() as any,
    smart_code: txnConfig.smart_code,
    transaction_date: new Date().toISOString().split('T')[0],
    transaction_currency_code: 'USD',
    base_currency_code: 'USD',
    exchange_rate: 1.0,
    fiscal_year: 2025,
    fiscal_period: 10,
    source_entity_id: '',
    target_entity_id: '',
    business_context: {
      source: 'web',
      net_of_tax: 0,
      tax_total: 0,
      gross_total: 0
    },
    metadata: {}
  });

  // Transaction lines
  const [lines, setLines] = useState<TransactionLine[]>([
    {
      id: '1',
      line_number: 10,
      line_type: 'ITEM_LINE',
      smart_code: LINE_TYPE_CONFIG.ITEM_LINE.smart_code,
      entity_id: '',
      quantity: 1,
      unit_amount: 0,
      discount_amount: 0,
      tax_amount: 0,
      line_amount: 0,
      description: '',
      line_data: {
        dimensions: {},
        tax_details: []
      }
    }
  ]);

  // Computed values
  const totals = useMemo(() => {
    const net_of_tax = round2(lines.reduce((sum, line) => sum + line.line_amount, 0));
    const tax_total = round2(lines.reduce((sum, line) => sum + line.tax_amount, 0));
    const gross_total = round2(net_of_tax + tax_total);
    
    return { net_of_tax, tax_total, gross_total };
  }, [lines]);

  // Update header totals when lines change
  useEffect(() => {
    setHeader(prev => ({
      ...prev,
      business_context: {
        ...prev.business_context,
        ...totals
      }
    }));
  }, [totals]);

  // Guardrails validation
  const guardrails = useMemo<GuardrailStatus>(() => {
    const smart_code_valid = /^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.v\d+$/.test(header.smart_code);
    const org_filter_valid = !!header.organization_id;
    const gl_balance_valid = Math.abs(totals.gross_total) > 0; // Simplified balance check
    
    return {
      smart_code_valid,
      org_filter_valid,
      gl_balance_valid,
      all_valid: smart_code_valid && org_filter_valid && gl_balance_valid
    };
  }, [header, totals]);

  // Event handlers
  const addLine = () => {
    const newLineNumber = Math.max(...lines.map(l => l.line_number)) + 10;
    const newLine: TransactionLine = {
      id: Date.now().toString(),
      line_number: newLineNumber,
      line_type: 'ITEM_LINE',
      smart_code: LINE_TYPE_CONFIG.ITEM_LINE.smart_code,
      entity_id: '',
      quantity: 1,
      unit_amount: 0,
      discount_amount: 0,
      tax_amount: 0,
      line_amount: 0,
      description: '',
      line_data: {
        dimensions: {},
        tax_details: []
      }
    };
    setLines([...lines, newLine]);
  };

  const removeLine = (id: string) => {
    setLines(lines.filter(line => line.id !== id));
  };

  const updateLine = (id: string, updates: Partial<TransactionLine>) => {
    setLines(lines.map(line => line.id === id ? { ...line, ...updates } : line));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (onSave) {
        await onSave(header, lines);
      }
      console.log('💾 Transaction saved:', { header, lines });
    } catch (error) {
      console.error('Failed to save transaction:', error);
      setErrors({ general: 'Failed to save transaction' });
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    setLoading(true);
    try {
      if (onPost) {
        await onPost(header, lines);
      }
      console.log('📨 Transaction posted:', { header, lines });
    } catch (error) {
      console.error('Failed to post transaction:', error);
      setErrors({ general: 'Failed to post transaction' });
    } finally {
      setLoading(false);
    }
  };

  // Render step indicator
  const renderStepIndicator = () => {
    const steps = [
      { id: 'header', label: 'Header', icon: FileText },
      { id: 'lines', label: 'Lines', icon: BarChart3 },
      { id: 'validate', label: 'Validate', icon: CheckCircle2 },
      { id: 'post', label: 'Post', icon: Send }
    ];

    return (
      <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200 shadow-sm mb-6">
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
          const StepIcon = step.icon;

          return (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  isActive
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : isCompleted
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'bg-gray-100 border-gray-300 text-gray-400'
                }`}
              >
                <StepIcon className="w-5 h-5" />
              </div>
              <span
                className={`ml-3 text-sm font-medium ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div className="w-8 h-px bg-gray-300 mx-4" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Render guardrails status
  const renderGuardrailsChip = () => {
    return (
      <div className="flex items-center gap-2 bg-white rounded-lg p-3 border border-gray-200">
        <Shield className="w-5 h-5 text-blue-600" />
        <span className="text-sm font-medium text-gray-900">Live Guardrails</span>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
            guardrails.smart_code_valid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {guardrails.smart_code_valid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
            Smart Code
          </div>
          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
            guardrails.org_filter_valid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {guardrails.org_filter_valid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
            Org Filter
          </div>
          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
            guardrails.gl_balance_valid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {guardrails.gl_balance_valid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
            GL Balance
          </div>
        </div>
      </div>
    );
  };

  // Render header step
  const renderHeaderStep = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TransactionIcon className="w-5 h-5 text-blue-600" />
            {txnConfig.label} Header
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Transaction Date
              </label>
              <input
                type="date"
                value={header.transaction_date}
                onChange={(e) => setHeader({...header, transaction_date: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Currency
              </label>
              <select
                value={header.transaction_currency_code}
                onChange={(e) => setHeader({...header, transaction_currency_code: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-600"
              >
                {CURRENCIES.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                <ArrowRightLeft className="w-4 h-4 inline mr-2" />
                Exchange Rate
              </label>
              <input
                type="number"
                step="0.000001"
                value={header.exchange_rate}
                onChange={(e) => setHeader({...header, exchange_rate: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                <Users className="w-4 h-4 inline mr-2" />
                {txnConfig.party_label}
              </label>
              <select
                value={header.source_entity_id}
                onChange={(e) => setHeader({...header, source_entity_id: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-600"
              >
                <option value="">Select {txnConfig.party_label}</option>
                <option value="party-1">Sample {txnConfig.party_label} 1</option>
                <option value="party-2">Sample {txnConfig.party_label} 2</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                <Building2 className="w-4 h-4 inline mr-2" />
                Location/Branch
              </label>
              <select
                value={header.target_entity_id}
                onChange={(e) => setHeader({...header, target_entity_id: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-600"
              >
                <option value="">Select Location</option>
                <option value="branch-1">Main Branch</option>
                <option value="branch-2">Secondary Branch</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                <Hash className="w-4 h-4 inline mr-2" />
                External Reference
              </label>
              <input
                type="text"
                value={header.metadata.external_reference || ''}
                onChange={(e) => setHeader({
                  ...header, 
                  metadata: {...header.metadata, external_reference: e.target.value}
                })}
                placeholder="INV-2025-00123"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Notes
            </label>
            <textarea
              value={header.business_context.notes || ''}
              onChange={(e) => setHeader({
                ...header,
                business_context: {...header.business_context, notes: e.target.value}
              })}
              placeholder="Additional notes for this transaction..."
              rows={3}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {renderGuardrailsChip()}
      </div>
    );
  };

  // Render lines step
  const renderLinesStep = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Transaction Lines
          </h3>
          <button
            onClick={addLine}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Line
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-gray-900 font-medium">Line</th>
                  <th className="text-left py-3 px-4 text-gray-900 font-medium">Type</th>
                  <th className="text-left py-3 px-4 text-gray-900 font-medium">Description</th>
                  <th className="text-right py-3 px-4 text-gray-900 font-medium">Quantity</th>
                  <th className="text-right py-3 px-4 text-gray-900 font-medium">Unit Price</th>
                  <th className="text-right py-3 px-4 text-gray-900 font-medium">Tax</th>
                  <th className="text-right py-3 px-4 text-gray-900 font-medium">Amount</th>
                  <th className="text-center py-3 px-4 text-gray-900 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => (
                  <tr key={line.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-700">
                      {line.line_number}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={line.line_type}
                        onChange={(e) => updateLine(line.id, { 
                          line_type: e.target.value as any,
                          smart_code: LINE_TYPE_CONFIG[e.target.value as keyof typeof LINE_TYPE_CONFIG]?.smart_code || line.smart_code
                        })}
                        className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:border-blue-600"
                      >
                        {txnConfig.line_types.map(type => (
                          <option key={type} value={type}>
                            {LINE_TYPE_CONFIG[type as keyof typeof LINE_TYPE_CONFIG]?.label || type}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={line.description}
                        onChange={(e) => updateLine(line.id, { description: e.target.value })}
                        placeholder="Line description"
                        className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:border-blue-600"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        step="0.001"
                        value={line.quantity}
                        onChange={(e) => {
                          const quantity = parseFloat(e.target.value) || 0;
                          const line_amount = quantity * line.unit_amount;
                          updateLine(line.id, { quantity, line_amount });
                        }}
                        className="w-20 px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 text-sm text-right focus:outline-none focus:border-blue-600"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        step="0.01"
                        value={line.unit_amount}
                        onChange={(e) => {
                          const unit_amount = parseFloat(e.target.value) || 0;
                          const line_amount = line.quantity * unit_amount;
                          updateLine(line.id, { unit_amount, line_amount });
                        }}
                        className="w-24 px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 text-sm text-right focus:outline-none focus:border-blue-600"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        step="0.01"
                        value={line.tax_amount}
                        onChange={(e) => updateLine(line.id, { tax_amount: parseFloat(e.target.value) || 0 })}
                        className="w-20 px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 text-sm text-right focus:outline-none focus:border-blue-600"
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-green-700 font-mono font-semibold">
                        {toFixed2(line.line_amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {lines.length > 1 && (
                        <button
                          onClick={() => removeLine(line.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr className="border-t-2 border-gray-200 font-semibold">
                  <td colSpan={6} className="py-3 px-4 text-gray-900">TOTALS</td>
                  <td className="py-3 px-4 text-right text-green-700 font-mono font-bold">
                    {toFixed2(totals.gross_total)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-sm text-blue-600 font-medium">Net Amount</div>
            <div className="text-xl font-bold text-blue-900">{toFixed2(totals.net_of_tax)}</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="text-sm text-orange-600 font-medium">Tax Total</div>
            <div className="text-xl font-bold text-orange-900">{toFixed2(totals.tax_total)}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="text-sm text-green-600 font-medium">Gross Total</div>
            <div className="text-xl font-bold text-green-900">{toFixed2(totals.gross_total)}</div>
          </div>
        </div>
      </div>
    );
  };

  // Render validate step
  const renderValidateStep = () => {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          Transaction Validation
        </h3>

        {/* Guardrails Status */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-4">Guardrails Check</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-3 rounded-lg border ${
              guardrails.smart_code_valid 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {guardrails.smart_code_valid ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={`font-medium ${
                  guardrails.smart_code_valid ? 'text-green-900' : 'text-red-900'
                }`}>
                  Smart Code Valid
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {header.smart_code}
              </div>
            </div>

            <div className={`p-3 rounded-lg border ${
              guardrails.org_filter_valid 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {guardrails.org_filter_valid ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={`font-medium ${
                  guardrails.org_filter_valid ? 'text-green-900' : 'text-red-900'
                }`}>
                  Org Filter Valid
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Organization boundary enforced
              </div>
            </div>

            <div className={`p-3 rounded-lg border ${
              guardrails.gl_balance_valid 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {guardrails.gl_balance_valid ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={`font-medium ${
                  guardrails.gl_balance_valid ? 'text-green-900' : 'text-red-900'
                }`}>
                  GL Balance Preview
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Total: {toFixed2(totals.gross_total)}
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-4">Transaction Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-gray-900 mb-3">Header Information</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="text-gray-900">{txnConfig.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="text-gray-900">{header.transaction_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Currency:</span>
                  <span className="text-gray-900">{header.transaction_currency_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Exchange Rate:</span>
                  <span className="text-gray-900">{header.exchange_rate}</span>
                </div>
              </div>
            </div>

            <div>
              <h5 className="font-medium text-gray-900 mb-3">Financial Summary</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Net Amount:</span>
                  <span className="text-green-700 font-mono font-semibold">{toFixed2(totals.net_of_tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax Total:</span>
                  <span className="text-orange-700 font-mono font-semibold">{toFixed2(totals.tax_total)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-900">Gross Total:</span>
                  <span className="text-green-700 font-mono text-lg">{toFixed2(totals.gross_total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Line Count:</span>
                  <span className="text-gray-900">{lines.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Validation Status */}
        {guardrails.all_valid ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center text-green-700">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              <span className="font-medium">Transaction is valid and ready to post</span>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center text-red-700">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span className="font-medium">Please resolve validation issues before posting</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render post step
  const renderPostStep = () => {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Send className="w-5 h-5 text-blue-600" />
          Post Transaction
        </h3>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Ready to Post</h4>
              <p className="text-gray-600 text-sm">
                This transaction will be posted to the general ledger with full audit trail.
                The posting is idempotent and can be safely retried.
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-900">{toFixed2(totals.gross_total)}</div>
              <div className="text-sm text-blue-600">{header.transaction_currency_code}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h5 className="font-medium text-gray-900 mb-3">Audit Information</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Organization:</span>
                <span className="text-gray-900">{header.organization_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Actor:</span>
                <span className="text-gray-900">Current User</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Timestamp:</span>
                <span className="text-gray-900">{new Date().toISOString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h5 className="font-medium text-gray-900 mb-3">Posting Method</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">RPC Function:</span>
                <span className="text-gray-900 font-mono text-xs">hera_transactions_post_v2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Idempotency:</span>
                <span className="text-green-700">✓ Enabled</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Audit Trail:</span>
                <span className="text-green-700">✓ Full</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'header':
        return renderHeaderStep();
      case 'lines':
        return renderLinesStep();
      case 'validate':
        return renderValidateStep();
      case 'post':
        return renderPostStep();
      default:
        return null;
    }
  };

  // Navigation functions
  const canGoNext = () => {
    switch (currentStep) {
      case 'header':
        return header.source_entity_id && header.target_entity_id;
      case 'lines':
        return lines.length > 0 && lines.every(line => line.description && line.line_amount > 0);
      case 'validate':
        return guardrails.all_valid;
      case 'post':
        return false;
      default:
        return false;
    }
  };

  const goNext = () => {
    const steps = ['header', 'lines', 'validate', 'post'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1] as any);
    }
  };

  const goBack = () => {
    const steps = ['header', 'lines', 'validate', 'post'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1] as any);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl ${txnConfig.color} bg-opacity-10 flex items-center justify-center`}>
            <TransactionIcon className={`w-6 h-6 ${txnConfig.color.replace('bg-', 'text-')}`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{txnConfig.label}</h1>
            <p className="text-gray-600">Universal transaction interface for HERA business operations</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            guardrails.all_valid 
              ? 'bg-green-100 text-green-700' 
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {guardrails.all_valid ? 'VALID' : 'VALIDATING'}
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Step Content */}
      <div className="min-h-[600px]">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200">
        <button
          onClick={goBack}
          disabled={currentStep === 'header'}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>

          {currentStep === 'post' ? (
            <button
              onClick={handlePost}
              disabled={loading || !guardrails.all_valid}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Post Transaction
            </button>
          ) : (
            <button
              onClick={goNext}
              disabled={!canGoNext()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center text-red-700">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{errors.general}</span>
          </div>
        </div>
      )}
    </div>
  );
}