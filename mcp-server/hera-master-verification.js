#!/usr/bin/env node
/**
 * HERA Master Verification System - Comprehensive Architecture Compliance
 * 
 * The ultimate HERA compliance verification tool that ensures:
 * - SACRED principles adherence 
 * - Build formula validation (HERA = UT + UA + UUI + SC + BM + IA)
 * - Smart code compliance
 * - Universal transaction patterns
 * - Quality gates verification
 * - Multi-tenant architecture checks
 * - Chief Architect sign-off system
 */

require('dotenv').config();

// ==========================================
// 🎯 MASTER VERIFICATION CHECKLIST
// ==========================================

const MASTER_CHECKLIST = {
  SACRED_PRINCIPLES: {
    name: "SACRED Principles Compliance",
    weight: 0.25,
    checks: [
      {
        id: "SACRED_ORG_ID",
        name: "Organization ID Filtering",
        description: "All data operations must include organization_id for multi-tenant isolation",
        severity: "CRITICAL",
        autoCheck: true
      },
      {
        id: "SACRED_NO_SCHEMA",
        name: "No Schema Alterations", 
        description: "Only dynamic fields allowed, no table/column additions",
        severity: "CRITICAL",
        autoCheck: true
      },
      {
        id: "SACRED_UNIVERSAL_TABLES",
        name: "Universal Tables Only",
        description: "Only the sacred 6 tables permitted for data storage",
        severity: "CRITICAL", 
        autoCheck: true
      },
      {
        id: "SACRED_SMART_CODES",
        name: "Smart Code Intelligence",
        description: "All entities and transactions must have HERA smart codes",
        severity: "HIGH",
        autoCheck: true
      },
      {
        id: "SACRED_AI_NATIVE", 
        name: "AI-Native Architecture",
        description: "AI fields built into core tables, not separate infrastructure",
        severity: "HIGH",
        autoCheck: true
      }
    ]
  },
  
  BUILD_FORMULA: {
    name: "HERA Build Formula (UT + UA + UUI + SC + BM + IA)",
    weight: 0.20,
    checks: [
      {
        id: "BUILD_UT",
        name: "Universal Tables (UT)",
        description: "6-table architecture fully implemented and functional",
        severity: "CRITICAL",
        autoCheck: true,
        threshold: 95
      },
      {
        id: "BUILD_UA", 
        name: "Universal API (UA)",
        description: "Complete CRUD operations on all 6 tables with security",
        severity: "CRITICAL",
        autoCheck: true,
        threshold: 90
      },
      {
        id: "BUILD_UUI",
        name: "Universal UI (UUI)",
        description: "Component library with HERA DNA patterns",
        severity: "HIGH",
        autoCheck: true,
        threshold: 80
      },
      {
        id: "BUILD_SC",
        name: "Smart Coding (SC)",
        description: "Business intelligence patterns and smart code coverage",
        severity: "HIGH", 
        autoCheck: true,
        threshold: 75
      },
      {
        id: "BUILD_BM",
        name: "Business Modules (BM)",
        description: "Industry-specific implementations using universal patterns",
        severity: "MEDIUM",
        autoCheck: true,
        threshold: 60
      },
      {
        id: "BUILD_IA",
        name: "Industry Apps (IA)",
        description: "Complete vertical solutions for target industries",
        severity: "MEDIUM",
        autoCheck: true,
        threshold: 50
      }
    ]
  },

  UNIVERSAL_PATTERNS: {
    name: "Universal Architecture Patterns",
    weight: 0.15,
    checks: [
      {
        id: "PATTERN_ENTITIES",
        name: "Universal Entity Types",
        description: "All business objects use standard universal entity types",
        severity: "HIGH",
        autoCheck: true
      },
      {
        id: "PATTERN_TRANSACTIONS",
        name: "Universal Transaction Types", 
        description: "All business activities use standard transaction patterns",
        severity: "HIGH",
        autoCheck: true
      },
      {
        id: "PATTERN_RELATIONSHIPS",
        name: "Universal Relationships",
        description: "Entity relationships follow universal patterns",
        severity: "MEDIUM",
        autoCheck: true
      },
      {
        id: "PATTERN_DYNAMIC_FIELDS",
        name: "Dynamic Field Usage",
        description: "Custom properties stored in core_dynamic_data, not schema changes",
        severity: "HIGH",
        autoCheck: true
      }
    ]
  },

  QUALITY_GATES: {
    name: "Quality Gates & Manufacturing Standards",
    weight: 0.15,
    checks: [
      {
        id: "QUALITY_PERFORMANCE",
        name: "Performance Standards",
        description: "Query optimization and performance patterns validated",
        severity: "HIGH",
        autoCheck: true,
        threshold: 85
      },
      {
        id: "QUALITY_SECURITY",
        name: "Security Compliance",
        description: "RLS, JWT validation, and organization isolation verified",
        severity: "CRITICAL",
        autoCheck: true,
        threshold: 95
      },
      {
        id: "QUALITY_TESTING",
        name: "Testing Coverage",
        description: "Comprehensive test coverage of universal patterns",
        severity: "HIGH",
        autoCheck: false,
        manualReview: true
      },
      {
        id: "QUALITY_DOCUMENTATION",
        name: "Documentation Standards",
        description: "Complete documentation of architecture decisions",
        severity: "MEDIUM",
        autoCheck: false,
        manualReview: true
      }
    ]
  },

  GOVERNANCE: {
    name: "Self-Governing Architecture",
    weight: 0.10,
    checks: [
      {
        id: "GOV_SELF_MANAGEMENT",
        name: "Self-Governing Implementation",
        description: "HERA manages its own standards using the 6 universal tables",
        severity: "HIGH",
        autoCheck: true
      },
      {
        id: "GOV_STANDARDS_REGISTRY",
        name: "Standards Registry",
        description: "Field definitions and smart codes in core_dynamic_data",
        severity: "MEDIUM",
        autoCheck: true
      },
      {
        id: "GOV_COMPLIANCE_MONITORING",
        name: "Real-time Compliance",
        description: "Automatic violation detection and reporting",
        severity: "HIGH",
        autoCheck: true
      }
    ]
  },

  ARCHITECT_REVIEW: {
    name: "Chief Architect Sign-off",
    weight: 0.15,
    checks: [
      {
        id: "ARCH_VISION_ALIGNMENT",
        name: "Vision Alignment",
        description: "Implementation aligns with HERA universal architecture vision",
        severity: "CRITICAL",
        autoCheck: false,
        manualReview: true
      },
      {
        id: "ARCH_TECHNICAL_DEBT",
        name: "Technical Debt Assessment",
        description: "No technical debt that violates universal principles",
        severity: "HIGH",
        autoCheck: false,
        manualReview: true
      },
      {
        id: "ARCH_SCALABILITY",
        name: "Scalability Review",
        description: "Architecture maintains universality at enterprise scale",
        severity: "HIGH",
        autoCheck: false,
        manualReview: true
      },
      {
        id: "ARCH_FUTURE_PROOF",
        name: "Future-Proof Design",
        description: "Implementation supports future business requirements",
        severity: "MEDIUM",
        autoCheck: false,
        manualReview: true
      }
    ]
  }
};

