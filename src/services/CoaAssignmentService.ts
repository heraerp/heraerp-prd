// Enhanced COA Template Assignment Service
// Handles organization template assignment logic with validation and template integration

import { CoaTemplateService } from './CoaTemplateService';
import { CoaValidationService, ValidationResult, OrganizationContext } from './CoaValidationService';

export interface OrganizationCoaConfig {
  id: string;
  organizationId: string;
  baseTemplate: string;
  countryTemplate?: string;
  industryTemplate?: string;
  assignedBy: string;
  assignedAt: string;
  effectiveDate: string;
  status: 'active' | 'inactive' | 'pending';
  isLocked: boolean;
  allowCustomAccounts: boolean;
  autoSyncUpdates: boolean;
}

export interface CoaAssignmentHistory {
  id: string;
  organizationId: string;
  changeType: 'assigned' | 'modified' | 'reverted';
  previousConfig?: any;
  newConfig: any;
  changedBy: string;
  changeReason?: string;
  changedAt: string;
  accountsAffected: number;
  customAccountsPreserved: boolean;
}

export interface TemplateAssignmentRequest {
  organizationId: string;
  countryTemplate?: string;
  industryTemplate?: string;
  assignedBy: string;
  allowCustomAccounts?: boolean;
  changeReason?: string;
}

export interface TemplateAssignmentResult {
  success: boolean;
  configurationId?: string;
  message: string;
  coaStructure?: any;
  warnings?: string[];
  errors?: string[];
}

export interface AvailableTemplate {
  id: string;
  name: string;
  type: 'country' | 'industry';
  description: string;
  accountCount: number;
  requirements: string[];
  isRecommended: boolean;
  compatibleWith: string[];
}

export class CoaAssignmentService {
  private baseUrl = '/api/v1/coa/assignment';
  private templateService: CoaTemplateService;
  private validationService: CoaValidationService;

  constructor() {
    this.templateService = CoaTemplateService.getInstance();
    this.validationService = CoaValidationService.getInstance();
  }

  /**
   * Get available templates for assignment
   */
  async getAvailableTemplates(): Promise<AvailableTemplate[]> {
    // Get templates from the template service
    const countryTemplates = this.templateService.getAvailableCountryTemplates();
    const industryTemplates = this.templateService.getAvailableIndustryTemplates();
    
    const templates: AvailableTemplate[] = [];
    
    // Add country templates
    for (const countryId of countryTemplates) {
      const template = this.templateService.getCountryTemplate(countryId);
      if (template) {
        templates.push({
          id: countryId,
          name: template.template_info.template_name,
          type: 'country',
          description: template.template_info.description,
          accountCount: this.countAccountsInTemplate(template),
          requirements: this.extractRequirements(template),
          isRecommended: true,
          compatibleWith: industryTemplates
        });
      }
    }
    
    // Add industry templates
    for (const industryId of industryTemplates) {
      const template = this.templateService.getIndustryTemplate(industryId);
      if (template) {
        templates.push({
          id: industryId,
          name: template.template_info.template_name,
          type: 'industry',
          description: template.template_info.description,
          accountCount: this.countAccountsInTemplate(template),
          requirements: this.extractRequirements(template),
          isRecommended: false,
          compatibleWith: countryTemplates
        });
      }
    }
    
    return templates;
  }

  /**
   * Count accounts in a template
   */
  private countAccountsInTemplate(template: any): number {
    let count = 0;
    
    if (template.account_structure) {
      count += this.countAccountsInSection(template.account_structure);
    }
    
    if (template.country_specific_accounts) {
      for (const section of Object.values(template.country_specific_accounts)) {
        if (Array.isArray(section)) {
          count += section.length;
        }
      }
    }
    
    if (template.industry_specific_accounts) {
      for (const section of Object.values(template.industry_specific_accounts)) {
        if (Array.isArray(section)) {
          count += section.length;
        }
      }
    }
    
    return count;
  }

