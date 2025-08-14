// Universal Chart of Accounts Service
// Business logic for COA template management and customization

import { 
  TemplateOptions, 
  COABuildRequest, 
  COABuildResult, 
  COAStructure,
  COAPreview,
  AddAccountsRequest,
  AddAccountsResult,
  GLAccount,
  CustomAccount,
  SupportedCountry,
  SupportedIndustry,
  SUPPORTED_COUNTRIES,
  SUPPORTED_INDUSTRIES,
  ValidationError,
  OrganizationNotFoundError,
  TemplateNotFoundError
} from '../types/coa.types';
import { DatabaseService } from './database.service';
import { validateAccountCode, validateOrganizationAccess } from '../utils/coa.utils';

export class UniversalCOAService {
  constructor(private db: DatabaseService) {}

  /**
   * Get available template options for building COA
   */
  async getAvailableTemplates(): Promise<TemplateOptions> {
    try {
      const result = await this.db.query('SELECT get_coa_template_options() as options');
      
      if (!result.rows[0]?.options) {
        throw new Error('Failed to retrieve template options');
      }

      return result.rows[0].options;
    } catch (error) {
      throw new Error(`Failed to get template options: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Preview COA structure before building
   */
  async previewCOAStructure(
    country?: SupportedCountry, 
    industry?: SupportedIndustry
  ): Promise<COAPreview> {
    try {
      // Validate inputs
      if (country && !SUPPORTED_COUNTRIES.includes(country)) {
        throw new ValidationError(`Unsupported country: ${country}`);
      }
      
      if (industry && !SUPPORTED_INDUSTRIES.includes(industry)) {
        throw new ValidationError(`Unsupported industry: ${industry}`);
      }

      // Get base account count
      const baseQuery = `
        SELECT COUNT(*) as count 
        FROM core_entities 
        WHERE organization_id = 'template_universal_base' 
        AND entity_type = 'gl_account'
      `;
      const baseResult = await this.db.query(baseQuery);
      const baseCount = parseInt(baseResult.rows[0]?.count || '0');

      // Get country-specific count
      let countryCount = 0;
      if (country) {
        const countryQuery = `
          SELECT COUNT(*) as count 
          FROM core_entities 
          WHERE organization_id = $1 
          AND entity_type = 'gl_account'
        `;
        const countryResult = await this.db.query(countryQuery, [`template_country_${country}`]);
        countryCount = parseInt(countryResult.rows[0]?.count || '0');
      }

      // Get industry-specific count
      let industryCount = 0;
      if (industry) {
        const industryQuery = `
          SELECT COUNT(*) as count 
          FROM core_entities 
          WHERE organization_id = $1 
          AND entity_type = 'gl_account'
        `;
        const industryResult = await this.db.query(industryQuery, [`template_industry_${industry}`]);
        industryCount = parseInt(industryResult.rows[0]?.count || '0');
      }

      // Get sample accounts by type
      const sampleQuery = `
        SELECT 
          dd.field_value as account_type,
          array_agg(e.entity_name ORDER BY e.entity_code::INTEGER) as sample_names
        FROM core_entities e
        JOIN core_dynamic_data dd ON dd.entity_id = e.id
        WHERE e.organization_id = 'template_universal_base'
        AND e.entity_type = 'gl_account'
        AND dd.field_name = 'account_type'
        GROUP BY dd.field_value
      `;
      const sampleResult = await this.db.query(sampleQuery);
      
      const sampleAccountsByType: Record<string, string[]> = {
        assets: [],
        liabilities: [],
        equity: [],
        revenue: [],
        expenses: []
      };
      sampleResult.rows.forEach((row: any) => {
        if (row.account_type in sampleAccountsByType) {
          sampleAccountsByType[row.account_type] = row.sample_names.slice(0, 3); // First 3 samples
        }
      });

      return {
        total_estimated_accounts: baseCount + countryCount + industryCount,
        layers: {
          universal_base: baseCount,
          ...(country && { country: countryCount }),
          ...(industry && { industry: industryCount })
        },
        sample_accounts_by_type: sampleAccountsByType
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Failed to preview COA structure: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Build customized COA for an organization
   */
  async buildCustomizedCOA(request: COABuildRequest): Promise<COABuildResult> {
    try {
      // Validate request
      this.validateBuildRequest(request);

      // Verify organization exists and user has access
      await validateOrganizationAccess(this.db, request.organization_id);

      // Call the database function
      const query = 'SELECT build_customized_coa($1, $2, $3, $4) as result';
      const params = [
        request.organization_id,
        request.country || null,
        request.industry || null,
        request.customizations ? JSON.stringify(request.customizations) : '{}'
      ];

      const result = await this.db.query(query, params);
      
      if (!result.rows[0]?.result) {
        throw new Error('No result returned from COA builder function');
      }

      const buildResult = result.rows[0].result;
      
      if (!buildResult.success) {
        throw new Error(buildResult.error || 'COA build failed');
      }

      return buildResult;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof OrganizationNotFoundError) {
        throw error;
      }
      throw new Error(`Failed to build COA: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get COA structure for an organization
   */
  async getCOAStructure(
    organizationId: string, 
    includeMetadata: boolean = true
  ): Promise<COAStructure> {
    try {
      // Verify organization access
      await validateOrganizationAccess(this.db, organizationId);

      const query = 'SELECT get_coa_structure($1, $2) as structure';
      const result = await this.db.query(query, [organizationId, includeMetadata]);
      
      if (!result.rows[0]?.structure) {
        throw new Error('No COA structure found');
      }

      const structure = result.rows[0].structure;
      
      if (!structure.success) {
        throw new Error(structure.error || 'Failed to retrieve COA structure');
      }

      return structure;
    } catch (error) {
      if (error instanceof OrganizationNotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get COA structure: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Add custom accounts to existing COA
   */
  async addCustomAccounts(request: AddAccountsRequest): Promise<AddAccountsResult> {
    try {
      // Validate request
      this.validateAddAccountsRequest(request);

      // Verify organization access
      await validateOrganizationAccess(this.db, request.organization_id);

      const query = 'SELECT add_custom_accounts($1, $2) as result';
      const result = await this.db.query(query, [
        request.organization_id,
        JSON.stringify(request.accounts)
      ]);
      
      if (!result.rows[0]?.result) {
        throw new Error('No result returned from add accounts function');
      }

      const addResult = result.rows[0].result;
      
      if (!addResult.success) {
        throw new Error(addResult.error || 'Failed to add custom accounts');
      }

      return addResult;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof OrganizationNotFoundError) {
        throw error;
      }
      throw new Error(`Failed to add custom accounts: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get accounts by template layer
   */
  async getAccountsByLayer(
    organizationId: string, 
    layer: string
  ): Promise<GLAccount[]> {
    try {
      await validateOrganizationAccess(this.db, organizationId);

      const query = `
        SELECT 
          e.id,
          e.entity_code as account_code,
          e.entity_name as account_name,
          e.status,
          e.created_at,
          e.updated_at,
          jsonb_object_agg(dd.field_name, dd.field_value) as metadata
        FROM core_entities e
        LEFT JOIN core_dynamic_data dd ON dd.entity_id = e.id
        WHERE e.organization_id = $1
        AND e.entity_type = 'gl_account'
        AND EXISTS (
          SELECT 1 FROM core_dynamic_data dd2 
          WHERE dd2.entity_id = e.id 
          AND dd2.field_name = 'template_layer' 
          AND dd2.field_value = $2
        )
        GROUP BY e.id, e.entity_code, e.entity_name, e.status, e.created_at, e.updated_at
        ORDER BY e.entity_code::INTEGER
      `;

      const result = await this.db.query(query, [organizationId, layer]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get accounts by layer: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update account name
   */
  async updateAccountName(
    organizationId: string,
    accountCode: string,
    newName: string
  ): Promise<void> {
    try {
      await validateOrganizationAccess(this.db, organizationId);
      
      if (!validateAccountCode(accountCode)) {
        throw new ValidationError('Invalid account code format');
      }

      if (!newName || newName.trim().length === 0) {
        throw new ValidationError('Account name cannot be empty');
      }

      const query = `
        UPDATE core_entities 
        SET entity_name = $3, updated_at = NOW()
        WHERE organization_id = $1 
        AND entity_code = $2 
        AND entity_type = 'gl_account'
      `;

      const result = await this.db.query(query, [organizationId, accountCode, newName.trim()]);
      
      if (result.rowCount === 0) {
        throw new Error('Account not found or no changes made');
      }
    } catch (error) {
      if (error instanceof ValidationError || error instanceof OrganizationNotFoundError) {
        throw error;
      }
      throw new Error(`Failed to update account name: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete custom account
   */
  async deleteCustomAccount(
    organizationId: string,
    accountCode: string
  ): Promise<void> {
    try {
      await validateOrganizationAccess(this.db, organizationId);

      // Verify it's a custom account (can only delete custom accounts)
      const checkQuery = `
        SELECT e.id
        FROM core_entities e
        JOIN core_dynamic_data dd ON dd.entity_id = e.id
        WHERE e.organization_id = $1
        AND e.entity_code = $2
        AND e.entity_type = 'gl_account'
        AND dd.field_name = 'template_layer'
        AND dd.field_value = 'custom'
      `;

      const checkResult = await this.db.query(checkQuery, [organizationId, accountCode]);
      
      if (checkResult.rows.length === 0) {
        throw new ValidationError('Can only delete custom accounts');
      }

      const entityId = checkResult.rows[0].id;

      // Delete dynamic data first
      await this.db.query(
        'DELETE FROM core_dynamic_data WHERE entity_id = $1',
        [entityId]
      );

      // Delete the entity
      await this.db.query(
        'DELETE FROM core_entities WHERE id = $1',
        [entityId]
      );
    } catch (error) {
      if (error instanceof ValidationError || error instanceof OrganizationNotFoundError) {
        throw error;
      }
      throw new Error(`Failed to delete custom account: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate COA build request
   */
  private validateBuildRequest(request: COABuildRequest): void {
    if (!request.organization_id) {
      throw new ValidationError('Organization ID is required');
    }

    if (request.country && !SUPPORTED_COUNTRIES.includes(request.country as SupportedCountry)) {
      throw new ValidationError(`Unsupported country: ${request.country}`);
    }

    if (request.industry && !SUPPORTED_INDUSTRIES.includes(request.industry as SupportedIndustry)) {
      throw new ValidationError(`Unsupported industry: ${request.industry}`);
    }

    if (request.customizations?.add_accounts) {
      for (const account of request.customizations.add_accounts) {
        if (!validateAccountCode(account.account_code)) {
          throw new ValidationError(`Invalid account code: ${account.account_code}`);
        }
        
        if (!account.account_name || account.account_name.trim().length === 0) {
          throw new ValidationError('Account name is required');
        }
      }
    }
  }

  /**
   * Validate add accounts request
   */
  private validateAddAccountsRequest(request: AddAccountsRequest): void {
    if (!request.organization_id) {
      throw new ValidationError('Organization ID is required');
    }

    if (!request.accounts || request.accounts.length === 0) {
      throw new ValidationError('At least one account is required');
    }

    for (const account of request.accounts) {
      if (!validateAccountCode(account.account_code)) {
        throw new ValidationError(`Invalid account code: ${account.account_code}`);
      }
      
      if (!account.account_name || account.account_name.trim().length === 0) {
        throw new ValidationError('Account name is required');
      }
    }
  }
}