/**
 * HERA Universal Balance Sheet DNA Service
 * Smart Code: HERA.FIN.BALANCE.SHEET.ENGINE.v1
 * 
 * Factory service for creating industry-optimized daily balance sheet services
 * that work with HERA's universal 6-table architecture.
 */

import { UniversalAPIClient } from '@/lib/universal-api';

// Core Balance Sheet DNA Configuration
export const BALANCE_SHEET_DNA_CONFIG = {
  component_id: 'HERA.FIN.BALANCE.SHEET.ENGINE.v1',
  component_name: 'Universal Balance Sheet Engine',
  version: '1.0.0',
  
  // Core capabilities of the Balance Sheet DNA
  capabilities: [
    'Daily Balance Sheet Generation',
    'Real-time Asset/Liability/Equity Reporting',
    'Multi-Organization Consolidation',
    'Industry-Specific Balance Sheet Templates',
    'IFRS/GAAP Compliant Formatting',
    'Comparative Period Analysis',
    'Financial Ratio Analysis',
    'Integration with Trial Balance DNA'
  ],
  
  // Industry-specific configurations
  industries: {
    salon: {
      name: 'Hair Salon & Beauty Services',
      template_structure: {
        current_assets: {
          cash_and_equivalents: ['1100000', '1110000'],
          accounts_receivable: ['1200000'],
          inventory: ['1300000', '1310000'],
          prepaid_expenses: ['1400000']
        },
        non_current_assets: {
          equipment_net: ['1500000', '1510000'],
          furniture_fixtures_net: ['1600000', '1610000'],
          leasehold_improvements_net: ['1700000', '1710000']
        },
        current_liabilities: {
          accounts_payable: ['2100000'],
          accrued_expenses: ['2200000'],
          sales_tax_payable: ['2250000', '2251000'],
          payroll_liabilities: ['2300000']
        },
        non_current_liabilities: {
          long_term_debt: ['2400000'],
          lease_liabilities: ['2450000']
        },
        equity: {
          owner_capital: ['3100000'],
          retained_earnings: ['3200000'],
          current_year_earnings: ['3900000']
        }
      },
      key_ratios: {
        current_ratio_target: 2.0,
        quick_ratio_target: 1.5,
        debt_to_equity_target: 0.5,
        equity_ratio_target: 0.6
      },
      daily_metrics: [
        'cash_position',
        'current_ratio', 
        'total_assets',
        'total_equity'
      ],
      alerts: {
        low_cash_threshold: 5000,
        high_debt_ratio: 0.7,
        negative_equity: true
      },
      smart_codes: {
        daily_report: 'HERA.SALON.BS.DAILY.REPORT.v1',
        cash_analysis: 'HERA.SALON.BS.CASH.ANALYSIS.v1',
        ratio_analysis: 'HERA.SALON.BS.RATIO.ANALYSIS.v1'
      }
    },
    
    restaurant: {
      name: 'Restaurant & Food Service',
      template_structure: {
        current_assets: {
          cash_and_bank: ['1100000', '1110000'],
          customer_receivables: ['1200000'],
          food_inventory: ['1300000'],
          beverage_inventory: ['1310000'],
          supplies_inventory: ['1320000']
        },
        non_current_assets: {
          kitchen_equipment_net: ['1500000', '1510000'],
          restaurant_furniture_net: ['1600000', '1610000']
        },
        current_liabilities: {
          food_suppliers: ['2100000'],
          accrued_wages: ['2200000'],
          sales_tax_payable: ['2250000']
        },
        equity: {
          owner_investment: ['3100000'],
          accumulated_profits: ['3200000', '3900000']
        }
      },
      key_ratios: {
        current_ratio_target: 1.5,
        inventory_turnover_target: 12,
        debt_to_equity_target: 0.6
      },
      daily_metrics: [
        'cash_position',
        'food_inventory_level',
        'current_ratio',
        'owner_equity'
      ],
      smart_codes: {
        daily_report: 'HERA.REST.BS.DAILY.REPORT.v1',
        inventory_analysis: 'HERA.REST.BS.INVENTORY.ANALYSIS.v1'
      }
    },
    
    healthcare: {
      name: 'Healthcare & Medical Services',
      template_structure: {
        current_assets: {
          cash_and_equivalents: ['1100000'],
          patient_receivables: ['1200000'],
          insurance_receivables: ['1210000'],
          medical_supplies: ['1300000']
        },
        non_current_assets: {
          medical_equipment_net: ['1500000', '1510000'],
          office_equipment_net: ['1600000', '1610000']
        },
        current_liabilities: {
          accounts_payable: ['2100000'],
          payroll_liabilities: ['2300000']
        },
        equity: {
          owner_capital: ['3100000'],
          retained_earnings: ['3200000', '3900000']
        }
      },
      key_ratios: {
        current_ratio_target: 2.5,
        collection_efficiency_target: 0.85,
        debt_to_equity_target: 0.4
      }
    },
    
    manufacturing: {
      name: 'Manufacturing & Production',
      template_structure: {
        current_assets: {
          cash_and_equivalents: ['1100000'],
          accounts_receivable: ['1200000'],
          raw_materials: ['1300000'],
          work_in_process: ['1310000'],
          finished_goods: ['1320000']
        },
        non_current_assets: {
          manufacturing_equipment_net: ['1500000', '1510000'],
          factory_building_net: ['1600000', '1610000']
        },
        current_liabilities: {
          accounts_payable: ['2100000'],
          accrued_wages: ['2200000']
        },
        equity: {
          owner_capital: ['3100000'],
          retained_earnings: ['3200000', '3900000']
        }
      },
      key_ratios: {
        current_ratio_target: 2.0,
        inventory_turnover_target: 6,
        debt_to_equity_target: 0.6
      }
    },
    
    universal: {
      name: 'Universal Business Template',
      template_structure: {
        current_assets: {
          cash_and_equivalents: ['1100000'],
          accounts_receivable: ['1200000'],
          inventory: ['1300000'],
          prepaid_expenses: ['1400000']
        },
        non_current_assets: {
          property_equipment_net: ['1500000', '1510000']
        },
        current_liabilities: {
          accounts_payable: ['2100000'],
          accrued_liabilities: ['2200000']
        },
        equity: {
          owner_equity: ['3100000', '3200000', '3900000']
        }
      },
      key_ratios: {
        current_ratio_target: 2.0,
        debt_to_equity_target: 0.5,
        equity_ratio_target: 0.6
      }
    }
  }
} as const;