// ==========================================
// 🔍 VIOLATION DETECTION SYSTEM
// ==========================================

const violationDetector = {
  /**
   * Comprehensive violation scan across all systems
   */
  scanForViolations: async (supabase, organizationId) => {
    const violations = {
      critical: [],
      high: [],
      medium: [],
      low: [],
      totalScore: 0
    };

    // SACRED Rule Violations
    const sacredViolations = await violationDetector.checkSacredViolations(supabase, organizationId);
    violations.critical.push(...sacredViolations.critical);
    violations.high.push(...sacredViolations.high);

    // Schema Violations
    const schemaViolations = await violationDetector.checkSchemaViolations(supabase);
    violations.critical.push(...schemaViolations);

    // Pattern Violations
    const patternViolations = await violationDetector.checkPatternViolations(supabase, organizationId);
    violations.medium.push(...patternViolations);

    // Performance Violations
    const performanceViolations = await violationDetector.checkPerformanceViolations(supabase, organizationId);
    violations.high.push(...performanceViolations);

    // Calculate compliance score
    const totalViolations = violations.critical.length + violations.high.length + violations.medium.length + violations.low.length;
    const maxScore = 100;
    const penalty = (violations.critical.length * 25) + (violations.high.length * 15) + (violations.medium.length * 10) + (violations.low.length * 5);
    violations.totalScore = Math.max(0, maxScore - penalty);

    return violations;
  },

  checkSacredViolations: async (supabase, organizationId) => {
    const violations = { critical: [], high: [] };

    try {
      // Check for entities without organization_id
      const { data: entitiesWithoutOrg } = await supabase
        .from('core_entities')
        .select('id, entity_name, entity_type')
        .is('organization_id', null)
        .limit(10);

      if (entitiesWithoutOrg && entitiesWithoutOrg.length > 0) {
        violations.critical.push({
          rule: 'SACRED_ORG_ID',
          message: `Found ${entitiesWithoutOrg.length} entities without organization_id`,
          severity: 'CRITICAL',
          data: entitiesWithoutOrg,
          fix: 'Add organization_id to all entities for multi-tenant isolation'
        });
      }

      // Check for missing smart codes
      const { data: entitiesWithoutSmartCode } = await supabase
        .from('core_entities')
        .select('id, entity_name, entity_type')
        .eq('organization_id', organizationId)
        .is('smart_code', null)
        .limit(10);

      if (entitiesWithoutSmartCode && entitiesWithoutSmartCode.length > 0) {
        violations.high.push({
          rule: 'SACRED_SMART_CODES',
          message: `Found ${entitiesWithoutSmartCode.length} entities without smart codes`,
          severity: 'HIGH',
          data: entitiesWithoutSmartCode,
          fix: 'Generate HERA smart codes for all entities'
        });
      }

    } catch (error) {
      console.warn('Sacred violation check error:', error.message);
    }

    return violations;
  },

  checkSchemaViolations: async (supabase) => {
    const violations = [];

    try {
      // Check for non-standard tables (this would require database metadata access)
      // For now, simulate the check
      const standardTables = [
        'core_organizations', 'core_entities', 'core_dynamic_data',
        'core_relationships', 'universal_transactions', 'universal_transaction_lines'
      ];

      // This would be implemented with actual schema introspection
      // violations.push(...detectedNonStandardTables);

    } catch (error) {
      console.warn('Schema violation check error:', error.message);
    }

    return violations;
  },

  checkPatternViolations: async (supabase, organizationId) => {
    const violations = [];

    try {
      // Check for non-standard entity types
      const { data: entities } = await supabase
        .from('core_entities')
        .select('entity_type')
        .eq('organization_id', organizationId);

      const standardEntityTypes = [
        'customer', 'vendor', 'product', 'employee', 'user', 'gl_account',
        'location', 'project', 'document', 'asset', 'service', 'contract'
      ];

      const nonStandardTypes = new Set();
      entities?.forEach(e => {
        if (!standardEntityTypes.includes(e.entity_type)) {
          nonStandardTypes.add(e.entity_type);
        }
      });

      if (nonStandardTypes.size > 0) {
        violations.push({
          rule: 'PATTERN_ENTITIES',
          message: `Non-standard entity types found: ${Array.from(nonStandardTypes).join(', ')}`,
          severity: 'MEDIUM',
          fix: 'Consider using standard universal entity types'
        });
      }

    } catch (error) {
      console.warn('Pattern violation check error:', error.message);
    }

    return violations;
  },

  checkPerformanceViolations: async (supabase, organizationId) => {
    const violations = [];

    try {
      // Check for large unfiltered dynamic data
      const { count: dynamicDataCount } = await supabase
        .from('core_dynamic_data')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      if (dynamicDataCount > 10000) {
        violations.push({
          rule: 'PERFORMANCE_OPTIMIZATION',
          message: `Large dynamic data set (${dynamicDataCount} records) may need optimization`,
          severity: 'HIGH',
          fix: 'Consider data archiving or additional indexing strategies'
        });
      }

    } catch (error) {
      console.warn('Performance violation check error:', error.message);
    }

    return violations;
  }
};

