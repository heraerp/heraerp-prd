import { readFileSync } from 'fs';
import { join } from 'path';

export interface CoaTemplate {
  template_info: {
    template_id: string;
    template_name: string;
    version: string;
    description: string;
    extends?: string;
    country_code?: string;
    industry_code?: string;
    created_at: string;
    updated_at: string;
  };
  account_structure?: any;
  country_specific_accounts?: any;
  industry_specific_accounts?: any;
}

export interface CoaAccount {
  code: string;
  name: string;
  type: 'assets' | 'liabilities' | 'equity' | 'revenue' | 'expenses';
  subtype: string;
  normal_balance: 'debit' | 'credit';
  required: boolean;
  description: string;
  industry_specific?: boolean;
  country_specific?: boolean;
  regulatory_requirement?: string;
}

export class CoaTemplateService {
  private static instance: CoaTemplateService;
  private templateCache: Map<string, CoaTemplate> = new Map();
  private configPath: string;

  constructor() {
    this.configPath = join(process.cwd(), 'config', 'coa');
  }

  public static getInstance(): CoaTemplateService {
    if (!CoaTemplateService.instance) {
      CoaTemplateService.instance = new CoaTemplateService();
    }
    return CoaTemplateService.instance;
  }

  /**
   * Load a template from the file system
   */
  private loadTemplate(templatePath: string): CoaTemplate {
    try {
      const templateContent = readFileSync(templatePath, 'utf-8');
      return JSON.parse(templateContent);
    } catch (error) {
      throw new Error(`Failed to load template from ${templatePath}: ${error}`);
    }
  }

  /**
   * Get the universal base template
   */
  public getBaseTemplate(): CoaTemplate {
    const cacheKey = 'universal_base';
    
    if (this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey)!;
    }

    const templatePath = join(this.configPath, 'templates', 'base', 'universal-base.json');
    const template = this.loadTemplate(templatePath);
    