// Balance Sheet Data Interfaces
export interface BalanceSheetAccount {
  sectionType: 'Assets' | 'Liabilities' | 'Equity';
  subsection: string;
  accountGroup: string;
  accountCode: string;
  accountName: string;
  currentBalance: number;
  priorBalance: number;
  balanceChange: number;
  percentageChange: number;
  sortOrder: number;
}

export interface BalanceSheetSummary {
  summarySection: string;
  currentAmount: number;
  priorAmount: number;
  changeAmount: number;
  changePercent: number;
}

export interface FinancialRatio {
  ratioName: string;
  ratioValue: number;
  industryBenchmark: number;
  variancePercent: number;
  status: 'Good' | 'Fair' | 'Poor' | 'High Risk' | 'Strong' | 'Moderate' | 'Weak';
  interpretation: string;
}

export interface BalanceSheetOptions {
  organizationId: string;
  asOfDate?: string;
  industryType?: keyof typeof BALANCE_SHEET_DNA_CONFIG.industries;
  includeComparatives?: boolean;
  includeRatios?: boolean;
  format?: 'summary' | 'detailed' | 'consolidated';
}

export interface DailyBalanceSheetReport {
  accounts: BalanceSheetAccount[];
  summary: BalanceSheetSummary[];
  ratios: FinancialRatio[];
  metadata: {
    organizationId: string;
    organizationName: string;
    asOfDate: string;
    industryType: string;
    generatedAt: string;
    isBalanced: boolean;
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
  };
  alerts: Array<{
    type: 'info' | 'warning' | 'error';
    metric: string;
    message: string;
    value: number;
    threshold: number;
  }>;
}

/**
 * Universal Balance Sheet DNA Service Class
 * Provides industry-optimized daily balance sheet functionality
 */
export class BalanceSheetDNAService {
  private api: UniversalAPIClient;
  private organizationId: string;
  private industryConfig: any;