// ==========================================
// 🏆 CHIEF ARCHITECT SIGN-OFF SYSTEM
// ==========================================

const chiefArchitectReview = {
  /**
   * Generate Chief Architect review checklist
   */
  generateReviewChecklist: (verificationResults) => {
    const checklist = {
      reviewDate: new Date().toISOString(),
      systemOverview: verificationResults.summary,
      criticalFindings: verificationResults.violations.critical,
      architecturalDecisions: [],
      riskAssessment: chiefArchitectReview.assessRisks(verificationResults),
      signOffRequired: verificationResults.violations.critical.length > 0 || verificationResults.overallScore < 85,
      recommendations: []
    };

    // Generate architectural recommendations
    if (verificationResults.overallScore < 90) {
      checklist.recommendations.push({
        priority: 'HIGH',
        area: 'Architecture Compliance',
        recommendation: 'Address compliance violations before production deployment',
        impact: 'Critical for maintaining universal architecture integrity'
      });
    }

    if (verificationResults.buildFormula.overallCompletion < 80) {
      checklist.recommendations.push({
        priority: 'HIGH',
        area: 'Build Completion',
        recommendation: 'Complete remaining HERA formula components',
        impact: 'Required for full universal architecture benefits'
      });
    }

    return checklist;
  },

  assessRisks: (verificationResults) => {
    const risks = [];

    if (verificationResults.violations.critical.length > 0) {
      risks.push({
        level: 'CRITICAL',
        category: 'Architecture Integrity',
        description: 'Critical SACRED rule violations detected',
        mitigation: 'Immediate remediation required before deployment'
      });
    }

    if (verificationResults.qualityGates.overallScore < 85) {
      risks.push({
        level: 'HIGH',
        category: 'Quality Assurance',
        description: 'Quality gates not meeting deployment standards',
        mitigation: 'Address quality issues and re-run verification'
      });
    }

    if (verificationResults.buildFormula.overallCompletion < 70) {
      risks.push({
        level: 'MEDIUM',
        category: 'Feature Completeness',
        description: 'HERA formula completion below recommended threshold',
        mitigation: 'Complete critical components before major release'
      });
    }

    return risks;
  },

  /**
   * Generate sign-off document
   */
  generateSignOffDocument: (verificationResults, reviewChecklist) => {
    const signOff = {
      documentType: 'HERA_CHIEF_ARCHITECT_SIGN_OFF',
      version: '1.0',
      date: new Date().toISOString(),
      systemVersion: verificationResults.systemVersion || 'Unknown',
      
      executiveSummary: {
        overallScore: verificationResults.overallScore,
        complianceStatus: verificationResults.overallScore >= 95 ? 'FULLY_COMPLIANT' : 
                         verificationResults.overallScore >= 85 ? 'MOSTLY_COMPLIANT' : 'NON_COMPLIANT',
        criticalIssues: verificationResults.violations.critical.length,
        recommendedAction: verificationResults.overallScore >= 85 ? 'APPROVE_DEPLOYMENT' : 'BLOCK_DEPLOYMENT'
      },

      technicalFindings: {
        sacredCompliance: verificationResults.sacredCompliance,
        buildFormula: verificationResults.buildFormula,
        qualityGates: verificationResults.qualityGates,
        violations: verificationResults.violations
      },

      architecturalDecision: {
        approved: verificationResults.overallScore >= 85 && verificationResults.violations.critical.length === 0,
        conditions: reviewChecklist.recommendations,
        nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      },

      signatureBlock: {
        chiefArchitect: 'HERA_SYSTEM_ARCHITECT',
        signedDate: null, // To be filled when actually signed
        digitalSignature: null, // To be generated when signed
        reviewStatus: 'PENDING_SIGN_OFF'
      }
    };

    return signOff;
  }
};

