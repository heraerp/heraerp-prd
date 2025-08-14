// COA Validation Schemas
// Zod schemas for request validation

import { z } from 'zod';
import { 
  ACCOUNT_CODE_PATTERN, 
  SUPPORTED_COUNTRIES, 
  SUPPORTED_INDUSTRIES 
} from '../types/coa.types';

// Base schemas
const accountCodeSchema = z.string()
  .regex(ACCOUNT_CODE_PATTERN, 'Account code must be a 7-digit number starting with 1-5');

const accountNameSchema = z.string()
  .min(2, 'Account name must be at least 2 characters')
  .max(100, 'Account name must be at most 100 characters')
  .regex(/[a-zA-Z]/, 'Account name must contain at least one letter');

const organizationIdSchema = z.string()
  .uuid('Organization ID must be a valid UUID');

const accountTypeSchema = z.enum(['assets', 'liabilities', 'equity', 'revenue', 'expenses']);

const accountSubtypeSchema = z.enum([
  'current_assets',
  'non_current_assets', 
  'current_liabilities',
  'non_current_liabilities',
  'equity',
  'revenue',
  'cost_of_sales',
  'operating_expenses',
  'other_expenses'
]).optional();

const normalBalanceSchema = z.enum(['debit', 'credit']).optional();

// Custom account schema
const customAccountSchema = z.object({
  account_code: accountCodeSchema,
  account_name: accountNameSchema,
  account_type: accountTypeSchema,
  account_subtype: accountSubtypeSchema,
  normal_balance: normalBalanceSchema
});

// Account modification schema
const accountModificationSchema = z.object({
  account_code: accountCodeSchema,
  new_name: accountNameSchema
});

// Customizations schema
const customizationsSchema = z.object({
  add_accounts: z.array(customAccountSchema).optional(),
  modify_accounts: z.array(accountModificationSchema).optional()
}).optional();

// Build COA request schema
export const buildCOASchema = z.object({
  body: z.object({
    organization_id: organizationIdSchema,
    country: z.enum(SUPPORTED_COUNTRIES).optional(),
    industry: z.enum(SUPPORTED_INDUSTRIES).optional(),
    customizations: customizationsSchema
  })
});

// Add accounts request schema
export const addAccountsSchema = z.object({
  body: z.object({
    organization_id: organizationIdSchema,
    accounts: z.array(customAccountSchema)
      .min(1, 'At least one account is required')
      .max(50, 'Cannot add more than 50 accounts at once')
  })
});

// Update account name schema
export const updateAccountSchema = z.object({
  body: z.object({
    name: accountNameSchema
  }),
  params: z.object({
    organizationId: organizationIdSchema,
    accountCode: accountCodeSchema
  })
});

// Query parameter schemas
export const structureQuerySchema = z.object({
  query: z.object({
    include_metadata: z.enum(['true', 'false']).optional()
  }),
  params: z.object({
    organizationId: organizationIdSchema
  })
});

export const previewQuerySchema = z.object({
  query: z.object({
    country: z.enum(SUPPORTED_COUNTRIES).optional(),
    industry: z.enum(SUPPORTED_INDUSTRIES).optional()
  })
});

export const layerParamsSchema = z.object({
  params: z.object({
    organizationId: organizationIdSchema,
    layer: z.enum([
      'universal_base',
      'country_india',
      'country_usa', 
      'country_uk',
      'industry_restaurant',
      'industry_healthcare',
      'industry_manufacturing',
      'industry_professional_services',
      'custom'
    ])
  })
});

// Batch operations schemas
export const batchUpdateAccountsSchema = z.object({
  body: z.object({
    organization_id: organizationIdSchema,
    updates: z.array(z.object({
      account_code: accountCodeSchema,
      changes: z.object({
        account_name: accountNameSchema.optional(),
        status: z.enum(['active', 'inactive']).optional()
      })
    })).min(1).max(100)
  })
});

export const batchDeleteAccountsSchema = z.object({
  body: z.object({
    organization_id: organizationIdSchema,
    account_codes: z.array(accountCodeSchema)
      .min(1, 'At least one account code is required')
      .max(50, 'Cannot delete more than 50 accounts at once')
  })
});

// Import/Export schemas
export const importCOASchema = z.object({
  body: z.object({
    organization_id: organizationIdSchema,
    accounts: z.array(z.object({
      account_code: accountCodeSchema,
      account_name: accountNameSchema,
      account_type: accountTypeSchema,
      account_subtype: accountSubtypeSchema,
      normal_balance: normalBalanceSchema,
      status: z.enum(['active', 'inactive']).optional().default('active')
    })).min(1).max(1000),
    replace_existing: z.boolean().optional().default(false)
  })
});

export const exportCOASchema = z.object({
  query: z.object({
    format: z.enum(['json', 'csv', 'xlsx']).optional().default('json'),
    include_metadata: z.enum(['true', 'false']).optional().default('true'),
    filter_by_type: accountTypeSchema.optional(),
    filter_by_layer: z.string().optional()
  }),
  params: z.object({
    organizationId: organizationIdSchema
  })
});

// Custom validation functions
export const validateUniqueAccountCodes = (accounts: any[]): boolean => {
  const codes = accounts.map(acc => acc.account_code);
  return codes.length === new Set(codes).size;
};

export const validateAccountCodeRange = (accountCode: string, accountType: string): boolean => {
  const code = parseInt(accountCode);
  
  switch (accountType) {
    case 'assets':
      return code >= 1000000 && code <= 1999999;
    case 'liabilities':
      return code >= 2000000 && code <= 2999999;
    case 'equity':
      return code >= 3000000 && code <= 3999999;
    case 'revenue':
      return code >= 4000000 && code <= 4999999;
    case 'expenses':
      return code >= 5000000 && code <= 5999999;
    default:
      return false;
  }
};

// Custom error messages
export const validationMessages = {
  INVALID_ACCOUNT_CODE: 'Account code must be a 7-digit number in the correct range for the account type',
  DUPLICATE_ACCOUNT_CODE: 'Account codes must be unique within the request',
  INVALID_ORGANIZATION_ID: 'Organization ID must be a valid UUID',
  ACCOUNT_NAME_TOO_SHORT: 'Account name must be at least 2 characters long',
  ACCOUNT_NAME_TOO_LONG: 'Account name cannot exceed 100 characters',
  INVALID_ACCOUNT_TYPE: 'Account type must be one of: assets, liabilities, equity, revenue, expenses',
  UNSUPPORTED_COUNTRY: `Country must be one of: ${SUPPORTED_COUNTRIES.join(', ')}`,
  UNSUPPORTED_INDUSTRY: `Industry must be one of: ${SUPPORTED_INDUSTRIES.join(', ')}`,
  TOO_MANY_ACCOUNTS: 'Cannot process more than the maximum allowed accounts in a single request',
  EMPTY_REQUEST: 'Request cannot be empty'
};