  constructor(api: UniversalAPIClient, organizationId: string, industryType: string = 'salon') {
    this.api = api;
    this.organizationId = organizationId;
    this.industryConfig = BALANCE_SHEET_DNA_CONFIG.industries[industryType as keyof typeof BALANCE_SHEET_DNA_CONFIG.industries] || 
                         BALANCE_SHEET_DNA_CONFIG.industries.universal;
  }

  /**
   * Generate daily balance sheet with industry-specific intelligence
   */
  async generateDailyBalanceSheet(options: Partial<BalanceSheetOptions> = {}): Promise<DailyBalanceSheetReport> {
    const {
      asOfDate = new Date().toISOString().split('T')[0],
      includeComparatives = true,
      includeRatios = true
    } = options;

    try {
      // Get organization details
      const orgResponse = await this.api.query({
        action: 'read',
        table: 'core_organizations',
        filters: { id: this.organizationId }
      });

      const organization = orgResponse.data?.[0];
      if (!organization) {
        throw new Error('Organization not found');
      }

      // Generate balance sheet data using SQL function
      const balanceSheetResponse = await this.api.query({
        action: 'custom_query',
        smart_code: 'HERA.FIN.BS.GENERATE.DAILY.v1',
        query: 'generate_daily_balance_sheet',
        params: {
          p_organization_id: this.organizationId,
          p_as_of_date: asOfDate,
          p_industry_type: this.industryConfig.name.toLowerCase(),
          p_include_comparatives: includeComparatives
        }
      });

      const accounts: BalanceSheetAccount[] = balanceSheetResponse.data?.map((account: any) => ({
        sectionType: account.section_type as 'Assets' | 'Liabilities' | 'Equity',
        subsection: account.subsection,
        accountGroup: account.account_group,
        accountCode: account.account_code,
        accountName: account.account_name,
        currentBalance: parseFloat(account.current_balance),
        priorBalance: parseFloat(account.prior_balance || '0'),
        balanceChange: parseFloat(account.balance_change || '0'),
        percentageChange: parseFloat(account.percentage_change || '0'),
        sortOrder: account.sort_order
      })) || [];

      // Generate summary data
      const summaryResponse = await this.api.query({
        action: 'custom_query',
        smart_code: 'HERA.FIN.BS.SUMMARY.v1',
        query: 'generate_balance_sheet_summary',
        params: {
          p_organization_id: this.organizationId,
          p_as_of_date: asOfDate
        }
      });

      const summary: BalanceSheetSummary[] = summaryResponse.data?.map((item: any) => ({
        summarySection: item.summary_section,
        currentAmount: parseFloat(item.current_amount),
        priorAmount: parseFloat(item.prior_amount || '0'),
        changeAmount: parseFloat(item.change_amount || '0'),
        changePercent: parseFloat(item.change_percent || '0')
      })) || [];

      // Calculate financial ratios
      let ratios: FinancialRatio[] = [];
      
      if (includeRatios) {
        const ratiosResponse = await this.api.query({
          action: 'custom_query',
          smart_code: 'HERA.FIN.BS.RATIOS.v1',
          query: 'calculate_balance_sheet_ratios',
          params: {
            p_organization_id: this.organizationId,
            p_as_of_date: asOfDate
          }
        });

        ratios = ratiosResponse.data?.map((ratio: any) => ({
          ratioName: ratio.ratio_name,
          ratioValue: parseFloat(ratio.ratio_value),
          industryBenchmark: parseFloat(ratio.industry_benchmark),
          variancePercent: parseFloat(ratio.variance_percent || '0'),
          status: ratio.status as FinancialRatio['status'],
          interpretation: ratio.interpretation
        })) || [];
      }

      // Calculate totals
      const totalAssets = accounts
        .filter(acc => acc.sectionType === 'Assets')
        .reduce((sum, acc) => sum + acc.currentBalance, 0);
      
      const totalLiabilities = accounts
        .filter(acc => acc.sectionType === 'Liabilities')
        .reduce((sum, acc) => sum + acc.currentBalance, 0);
      
      const totalEquity = accounts
        .filter(acc => acc.sectionType === 'Equity')
        .reduce((sum, acc) => sum + acc.currentBalance, 0);

      const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

      // Generate alerts based on industry configuration
      const alerts = this.generateBalanceSheetAlerts(accounts, ratios);

      return {
        accounts,
        summary,
        ratios,
        metadata: {
          organizationId: this.organizationId,
          organizationName: organization.organization_name,
          asOfDate,
          industryType: this.industryConfig.name,
          generatedAt: new Date().toISOString(),
          isBalanced,
          totalAssets,
          totalLiabilities,
          totalEquity
        },
        alerts
      };

    } catch (error) {
      console.error('Error generating daily balance sheet:', error);
      throw new Error(`Failed to generate daily balance sheet: ${error}`);
    }
  }

