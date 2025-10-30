import React, { useMemo, useState, useEffect } from 'react';
import {
  CheckCircle2, AlertCircle, Upload, Plus, Trash2,
  Save, Send, FileText, DollarSign, Calendar,
  Building2, Tag, Loader2, Download, Eye, X,
  ChevronRight, ChevronDown, Filter, Search,
  TrendingUp, Users, Package, Briefcase, Receipt,
  Percent, Info, MapPin, Shield, Layers, Calculator,
  Book, Hash, PlusCircle, MinusCircle, Settings,
  ArrowRightLeft, FileCheck, Activity
} from 'lucide-react';

// ============================================================================
// HERA v2.4 JOURNAL ENTRY TRANSACTION COMPOSER
// Enterprise-grade GL posting with automatic tax calculations
// Integrates with proven HERA patterns for complete accounting workflow
// ============================================================================

// Type definitions
interface TaxCode {
  id: string;
  entity_type: 'TAX_CODE';
  entity_code: string;
  entity_name: string;
  smart_code: string;
  business_rules: {
    rate: number;
    inclusive: boolean;
    jurisdiction: string;
    output_gl?: string;
    input_gl?: string;
    calculation_method: string;
    reverse_charge: boolean;
    zero_rated: boolean;
    exempt: boolean;
    rounding?: string;
    recovery_percentage?: number;
    reason_code?: string;
  };
}

interface JournalLine {
  id: string;
  line_number: number;
  line_type: 'GL' | 'TAX';
  account_id: string;
  description: string;
  line_amount: number;
  tax_code_id: string;
  tax_inclusive: boolean;
  line_data: {
    side: 'DR' | 'CR';
    tax_details: any[];
    reference?: string;
    source_line_id?: string;
  };
  cost_center_id: string;
  profit_center_id?: string;
  smart_code: string;
  is_auto_generated?: boolean;
}

interface JournalHeader {
  transaction_type: string;
  transaction_date: string;
  transaction_currency_code: string;
  base_currency_code: string;
  exchange_rate: number;
  fiscal_year: number;
  fiscal_period: number;
  reference_number: string;
  description: string;
  total_amount: number;
  status: 'draft' | 'submitted' | 'approved' | 'posted';
}

// Helper functions
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const toFixed2 = (n: number) => (isFinite(n) ? n : 0).toFixed(2);

// Static data (would be loaded from HERA entities in production)
const TAX_CODES: TaxCode[] = [
  {
    id: 'tc1',
    entity_type: 'TAX_CODE',
    entity_code: 'VAT_UAE_STD_5',
    entity_name: 'UAE VAT Standard 5%',
    smart_code: 'HERA.TAX.CODE.VAT.UAE.STD.v1',
    business_rules: {
      rate: 0.05,
      inclusive: false,
      jurisdiction: 'UAE',
      output_gl: '2100',
      input_gl: '1410',
      calculation_method: 'PERCENTAGE_OF_NET',
      reverse_charge: false,
      zero_rated: false,
      exempt: false,
      rounding: 'half_up'
    }
  },
  {
    id: 'tc2',
    entity_type: 'TAX_CODE',
    entity_code: 'VAT_UAE_ZERO',
    entity_name: 'UAE VAT Zero-Rated',
    smart_code: 'HERA.TAX.CODE.VAT.UAE.ZERO.v1',
    business_rules: {
      rate: 0.00,
      inclusive: false,
      jurisdiction: 'UAE',
      output_gl: null,
      input_gl: null,
      calculation_method: 'NONE',
      reverse_charge: false,
      zero_rated: true,
      exempt: false,
      reason_code: 'EXPORT'
    }
  },
  {
    id: 'tc3',
    entity_type: 'TAX_CODE',
    entity_code: 'VAT_UAE_INPUT_5',
    entity_name: 'UAE VAT Input 5%',
    smart_code: 'HERA.TAX.CODE.VAT.UAE.INPUT.v1',
    business_rules: {
      rate: 0.05,
      inclusive: false,
      jurisdiction: 'UAE',
      output_gl: null,
      input_gl: '1410',
      calculation_method: 'PERCENTAGE_OF_NET',
      reverse_charge: false,
      zero_rated: false,
      exempt: false,
      recovery_percentage: 1.0
    }
  }
];