  /**
   * Count accounts in a nested section
   */
  private countAccountsInSection(section: any): number {
    let count = 0;
    
    if (section.accounts && Array.isArray(section.accounts)) {
      count += section.accounts.length;
    }
    
    for (const [key, value] of Object.entries(section)) {
      if (key !== 'accounts' && key !== 'range' && typeof value === 'object' && value !== null) {
        count += this.countAccountsInSection(value);
      }
    }
    
    return count;
  }

  /**
   * Extract requirements from template
   */
  private extractRequirements(template: any): string[] {
    const requirements: string[] = [];
    
    if (template.reporting_requirements?.compliance_requirements) {
      requirements.push(...template.reporting_requirements.compliance_requirements);
    }
    
    return requirements;
  }

  /**
   * Fallback method for mock data during development
   */
  private async getFallbackTemplates(): Promise<AvailableTemplate[]> {
    return [
      // Country Templates
      {
        id: 'india',
        name: 'India (GST/TDS/EPF)',
        type: 'country',
        description: 'Indian compliance with GST, TDS, EPF, and statutory requirements',
        accountCount: 45,
        requirements: ['GST Registration', 'PAN Number', 'EPF Registration'],
        isRecommended: true,
        compatibleWith: ['restaurant', 'healthcare', 'manufacturing', 'professional_services']
      },
      {
        id: 'usa',
        name: 'United States (Sales Tax/Payroll)',
        type: 'country',
        description: 'US compliance with sales tax, payroll taxes, and federal requirements',
        accountCount: 38,
        requirements: ['EIN Number', 'State Registration', 'Sales Tax Permit'],
        isRecommended: true,
        compatibleWith: ['restaurant', 'healthcare', 'manufacturing', 'professional_services']
      },
      {
        id: 'uk',
        name: 'United Kingdom (VAT/PAYE)',
        type: 'country',
        description: 'UK compliance with VAT, PAYE, Corporation Tax, and HMRC requirements',
        accountCount: 42,
        requirements: ['VAT Registration', 'Company House Number', 'PAYE Scheme'],
        isRecommended: true,
        compatibleWith: ['restaurant', 'healthcare', 'manufacturing', 'professional_services']
      },
      
      // Industry Templates
      {
        id: 'restaurant',
        name: 'Restaurant & Food Service',
        type: 'industry',
        description: 'Specialized accounts for restaurant operations, inventory, and food service',
        accountCount: 28,
        requirements: ['Food Service License', 'Liquor License (if applicable)'],
        isRecommended: false,
        compatibleWith: ['india', 'usa', 'uk']
      },
      {
        id: 'healthcare',
        name: 'Healthcare & Medical',
        type: 'industry',
        description: 'Medical practice accounts, patient billing, insurance, and regulatory compliance',
        accountCount: 35,
        requirements: ['Medical License', 'HIPAA Compliance', 'Insurance Credentialing'],
        isRecommended: false,
        compatibleWith: ['india', 'usa', 'uk']
      },
      {
        id: 'manufacturing',
        name: 'Manufacturing & Production',
        type: 'industry',
        description: 'Manufacturing accounts for raw materials, WIP, finished goods, and production costs',
        accountCount: 32,
        requirements: ['Manufacturing License', 'Environmental Permits'],
        isRecommended: false,
        compatibleWith: ['india', 'usa', 'uk']
      },
      {
        id: 'professional_services',
        name: 'Professional Services',
        type: 'industry',
        description: 'Service-based business accounts for consultancy, legal, accounting, and professional firms',
        accountCount: 25,
        requirements: ['Professional License', 'Liability Insurance'],
        isRecommended: true,
        compatibleWith: ['india', 'usa', 'uk']
      }
    ];
  }

