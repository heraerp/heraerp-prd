// Universal Chart of Accounts Controller
// HTTP request handlers for COA management endpoints

import { Request, Response, NextFunction } from 'express';
import { UniversalCOAService } from '../services/universal-coa.service';
import { 
  COABuildRequest, 
  AddAccountsRequest,
  ApiResponse,
  ValidationError,
  OrganizationNotFoundError,
  TemplateNotFoundError,
  SupportedCountry,
  SupportedIndustry
} from '../types/coa.types';
import { validateAccountCode, sanitizeAccountName } from '../utils/coa.utils';

export class UniversalCOAController {
  constructor(private coaService: UniversalCOAService) {}

  /**
   * GET /api/v1/coa/templates/countries
   * Get available country templates
   */
  getAvailableCountries = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const templates = await this.coaService.getAvailableTemplates();
      
      const response: ApiResponse<any> = {
        success: true,
        data: templates.countries,
        message: 'Available country templates retrieved successfully',
        timestamp: new Date().toISOString()
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/coa/templates/industries
   * Get available industry templates
   */
  getAvailableIndustries = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const templates = await this.coaService.getAvailableTemplates();
      
      const response: ApiResponse<any> = {
        success: true,
        data: templates.industries,
        message: 'Available industry templates retrieved successfully',
        timestamp: new Date().toISOString()
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/coa/templates/options
   * Get all available template options
   */
  getTemplateOptions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const templates = await this.coaService.getAvailableTemplates();
      
      const response: ApiResponse<any> = {
        success: true,
        data: templates,
        message: 'Template options retrieved successfully',
        timestamp: new Date().toISOString()
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/coa/templates/preview
   * Preview COA structure before building
   */
  previewCOAStructure = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { country, industry } = req.query;
      
      const preview = await this.coaService.previewCOAStructure(
        country as SupportedCountry, 
        industry as SupportedIndustry
      );
      
      const response: ApiResponse<any> = {
        success: true,
        data: preview,
        message: 'COA structure preview generated successfully',
        timestamp: new Date().toISOString()
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/coa/build
   * Build customized COA for organization
   */
  buildCustomizedCOA = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const buildRequest: COABuildRequest = {
        organization_id: req.body.organization_id,
        country: req.body.country,
        industry: req.body.industry,
        customizations: req.body.customizations
      };

      // Validate required fields
      if (!buildRequest.organization_id) {
        throw new ValidationError('organization_id is required');
      }

      // Sanitize custom account names if provided
      if (buildRequest.customizations?.add_accounts) {
        buildRequest.customizations.add_accounts = buildRequest.customizations.add_accounts.map(account => ({
          ...account,
          account_name: sanitizeAccountName(account.account_name)
        }));
      }

      const result = await this.coaService.buildCustomizedCOA(buildRequest);
      
      const response: ApiResponse<any> = {
        success: true,
        data: result,
        message: 'COA built successfully',
        timestamp: new Date().toISOString()
      };
      
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/coa/structure/:organizationId
   * Get COA structure for organization
   */
  getCOAStructure = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId } = req.params;
      const includeMetadata = req.query.include_metadata !== 'false';
      
      if (!organizationId) {
        throw new ValidationError('Organization ID is required');
      }

      const structure = await this.coaService.getCOAStructure(organizationId, includeMetadata);
      
      const response: ApiResponse<any> = {
        success: true,
        data: structure,
        message: 'COA structure retrieved successfully',
        timestamp: new Date().toISOString()
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/coa/customize
   * Add custom accounts to existing COA
   */
  addCustomAccounts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const addRequest: AddAccountsRequest = {
        organization_id: req.body.organization_id,
        accounts: req.body.accounts
      };

      // Validate required fields
      if (!addRequest.organization_id) {
        throw new ValidationError('organization_id is required');
      }

      if (!addRequest.accounts || !Array.isArray(addRequest.accounts)) {
        throw new ValidationError('accounts array is required');
      }

      // Sanitize account names
      addRequest.accounts = addRequest.accounts.map(account => ({
        ...account,
        account_name: sanitizeAccountName(account.account_name)
      }));

      const result = await this.coaService.addCustomAccounts(addRequest);
      
      const response: ApiResponse<any> = {
        success: true,
        data: result,
        message: 'Custom accounts added successfully',
        timestamp: new Date().toISOString()
      };
      
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/coa/accounts/layer/:organizationId/:layer
   * Get accounts by template layer
   */
  getAccountsByLayer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId, layer } = req.params;
      
      if (!organizationId || !layer) {
        throw new ValidationError('Organization ID and layer are required');
      }

      const accounts = await this.coaService.getAccountsByLayer(organizationId, layer);
      
      const response: ApiResponse<any> = {
        success: true,
        data: accounts,
        message: `Accounts for layer '${layer}' retrieved successfully`,
        timestamp: new Date().toISOString()
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/v1/coa/account/:organizationId/:accountCode/name
   * Update account name
   */
  updateAccountName = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId, accountCode } = req.params;
      const { name } = req.body;
      
      if (!organizationId || !accountCode) {
        throw new ValidationError('Organization ID and account code are required');
      }

      if (!name) {
        throw new ValidationError('Account name is required');
      }

      const sanitizedName = sanitizeAccountName(name);
      
      await this.coaService.updateAccountName(organizationId, accountCode, sanitizedName);
      
      const response: ApiResponse<any> = {
        success: true,
        message: 'Account name updated successfully',
        timestamp: new Date().toISOString()
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/coa/account/:organizationId/:accountCode
   * Delete custom account
   */
  deleteCustomAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId, accountCode } = req.params;
      
      if (!organizationId || !accountCode) {
        throw new ValidationError('Organization ID and account code are required');
      }

      if (!validateAccountCode(accountCode)) {
        throw new ValidationError('Invalid account code format');
      }

      await this.coaService.deleteCustomAccount(organizationId, accountCode);
      
      const response: ApiResponse<any> = {
        success: true,
        message: 'Custom account deleted successfully',
        timestamp: new Date().toISOString()
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Error handler middleware
   */
  handleError = (error: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('COA Controller Error:', error);

    let statusCode = 500;
    let errorMessage = 'Internal server error';

    if (error instanceof ValidationError) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error instanceof OrganizationNotFoundError) {
      statusCode = 404;
      errorMessage = error.message;
    } else if (error instanceof TemplateNotFoundError) {
      statusCode = 404;
      errorMessage = error.message;
    }

    const response: ApiResponse<null> = {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    };

    res.status(statusCode).json(response);
  };
}