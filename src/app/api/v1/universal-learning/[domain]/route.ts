// HERA Universal Learning Platform - Domain-Specific API Endpoints
// REST API endpoints for specific domain operations

import { NextRequest, NextResponse } from 'next/server';
import { UniversalContentProcessor } from '@/lib/universal-learning/UniversalContentProcessor';
import { UniversalAIAnalyzer } from '@/lib/universal-learning/UniversalAIAnalyzer';
import { UniversalEntityCreator } from '@/lib/universal-learning/UniversalEntityCreator';
import { DomainSpecializationFramework } from '@/lib/universal-learning/DomainSpecializationFramework';

const HERA_LEARNING_ORG_ID = '719dfed1-09b4-4ca8-bfda-f682460de945';

interface DomainSpecificRequest {
  action: 'quick_process' | 'get_specializer' | 'domain_analysis' | 'certification_alignment' | 'professional_context' | 'cross_reference';
  content?: string;
  files?: File[];
  options?: any;
  metadata?: any;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
): Promise<NextResponse> {
  try {
    const { domain: domainParam } = await params;
    const domain = domainParam.toUpperCase();
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'info';

    console.log(`🎯 HERA Domain-Specific API - ${domain} - ${action.toUpperCase()}`);

    const smart_code = `HERA.EDU.${domain}.API.${action.toUpperCase()}.v1`;

    // Validate domain
    const supportedDomains = ['CA', 'MED', 'LAW', 'ENG', 'LANG', 'GENERAL'];
    if (!supportedDomains.includes(domain)) {
      return NextResponse.json({
        success: false,
        error: `Unsupported domain: ${domain}. Supported domains: ${supportedDomains.join(', ')}`,
        smart_code
      }, { status: 400 });
    }

    const specializationFramework = new DomainSpecializationFramework();

    switch (action) {
      case 'info':
        const domainInfo = await specializationFramework.getDomainInfo(domain);
        return NextResponse.json({
          success: true,
          domain,
          data: domainInfo,
          smart_code
        });

      case 'specializer':
        const specializer = await specializationFramework.getSpecializer(domain);
        return NextResponse.json({
          success: true,
          domain,
          data: {
            domainCode: specializer.domainCode,
            domainName: specializer.domainName,
            capabilities: specializer.specializationCapabilities,
            smart_code: `HERA.EDU.${domain}.SPECIALIZER.INFO.v1`
          },
          smart_code
        });

      case 'certifications':
        const certifications = await specializationFramework.getDomainCertifications(domain);
        return NextResponse.json({
          success: true,
          domain,
          data: certifications,
          smart_code
        });

      case 'learning_patterns':
        const learningPatterns = await specializationFramework.getDomainLearningPatterns(domain);
        return NextResponse.json({
          success: true,
          domain,
          data: learningPatterns,
          smart_code
        });

      case 'assessment_strategies':
        const assessmentStrategies = await specializationFramework.getDomainAssessmentStrategies(domain);
        return NextResponse.json({
          success: true,
          domain,
          data: assessmentStrategies,
          smart_code
        });

      default:
        return NextResponse.json({
          success: true,
          domain,
          message: `${domain} Domain-Specific Learning Platform`,
          description: `Specialized learning system for ${domain} with professional context and certification alignment`,
          available_actions: [
            'GET /?action=info - Domain information',
            'GET /?action=specializer - Domain specializer details',
            'GET /?action=certifications - Available certifications',
            'GET /?action=learning_patterns - Domain-specific learning patterns',
            'GET /?action=assessment_strategies - Assessment approaches',
            'POST / - Domain-specific processing'
          ],
          smart_code
        });
    }

  } catch (error: any) {
    console.error(`HERA Domain API Error:`, error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
      smart_code: `HERA.EDU.API.ERROR.v1`
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
): Promise<NextResponse> {
  try {
    const { domain: domainParam } = await params;
    const domain = domainParam.toUpperCase();
    const body: DomainSpecificRequest = await request.json();
    const { action, content, files, options = {}, metadata = {} } = body;

    console.log(`🎯 HERA ${domain} Domain Processing - ${action?.toUpperCase()}`);

    const startTime = Date.now();
    const smart_code = `HERA.EDU.${domain}.API.${action?.toUpperCase()}.v1`;

    // Validate domain
    const supportedDomains = ['CA', 'MED', 'LAW', 'ENG', 'LANG', 'GENERAL'];
    if (!supportedDomains.includes(domain)) {
      return NextResponse.json({
        success: false,
        error: `Unsupported domain: ${domain}. Supported domains: ${supportedDomains.join(', ')}`,
        smart_code
      }, { status: 400 });
    }

    // Initialize components
    const processor = new UniversalContentProcessor();
    const analyzer = new UniversalAIAnalyzer();
    const entityCreator = new UniversalEntityCreator(HERA_LEARNING_ORG_ID, domain);
    const specializationFramework = new DomainSpecializationFramework();

    let result: any;
    let processingMetadata: any = {};

    switch (action) {
      case 'quick_process':
        console.log(`⚡ Quick processing for ${domain}...`);
        
        if (!content && !files) {
          return NextResponse.json({
            success: false,
            error: 'Content or files are required for quick processing',
            smart_code
          }, { status: 400 });
        }

        // Streamlined processing optimized for speed
        const quickFiles = files || [new File([content || ''], 'content.txt', { type: 'text/plain' })];
        
        // Process content
        const processedContent = await processor.processAnyEducationalContent(
          quickFiles,
          domain,
          {
            source: metadata.source || 'api_quick',
            author: metadata.author || 'Quick Processing',
            subject: metadata.subject || domain,
            grade_level: metadata.grade_level || 'Professional',
            language: metadata.language || 'English'
          }
        );

        // Quick AI analysis
        const analysisResult = await analyzer.analyzeForUniversalLearning(
          content || '',
          domain,
          processedContent,
          {
            generate_summaries: true,
            create_flashcards: true,
            learning_science_enhanced: true,
            cross_domain_insights: false, // Disabled for quick processing
            gamification: false // Disabled for quick processing
          }
        );

        // Apply domain specialization
        const entityResult = await entityCreator.createUniversalEntities(
          analysisResult,
          {
            source: 'quick_processing',
            author: 'Quick API',
            subject: domain,
            grade_level: 'Professional',
            language: 'English'
          },
          {
            includeAssessments: true,
            includeRelationships: false, // Simplified for speed
            includeTransactions: false // Simplified for speed
          }
        );

        const specialization = await specializationFramework.specializeDomain(
          domain,
          analysisResult,
          entityResult,
          [] // No learning paths for quick processing
        );

        result = {
          universal_elements: analysisResult.universalElements,
          domain_specialization: specialization,
          quick_summary: {
            elements_processed: analysisResult.universalElements.length,
            confidence_score: analysisResult.confidenceScore,
            specialization_enhancements: specialization.enhancedElements.length,
            processing_time_ms: Date.now() - startTime
          }
        };

        processingMetadata = {
          step_completed: 'quick_process',
          processing_time: Date.now() - startTime,
          confidence_score: analysisResult.confidenceScore,
          optimization: 'speed_optimized'
        };

        break;

      case 'get_specializer':
        console.log(`🎯 Getting ${domain} specializer...`);
        
        const specializer = await specializationFramework.getSpecializer(domain);
        
        result = {
          specializer: {
            domainCode: specializer.domainCode,
            domainName: specializer.domainName,
            capabilities: specializer.specializationCapabilities
          },
          domain_context: await specializationFramework.getDomainInfo(domain),
          certifications: await specializationFramework.getDomainCertifications(domain),
          learning_patterns: await specializationFramework.getDomainLearningPatterns(domain)
        };

        processingMetadata = {
          step_completed: 'get_specializer',
          processing_time: Date.now() - startTime,
          capabilities_count: specializer.specializationCapabilities.length
        };

        break;

      case 'domain_analysis':
        console.log(`📊 Deep domain analysis for ${domain}...`);
        
        if (!content) {
          return NextResponse.json({
            success: false,
            error: 'Content is required for domain analysis',
            smart_code
          }, { status: 400 });
        }

        // Deep analysis focused on domain-specific insights
        const domainProcessedContent = await processor.processAnyEducationalContent(
          [new File([content], 'content.txt', { type: 'text/plain' })],
          domain,
          {
            source: 'domain_analysis',
            author: 'Domain API',
            subject: domain,
            grade_level: 'Professional',
            language: 'English'
          }
        );

        const domainAnalysisResult = await analyzer.analyzeForUniversalLearning(
          content,
          domain,
          domainProcessedContent,
          {
            learning_science_enhanced: true,
            cross_domain_insights: true,
            universal_patterns: true,
            personalization: true,
            ...options
          }
        );

        const domainEntityResult = await entityCreator.createUniversalEntities(
          domainAnalysisResult,
          {
            source: 'domain_analysis',
            author: 'Domain API',
            subject: domain,
            grade_level: 'Professional',
            language: 'English'
          },
          {
            includeAssessments: true,
            includeRelationships: true,
            includeTransactions: true
          }
        );

        const domainSpecialization = await specializationFramework.specializeDomain(
          domain,
          domainAnalysisResult,
          domainEntityResult,
          []
        );

        result = {
          universal_analysis: {
            elements: domainAnalysisResult.universalElements.length,
            confidence: domainAnalysisResult.confidenceScore,
            cross_domain_insights: domainAnalysisResult.crossDomainInsights.length
          },
          domain_specialization: domainSpecialization,
          professional_alignment: domainSpecialization.professionalAlignment,
          certification_mapping: domainSpecialization.certificationMapping,
          practical_applications: domainSpecialization.practicalApplications,
          industry_insights: domainSpecialization.industryInsights,
          hera_entities: {
            entities_created: domainEntityResult.coreEntities.length,
            dynamic_fields: domainEntityResult.dynamicData.length,
            relationships: domainEntityResult.relationships.length
          }
        };

        processingMetadata = {
          step_completed: 'domain_analysis',
          processing_time: Date.now() - startTime,
          confidence_score: domainAnalysisResult.confidenceScore,
          specialization_depth: domainSpecialization.enhancedElements.length
        };

        break;

      case 'certification_alignment':
        console.log(`🎓 Certification alignment analysis for ${domain}...`);
        
        if (!content) {
          return NextResponse.json({
            success: false,
            error: 'Content is required for certification alignment',
            smart_code
          }, { status: 400 });
        }

        // Focus on certification-specific analysis
        const certificationAnalysis = await analyzer.analyzeForUniversalLearning(
          content,
          domain,
          await processor.processAnyEducationalContent(
            [new File([content], 'content.txt', { type: 'text/plain' })],
            domain,
            { source: 'certification_alignment', author: 'Cert API', subject: domain, grade_level: 'Professional', language: 'English' }
          ),
          {
            learning_science_enhanced: true,
            cross_domain_insights: false,
            personalization: false,
            gamification: false
          }
        );

        const certSpecialization = await specializationFramework.specializeDomain(
          domain,
          certificationAnalysis,
          await entityCreator.createUniversalEntities(
            certificationAnalysis,
            { source: 'cert_alignment', author: 'Cert API', subject: domain, grade_level: 'Professional', language: 'English' },
            { includeAssessments: true, includeRelationships: false, includeTransactions: false }
          ),
          []
        );

        result = {
          certification_mapping: certSpecialization.certificationMapping,
          exam_alignment: await specializationFramework.analyzeExamAlignment(domain, content),
          study_recommendations: await specializationFramework.generateStudyRecommendations(domain, certificationAnalysis),
          assessment_strategies: await specializationFramework.getDomainAssessmentStrategies(domain),
          preparation_timeline: await specializationFramework.generatePreparationTimeline(domain, certificationAnalysis)
        };

        processingMetadata = {
          step_completed: 'certification_alignment',
          processing_time: Date.now() - startTime,
          confidence_score: certificationAnalysis.confidenceScore,
          certifications_analyzed: Object.keys(result.certification_mapping).length
        };

        break;

      case 'professional_context':
        console.log(`💼 Professional context analysis for ${domain}...`);
        
        if (!content) {
          return NextResponse.json({
            success: false,
            error: 'Content is required for professional context analysis',
            smart_code
          }, { status: 400 });
        }

        const professionalAnalysis = await analyzer.analyzeForUniversalLearning(
          content,
          domain,
          await processor.processAnyEducationalContent(
            [new File([content], 'content.txt', { type: 'text/plain' })],
            domain,
            { source: 'professional_context', author: 'Prof API', subject: domain, grade_level: 'Professional', language: 'English' }
          ),
          { learning_science_enhanced: true }
        );

        const professionalSpecialization = await specializationFramework.specializeDomain(
          domain,
          professionalAnalysis,
          await entityCreator.createUniversalEntities(
            professionalAnalysis,
            { source: 'prof_context', author: 'Prof API', subject: domain, grade_level: 'Professional', language: 'English' },
            { includeAssessments: false, includeRelationships: false, includeTransactions: false }
          ),
          []
        );

        result = {
          professional_alignment: professionalSpecialization.professionalAlignment,
          industry_insights: professionalSpecialization.industryInsights,
          practical_applications: professionalSpecialization.practicalApplications,
          career_guidance: professionalSpecialization.careerGuidance,
          real_world_scenarios: await specializationFramework.generateRealWorldScenarios(domain, professionalAnalysis),
          professional_skills: await specializationFramework.identifyProfessionalSkills(domain, professionalAnalysis)
        };

        processingMetadata = {
          step_completed: 'professional_context',
          processing_time: Date.now() - startTime,
          confidence_score: professionalAnalysis.confidenceScore,
          practical_applications: result.practical_applications.length
        };

        break;

      case 'cross_reference':
        console.log(`🔗 Cross-reference analysis for ${domain}...`);
        
        if (!content) {
          return NextResponse.json({
            success: false,
            error: 'Content is required for cross-reference analysis',
            smart_code
          }, { status: 400 });
        }

        const crossRefAnalysis = await analyzer.analyzeForUniversalLearning(
          content,
          domain,
          await processor.processAnyEducationalContent(
            [new File([content], 'content.txt', { type: 'text/plain' })],
            domain,
            { source: 'cross_reference', author: 'CrossRef API', subject: domain, grade_level: 'Professional', language: 'English' }
          ),
          {
            cross_domain_insights: true,
            universal_patterns: true,
            learning_science_enhanced: true
          }
        );

        result = {
          cross_domain_connections: crossRefAnalysis.crossDomainInsights,
          universal_patterns: await specializationFramework.identifyUniversalPatterns(crossRefAnalysis),
          domain_bridges: await specializationFramework.findDomainBridges(domain, crossRefAnalysis),
          learning_transfers: await specializationFramework.identifyLearningTransfers(domain, crossRefAnalysis),
          enhancement_opportunities: await specializationFramework.findEnhancementOpportunities(domain, crossRefAnalysis)
        };

        processingMetadata = {
          step_completed: 'cross_reference',
          processing_time: Date.now() - startTime,
          confidence_score: crossRefAnalysis.confidenceScore,
          cross_domain_insights: result.cross_domain_connections.length
        };

        break;

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}. Supported actions: quick_process, get_specializer, domain_analysis, certification_alignment, professional_context, cross_reference`,
          smart_code
        }, { status: 400 });
    }

    console.log(`✅ HERA ${domain} Domain Processing - ${action?.toUpperCase()} completed in ${processingMetadata.processing_time}ms`);

    return NextResponse.json({
      success: true,
      domain,
      data: result,
      processing_metadata: processingMetadata,
      smart_code
    });

  } catch (error: any) {
    console.error(`HERA ${params.domain} Domain Processing Error:`, error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error during domain processing',
      smart_code: `HERA.EDU.${params.domain.toUpperCase()}.API.ERROR.v1`
    }, { status: 500 });
  }
}