  /**
   * Generate consolidated balance sheet for multiple organizations
   */
  async generateConsolidatedBalanceSheet(organizationIds: string[], options: Partial<BalanceSheetOptions> = {}): Promise<{
    consolidatedAccounts: any[];
    organizationSummaries: DailyBalanceSheetReport[];
    consolidatedSummary: BalanceSheetSummary[];
    consolidatedRatios: FinancialRatio[];
  }> {
    const {
      asOfDate = new Date().toISOString().split('T')[0]
    } = options;

    try {
      // Generate individual balance sheets
      const organizationSummaries: DailyBalanceSheetReport[] = [];
      
      for (const orgId of organizationIds) {
        const service = new BalanceSheetDNAService(this.api, orgId, this.industryConfig.name.toLowerCase());
        const balanceSheet = await service.generateDailyBalanceSheet({ asOfDate });
        organizationSummaries.push(balanceSheet);
      }

      // Generate consolidated data using SQL function
      const consolidatedResponse = await this.api.query({
        action: 'custom_query',
        smart_code: 'HERA.FIN.BS.CONSOLIDATED.v1',
        query: 'generate_consolidated_balance_sheet',
        params: {
          p_organization_ids: organizationIds,
          p_as_of_date: asOfDate
        }
      });

      const consolidatedAccounts = consolidatedResponse.data || [];

      // Calculate consolidated summary
      const consolidatedSummary = this.calculateConsolidatedSummary(organizationSummaries);
      
      // Calculate consolidated ratios
      const consolidatedRatios = this.calculateConsolidatedRatios(organizationSummaries);

      return {
        consolidatedAccounts,
        organizationSummaries,
        consolidatedSummary,
        consolidatedRatios
      };

    } catch (error) {
      console.error('Error generating consolidated balance sheet:', error);
      throw new Error(`Failed to generate consolidated balance sheet: ${error}`);
    }
  }

  /**
   * Generate balance sheet alerts based on industry thresholds
   */
  private generateBalanceSheetAlerts(accounts: BalanceSheetAccount[], ratios: FinancialRatio[]): Array<{
    type: 'info' | 'warning' | 'error';
    metric: string;
    message: string;
    value: number;
    threshold: number;
  }> {
    const alerts = [];
    const config = this.industryConfig;

    // Cash position alert
    const cashAccounts = accounts.filter(acc => 
      acc.accountGroup.toLowerCase().includes('cash') || 
      acc.accountCode.startsWith('11')
    );
    const totalCash = cashAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
    
    if (config.alerts?.low_cash_threshold && totalCash < config.alerts.low_cash_threshold) {
      alerts.push({
        type: 'warning' as const,
        metric: 'Cash Position',
        message: `Cash position is below recommended threshold`,
        value: totalCash,
        threshold: config.alerts.low_cash_threshold
      });
    }

    // Debt-to-equity ratio alert
    const debtRatio = ratios.find(r => r.ratioName === 'Debt-to-Equity Ratio');
    if (debtRatio && config.alerts?.high_debt_ratio && debtRatio.ratioValue > config.alerts.high_debt_ratio) {
      alerts.push({
        type: 'error' as const,
        metric: 'Debt-to-Equity Ratio',
        message: `Debt-to-equity ratio is above safe threshold`,
        value: debtRatio.ratioValue,
        threshold: config.alerts.high_debt_ratio
      });
    }

    // Negative equity alert
    const totalEquity = accounts
      .filter(acc => acc.sectionType === 'Equity')
      .reduce((sum, acc) => sum + acc.currentBalance, 0);
    
    if (config.alerts?.negative_equity && totalEquity < 0) {
      alerts.push({
        type: 'error' as const,
        metric: 'Total Equity',
        message: `Business has negative equity - review capital structure`,
        value: totalEquity,
        threshold: 0
      });
    }

    return alerts;
  }