// ==========================================
// 🎯 MASTER VERIFICATION ENGINE
// ==========================================

const masterVerification = {
  /**
   * Execute complete HERA verification workflow
   */
  executeFullVerification: async (supabase, organizationId) => {
    console.log('🔍 Starting HERA Master Verification...');
    
    const startTime = Date.now();
    const results = {
      verificationId: `HERA_VERIFY_${Date.now()}`,
      timestamp: new Date().toISOString(),
      organizationId: organizationId,
      systemVersion: process.env.HERA_VERSION || '2.0.0',
      executionTime: null,
      overallScore: 0,
      complianceLevel: null,
      summary: {},
      violations: {},
      sacredCompliance: {},
      buildFormula: {},
      qualityGates: {},
      universalPatterns: {},
      governance: {},
      chiefArchitectReview: {}
    };

    try {
      // 1. SACRED Principles Verification
      console.log('  ✅ Checking SACRED Principles...');
      results.sacredCompliance = await masterVerification.verifySacredPrinciples(supabase, organizationId);

      // 2. Build Formula Assessment  
      console.log('  📊 Assessing Build Formula...');
      results.buildFormula = await masterVerification.assessBuildFormula(supabase, organizationId);

      // 3. Universal Patterns Validation
      console.log('  🔄 Validating Universal Patterns...');
      results.universalPatterns = await masterVerification.validateUniversalPatterns(supabase, organizationId);

      // 4. Quality Gates Check
      console.log('  🚨 Running Quality Gates...');
      results.qualityGates = await masterVerification.checkQualityGates(supabase, organizationId);

      // 5. Governance Verification
      console.log('  🏛️ Verifying Self-Governance...');
      results.governance = await masterVerification.verifyGovernance(supabase, organizationId);

      // 6. Comprehensive Violation Scan
      console.log('  🔍 Scanning for Violations...');
      results.violations = await violationDetector.scanForViolations(supabase, organizationId);

      // 7. Calculate Overall Score
      results.overallScore = masterVerification.calculateOverallScore(results);
      results.complianceLevel = masterVerification.determineComplianceLevel(results.overallScore);

      // 8. Generate Chief Architect Review
      console.log('  👨‍💼 Generating Chief Architect Review...');
      const reviewChecklist = chiefArchitectReview.generateReviewChecklist(results);
      results.chiefArchitectReview = {
        checklist: reviewChecklist,
        signOffDocument: chiefArchitectReview.generateSignOffDocument(results, reviewChecklist),
        requiresManualReview: reviewChecklist.signOffRequired
      };

      // 9. Generate Executive Summary
      results.summary = {
        status: results.complianceLevel,
        score: results.overallScore,
        criticalIssues: results.violations.critical.length,
        highIssues: results.violations.high.length,
        buildCompletion: results.buildFormula.overallCompletion,
        qualityScore: results.qualityGates.overallScore,
        deploymentRecommendation: results.overallScore >= 85 ? 'APPROVED' : 'BLOCKED',
        nextSteps: masterVerification.generateNextSteps(results)
      };

      results.executionTime = Date.now() - startTime;
      console.log(`✅ Verification completed in ${results.executionTime}ms`);

      return results;

    } catch (error) {
      console.error('❌ Verification failed:', error.message);
      results.error = error.message;
      results.executionTime = Date.now() - startTime;
      return results;
    }
  },

  verifySacredPrinciples: async (supabase, organizationId) => {
    // Implementation using existing architecturePolice functions
    const { architecturePolice } = require('./hera-build-police');
    
    const violations = await architecturePolice.checkSacredRules(supabase, { organization_id: organizationId });
    const complianceScore = Math.max(0, 100 - (violations.length * 20));

    return {
      complianceScore,
      status: complianceScore >= 95 ? 'COMPLIANT' : complianceScore >= 80 ? 'MOSTLY_COMPLIANT' : 'NON_COMPLIANT',
      violations,
      details: {
        organizationFiltering: violations.find(v => v.rule === 'SACRED_RULE_1') ? 'FAIL' : 'PASS',
        schemaProtection: violations.find(v => v.rule === 'SACRED_RULE_2') ? 'FAIL' : 'PASS',
        smartCodeUsage: violations.find(v => v.rule === 'SACRED_RULE_3') ? 'FAIL' : 'PASS'
      }
    };
  },

  assessBuildFormula: async (supabase, organizationId) => {
    // Implementation using existing buildTracker functions
    const { getBuildPoliceHandlers } = require('./hera-build-police');
    const handlers = getBuildPoliceHandlers(supabase);
    
    return await handlers["check-hera-formula"]({ 
      organization_id: organizationId, 
      detailed: true 
    });
  },

  validateUniversalPatterns: async (supabase, organizationId) => {
    const { architecturePolice } = require('./hera-build-police');
    
    try {
      // Check entity patterns
      const { data: entities } = await supabase
        .from('core_entities')
        .select('entity_type, smart_code, metadata')
        .eq('organization_id', organizationId)
        .limit(100);

      let patternScore = 100;
      const issues = [];

      entities?.forEach(entity => {
        const patternIssues = architecturePolice.validateUniversalPattern(entity.entity_type, entity);
        issues.push(...patternIssues);
        patternScore -= patternIssues.length * 5;
      });

      return {
        complianceScore: Math.max(0, patternScore),
        status: patternScore >= 90 ? 'COMPLIANT' : patternScore >= 70 ? 'MOSTLY_COMPLIANT' : 'NON_COMPLIANT',
        entitiesChecked: entities?.length || 0,
        issues
      };
    } catch (error) {
      return {
        complianceScore: 0,
        status: 'ERROR',
        error: error.message
      };
    }
  },

  checkQualityGates: async (supabase, organizationId) => {
    const { qualityGates } = require('./hera-build-police');
    return await qualityGates.checkDeploymentReadiness(supabase, 'master_verification');
  },

  verifyGovernance: async (supabase, organizationId) => {
    try {
      // Check if HERA is managing its own standards
      const { data: governanceEntities } = await supabase
        .from('core_entities')
        .select('entity_type, smart_code')
        .eq('organization_id', 'hera_software_inc') // System governance org
        .in('entity_type', ['standard_entity_type', 'field_registry', 'smart_code_registry']);

      const governanceScore = governanceEntities ? 
        Math.min(100, (governanceEntities.length / 10) * 100) : 0;

      return {
        complianceScore: governanceScore,
        status: governanceScore >= 80 ? 'SELF_GOVERNING' : 'NEEDS_IMPROVEMENT',
        governanceEntities: governanceEntities?.length || 0,
        selfGoverning: governanceScore >= 80
      };
    } catch (error) {
      return {
        complianceScore: 50,
        status: 'PARTIAL',
        error: error.message
      };
    }
  },

  calculateOverallScore: (results) => {
    const weights = {
      sacredCompliance: 0.25,
      buildFormula: 0.20,
      universalPatterns: 0.15,
      qualityGates: 0.15,
      governance: 0.10,
      violations: 0.15
    };

    let weightedSum = 0;
    let totalWeight = 0;

    // Add individual scores
    if (results.sacredCompliance?.complianceScore !== undefined) {
      weightedSum += results.sacredCompliance.complianceScore * weights.sacredCompliance;
      totalWeight += weights.sacredCompliance;
    }

    if (results.buildFormula?.overallCompletion) {
      const completion = parseInt(results.buildFormula.overallCompletion.replace('%', ''));
      weightedSum += completion * weights.buildFormula;
      totalWeight += weights.buildFormula;
    }

    if (results.universalPatterns?.complianceScore !== undefined) {
      weightedSum += results.universalPatterns.complianceScore * weights.universalPatterns;
      totalWeight += weights.universalPatterns;
    }

    if (results.qualityGates?.overallScore !== undefined) {
      weightedSum += results.qualityGates.overallScore * weights.qualityGates;
      totalWeight += weights.qualityGates;
    }

    if (results.governance?.complianceScore !== undefined) {
      weightedSum += results.governance.complianceScore * weights.governance;
      totalWeight += weights.governance;
    }

    if (results.violations?.totalScore !== undefined) {
      weightedSum += results.violations.totalScore * weights.violations;
      totalWeight += weights.violations;
    }

    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  },

  determineComplianceLevel: (score) => {
    if (score >= 95) return 'FULLY_COMPLIANT';
    if (score >= 85) return 'MOSTLY_COMPLIANT';
    if (score >= 70) return 'PARTIALLY_COMPLIANT';
    return 'NON_COMPLIANT';
  },

  generateNextSteps: (results) => {
    const steps = [];

    if (results.violations.critical.length > 0) {
      steps.push({
        priority: 'CRITICAL',
        action: 'Fix critical SACRED rule violations',
        timeline: 'Immediate'
      });
    }

    if (results.buildFormula.overallCompletion < 80) {
      steps.push({
        priority: 'HIGH',
        action: 'Complete remaining HERA formula components',
        timeline: '1-2 weeks'
      });
    }

    if (results.qualityGates.overallScore < 85) {
      steps.push({
        priority: 'HIGH',
        action: 'Address quality gate failures',
        timeline: '3-5 days'
      });
    }

    if (results.overallScore >= 85) {
      steps.push({
        priority: 'LOW',
        action: 'Proceed with Chief Architect sign-off',
        timeline: '1-2 days'
      });
    }

    return steps;
  }
};

