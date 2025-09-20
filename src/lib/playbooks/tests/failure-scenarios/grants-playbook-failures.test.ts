import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { PlaybookExecutor } from '../../executor/PlaybookExecutor';
import { PlaybookRegistry } from '../../registry/PlaybookRegistry';
import { ExecutionContext } from '../../executor/types';
import { WorkflowStatus } from '../../types/execution';
import { grantsPlaybook } from '../../library/grants';

// Mock Supabase client
jest.mock('@supabase/supabase-js');
const mockSupabase = createClient as jest.MockedFunction<typeof createClient>;

describe('Grants Playbook Failure Scenarios', () => {
  let executor: PlaybookExecutor;
  let registry: PlaybookRegistry;
  let supabase: SupabaseClient;
  let executionContext: ExecutionContext;
  const testOrgId = 'test-org-123';
  const testUserId = 'test-user-456';
  const testExecutionId = 'exec-789';

  beforeEach(() => {
    jest.clearAllMocks();
    
    supabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      rpc: jest.fn(),
    } as any;

    mockSupabase.mockReturnValue(supabase);

    registry = new PlaybookRegistry();
    registry.register(grantsPlaybook);
    executor = new PlaybookExecutor(supabase, registry);

    executionContext = {
      executionId: testExecutionId,
      organizationId: testOrgId,
      userId: testUserId,
      workflowId: 'GRANTS_APPLICATION_v1',
      currentStep: 0,
      status: 'running' as WorkflowStatus,
      startedAt: new Date().toISOString(),
      metadata: {},
      error: null,
      completedSteps: [],
      retryCount: 0,
      lastCheckpoint: null,
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Eligibility Check Failures', () => {
    it('should fail when organization is not registered in SAM.gov', async () => {
      const mockSamApi = {
        checkRegistration: jest.fn().mockResolvedValue({
          isRegistered: false,
          registrationStatus: 'NOT_FOUND',
        }),
      };

      jest.spyOn(global, 'fetch').mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSamApi.checkRegistration()),
        } as Response)
      );

      const input = {
        organizationId: testOrgId,
        grantOpportunity: 'NSF-2024-001',
        requestedAmount: 500000,
      };

      await expect(
        executor.execute('GRANTS_APPLICATION_v1', input, executionContext)
      ).rejects.toThrow('Organization not registered in SAM.gov');

      expect(executionContext.status).toBe('failed');
      expect(executionContext.error).toContain('SAM.gov registration');
    });

    it('should fail when organization is debarred', async () => {
      const mockSamApi = {
        checkRegistration: jest.fn().mockResolvedValue({
          isRegistered: true,
          registrationStatus: 'DEBARRED',
          debarmentReason: 'Violation of federal procurement regulations',
        }),
      };

      jest.spyOn(global, 'fetch').mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSamApi.checkRegistration()),
        } as Response)
      );

      const input = {
        organizationId: testOrgId,
        grantOpportunity: 'NSF-2024-001',
        requestedAmount: 500000,
      };

      await expect(
        executor.execute('GRANTS_APPLICATION_v1', input, executionContext)
      ).rejects.toThrow('Organization is debarred from federal grants');

      expect(executionContext.metadata.debarmentReason).toBeDefined();
    });

    it('should fail when requested amount exceeds grant limits', async () => {
      const input = {
        organizationId: testOrgId,
        grantOpportunity: 'SMALL-BUSINESS-GRANT-2024',
        requestedAmount: 1500000, // Exceeds $1M limit
        grantMaximum: 1000000,
      };

      await expect(
        executor.execute('GRANTS_APPLICATION_v1', input, executionContext)
      ).rejects.toThrow('Requested amount exceeds grant maximum');

      expect(executionContext.error).toContain('exceeds maximum');
    });
  });

  describe('Document Validation Failures', () => {
    it('should fail when required documents are missing', async () => {
      const input = {
        organizationId: testOrgId,
        grantOpportunity: 'NSF-2024-001',
        requestedAmount: 500000,
        documents: {
          // Missing required narrative
          budget: { id: 'doc-1', status: 'uploaded' },
          // Missing biosketch
        },
        requiredDocuments: ['narrative', 'budget', 'biosketch'],
      };

      await expect(
        executor.execute('GRANTS_APPLICATION_v1', input, executionContext)
      ).rejects.toThrow('Missing required documents');

      expect(executionContext.metadata.missingDocuments).toContain('narrative');
      expect(executionContext.metadata.missingDocuments).toContain('biosketch');
    });

    it('should fail when document format is invalid', async () => {
      const input = {
        organizationId: testOrgId,
        grantOpportunity: 'NSF-2024-001',
        requestedAmount: 500000,
        documents: {
          narrative: { 
            id: 'doc-1', 
            status: 'uploaded',
            format: 'docx', // Invalid, requires PDF
            size: 5242880,
          },
          budget: { 
            id: 'doc-2', 
            status: 'uploaded',
            format: 'pdf',
            size: 1048576,
          },
        },
        documentRequirements: {
          narrative: { format: 'pdf', maxSize: 10485760 },
          budget: { format: 'pdf', maxSize: 5242880 },
        },
      };

      await expect(
        executor.execute('GRANTS_APPLICATION_v1', input, executionContext)
      ).rejects.toThrow('Invalid document format');

      expect(executionContext.metadata.invalidDocuments).toContain('narrative');
    });

    it('should fail when budget doesn\'t match narrative', async () => {
      const mockBudgetValidator = {
        validate: jest.fn().mockResolvedValue({
          isValid: false,
          errors: [
            'Total budget in narrative ($600,000) doesn\'t match budget spreadsheet ($500,000)',
            'Personnel costs in narrative exceed budget allocation',
          ],
        }),
      };

      jest.spyOn(global, 'fetch').mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockBudgetValidator.validate()),
        } as Response)
      );

      const input = {
        organizationId: testOrgId,
        grantOpportunity: 'NSF-2024-001',
        requestedAmount: 500000,
        narrativeBudget: 600000,
        spreadsheetBudget: 500000,
      };

      await expect(
        executor.execute('GRANTS_APPLICATION_v1', input, executionContext)
      ).rejects.toThrow('Budget validation failed');

      expect(executionContext.metadata.budgetErrors).toBeDefined();
    });
  });

  describe('Compliance Review Failures', () => {
    it('should fail when certifications are expired', async () => {
      const input = {
        organizationId: testOrgId,
        grantOpportunity: 'NSF-2024-001',
        requestedAmount: 500000,
        certifications: {
          humanSubjects: {
            status: 'expired',
            expiryDate: '2023-12-01',
          },
          animalWelfare: {
            status: 'active',
            expiryDate: '2025-06-01',
          },
        },
        requiredCertifications: ['humanSubjects', 'animalWelfare'],
      };

      await expect(
        executor.execute('GRANTS_APPLICATION_v1', input, executionContext)
      ).rejects.toThrow('Expired certifications');

      expect(executionContext.metadata.expiredCertifications).toContain('humanSubjects');
    });

    it('should fail when unresolved audit findings exist', async () => {
      const mockAuditApi = {
        checkFindings: jest.fn().mockResolvedValue({
          hasUnresolvedFindings: true,
          findings: [
            {
              id: 'AUDIT-2023-001',
              severity: 'material',
              description: 'Improper cost allocation',
              status: 'open',
            },
          ],
        }),
      };

      jest.spyOn(global, 'fetch').mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAuditApi.checkFindings()),
        } as Response)
      );

      const input = {
        organizationId: testOrgId,
        grantOpportunity: 'NSF-2024-001',
        requestedAmount: 500000,
      };

      await expect(
        executor.execute('GRANTS_APPLICATION_v1', input, executionContext)
      ).rejects.toThrow('Unresolved audit findings');

      expect(executionContext.metadata.auditFindings).toBeDefined();
      expect(executionContext.metadata.auditFindings[0].severity).toBe('material');
    });

    it('should fail when conflict of interest forms are missing', async () => {
      const input = {
        organizationId: testOrgId,
        grantOpportunity: 'NSF-2024-001',
        requestedAmount: 500000,
        investigators: [
          { id: 'inv-1', name: 'Dr. Smith', coiFormSubmitted: true },
          { id: 'inv-2', name: 'Dr. Jones', coiFormSubmitted: false },
          { id: 'inv-3', name: 'Dr. Brown', coiFormSubmitted: false },
        ],
      };

      await expect(
        executor.execute('GRANTS_APPLICATION_v1', input, executionContext)
      ).rejects.toThrow('Missing conflict of interest forms');

      expect(executionContext.metadata.missingCoiForms).toContain('Dr. Jones');
      expect(executionContext.metadata.missingCoiForms).toContain('Dr. Brown');
    });
  });

  describe('Technical Review Failures', () => {
    it('should fail when technical merit score is too low', async () => {
      const mockReviewApi = {
        scoreTechnicalMerit: jest.fn().mockResolvedValue({
          overallScore: 2.8, // Below 3.0 threshold
          scores: {
            innovation: 2.5,
            feasibility: 3.0,
            impact: 2.8,
            methodology: 3.0,
          },
          reviewerComments: [
            'Limited innovation in proposed approach',
            'Impact not clearly articulated',
          ],
        }),
      };

      jest.spyOn(global, 'fetch').mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockReviewApi.scoreTechnicalMerit()),
        } as Response)
      );

      const input = {
        organizationId: testOrgId,
        grantOpportunity: 'NSF-2024-001',
        requestedAmount: 500000,
        minimumTechnicalScore: 3.0,
      };

      await expect(
        executor.execute('GRANTS_APPLICATION_v1', input, executionContext)
      ).rejects.toThrow('Technical merit score below threshold');

      expect(executionContext.metadata.technicalScore).toBeLessThan(3.0);
      expect(executionContext.metadata.reviewerComments).toBeDefined();
    });

    it('should fail due to feasibility concerns', async () => {
      const mockReviewApi = {
        assessFeasibility: jest.fn().mockResolvedValue({
          isFeasible: false,
          concerns: [
            'Timeline unrealistic for proposed scope',
            'Lack of necessary equipment',
            'Team lacks required expertise in key areas',
          ],
          riskLevel: 'high',
        }),
      };

      jest.spyOn(global, 'fetch').mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockReviewApi.assessFeasibility()),
        } as Response)
      );

      const input = {
        organizationId: testOrgId,
        grantOpportunity: 'NSF-2024-001',
        requestedAmount: 500000,
      };

      await expect(
        executor.execute('GRANTS_APPLICATION_v1', input, executionContext)
      ).rejects.toThrow('Project feasibility concerns');

      expect(executionContext.metadata.feasibilityConcerns).toBeDefined();
      expect(executionContext.metadata.riskLevel).toBe('high');
    });

    it('should fail due to insufficient innovation', async () => {
      const mockInnovationApi = {
        assessInnovation: jest.fn().mockResolvedValue({
          innovationScore: 1.5, // Scale of 1-5
          assessment: {
            novelty: 'low',
            technicalAdvancement: 'minimal',
            marketDifferentiation: 'none',
          },
          feedback: 'Proposed approach uses well-established methods without novel contributions',
        }),
      };

      jest.spyOn(global, 'fetch').mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockInnovationApi.assessInnovation()),
        } as Response)
      );

      const input = {
        organizationId: testOrgId,
        grantOpportunity: 'INNOVATION-GRANT-2024',
        requestedAmount: 750000,
        minimumInnovationScore: 3.0,
      };

      await expect(
        executor.execute('GRANTS_APPLICATION_v1', input, executionContext)
      ).rejects.toThrow('Insufficient innovation');

      expect(executionContext.metadata.innovationScore).toBeLessThan(3.0);
    });
  });

  describe('Budget Review Failures', () => {
    it('should fail when personnel costs exceed 65% limit', async () => {
      const input = {
        organizationId: testOrgId,
        grantOpportunity: 'NSF-2024-001',
        requestedAmount: 500000,
        budget: {
          personnel: 350000, // 70% of total
          equipment: 50000,
          supplies: 30000,
          travel: 20000,
          other: 50000,
        },
        budgetLimits: {
          maxPersonnelPercentage: 0.65,
        },
      };

      await expect(
        executor.execute('GRANTS_APPLICATION_v1', input, executionContext)
      ).rejects.toThrow('Personnel costs exceed allowable percentage');

      expect(executionContext.metadata.personnelPercentage).toBeGreaterThan(0.65);
    });

    it('should fail when unallowable costs are included', async () => {
      const mockCostValidator = {
        validateCosts: jest.fn().mockResolvedValue({
          hasUnallowableCosts: true,
          unallowableCosts: [
            {
              category: 'Entertainment',
              amount: 5000,
              reason: 'Entertainment expenses not allowable under federal grants',
            },
            {
              category: 'Alcoholic beverages',
              amount: 2000,
              reason: 'Alcohol purchases prohibited',
            },
          ],
          totalUnallowable: 7000,
        }),
      };

      jest.spyOn(global, 'fetch').mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCostValidator.validateCosts()),
        } as Response)
      );

      const input = {
        organizationId: testOrgId,
        grantOpportunity: 'NSF-2024-001',
        requestedAmount: 500000,
      };

      await expect(
        executor.execute('GRANTS_APPLICATION_v1', input, executionContext)
      ).rejects.toThrow('Budget contains unallowable costs');

      expect(executionContext.metadata.unallowableCosts).toBeDefined();
      expect(executionContext.metadata.totalUnallowable).toBe(7000);
    });

    it('should fail when cost share documentation is missing', async () => {
      const input = {
        organizationId: testOrgId,
        grantOpportunity: 'MATCHING-GRANT-2024',
        requestedAmount: 500000,
        requiresCostShare: true,
        costSharePercentage: 0.25, // 25% match required
        costShareDocumentation: {
          commitmentLetters: [],
          bankStatements: [],
          inKindContributions: [],
        },
      };

      await expect(
        executor.execute('GRANTS_APPLICATION_v1', input, executionContext)
      ).rejects.toThrow('Missing cost share documentation');

      expect(executionContext.metadata.requiredCostShare).toBe(125000);
      expect(executionContext.metadata.documentedCostShare).toBe(0);
    });
  });

  describe('Risk Assessment Failures', () => {
    it('should fail when risk score triggers rejection', async () => {
      const mockRiskApi = {
        assessRisk: jest.fn().mockResolvedValue({
          overallRiskScore: 8.5, // High risk (scale 1-10)
          riskFactors: {
            financial: 9.0,
            operational: 7.5,
            compliance: 8.0,
            reputational: 9.0,
          },
          recommendation: 'REJECT',
          reasons: [
            'Recent bankruptcy filing',
            'Multiple failed grant deliverables',
            'Ongoing legal proceedings',
          ],
        }),
      };

      jest.spyOn(global, 'fetch').mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRiskApi.assessRisk()),
        } as Response)
      );

      const input = {
        organizationId: testOrgId,
        grantOpportunity: 'HIGH-VALUE-GRANT-2024',
        requestedAmount: 2000000,
        riskThreshold: 6.0,
      };

      await expect(
        executor.execute('GRANTS_APPLICATION_v1', input, executionContext)
      ).rejects.toThrow('Risk assessment failed');

      expect(executionContext.metadata.riskScore).toBeGreaterThan(6.0);
      expect(executionContext.metadata.riskRecommendation).toBe('REJECT');
    });

    it('should fail due to previous grant performance issues', async () => {
      const mockPerformanceApi = {
        checkGrantHistory: jest.fn().mockResolvedValue({
          hasPerformanceIssues: true,
          performanceScore: 2.2, // Poor (scale 1-5)
          issues: [
            {
              grantId: 'NSF-2022-005',
              issue: 'Failed to submit final reports',
              severity: 'high',
            },
            {
              grantId: 'NIH-2021-123',
              issue: 'Significant budget overruns',
              severity: 'medium',
            },
          ],
        }),
      };

      jest.spyOn(global, 'fetch').mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPerformanceApi.checkGrantHistory()),
        } as Response)
      );

      const input = {
        organizationId: testOrgId,
        grantOpportunity: 'NSF-2024-001',
        requestedAmount: 500000,
        minimumPerformanceScore: 3.0,
      };

      await expect(
        executor.execute('GRANTS_APPLICATION_v1', input, executionContext)
      ).rejects.toThrow('Previous grant performance below threshold');

      expect(executionContext.metadata.performanceScore).toBeLessThan(3.0);
      expect(executionContext.metadata.performanceIssues).toBeDefined();
    });

    it('should fail due to financial instability indicators', async () => {
      const mockFinancialApi = {
        assessFinancialHealth: jest.fn().mockResolvedValue({
          isFinanciallyStable: false,
          indicators: {
            currentRatio: 0.8, // Below 1.0 indicates liquidity issues
            debtToEquity: 4.5, // High leverage
            cashFlowCoverage: -0.2, // Negative cash flow
            auditOpinion: 'going_concern',
          },
          warnings: [
            'Current liabilities exceed current assets',
            'Auditor expressed going concern opinion',
            'Negative operating cash flow for 3 consecutive years',
          ],
        }),
      };

      jest.spyOn(global, 'fetch').mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFinancialApi.assessFinancialHealth()),
        } as Response)
      );

      const input = {
        organizationId: testOrgId,
        grantOpportunity: 'LARGE-GRANT-2024',
        requestedAmount: 1500000,
      };

      await expect(
        executor.execute('GRANTS_APPLICATION_v1', input, executionContext)
      ).rejects.toThrow('Financial instability detected');

      expect(executionContext.metadata.financialIndicators).toBeDefined();
      expect(executionContext.metadata.auditOpinion).toBe('going_concern');
    });
  });

  describe('Executive Approval Failures', () => {
    it('should fail when approval denied due to strategic priorities', async () => {
      const mockApprovalApi = {
        requestExecutiveApproval: jest.fn().mockResolvedValue({
          approved: false,
          reason: 'STRATEGIC_MISALIGNMENT',
          feedback: 'Project does not align with current organizational strategic priorities',
          reviewedBy: 'exec-001',
          reviewDate: new Date().toISOString(),
        }),
      };

      jest.spyOn(global, 'fetch').mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApprovalApi.requestExecutiveApproval()),
        } as Response)
      );

      const input = {
        organizationId: testOrgId,
        grantOpportunity: 'NSF-2024-001',
        requestedAmount: 500000,
      };

      await expect(
        executor.execute('GRANTS_APPLICATION_v1', input, executionContext)
      ).rejects.toThrow('Executive approval denied');

      expect(executionContext.metadata.denialReason).toBe('STRATEGIC_MISALIGNMENT');
    });

    it('should fail due to budget constraints', async () => {
      const mockBudgetApi = {
        checkBudgetAvailability: jest.fn().mockResolvedValue({
          hasAvailableBudget: false,
          availableBudget: 200000,
          requestedAmount: 500000,
          shortfall: 300000,
          message: 'Insufficient budget allocation for grant matching requirements',
        }),
      };

      jest.spyOn(global, 'fetch').mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockBudgetApi.checkBudgetAvailability()),
        } as Response)
      );

      const input = {
        organizationId: testOrgId,
        grantOpportunity: 'MATCHING-GRANT-2024',
        requestedAmount: 500000,
        matchingRequired: true,
        matchingPercentage: 0.5,
      };

      await expect(
        executor.execute('GRANTS_APPLICATION_v1', input, executionContext)
      ).rejects.toThrow('Insufficient budget for grant matching');

      expect(executionContext.metadata.budgetShortfall).toBe(300000);
    });

    it('should fail due to competing applications', async () => {
      const mockPriorityApi = {
        evaluateCompetingApplications: jest.fn().mockResolvedValue({
          approved: false,
          reason: 'LOWER_PRIORITY',
          competingApplications: [
            {
              id: 'APP-001',
              priority: 9,
              requestedAmount: 800000,
            },
            {
              id: 'APP-002',
              priority: 8,
              requestedAmount: 600000,
            },
          ],
          currentApplicationPriority: 5,
          feedback: 'Higher priority applications have been selected for submission',
        }),
      };

      jest.spyOn(global, 'fetch').mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPriorityApi.evaluateCompetingApplications()),
        } as Response)
      );

      const input = {
        organizationId: testOrgId,
        grantOpportunity: 'NSF-2024-001',
        requestedAmount: 500000,
        applicationPriority: 5,
      };

      await expect(
        executor.execute('GRANTS_APPLICATION_v1', input, executionContext)
      ).rejects.toThrow('Application not selected due to competing priorities');

      expect(executionContext.metadata.applicationPriority).toBe(5);
      expect(executionContext.metadata.competingApplications).toBeDefined();
    });
  });

  describe('External API Failures', () => {
    it('should fail when Grants.gov submission times out', async () => {
      const mockSubmitWithTimeout = jest.fn().mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Grants.gov API timeout after 30000ms'));
          }, 100);
        });
      });

      jest.spyOn(global, 'fetch').mockImplementation(mockSubmitWithTimeout);

      const input = {
        organizationId: testOrgId,
        grantOpportunity: 'NSF-2024-001',
        requestedAmount: 500000,
        submissionDeadline: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      };

      await expect(
        executor.execute('GRANTS_APPLICATION_v1', input, executionContext)
      ).rejects.toThrow('submission timeout');

      expect(executionContext.metadata.apiTimeout).toBe(true);
      expect(executionContext.retryCount).toBeGreaterThan(0);
    });

    it('should fail due to authentication failures', async () => {
      let attemptCount = 0;
      const mockAuthFailure = jest.fn().mockImplementation(() => {
        attemptCount++;
        return Promise.resolve({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: () => Promise.resolve({
            error: 'Invalid API credentials',
            code: 'AUTH_FAILED',
          }),
        } as Response);
      });

      jest.spyOn(global, 'fetch').mockImplementation(mockAuthFailure);

      const input = {
        organizationId: testOrgId,
        grantOpportunity: 'NSF-2024-001',
        requestedAmount: 500000,
      };

      await expect(
        executor.execute('GRANTS_APPLICATION_v1', input, executionContext)
      ).rejects.toThrow('Authentication failed');

      expect(attemptCount).toBeGreaterThan(1); // Should retry
      expect(executionContext.metadata.authError).toBe('Invalid API credentials');
    });

    it('should fail due to API rate limiting', async () => {
      let callCount = 0;
      const mockRateLimited = jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          headers: new Headers({
            'Retry-After': '3600',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Date.now() + 3600000),
          }),
          json: () => Promise.resolve({
            error: 'Rate limit exceeded',
            retryAfter: 3600,
          }),
        } as Response);
      });

      jest.spyOn(global, 'fetch').mockImplementation(mockRateLimited);

      const input = {
        organizationId: testOrgId,
        grantOpportunity: 'NSF-2024-001',
        requestedAmount: 500000,
      };

      await expect(
        executor.execute('GRANTS_APPLICATION_v1', input, executionContext)
      ).rejects.toThrow('Rate limit exceeded');

      expect(executionContext.metadata.rateLimitReset).toBeDefined();
      expect(executionContext.metadata.retryAfterSeconds).toBe(3600);
      expect(callCount).toBe(1); // Should not retry when rate limited
    });
  });

  describe('System Failures', () => {
    it('should fail due to database connection errors', async () => {
      const dbError = new Error('Connection to database failed: ECONNREFUSED');
      
      (supabase.from as jest.Mock).mockImplementation(() => {
        throw dbError;
      });

      const input = {
        organizationId: testOrgId,
        grantOpportunity: 'NSF-2024-001',
        requestedAmount: 500000,
      };

      await expect(
        executor.execute('GRANTS_APPLICATION_v1', input, executionContext)
      ).rejects.toThrow('database failed');

      expect(executionContext.status).toBe('failed');
      expect(executionContext.error).toContain('ECONNREFUSED');
    });

    it('should fail when worker timeout is reached', async () => {
      // Mock a long-running process
      const mockLongRunningProcess = jest.fn().mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(resolve, 300000); // 5 minutes
        });
      });

      jest.spyOn(global, 'fetch').mockImplementation(mockLongRunningProcess);

      // Mock worker timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Worker timeout: Process exceeded 180 seconds'));
        }, 100);
      });

      const input = {
        organizationId: testOrgId,
        grantOpportunity: 'COMPLEX-GRANT-2024',
        requestedAmount: 5000000,
        requiresComplexCalculations: true,
      };

      await expect(
        Promise.race([
          executor.execute('GRANTS_APPLICATION_v1', input, executionContext),
          timeoutPromise,
        ])
      ).rejects.toThrow('Worker timeout');

      expect(executionContext.metadata.workerTimeout).toBe(true);
    });

    it('should fail after retry exhaustion', async () => {
      let attemptCount = 0;
      const mockTransientFailure = jest.fn().mockImplementation(() => {
        attemptCount++;
        return Promise.reject(new Error('Transient network error'));
      });

      jest.spyOn(global, 'fetch').mockImplementation(mockTransientFailure);

      // Configure max retries
      const input = {
        organizationId: testOrgId,
        grantOpportunity: 'NSF-2024-001',
        requestedAmount: 500000,
        maxRetries: 3,
      };

      await expect(
        executor.execute('GRANTS_APPLICATION_v1', input, executionContext)
      ).rejects.toThrow('Transient network error');

      expect(attemptCount).toBe(4); // Initial + 3 retries
      expect(executionContext.retryCount).toBe(3);
      expect(executionContext.metadata.retryExhausted).toBe(true);
    });
  });

  describe('Signal-based Failures', () => {
    it('should handle CANCEL_REQUEST signal gracefully', async () => {
      const mockSignalHandler = {
        signals: new Map(),
        emit: function(signal: string, data: any) {
          const handlers = this.signals.get(signal) || [];
          handlers.forEach((handler: Function) => handler(data));
        },
        on: function(signal: string, handler: Function) {
          const handlers = this.signals.get(signal) || [];
          handlers.push(handler);
          this.signals.set(signal, handlers);
        },
      };

      // Simulate signal emission during execution
      setTimeout(() => {
        mockSignalHandler.emit('CANCEL_REQUEST', {
          executionId: testExecutionId,
          reason: 'User requested cancellation',
          timestamp: new Date().toISOString(),
        });
      }, 50);

      const input = {
        organizationId: testOrgId,
        grantOpportunity: 'NSF-2024-001',
        requestedAmount: 500000,
        signalHandler: mockSignalHandler,
      };

      const executionPromise = executor.execute('GRANTS_APPLICATION_v1', input, executionContext);

      // Listen for cancellation
      mockSignalHandler.on('CANCEL_REQUEST', (data: any) => {
        if (data.executionId === testExecutionId) {
          executionContext.status = 'cancelled' as WorkflowStatus;
          executionContext.metadata.cancellationReason = data.reason;
        }
      });

      await expect(executionPromise).rejects.toThrow('cancelled');

      expect(executionContext.status).toBe('cancelled');
      expect(executionContext.metadata.cancellationReason).toBe('User requested cancellation');
    });

    it('should process APPROVAL_DENIED signal and update status', async () => {
      const mockSignalHandler = {
        signals: new Map(),
        emit: function(signal: string, data: any) {
          const handlers = this.signals.get(signal) || [];
          handlers.forEach((handler: Function) => handler(data));
        },
        on: function(signal: string, handler: Function) {
          const handlers = this.signals.get(signal) || [];
          handlers.push(handler);
          this.signals.set(signal, handlers);
        },
      };

      // Simulate approval denial during review
      setTimeout(() => {
        mockSignalHandler.emit('APPROVAL_DENIED', {
          executionId: testExecutionId,
          deniedBy: 'reviewer-001',
          reason: 'Insufficient technical merit',
          timestamp: new Date().toISOString(),
          recommendations: [
            'Strengthen innovation section',
            'Add more preliminary data',
          ],
        });
      }, 50);

      const input = {
        organizationId: testOrgId,
        grantOpportunity: 'NSF-2024-001',
        requestedAmount: 500000,
        signalHandler: mockSignalHandler,
        requiresApproval: true,
      };

      const executionPromise = executor.execute('GRANTS_APPLICATION_v1', input, executionContext);

      // Listen for approval denial
      mockSignalHandler.on('APPROVAL_DENIED', (data: any) => {
        if (data.executionId === testExecutionId) {
          executionContext.status = 'failed' as WorkflowStatus;
          executionContext.error = `Approval denied: ${data.reason}`;
          executionContext.metadata.denialDetails = data;
        }
      });

      await expect(executionPromise).rejects.toThrow('Approval denied');

      expect(executionContext.status).toBe('failed');
      expect(executionContext.metadata.denialDetails.deniedBy).toBe('reviewer-001');
      expect(executionContext.metadata.denialDetails.recommendations).toBeDefined();
    });
  });

  describe('Cleanup and Recovery', () => {
    it('should cleanup resources on failure', async () => {
      const mockCleanup = {
        tempFiles: jest.fn(),
        apiConnections: jest.fn(),
        pendingTransactions: jest.fn(),
      };

      const input = {
        organizationId: testOrgId,
        grantOpportunity: 'NSF-2024-001',
        requestedAmount: 500000,
        cleanup: mockCleanup,
        forceError: true, // Trigger intentional error
      };

      await expect(
        executor.execute('GRANTS_APPLICATION_v1', input, executionContext)
      ).rejects.toThrow();

      // Verify cleanup was called
      expect(mockCleanup.tempFiles).toHaveBeenCalled();
      expect(mockCleanup.apiConnections).toHaveBeenCalled();
      expect(mockCleanup.pendingTransactions).toHaveBeenCalled();
    });

    it('should save checkpoint data before failure', async () => {
      const mockCheckpoint = jest.fn();
      
      const input = {
        organizationId: testOrgId,
        grantOpportunity: 'NSF-2024-001',
        requestedAmount: 500000,
        saveCheckpoint: mockCheckpoint,
        forceErrorAtStep: 5,
      };

      await expect(
        executor.execute('GRANTS_APPLICATION_v1', input, executionContext)
      ).rejects.toThrow();

      // Verify checkpoint was saved
      expect(mockCheckpoint).toHaveBeenCalledWith(expect.objectContaining({
        executionId: testExecutionId,
        lastCompletedStep: expect.any(Number),
        partialData: expect.any(Object),
        timestamp: expect.any(String),
      }));
    });
  });

  describe('Edge Cases and Complex Scenarios', () => {
    it('should handle cascading failures gracefully', async () => {
      // First API fails, triggering fallback which also fails
      let apiCallCount = 0;
      const mockCascadingFailure = jest.fn().mockImplementation(() => {
        apiCallCount++;
        if (apiCallCount === 1) {
          return Promise.reject(new Error('Primary API failed'));
        } else {
          return Promise.reject(new Error('Fallback API also failed'));
        }
      });

      jest.spyOn(global, 'fetch').mockImplementation(mockCascadingFailure);

      const input = {
        organizationId: testOrgId,
        grantOpportunity: 'NSF-2024-001',
        requestedAmount: 500000,
        useFallbackApi: true,
      };

      await expect(
        executor.execute('GRANTS_APPLICATION_v1', input, executionContext)
      ).rejects.toThrow('All APIs failed');

      expect(apiCallCount).toBe(2);
      expect(executionContext.metadata.primaryApiError).toBe('Primary API failed');
      expect(executionContext.metadata.fallbackApiError).toBe('Fallback API also failed');
    });

    it('should handle partial success with rollback', async () => {
      const mockTransaction = {
        begin: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
      };

      const input = {
        organizationId: testOrgId,
        grantOpportunity: 'NSF-2024-001',
        requestedAmount: 500000,
        transaction: mockTransaction,
        failAtStep: 'document_upload', // Fail after some steps succeed
      };

      await expect(
        executor.execute('GRANTS_APPLICATION_v1', input, executionContext)
      ).rejects.toThrow();

      // Verify transaction was rolled back
      expect(mockTransaction.begin).toHaveBeenCalled();
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });

    it('should handle race conditions in concurrent approvals', async () => {
      // Simulate concurrent approval attempts
      const mockConcurrentApproval = jest.fn()
        .mockResolvedValueOnce({ 
          approved: true, 
          approvalId: 'APP-001',
          timestamp: Date.now() 
        })
        .mockRejectedValueOnce(new Error('Approval already processed'));

      const input = {
        organizationId: testOrgId,
        grantOpportunity: 'NSF-2024-001',
        requestedAmount: 500000,
        approvalHandler: mockConcurrentApproval,
        allowConcurrentApproval: false,
      };

      // First execution should succeed
      const result1 = executor.execute('GRANTS_APPLICATION_v1', input, executionContext);
      
      // Second concurrent execution should fail
      const context2 = { ...executionContext, executionId: 'exec-790' };
      const result2 = executor.execute('GRANTS_APPLICATION_v1', input, context2);

      await expect(result1).resolves.toBeDefined();
      await expect(result2).rejects.toThrow('Approval already processed');
    });
  });
});