  /**
   * Calculate consolidated summary from individual organization reports
   */
  private calculateConsolidatedSummary(organizationSummaries: DailyBalanceSheetReport[]): BalanceSheetSummary[] {
    const consolidatedSummary: { [key: string]: BalanceSheetSummary } = {};

    organizationSummaries.forEach(org => {
      org.summary.forEach(summary => {
        if (!consolidatedSummary[summary.summarySection]) {
          consolidatedSummary[summary.summarySection] = {
            summarySection: summary.summarySection,
            currentAmount: 0,
            priorAmount: 0,
            changeAmount: 0,
            changePercent: 0
          };
        }
        
        consolidatedSummary[summary.summarySection].currentAmount += summary.currentAmount;
        consolidatedSummary[summary.summarySection].priorAmount += summary.priorAmount;
        consolidatedSummary[summary.summarySection].changeAmount += summary.changeAmount;
      });
    });

    // Calculate consolidated change percentages
    Object.values(consolidatedSummary).forEach(summary => {
      if (summary.priorAmount !== 0) {
        summary.changePercent = (summary.changeAmount / Math.abs(summary.priorAmount)) * 100;
      }
    });

    return Object.values(consolidatedSummary);
  }

  /**
   * Calculate consolidated ratios from individual organization reports
   */
  private calculateConsolidatedRatios(organizationSummaries: DailyBalanceSheetReport[]): FinancialRatio[] {
    // For simplicity, this returns weighted average ratios
    const consolidatedRatios: FinancialRatio[] = [];
    
    const totalAssets = organizationSummaries.reduce((sum, org) => sum + org.metadata.totalAssets, 0);
    const totalLiabilities = organizationSummaries.reduce((sum, org) => sum + org.metadata.totalLiabilities, 0);
    const totalEquity = organizationSummaries.reduce((sum, org) => sum + org.metadata.totalEquity, 0);

    // Calculate consolidated ratios
    if (totalLiabilities > 0 && totalEquity > 0) {
      consolidatedRatios.push({
        ratioName: 'Consolidated Current Ratio',
        ratioValue: totalAssets > 0 ? totalAssets / totalLiabilities : 0,
        industryBenchmark: this.industryConfig.key_ratios.current_ratio_target || 2.0,
        variancePercent: 0,
        status: 'Good',
        interpretation: 'Consolidated liquidity position'
      });

      consolidatedRatios.push({
        ratioName: 'Consolidated Debt-to-Equity',
        ratioValue: totalLiabilities / totalEquity,
        industryBenchmark: this.industryConfig.key_ratios.debt_to_equity_target || 0.5,
        variancePercent: 0,
        status: totalLiabilities / totalEquity <= 0.5 ? 'Good' : 'High Risk',
        interpretation: 'Consolidated financial leverage'
      });
    }

    return consolidatedRatios;
  }
}

/**
 * Factory function to create industry-specific Balance Sheet DNA services
 */
export const balanceSheetDNAService = {
  /**
   * Create a Balance Sheet DNA service for a specific industry
   */
  createForIndustry: (
    industryType: keyof typeof BALANCE_SHEET_DNA_CONFIG.industries,
    options: {
      api: UniversalAPIClient;
      organizationId: string;
      customizations?: any;
    }
  ): BalanceSheetDNAService => {
    const { api, organizationId, customizations } = options;
    
    const service = new BalanceSheetDNAService(api, organizationId, industryType);
    
    // Apply any custom configurations
    if (customizations) {
      Object.assign(service['industryConfig'], customizations);
    }
    
    return service;
  },

  /**
   * Get available industry configurations
   */
  getAvailableIndustries: () => {
    return Object.entries(BALANCE_SHEET_DNA_CONFIG.industries).map(([key, config]) => ({
      key,
      name: config.name,
      templateSections: Object.keys(config.template_structure),
      keyRatios: Object.keys(config.key_ratios),
      dailyMetrics: config.daily_metrics || []
    }));
  },

  /**
   * Create Hair Talkz specific service (salon industry)
   */
  createForHairTalkz: (api: UniversalAPIClient, organizationId: string): BalanceSheetDNAService => {
    return new BalanceSheetDNAService(api, organizationId, 'salon');
  },

  /**
   * Validate industry configuration
   */
  validateIndustryConfig: (industryType: string): boolean => {
    return industryType in BALANCE_SHEET_DNA_CONFIG.industries;
  }
};

export default balanceSheetDNAService;