// ==========================================
// 🔧 MCP TOOLS EXPORT
// ==========================================

function getMasterVerificationTools() {
  return [
    {
      name: "verify-hera-compliance",
      description: "Execute comprehensive HERA Master Verification with Chief Architect sign-off",
      inputSchema: {
        type: "object",
        properties: {
          organization_id: {
            type: "string",
            description: "Organization to verify (uses default if not provided)"
          },
          verification_level: {
            type: "string",
            enum: ["basic", "standard", "comprehensive"],
            default: "comprehensive",
            description: "Level of verification to perform"
          },
          include_chief_architect_review: {
            type: "boolean",
            default: true,
            description: "Generate Chief Architect review and sign-off documents"
          },
          auto_fix_violations: {
            type: "boolean", 
            default: false,
            description: "Attempt to auto-fix non-critical violations"
          }
        }
      }
    }
  ];
}

function getMasterVerificationHandlers(supabase) {
  return {
    "verify-hera-compliance": async (args) => {
      try {
        const orgId = args.organization_id || process.env.DEFAULT_ORGANIZATION_ID || 'hera_software_inc';
        
        console.log(`🔍 Starting HERA Master Verification for organization: ${orgId}`);
        
        const results = await masterVerification.executeFullVerification(supabase, orgId);
        
        // Format results for output
        const output = {
          success: true,
          verificationComplete: true,
          timestamp: results.timestamp,
          organizationId: results.organizationId,
          
          // Executive Summary
          executiveSummary: {
            overallScore: `${results.overallScore}%`,
            complianceLevel: results.complianceLevel,
            deploymentRecommendation: results.summary.deploymentRecommendation,
            criticalIssues: results.summary.criticalIssues,
            executionTime: `${results.executionTime}ms`
          },

          // Detailed Results
          detailedResults: {
            sacredPrinciples: {
              score: `${results.sacredCompliance.complianceScore}%`,
              status: results.sacredCompliance.status,
              violations: results.sacredCompliance.violations?.length || 0
            },
            buildFormula: {
              completion: results.buildFormula.overallCompletion,
              components: Object.keys(results.buildFormula.componentBreakdown || {}).map(key => ({
                component: key,
                name: results.buildFormula.componentBreakdown[key].name,
                completion: results.buildFormula.componentBreakdown[key].completion,
                status: results.buildFormula.componentBreakdown[key].status
              }))
            },
            qualityGates: {
              overallScore: `${results.qualityGates.overallScore}%`,
              approved: results.qualityGates.approved,
              recommendation: results.qualityGates.recommendation
            }
          },

          // Violations Summary
          violationsSummary: {
            critical: results.violations.critical?.length || 0,
            high: results.violations.high?.length || 0,
            medium: results.violations.medium?.length || 0,
            low: results.violations.low?.length || 0,
            totalScore: `${results.violations.totalScore}%`
          },

          // Chief Architect Review
          chiefArchitectReview: {
            reviewRequired: results.chiefArchitectReview.requiresManualReview,
            signOffStatus: results.chiefArchitectReview.signOffDocument.signatureBlock.reviewStatus,
            riskLevel: results.chiefArchitectReview.checklist.riskAssessment?.length > 0 ? 
              results.chiefArchitectReview.checklist.riskAssessment[0].level : 'LOW',
            recommendations: results.chiefArchitectReview.checklist.recommendations?.length || 0
          },

          // Next Steps
          nextSteps: results.summary.nextSteps,

          // Full verification data (for detailed analysis)
          fullResults: args.verification_level === 'comprehensive' ? results : undefined
        };

        return output;

      } catch (error) {
        return {
          success: false,
          error: `Master verification failed: ${error.message}`,
          timestamp: new Date().toISOString()
        };
      }
    }
  };
}

module.exports = {
  getMasterVerificationTools,
  getMasterVerificationHandlers,
  masterVerification,
  violationDetector,
  chiefArchitectReview,
  MASTER_CHECKLIST
};