    this.templateCache.set(cacheKey, template);
    return template;
  }

  /**
   * Get a country-specific template
   */
  public getCountryTemplate(countryCode: string): CoaTemplate | null {
    const cacheKey = `country_${countryCode}`;
    
    if (this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey)!;
    }

    try {
      const templatePath = join(this.configPath, 'templates', 'countries', `${countryCode.toLowerCase()}.json`);
      const template = this.loadTemplate(templatePath);
      
      this.templateCache.set(cacheKey, template);
      return template;
    } catch (error) {
      console.warn(`Country template not found for ${countryCode}:`, error);
      return null;
    }
  }

  /**
   * Get an industry-specific template
   */
  public getIndustryTemplate(industryCode: string): CoaTemplate | null {
    const cacheKey = `industry_${industryCode}`;
    
    if (this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey)!;
    }

    try {
      const templatePath = join(this.configPath, 'templates', 'industries', `${industryCode.toLowerCase()}.json`);
      const template = this.loadTemplate(templatePath);
      
      this.templateCache.set(cacheKey, template);
      return template;
    } catch (error) {
      console.warn(`Industry template not found for ${industryCode}:`, error);
      return null;
    }
  }

  /**
   * Get list of available country templates
   */
  public getAvailableCountryTemplates(): string[] {
    try {
      const fs = require('fs');
      const countriesPath = join(this.configPath, 'templates', 'countries');
      const files = fs.readdirSync(countriesPath);
      
      return files
        .filter((file: string) => file.endsWith('.json'))
        .map((file: string) => file.replace('.json', ''));
    } catch (error) {
      console.error('Failed to read country templates directory:', error);
      return [];
    }
  }

  /**
   * Get list of available industry templates
   */
  public getAvailableIndustryTemplates(): string[] {
    try {
      const fs = require('fs');
      const industriesPath = join(this.configPath, 'templates', 'industries');
      const files = fs.readdirSync(industriesPath);
      
      return files
        .filter((file: string) => file.endsWith('.json'))
        .map((file: string) => file.replace('.json', ''));
    } catch (error) {
      console.error('Failed to read industry templates directory:', error);
      return [];
    }
  }

  /**
   * Build a complete COA by merging base, country, and industry templates
   */
  public buildMergedCoa(
    countryCode?: string,
    industryCode?: string
  ): {
    accounts: CoaAccount[];
    template_layers: string[];
    metadata: any;
  } {
    const layers: string[] = ['universal_base'];
    let mergedAccounts: CoaAccount[] = [];
    
    // Start with base template
    const baseTemplate = this.getBaseTemplate();
    const baseAccounts = this.extractAccountsFromTemplate(baseTemplate);
    mergedAccounts = [...baseAccounts];

    // Add country-specific accounts
    if (countryCode) {
      const countryTemplate = this.getCountryTemplate(countryCode);
      if (countryTemplate) {
        layers.push(`country_${countryCode}`);
        const countryAccounts = this.extractAccountsFromTemplate(countryTemplate);
        mergedAccounts = this.mergeAccounts(mergedAccounts, countryAccounts);
      }
    }

    // Add industry-specific accounts
    if (industryCode) {
      const industryTemplate = this.getIndustryTemplate(industryCode);
      if (industryTemplate) {
        layers.push(`industry_${industryCode}`);
        const industryAccounts = this.extractAccountsFromTemplate(industryTemplate);
        mergedAccounts = this.mergeAccounts(mergedAccounts, industryAccounts);
      }
    }

    return {
      accounts: mergedAccounts.sort((a, b) => a.code.localeCompare(b.code)),
      template_layers: layers,
      metadata: {
        total_accounts: mergedAccounts.length,
        required_accounts: mergedAccounts.filter(acc => acc.required).length,
        country_specific: mergedAccounts.filter(acc => acc.country_specific).length,
        industry_specific: mergedAccounts.filter(acc => acc.industry_specific).length
      }
    };
  }

  /**
   * Extract accounts from a template structure
   */
  private extractAccountsFromTemplate(template: CoaTemplate): CoaAccount[] {
    const accounts: CoaAccount[] = [];

    // Extract from account_structure (base template format)
    if (template.account_structure) {
      for (const [type, typeData] of Object.entries(template.account_structure)) {
        if (typeof typeData === 'object' && typeData !== null) {
          this.extractAccountsFromSection(typeData, accounts, type);
        }
      }
    }

    // Extract from country_specific_accounts
    if (template.country_specific_accounts) {
      for (const [section, sectionData] of Object.entries(template.country_specific_accounts)) {
        if (Array.isArray(sectionData)) {
          accounts.push(...(sectionData as CoaAccount[]).map(acc => ({
            ...acc,
            country_specific: true
          })));
        }
      }
    }

    // Extract from industry_specific_accounts
    if (template.industry_specific_accounts) {
      for (const [section, sectionData] of Object.entries(template.industry_specific_accounts)) {
        if (Array.isArray(sectionData)) {
          accounts.push(...(sectionData as CoaAccount[]).map(acc => ({
            ...acc,
            industry_specific: true
          })));
        }
      }
    }

    return accounts;
  }

  /**
   * Recursively extract accounts from nested template sections
   */
  private extractAccountsFromSection(section: any, accounts: CoaAccount[], parentType: string): void {
    if (section.accounts && Array.isArray(section.accounts)) {
      accounts.push(...section.accounts);
    }

    // Handle nested subsections
    for (const [key, value] of Object.entries(section)) {
      if (key !== 'accounts' && key !== 'range' && typeof value === 'object' && value !== null) {
        this.extractAccountsFromSection(value, accounts, parentType);
      }
    }
  }

  /**
   * Merge two account arrays, handling conflicts
   */
  private mergeAccounts(baseAccounts: CoaAccount[], newAccounts: CoaAccount[]): CoaAccount[] {
    const merged = [...baseAccounts];
    const existingCodes = new Set(baseAccounts.map(acc => acc.code));

    for (const newAccount of newAccounts) {
      if (existingCodes.has(newAccount.code)) {
        // Handle conflict - for now, override with new account
        const index = merged.findIndex(acc => acc.code === newAccount.code);
        if (index !== -1) {
          merged[index] = { ...merged[index], ...newAccount };
        }
      } else {
        merged.push(newAccount);
        existingCodes.add(newAccount.code);
      }
    }

    return merged;
  }

  /**
   * Validate template compatibility
   */
  public validateTemplateCompatibility(
    countryCode?: string,
    industryCode?: string
  ): {
    valid: boolean;
    conflicts: string[];
    warnings: string[];
  } {
    const conflicts: string[] = [];
    const warnings: string[] = [];

    try {
      const mergedCoa = this.buildMergedCoa(countryCode, industryCode);
      
      // Check for duplicate account codes
      const codeCounts = new Map<string, number>();
      mergedCoa.accounts.forEach(acc => {
        codeCounts.set(acc.code, (codeCounts.get(acc.code) || 0) + 1);
      });

      for (const [code, count] of codeCounts) {
        if (count > 1) {
          conflicts.push(`Duplicate account code: ${code}`);
        }
      }

      // Additional validation logic can be added here
      
      return {
        valid: conflicts.length === 0,
        conflicts,
        warnings
      };
    } catch (error) {
      return {
        valid: false,
        conflicts: [`Template validation failed: ${error}`],
        warnings
      };
    }
  }

  /**
   * Clear template cache
   */
  public clearCache(): void {
    this.templateCache.clear();
  }
}

export default CoaTemplateService;