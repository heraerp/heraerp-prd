// Universal Chart of Accounts Types
// TypeScript interfaces for the Universal COA system

export interface GLAccount {
  id: string;
  account_code: string;
  account_name: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  metadata?: AccountMetadata;
}

export interface AccountMetadata {
  account_type: AccountType;
  account_subtype?: AccountSubtype;
  normal_balance?: 'debit' | 'credit';
  template_layer?: TemplateLayer;
  compliance_requirement?: string;
  operational_requirement?: string;
}

export type AccountType = 
  | 'assets' 
  | 'liabilities' 
  | 'equity' 
  | 'revenue' 
  | 'expenses';

export type AccountSubtype = 
  | 'current_assets'
  | 'non_current_assets'
  | 'current_liabilities'
  | 'non_current_liabilities'
  | 'equity'
  | 'revenue'
  | 'cost_of_sales'
  | 'operating_expenses'
  | 'other_expenses';

export type TemplateLayer = 
  | 'universal_base'
  | 'country_india'
  | 'country_usa'
  | 'country_uk'
  | 'industry_restaurant'
  | 'industry_healthcare'
  | 'industry_manufacturing'
  | 'industry_professional_services'
  | 'custom';

export interface TemplateOptions {
  universal_base: {
    name: string;
    description: string;
    account_count: number;
  };
  countries: CountryTemplate[];
  industries: IndustryTemplate[];
  customization_options: {
    add_accounts: string;
    modify_accounts: string;
    account_properties: string;
  };
}

export interface CountryTemplate {
  code: string;
  name: string;
  account_count: number;
}

export interface IndustryTemplate {
  code: string;
  name: string;
  account_count: number;
}

export interface COABuildRequest {
  organization_id: string;
  country?: string;
  industry?: string;
  customizations?: COACustomizations;
}

export interface COACustomizations {
  add_accounts?: CustomAccount[];
  modify_accounts?: AccountModification[];
}

export interface CustomAccount {
  account_code: string;
  account_name: string;
  account_type: AccountType;
  account_subtype?: AccountSubtype;
  normal_balance?: 'debit' | 'credit';
}

export interface AccountModification {
  account_code: string;
  new_name: string;
}

export interface COABuildResult {
  success: boolean;
  organization_id: string;
  total_accounts_created?: number;
  breakdown?: {
    base_accounts: number;
    country_accounts: number;
    industry_accounts: number;
    custom_accounts: number;
  };
  templates_applied?: {
    universal_base: boolean;
    country: string;
    industry: string;
    customizations_applied: boolean;
  };
  created_at?: string;
  error?: string;
  error_code?: string;
}

export interface COAStructure {
  success: boolean;
  organization_id: string;
  total_accounts: number;
  summary_by_type: Record<AccountType, number>;
  accounts: GLAccount[];
  generated_at: string;
  error?: string;
}

export interface COAPreview {
  total_estimated_accounts: number;
  layers: {
    universal_base: number;
    country?: number;
    industry?: number;
    custom?: number;
  };
  sample_accounts_by_type: Record<AccountType, string[]>;
}

export interface AddAccountsRequest {
  organization_id: string;
  accounts: CustomAccount[];
}

export interface AddAccountsResult {
  success: boolean;
  organization_id: string;
  accounts_added: number;
  added_at: string;
  error?: string;
}

// API Response wrapper types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Database entity types (matching HERA schema)
export interface CoreEntity {
  id: string;
  organization_id: string;
  entity_type: string;
  entity_name: string;
  entity_code: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CoreDynamicData {
  id: string;
  organization_id: string;
  entity_id: string;
  field_name: string;
  field_value: string;
  field_type: string;
  created_at: string;
  updated_at: string;
}

// Validation schemas (for runtime validation)
export const ACCOUNT_CODE_PATTERN = /^[1-9]\d{6}$/;
export const SUPPORTED_COUNTRIES = ['india', 'usa', 'uk'] as const;
export const SUPPORTED_INDUSTRIES = [
  'restaurant', 
  'healthcare', 
  'manufacturing', 
  'professional_services'
] as const;

export type SupportedCountry = typeof SUPPORTED_COUNTRIES[number];
export type SupportedIndustry = typeof SUPPORTED_INDUSTRIES[number];

// Error types
export class COAError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'COAError';
  }
}

export class ValidationError extends COAError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class DuplicateAccountError extends COAError {
  constructor(accountCode: string) {
    super(`Account code ${accountCode} already exists`, 'DUPLICATE_ACCOUNT', { accountCode });
    this.name = 'DuplicateAccountError';
  }
}

export class OrganizationNotFoundError extends COAError {
  constructor(organizationId: string) {
    super(`Organization ${organizationId} not found`, 'ORGANIZATION_NOT_FOUND', { organizationId });
    this.name = 'OrganizationNotFoundError';
  }
}

export class TemplateNotFoundError extends COAError {
  constructor(templateType: string, templateCode: string) {
    super(`Template ${templateType}:${templateCode} not found`, 'TEMPLATE_NOT_FOUND', { 
      templateType, 
      templateCode 
    });
    this.name = 'TemplateNotFoundError';
  }
}