const ACCOUNTS = [
  { id: '1', code: '1000', name: 'Cash on Hand', type: 'ASSET', currency: 'AED' },
  { id: '2', code: '1100', name: 'Accounts Receivable', type: 'ASSET', currency: 'AED' },
  { id: '3', code: '2100', name: 'Output VAT Payable', type: 'LIABILITY', currency: 'AED' },
  { id: '4', code: '4000', name: 'Service Revenue', type: 'REVENUE', currency: 'AED' },
  { id: '5', code: '5000', name: 'Commission Expense', type: 'EXPENSE', currency: 'AED' },
  { id: '6', code: '6100', name: 'Office Supplies', type: 'EXPENSE', currency: 'AED' },
  { id: '7', code: '1410', name: 'Input VAT Recoverable', type: 'ASSET', currency: 'AED' },
  { id: '8', code: '2101', name: 'Accounts Payable', type: 'LIABILITY', currency: 'AED' },
  { id: '9', code: '6200', name: 'Non-Recoverable VAT', type: 'EXPENSE', currency: 'AED' },
  { id: '10', code: '3000', name: 'Share Capital', type: 'EQUITY', currency: 'AED' },
  { id: '11', code: '3100', name: 'Retained Earnings', type: 'EQUITY', currency: 'AED' }
];

const COST_CENTERS = [
  { id: 'cc1', code: 'CC001', name: 'Hair Services' },
  { id: 'cc2', code: 'CC002', name: 'Beauty Services' },
  { id: 'cc3', code: 'CC003', name: 'Retail Operations' },
  { id: 'cc4', code: 'CC004', name: 'Administration' }
];

const CURRENCIES = [
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' }
];

// Tax calculation engine
const TaxEngine = {
  calculateTax(netAmount: number, taxCode: TaxCode | null, inclusive = false) {
    const amount = Number(netAmount) || 0;
    if (!taxCode || taxCode.business_rules.rate === 0) {
      return { taxable_base: round2(amount), tax_amount: 0, gross_amount: round2(amount) };
    }
    const rate = taxCode.business_rules.rate;
    if (inclusive || taxCode.business_rules.inclusive) {
      const taxable_base = round2(amount / (1 + rate));
      const tax_amount = round2(amount - taxable_base);
      return { taxable_base, tax_amount, gross_amount: round2(amount) };
    } else {
      const tax_amount = round2(amount * rate);
      return { taxable_base: round2(amount), tax_amount, gross_amount: round2(amount + tax_amount) };
    }
  },

  generateTaxLines(lines: JournalLine[], startLineNumber = 1000): JournalLine[] {
    const taxLines: JournalLine[] = [];
    let seq = startLineNumber;

    const accountByCode = (code?: string | null) => ACCOUNTS.find(a => a.code === code)?.id || null;

    lines.forEach((line) => {
      if (line.is_auto_generated || !line.tax_code_id) return;
      
      const taxCode = TAX_CODES.find(tc => tc.id === line.tax_code_id);
      if (!taxCode || taxCode.business_rules.rate === 0) return;

      const calc = this.calculateTax(line.line_amount, taxCode, line.tax_inclusive);
      
      if (calc.tax_amount === 0) return;

      // Determine if this is input or output VAT based on account type
      const account = ACCOUNTS.find(a => a.id === line.account_id);
      const isInputVAT = account?.type === 'EXPENSE' || account?.type === 'ASSET';
      
      const taxAccountCode = isInputVAT ? taxCode.business_rules.input_gl : taxCode.business_rules.output_gl;
      const taxAccountId = accountByCode(taxAccountCode);
      
      if (!taxAccountId) return;

      // Create tax line
      taxLines.push({
        id: `tax_${line.id}_${seq}`,
        line_number: seq,
        line_type: 'TAX',
        account_id: taxAccountId,
        description: `${taxCode.entity_name} - ${line.description}`,
        line_amount: calc.tax_amount,
        tax_code_id: line.tax_code_id,
        tax_inclusive: false,
        line_data: {
          side: isInputVAT ? 'DR' : 'CR',
          tax_details: [{
            tax_code: taxCode.entity_code,
            tax_rate: taxCode.business_rules.rate,
            taxable_base: calc.taxable_base,
            tax_amount: calc.tax_amount,
            tax_type: isInputVAT ? 'INPUT' : 'OUTPUT'
          }],
          source_line_id: line.id
        },
        cost_center_id: line.cost_center_id,
        smart_code: 'HERA.FINANCE.GL.LINE.TAX.v1',
        is_auto_generated: true
      });

      seq += 10;
    });

    return taxLines;
  }
};