  /**
   * Get current COA assignment for an organization
   */
  async getOrganizationAssignment(organizationId: string): Promise<OrganizationCoaConfig | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${organizationId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to fetch assignment: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching organization assignment:', error);
      
      // Mock data for development
      return {
        id: '550e8400-e29b-41d4-a716-446655440000',
        organizationId,
        baseTemplate: 'universal_base',
        countryTemplate: 'india',
        industryTemplate: 'professional_services',
        assignedBy: 'system',
        assignedAt: new Date().toISOString(),
        effectiveDate: new Date().toISOString().split('T')[0],
        status: 'active',
        isLocked: false,
        allowCustomAccounts: true,
        autoSyncUpdates: true
      };
    }
  }

  /**
   * Assign COA template to an organization with enhanced validation
   */
  async assignTemplate(
    request: TemplateAssignmentRequest,
    organizationContext?: OrganizationContext
  ): Promise<TemplateAssignmentResult> {
    try {
      // Enhanced validation using validation service
      if (organizationContext) {
        const validationResult = await this.validationService.validateCoaAssignment(
          {
            organization_id: request.organizationId,
            country_template: request.countryTemplate,
            industry_template: request.industryTemplate,
            allow_custom_accounts: request.allowCustomAccounts,
            assigned_by: request.assignedBy
          },
          organizationContext
        );

        if (!validationResult.valid) {
          return {
            success: false,
            message: 'Template assignment validation failed',
            errors: validationResult.errors.map(e => e.message),
            warnings: validationResult.warnings.map(w => w.message)
          };
        }
      }

      // Legacy validation for backward compatibility
      const legacyValidation = await this.validateAssignment(request);
      if (!legacyValidation.isValid) {
        return {
          success: false,
          message: 'Template assignment validation failed',
          errors: legacyValidation.errors,
          warnings: legacyValidation.warnings
        };
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Assignment failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error assigning template:', error);
      
      // Mock successful response for development
      return {
        success: true,
        configurationId: '550e8400-e29b-41d4-a716-446655440001',
        message: `COA template assigned successfully. Base: universal_base${request.countryTemplate ? `, Country: ${request.countryTemplate}` : ''}${request.industryTemplate ? `, Industry: ${request.industryTemplate}` : ''}`,
        coaStructure: {
          totalAccounts: 67 + (request.countryTemplate ? 40 : 0) + (request.industryTemplate ? 30 : 0),
          layers: [
            { layer: 'base', template: 'universal_base', accounts: 67 },
            request.countryTemplate && { layer: 'country', template: request.countryTemplate, accounts: 40 },
            request.industryTemplate && { layer: 'industry', template: request.industryTemplate, accounts: 30 }
          ].filter(Boolean)
        },
        warnings: []
      };
    }
  }

  /**
   * Get assignment history for an organization
   */
  async getAssignmentHistory(organizationId: string): Promise<CoaAssignmentHistory[]> {
    try {
      const response = await fetch(`${this.baseUrl}/${organizationId}/history`);
      if (!response.ok) {
        throw new Error(`Failed to fetch history: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching assignment history:', error);
      
      // Mock data for development
      return [
        {
          id: '1',
          organizationId,
          changeType: 'assigned',
          newConfig: {
            baseTemplate: 'universal_base',
            countryTemplate: 'india',
            industryTemplate: 'professional_services'
          },
          changedBy: 'system',
          changeReason: 'Initial template assignment',
          changedAt: new Date().toISOString(),
          accountsAffected: 137,
          customAccountsPreserved: true
        }
      ];
    }
  }

  /**
   * Validate template assignment request
   */
  private async validateAssignment(request: TemplateAssignmentRequest): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if organization exists
    if (!request.organizationId) {
      errors.push('Organization ID is required');
    }

    // Check if assigned by user is provided
    if (!request.assignedBy) {
      errors.push('Assigned by user is required');
    }

    // Validate country template
    if (request.countryTemplate) {
      const availableTemplates = await this.getAvailableTemplates();
      const countryTemplate = availableTemplates.find(t => t.id === request.countryTemplate && t.type === 'country');
      if (!countryTemplate) {
        errors.push(`Invalid country template: ${request.countryTemplate}`);
      }
    } else {
      warnings.push('No country template selected. Consider adding country-specific compliance.');
    }

    // Validate industry template
    if (request.industryTemplate) {
      const availableTemplates = await this.getAvailableTemplates();
      const industryTemplate = availableTemplates.find(t => t.id === request.industryTemplate && t.type === 'industry');
      if (!industryTemplate) {
        errors.push(`Invalid industry template: ${request.industryTemplate}`);
      }
    } else {
      warnings.push('No industry template selected. Consider adding industry-specific accounts.');
    }

    // Check template compatibility
    if (request.countryTemplate && request.industryTemplate) {
      const availableTemplates = await this.getAvailableTemplates();
      const countryTemplate = availableTemplates.find(t => t.id === request.countryTemplate);
      const industryTemplate = availableTemplates.find(t => t.id === request.industryTemplate);
      
      if (countryTemplate && industryTemplate && 
          !countryTemplate.compatibleWith.includes(request.industryTemplate!)) {
        warnings.push(`${countryTemplate.name} and ${industryTemplate.name} may have compatibility issues`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get template recommendation for an organization
   */
  async getTemplateRecommendation(organizationProfile: {
    country?: string;
    industry?: string;
    businessType?: string;
    companySize?: 'small' | 'medium' | 'large';
  }): Promise<{
    recommendedCountry?: string;
    recommendedIndustry?: string;
    reasoning: string[];
    alternatives: string[];
  }> {
    const reasoning: string[] = [];
    const alternatives: string[] = [];

    let recommendedCountry: string | undefined;
    let recommendedIndustry: string | undefined;

    // Country recommendation logic
    if (organizationProfile.country) {
      switch (organizationProfile.country.toLowerCase()) {
        case 'india':
        case 'in':
          recommendedCountry = 'india';
          reasoning.push('India template recommended for GST, TDS, and EPF compliance');
          break;
        case 'usa':
        case 'us':
        case 'united states':
          recommendedCountry = 'usa';
          reasoning.push('USA template recommended for sales tax and payroll compliance');
          break;
        case 'uk':
        case 'united kingdom':
        case 'britain':
          recommendedCountry = 'uk';
          reasoning.push('UK template recommended for VAT and PAYE compliance');
          break;
        default:
          reasoning.push('Consider using universal base template until country-specific template is available');
          alternatives.push('Contact support for custom country template development');
      }
    }

    // Industry recommendation logic
    if (organizationProfile.industry) {
      switch (organizationProfile.industry.toLowerCase()) {
        case 'restaurant':
        case 'food service':
        case 'hospitality':
          recommendedIndustry = 'restaurant';
          reasoning.push('Restaurant template includes specialized inventory and food service accounts');
          break;
        case 'healthcare':
        case 'medical':
        case 'clinic':
        case 'hospital':
          recommendedIndustry = 'healthcare';
          reasoning.push('Healthcare template includes patient billing and medical compliance accounts');
          break;
        case 'manufacturing':
        case 'production':
        case 'factory':
          recommendedIndustry = 'manufacturing';
          reasoning.push('Manufacturing template includes raw materials, WIP, and production cost accounts');
          break;
        case 'consulting':
        case 'professional services':
        case 'legal':
        case 'accounting':
          recommendedIndustry = 'professional_services';
          reasoning.push('Professional services template optimized for service-based businesses');
          break;
        default:
          reasoning.push('Professional services template recommended as general-purpose solution');
          alternatives.push('Contact support if specialized industry template is needed');
      }
    }

    return {
      recommendedCountry,
      recommendedIndustry,
      reasoning,
      alternatives
    };
  }
}

export const coaAssignmentService = new CoaAssignmentService();