export default function JournalEntryTransaction() {
  // State management
  const [activeTab, setActiveTab] = useState<'header' | 'lines' | 'tax' | 'review'>('header');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTaxDetails, setShowTaxDetails] = useState(false);

  // Journal header
  const [header, setHeader] = useState<JournalHeader>({
    transaction_type: 'JOURNAL_ENTRY',
    transaction_date: new Date().toISOString().split('T')[0],
    transaction_currency_code: 'USD',
    base_currency_code: 'USD',
    exchange_rate: 1.0,
    fiscal_year: 2025,
    fiscal_period: 10,
    reference_number: '',
    description: '',
    total_amount: 0,
    status: 'draft'
  });

  // Journal lines (user-entered)
  const [lines, setLines] = useState<JournalLine[]>([
    {
      id: '1',
      line_number: 10,
      line_type: 'GL',
      account_id: '',
      description: '',
      line_amount: 0,
      tax_code_id: '',
      tax_inclusive: false,
      line_data: { side: 'DR', tax_details: [] },
      cost_center_id: '',
      smart_code: 'HERA.FINANCE.GL.LINE.v1'
    },
    {
      id: '2',
      line_number: 20,
      line_type: 'GL',
      account_id: '',
      description: '',
      line_amount: 0,
      tax_code_id: '',
      tax_inclusive: false,
      line_data: { side: 'CR', tax_details: [] },
      cost_center_id: '',
      smart_code: 'HERA.FINANCE.GL.LINE.v1'
    }
  ]);

  // Computed values
  const computedLines = useMemo(() => {
    return lines.map((line) => {
      const taxCode = TAX_CODES.find(tc => tc.id === line.tax_code_id) || null;
      if (!taxCode || line.is_auto_generated) return line;

      const calc = TaxEngine.calculateTax(line.line_amount, taxCode, line.tax_inclusive);
      
      return {
        ...line,
        line_data: {
          ...line.line_data,
          tax_details: calc.tax_amount > 0 ? [{
            tax_code: taxCode.entity_code,
            tax_rate: taxCode.business_rules.rate,
            taxable_base: calc.taxable_base,
            tax_amount: calc.tax_amount,
            gross_amount: calc.gross_amount
          }] : []
        }
      };
    });
  }, [lines]);

  // Auto-generated tax lines
  const taxLines = useMemo(() => {
    return TaxEngine.generateTaxLines(computedLines.filter(line => !line.is_auto_generated));
  }, [computedLines]);

  // All lines combined
  const allLines = useMemo(() => {
    return [...computedLines, ...taxLines].sort((a, b) => a.line_number - b.line_number);
  }, [computedLines, taxLines]);

  // Balance calculation
  const balance = useMemo(() => {
    const debits = allLines.filter(line => line.line_data.side === 'DR').reduce((sum, line) => sum + line.line_amount, 0);
    const credits = allLines.filter(line => line.line_data.side === 'CR').reduce((sum, line) => sum + line.line_amount, 0);
    return { debits: round2(debits), credits: round2(credits), difference: round2(debits - credits) };
  }, [allLines]);

  // Event handlers
  const addLine = () => {
    const newLineNumber = Math.max(...lines.map(l => l.line_number)) + 10;
    const newLine: JournalLine = {
      id: Date.now().toString(),
      line_number: newLineNumber,
      line_type: 'GL',
      account_id: '',
      description: '',
      line_amount: 0,
      tax_code_id: '',
      tax_inclusive: false,
      line_data: { side: 'DR', tax_details: [] },
      cost_center_id: '',
      smart_code: 'HERA.FINANCE.GL.LINE.v1'
    };
    setLines([...lines, newLine]);
  };

  const removeLine = (id: string) => {
    setLines(lines.filter(line => line.id !== id));
  };

  const updateLine = (id: string, updates: Partial<JournalLine>) => {
    setLines(lines.map(line => line.id === id ? { ...line, ...updates } : line));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Validate balance
      if (Math.abs(balance.difference) > 0.01) {
        setErrors({ balance: 'Journal entry must be balanced (total debits = total credits)' });
        return;
      }

      // Prepare HERA transaction payload
      const payload = {
        p_action: 'CREATE',
        p_actor_user_id: 'current-user-id', // Would come from auth context
        p_organization_id: 'current-org-id', // Would come from auth context
        p_payload: {
          header: {
            organization_id: 'current-org-id',
            transaction_type: 'journal_entry',
            smart_code: 'HERA.FINANCE.TXN.JOURNAL_ENTRY.v1',
            
            total_amount: Math.abs(balance.debits),
            transaction_currency_code: header.transaction_currency_code,
            transaction_code: header.reference_number || `JE-${Date.now()}`,
            transaction_status: 'draft',
            transaction_date: header.transaction_date,
            
            business_context: {
              fiscal_year: header.fiscal_year,
              fiscal_period: header.fiscal_period,
              exchange_rate: header.exchange_rate,
              base_currency: header.base_currency_code,
              description: header.description,
              total_debits: balance.debits,
              total_credits: balance.credits,
              line_count: allLines.length
            }
          },
          lines: allLines.map(line => ({
            line_number: line.line_number,
            line_type: line.line_type,
            entity_id: line.account_id,
            description: line.description,
            quantity: 1,
            unit_amount: line.line_amount,
            line_amount: line.line_amount,
            smart_code: line.smart_code,
            line_data: {
              side: line.line_data.side,
              account_code: ACCOUNTS.find(a => a.id === line.account_id)?.code,
              cost_center_code: COST_CENTERS.find(cc => cc.id === line.cost_center_id)?.code,
              tax_details: line.line_data.tax_details,
              is_auto_generated: line.is_auto_generated || false
            }
          }))
        }
      };

      console.log('🏦 Journal Entry Payload:', JSON.stringify(payload, null, 2));
      
      // In production, this would call the HERA transaction API
      // const result = await supabase.rpc('hera_txn_crud_v1', payload);
      
      alert('Journal entry saved successfully! Check console for payload.');
      
    } catch (error) {
      console.error('Failed to save journal entry:', error);
      setErrors({ general: 'Failed to save journal entry' });
    } finally {
      setLoading(false);
    }
  };

  // Render helpers
  const renderTabContent = () => {
    switch (activeTab) {
      case 'header':
        return (
          <div className="space-y-6">
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
                  <Hash className="w-4 h-4 inline mr-2" />
                  Reference Number
                </label>
                <input
                  type="text"
                  value={header.reference_number}
                  onChange={(e) => setHeader({...header, reference_number: e.target.value})}
                  placeholder="JE-001"
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
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Fiscal Year
                </label>
                <input
                  type="number"
                  value={header.fiscal_year}
                  onChange={(e) => setHeader({...header, fiscal_year: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Fiscal Period
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={header.fiscal_period}
                  onChange={(e) => setHeader({...header, fiscal_period: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-600"
                />
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Description
              </label>
              <textarea
                value={header.description}
                onChange={(e) => setHeader({...header, description: e.target.value})}
                placeholder="Describe the purpose of this journal entry..."
                rows={3}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        );

      case 'lines':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Book className="w-5 h-5 mr-2 text-blue-600" />
                Journal Lines
              </h3>
              <button
                onClick={addLine}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Line
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 text-gray-900 text-sm font-medium">Line</th>
                    <th className="text-left py-3 px-2 text-gray-900 text-sm font-medium">Account</th>
                    <th className="text-left py-3 px-2 text-gray-900 text-sm font-medium">Description</th>
                    <th className="text-right py-3 px-2 text-gray-900 text-sm font-medium">Debit</th>
                    <th className="text-right py-3 px-2 text-gray-900 text-sm font-medium">Credit</th>
                    <th className="text-left py-3 px-2 text-gray-900 text-sm font-medium">Tax Code</th>
                    <th className="text-left py-3 px-2 text-gray-900 text-sm font-medium">Cost Center</th>
                    <th className="text-center py-3 px-2 text-gray-900 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allLines.map((line) => (
                    <tr key={line.id} className={`border-b border-gray-100 ${line.is_auto_generated ? 'bg-blue-50' : ''}`}>
                      <td className="py-3 px-2 text-gray-700">
                        {line.line_number}
                        {line.is_auto_generated && (
                          <Tag className="w-3 h-3 inline ml-1 text-blue-600" title="Auto-generated tax line" />
                        )}
                      </td>
                      <td className="py-3 px-2">
                        {line.is_auto_generated ? (
                          <span className="text-gray-700">
                            {ACCOUNTS.find(a => a.id === line.account_id)?.code} - {ACCOUNTS.find(a => a.id === line.account_id)?.name}
                          </span>
                        ) : (
                          <select
                            value={line.account_id}
                            onChange={(e) => updateLine(line.id, { account_id: e.target.value })}
                            className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:border-blue-600"
                          >
                            <option value="">Select Account</option>
                            {ACCOUNTS.map(account => (
                              <option key={account.id} value={account.id}>
                                {account.code} - {account.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        {line.is_auto_generated ? (
                          <span className="text-gray-600 text-sm italic">{line.description}</span>
                        ) : (
                          <input
                            type="text"
                            value={line.description}
                            onChange={(e) => updateLine(line.id, { description: e.target.value })}
                            placeholder="Line description"
                            className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:border-blue-600"
                          />
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {line.line_data.side === 'DR' ? (
                          line.is_auto_generated ? (
                            <span className="text-green-700 font-mono font-semibold">{toFixed2(line.line_amount)}</span>
                          ) : (
                            <input
                              type="number"
                              step="0.01"
                              value={line.line_data.side === 'DR' ? line.line_amount : ''}
                              onChange={(e) => updateLine(line.id, { 
                                line_amount: parseFloat(e.target.value) || 0,
                                line_data: { ...line.line_data, side: 'DR' }
                              })}
                              className="w-24 px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 text-sm text-right focus:outline-none focus:border-blue-600"
                            />
                          )
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {line.line_data.side === 'CR' ? (
                          line.is_auto_generated ? (
                            <span className="text-green-700 font-mono font-semibold">{toFixed2(line.line_amount)}</span>
                          ) : (
                            <input
                              type="number"
                              step="0.01"
                              value={line.line_data.side === 'CR' ? line.line_amount : ''}
                              onChange={(e) => updateLine(line.id, { 
                                line_amount: parseFloat(e.target.value) || 0,
                                line_data: { ...line.line_data, side: 'CR' }
                              })}
                              className="w-24 px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 text-sm text-right focus:outline-none focus:border-blue-600"
                            />
                          )
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        {line.is_auto_generated ? (
                          <span className="text-gray-600 text-sm">
                            {TAX_CODES.find(tc => tc.id === line.tax_code_id)?.entity_name || 'N/A'}
                          </span>
                        ) : (
                          <select
                            value={line.tax_code_id}
                            onChange={(e) => updateLine(line.id, { tax_code_id: e.target.value })}
                            className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:border-blue-600"
                          >
                            <option value="">No Tax</option>
                            {TAX_CODES.map(taxCode => (
                              <option key={taxCode.id} value={taxCode.id}>
                                {taxCode.entity_name}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        {line.is_auto_generated ? (
                          <span className="text-gray-600 text-sm">
                            {COST_CENTERS.find(cc => cc.id === line.cost_center_id)?.name || '-'}
                          </span>
                        ) : (
                          <select
                            value={line.cost_center_id}
                            onChange={(e) => updateLine(line.id, { cost_center_id: e.target.value })}
                            className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:border-blue-600"
                          >
                            <option value="">Select</option>
                            {COST_CENTERS.map(cc => (
                              <option key={cc.id} value={cc.id}>
                                {cc.code} - {cc.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {!line.is_auto_generated && (
                          <button
                            onClick={() => removeLine(line.id)}
                            className="text-rose hover:text-rose/80 transition-colors"
                            disabled={lines.length <= 2}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 font-semibold">
                    <td colSpan={3} className="py-3 px-2 text-gray-900">TOTALS</td>
                    <td className="py-3 px-2 text-right text-green-700 font-mono font-semibold">{toFixed2(balance.debits)}</td>
                    <td className="py-3 px-2 text-right text-green-700 font-mono font-semibold">{toFixed2(balance.credits)}</td>
                    <td colSpan={3} className="py-3 px-2">
                      {Math.abs(balance.difference) < 0.01 ? (
                        <span className="text-green-500 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Balanced
                        </span>
                      ) : (
                        <span className="text-rose flex items-center justify-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          Out of balance: {toFixed2(balance.difference)}
                        </span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );

      case 'tax':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Calculator className="w-5 h-5 mr-2 text-blue-600" />
                Tax Analysis
              </h3>
              <button
                onClick={() => setShowTaxDetails(!showTaxDetails)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center"
              >
                <Eye className="w-4 h-4 mr-2" />
                {showTaxDetails ? 'Hide' : 'Show'} Details
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TAX_CODES.map(taxCode => {
                const linesWithThisTax = allLines.filter(line => line.tax_code_id === taxCode.id);
                const totalTaxAmount = linesWithThisTax.reduce((sum, line) => {
                  const taxDetails = line.line_data.tax_details?.[0];
                  return sum + (taxDetails?.tax_amount || 0);
                }, 0);

                if (totalTaxAmount === 0) return null;

                return (
                  <div key={taxCode.id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <h4 className="font-semibold text-gray-900 text-sm mb-3">{taxCode.entity_name}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Rate:</span>
                        <span className="text-gray-900 font-medium">{(taxCode.business_rules.rate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Tax:</span>
                        <span className="text-green-700 font-mono font-semibold">{toFixed2(totalTaxAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Lines:</span>
                        <span className="text-gray-900">{linesWithThisTax.length}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {TAX_CODES.every(taxCode => {
              const linesWithThisTax = allLines.filter(line => line.tax_code_id === taxCode.id);
              const totalTaxAmount = linesWithThisTax.reduce((sum, line) => {
                const taxDetails = line.line_data.tax_details?.[0];
                return sum + (taxDetails?.tax_amount || 0);
              }, 0);
              return totalTaxAmount === 0;
            }) && (
              <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
                <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Tax Calculations Yet</h4>
                <p className="text-gray-600 text-sm max-w-md mx-auto">
                  Add journal lines with tax codes to see automatic tax calculations and analysis here. 
                  Tax amounts will be calculated based on HERA v2.4 tax engine.
                </p>
              </div>
            )}

            {showTaxDetails && (
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Receipt className="w-5 h-5 mr-2 text-blue-600" />
                  Tax Line Details
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 text-gray-900 font-medium">Source Line</th>
                        <th className="text-left py-3 px-2 text-gray-900 font-medium">Tax Code</th>
                        <th className="text-right py-3 px-2 text-gray-900 font-medium">Tax Base</th>
                        <th className="text-right py-3 px-2 text-gray-900 font-medium">Tax Rate</th>
                        <th className="text-right py-3 px-2 text-gray-900 font-medium">Tax Amount</th>
                        <th className="text-left py-3 px-2 text-gray-900 font-medium">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {taxLines.map(taxLine => {
                        const taxDetail = taxLine.line_data.tax_details?.[0];
                        if (!taxDetail) return null;
                        
                        return (
                          <tr key={taxLine.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-2 text-gray-700">Line {taxLine.line_number}</td>
                            <td className="py-3 px-2 text-gray-700">{taxDetail.tax_code}</td>
                            <td className="py-3 px-2 text-right text-gray-700 font-mono">{toFixed2(taxDetail.taxable_base)}</td>
                            <td className="py-3 px-2 text-right text-gray-700">{(taxDetail.tax_rate * 100).toFixed(1)}%</td>
                            <td className="py-3 px-2 text-right text-green-700 font-mono font-semibold">{toFixed2(taxDetail.tax_amount)}</td>
                            <td className="py-3 px-2 text-gray-700">{taxDetail.tax_type}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  {taxLines.length === 0 && (
                    <tbody>
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500">
                          <Calculator className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <div className="text-sm">No tax calculations available</div>
                          <div className="text-xs">Add lines with tax codes to see calculations</div>
                        </td>
                      </tr>
                    </tbody>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileCheck className="w-5 h-5 mr-2 text-blue-600" />
                Journal Entry Summary
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Header Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="text-gray-900">{header.transaction_date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reference:</span>
                      <span className="text-gray-900">{header.reference_number || 'Auto-generated'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Currency:</span>
                      <span className="text-gray-900">{header.transaction_currency_code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fiscal Period:</span>
                      <span className="text-gray-900">{header.fiscal_year}/{header.fiscal_period}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Balance Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Debits:</span>
                      <span className="text-green-700 font-mono font-semibold">{toFixed2(balance.debits)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Credits:</span>
                      <span className="text-green-700 font-mono font-semibold">{toFixed2(balance.credits)}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-600">Difference:</span>
                      <span className={`font-mono ${Math.abs(balance.difference) < 0.01 ? 'text-green-500' : 'text-rose'}`}>
                        {toFixed2(balance.difference)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Line Count:</span>
                      <span className="text-gray-900">{allLines.length} ({lines.length} manual + {taxLines.length} auto)</span>
                    </div>
                  </div>
                </div>
              </div>

              {header.description && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600 text-sm">{header.description}</p>
                </div>
              )}
            </div>

            {errors.balance && (
              <div className="bg-rose/10 border border-rose/30 rounded-lg p-4">
                <div className="flex items-center text-rose">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span>{errors.balance}</span>
                </div>
              </div>
            )}

            {Math.abs(balance.difference) < 0.01 && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center text-green-500">
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  <span>Journal entry is balanced and ready to post</span>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Book className="w-8 h-8 mr-3 text-blue-600" />
            Journal Entry Transaction
          </h1>
          <p className="text-gray-600 mt-1">Create and manage journal entries with automatic tax calculations</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            header.status === 'draft' ? 'bg-yellow-500/20 text-yellow-500' :
            header.status === 'submitted' ? 'bg-blue-500/20 text-blue-500' :
            header.status === 'approved' ? 'bg-green-500/20 text-green-500' :
            'bg-purple-500/20 text-purple-500'
          }`}>
            {header.status.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'header', label: 'Header', icon: FileText },
            { id: 'lines', label: 'Lines', icon: Book },
            { id: 'tax', label: 'Tax Analysis', icon: Calculator },
            { id: 'review', label: 'Review', icon: Eye }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-blue-300'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {renderTabContent()}
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-700">
            Balance: {Math.abs(balance.difference) < 0.01 ? (
              <span className="text-green-500 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                In Balance
              </span>
            ) : (
              <span className="text-rose flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                Out of Balance: {toFixed2(balance.difference)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSave}
            disabled={loading || Math.abs(balance.difference) >= 0.01}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Journal Entry
          </button>
        </div>
      </div>
    </div>
  );
}

// Component is already exported as default on line 246