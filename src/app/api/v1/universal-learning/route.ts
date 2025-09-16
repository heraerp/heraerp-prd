// HERA Universal Learning Platform - Universal API Endpoints
// REST API exposing the complete Universal Learning Platform functionality

import { NextRequest, NextResponse } from 'next/server'
import { UniversalContentProcessor } from '@/src/lib/universal-learning/UniversalContentProcessor'
import { UniversalAIAnalyzer } from '@/src/lib/universal-learning/UniversalAIAnalyzer'
import { UniversalEntityCreator } from '@/src/lib/universal-learning/UniversalEntityCreator'
import { UniversalLearningPathGenerator } from '@/src/lib/universal-learning/UniversalLearningPathGenerator'
import { DomainSpecializationFramework } from '@/src/lib/universal-learning/DomainSpecializationFramework'
import { CrossDomainIntelligenceEngine } from '@/src/lib/universal-learning/CrossDomainIntelligenceEngine'

// HERA Organization ID for Universal Learning System
const HERA_LEARNING_ORG_ID = '719dfed1-09b4-4ca8-bfda-f682460de945'

interface UniversalLearningRequest {
  action:
    | 'process_content'
    | 'analyze_content'
    | 'create_entities'
    | 'generate_paths'
    | 'specialize_domain'
    | 'cross_domain_intelligence'
    | 'complete_pipeline'
  domain: string
  content?: string
  files?: File[]
  options?: {
    extract_images?: boolean
    generate_summaries?: boolean
    create_flashcards?: boolean
    difficulty_adjustment?: boolean
    personalization?: boolean
    gamification?: boolean
    cross_domain_insights?: boolean
    universal_patterns?: boolean
    learning_science_enhanced?: boolean
    target_audience?: 'beginner' | 'intermediate' | 'advanced' | 'mixed'
    learning_style?: 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing' | 'adaptive'
    time_constraint?: 'relaxed' | 'moderate' | 'intensive' | 'flexible'
    assessment_frequency?: 'low' | 'medium' | 'high' | 'adaptive'
    include_assessments?: boolean
    include_relationships?: boolean
    include_transactions?: boolean
  }
  metadata?: {
    source?: string
    author?: string
    subject?: string
    grade_level?: string
    language?: string
    custom_fields?: { [key: string]: any }
  }
}

interface UniversalLearningResponse {
  success: boolean
  data?: any
  error?: string
  processing_metadata?: {
    step_completed: string
    processing_time: number
    confidence_score: number
    universal_applicability: number
    domain_specialization: number
    entities_created?: number
    learning_paths_generated?: number
    cross_domain_insights?: number
  }
  smart_code: string
  hera_entities?: {
    core_entities: any[]
    dynamic_data: any[]
    relationships: any[]
    transactions: any[]
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<UniversalLearningResponse>> {
  try {
    console.log('🔍 [DEBUG] API route called')

    // Check if request has FormData (file upload) or JSON
    const contentType = request.headers.get('content-type') || ''
    let body: UniversalLearningRequest
    let extractedContent = ''

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      console.log('🔍 [DEBUG] Processing FormData request (file upload)')
      const formData = await request.formData()

      // Extract form fields
      const action = formData.get('action') as string
      const domain = formData.get('domain') as string
      const textContent = (formData.get('content') as string) || ''
      let options = {}
      let metadata = {}

      try {
        options = JSON.parse((formData.get('options') as string) || '{}')
        metadata = JSON.parse((formData.get('metadata') as string) || '{}')
      } catch (e) {
        console.log('🔍 [DEBUG] Error parsing options/metadata, using defaults')
      }

      // Process uploaded files
      const files: File[] = []
      let fileIndex = 0
      while (formData.has(`file_${fileIndex}`)) {
        const file = formData.get(`file_${fileIndex}`) as File
        files.push(file)
        fileIndex++
      }

      console.log(`🔍 [DEBUG] Found ${files.length} uploaded files`)

      // Extract content from files
      for (const file of files) {
        console.log(`🔍 [DEBUG] Processing file: ${file.name} (${file.type})`)
        const fileContent = await extractContentFromFile(file)
        extractedContent += fileContent + '\n\n'
      }

      // Combine text content and extracted file content
      const finalContent =
        textContent + (extractedContent ? '\n\n--- FILE CONTENT ---\n\n' + extractedContent : '')

      body = {
        action: action as any,
        domain,
        content: finalContent,
        options,
        metadata
      }

      console.log('🔍 [DEBUG] FormData processed:', {
        action,
        domain,
        textContentLength: textContent.length,
        extractedContentLength: extractedContent.length,
        totalFiles: files.length
      })
    } else {
      // Handle JSON request
      console.log('🔍 [DEBUG] Processing JSON request')
      body = await request.json()
    }

    console.log('🔍 [DEBUG] Request body parsed:', {
      action: body.action,
      domain: body.domain,
      contentLength: body.content?.length
    })

    const { action, domain, content, files, options = {}, metadata = {} } = body

    console.log(
      `🚀 HERA Universal Learning API - ${action.toUpperCase()} for ${domain.toUpperCase()}`
    )
    console.log(
      `📊 Options:`,
      Object.keys(options)
        .filter(key => options[key])
        .join(', ')
    )
    console.log('🔍 [DEBUG] About to start switch statement')

    const startTime = Date.now()
    const smart_code = `HERA.EDU.UNIVERSAL.API.${action.toUpperCase()}.${domain.toUpperCase()}.v1`

    // Validate required parameters
    if (!domain) {
      return NextResponse.json(
        {
          success: false,
          error: 'Domain is required (e.g., CA, MED, LAW, ENG, LANG)',
          smart_code
        },
        { status: 400 }
      )
    }

    if (!content && !files && action !== 'cross_domain_intelligence') {
      return NextResponse.json(
        {
          success: false,
          error: 'Content or files are required for processing',
          smart_code
        },
        { status: 400 }
      )
    }

    // Initialize Universal Learning Components
    const processor = new UniversalContentProcessor()
    const analyzer = new UniversalAIAnalyzer()
    const entityCreator = new UniversalEntityCreator(HERA_LEARNING_ORG_ID, domain)
    const pathGenerator = new UniversalLearningPathGenerator(domain, HERA_LEARNING_ORG_ID)
    const specializationFramework = new DomainSpecializationFramework()
    const crossDomainEngine = new CrossDomainIntelligenceEngine()

    let result: any
    let processingMetadata: any = {}

    switch (action) {
      case 'process_content':
        console.log(`📚 Processing content for ${domain.toUpperCase()}...`)

        result = await processor.processTextContent(content || '', domain, {
          source: metadata.source || 'api_upload',
          author: metadata.author || 'Unknown',
          subject: metadata.subject || domain,
          grade_level: metadata.grade_level || 'Professional',
          language: metadata.language || 'English',
          custom_fields: metadata.custom_fields || {}
        })

        processingMetadata = {
          step_completed: 'content_processing',
          processing_time: Date.now() - startTime,
          confidence_score: result.processingMetadata.confidenceScore,
          universal_applicability: result.crossDomainApplicable ? 0.8 : 0.6,
          domain_specialization: 0.7, // Default for single domain
          elements_extracted: result.universalFoundation.universalElements.length
        }

        break

      case 'analyze_content':
        console.log(`🧠 AI analyzing content for ${domain.toUpperCase()}...`)

        if (!content) {
          return NextResponse.json(
            {
              success: false,
              error: 'Content is required for AI analysis',
              smart_code
            },
            { status: 400 }
          )
        }

        // First process content to get universal knowledge structure
        const processedContent = await processor.processTextContent(content, domain, {
          source: metadata.source || 'api_content',
          author: metadata.author || 'Unknown',
          subject: metadata.subject || domain,
          grade_level: metadata.grade_level || 'Professional',
          language: metadata.language || 'English'
        })

        // Then analyze with AI
        result = await analyzer.analyzeForUniversalLearning(
          content,
          domain,
          processedContent.universalFoundation,
          {
            extract_images: options.extract_images,
            generate_summaries: options.generate_summaries,
            create_flashcards: options.create_flashcards,
            difficulty_adjustment: options.difficulty_adjustment,
            personalization: options.personalization,
            gamification: options.gamification,
            cross_domain_insights: options.cross_domain_insights,
            universal_patterns: options.universal_patterns,
            learning_science_enhanced: options.learning_science_enhanced
          }
        )

        processingMetadata = {
          step_completed: 'ai_analysis',
          processing_time: Date.now() - startTime,
          confidence_score: result.confidenceScore || 0.8,
          universal_applicability:
            result.universalElements?.length > 0
              ? result.universalElements.reduce(
                  (avg, el) => avg + (el.universalApplicability || 0),
                  0
                ) / result.universalElements.length
              : 0.7,
          domain_specialization:
            (result.domainSpecificElements?.length || 0) /
            ((result.universalElements?.length || 0) +
              (result.domainSpecificElements?.length || 0) +
              1),
          universal_elements: result.universalElements?.length || 0,
          domain_elements: result.domainSpecificElements?.length || 0,
          cross_domain_insights: result.crossDomainInsights?.length || 0
        }

        break

      case 'create_entities':
        console.log(`🏗️ Creating HERA entities for ${domain.toUpperCase()}...`)

        // Need AI analysis first
        if (!content) {
          return NextResponse.json(
            {
              success: false,
              error: 'Content is required for entity creation',
              smart_code
            },
            { status: 400 }
          )
        }

        // Process and analyze content
        const entityProcessedContent = await processor.processTextContent(content, domain, {
          source: 'api_entity_creation',
          author: 'API',
          subject: domain,
          grade_level: 'Professional',
          language: 'English'
        })

        const entityAnalysisResult = await analyzer.analyzeForUniversalLearning(
          content,
          domain,
          entityProcessedContent.universalFoundation,
          options
        )

        // Create entities
        result = await entityCreator.createUniversalEntities(
          entityAnalysisResult,
          {
            source: metadata.source || 'api_creation',
            author: metadata.author || 'API User',
            subject: metadata.subject || domain,
            grade_level: metadata.grade_level || 'Professional',
            language: metadata.language || 'English',
            custom_fields: metadata.custom_fields || {}
          },
          {
            includeAssessments: options.include_assessments,
            includeRelationships: options.include_relationships,
            includeTransactions: options.include_transactions,
            generateMockData: false
          }
        )

        processingMetadata = {
          step_completed: 'entity_creation',
          processing_time: Date.now() - startTime,
          confidence_score: result.creationMetadata.confidenceScore,
          universal_applicability: result.creationMetadata.universalApplicability,
          domain_specialization: result.creationMetadata.domainSpecialization,
          entities_created: result.creationMetadata.totalEntitiesCreated,
          dynamic_fields: result.creationMetadata.dynamicFieldsCreated,
          relationships: result.creationMetadata.relationshipsEstablished,
          transactions: result.creationMetadata.transactionsLogged
        }

        break

      case 'generate_paths':
        console.log(`🛤️ Generating learning paths for ${domain.toUpperCase()}...`)

        if (!content) {
          return NextResponse.json(
            {
              success: false,
              error: 'Content is required for path generation',
              smart_code
            },
            { status: 400 }
          )
        }

        // Complete processing pipeline for path generation
        const pathProcessedContent = await processor.processTextContent(content, domain, {
          source: 'api_path_generation',
          author: 'API',
          subject: domain,
          grade_level: 'Professional',
          language: 'English'
        })

        const pathAnalysisResult = await analyzer.analyzeForUniversalLearning(
          content,
          domain,
          pathProcessedContent.universalFoundation,
          options
        )

        const pathEntityResult = await entityCreator.createUniversalEntities(
          pathAnalysisResult,
          {
            source: 'api_path_generation',
            author: 'API',
            subject: domain,
            grade_level: 'Professional',
            language: 'English'
          },
          { includeAssessments: true, includeRelationships: true, includeTransactions: true }
        )

        // Generate learning paths
        result = await pathGenerator.generateUniversalLearningPaths(
          pathAnalysisResult,
          pathEntityResult,
          {
            targetAudience: options.target_audience || 'mixed',
            learningStyle: options.learning_style || 'adaptive',
            timeConstraint: options.time_constraint || 'flexible',
            assessmentFrequency: options.assessment_frequency || 'adaptive',
            domainFocus: domain,
            crossDomainInsights: options.cross_domain_insights || true,
            personalization: options.personalization || true,
            gamification: options.gamification || true
          }
        )

        processingMetadata = {
          step_completed: 'path_generation',
          processing_time: Date.now() - startTime,
          confidence_score: pathAnalysisResult.confidenceScore,
          universal_applicability: pathEntityResult.creationMetadata.universalApplicability,
          domain_specialization: pathEntityResult.creationMetadata.domainSpecialization,
          learning_paths_generated: result.length,
          total_learning_steps: result.reduce(
            (total, path) => total + path.learningSequence.length,
            0
          ),
          assessment_points: result.reduce((total, path) => total + path.assessmentPoints.length, 0)
        }

        break

      case 'specialize_domain':
        console.log(`🎯 Applying domain specialization for ${domain.toUpperCase()}...`)

        if (!content) {
          return NextResponse.json(
            {
              success: false,
              error: 'Content is required for domain specialization',
              smart_code
            },
            { status: 400 }
          )
        }

        // Complete processing pipeline for specialization
        const specProcessedContent = await processor.processTextContent(content, domain, {
          source: 'api_specialization',
          author: 'API',
          subject: domain,
          grade_level: 'Professional',
          language: 'English'
        })

        const specAnalysisResult = await analyzer.analyzeForUniversalLearning(
          content,
          domain,
          specProcessedContent.universalFoundation,
          options
        )

        const specEntityResult = await entityCreator.createUniversalEntities(
          specAnalysisResult,
          {
            source: 'api_specialization',
            author: 'API',
            subject: domain,
            grade_level: 'Professional',
            language: 'English'
          },
          { includeAssessments: true, includeRelationships: true, includeTransactions: true }
        )

        const specPathResult = await pathGenerator.generateUniversalLearningPaths(
          specAnalysisResult,
          specEntityResult,
          {
            targetAudience: 'mixed',
            learningStyle: 'adaptive',
            timeConstraint: 'flexible',
            assessmentFrequency: 'adaptive',
            domainFocus: domain,
            crossDomainInsights: true,
            personalization: true,
            gamification: true
          }
        )

        // Apply domain specialization
        result = await specializationFramework.applyDomainSpecialization(
          domain,
          specAnalysisResult,
          specEntityResult,
          specPathResult
        )

        processingMetadata = {
          step_completed: 'domain_specialization',
          processing_time: Date.now() - startTime,
          confidence_score: result.specializationMetadata.confidenceScore,
          universal_applicability: result.specializationMetadata.universalRetention,
          domain_specialization: result.specializationMetadata.specializationStrength,
          enhanced_elements: result.enhancedElements.length,
          professional_alignments: result.professionalAlignment ? 1 : 0,
          certification_mappings: result.certificationMapping ? 1 : 0,
          practical_applications: result.practicalApplications.length
        }

        break

      case 'cross_domain_intelligence':
        console.log(`🧠 Generating cross-domain intelligence...`)

        // For cross-domain intelligence, we can work with existing domain data
        // In production, this would access actual domain data from HERA database
        const mockDomainData = new Map([
          [
            'CA',
            {
              analysis: await getMockAnalysisForDomain('CA'),
              specialization: await getMockSpecializationForDomain('CA'),
              learningPaths: await getMockLearningPathsForDomain('CA')
            }
          ],
          [
            'MED',
            {
              analysis: await getMockAnalysisForDomain('MED'),
              specialization: await getMockSpecializationForDomain('MED'),
              learningPaths: await getMockLearningPathsForDomain('MED')
            }
          ],
          [
            'LAW',
            {
              analysis: await getMockAnalysisForDomain('LAW'),
              specialization: await getMockSpecializationForDomain('LAW'),
              learningPaths: await getMockLearningPathsForDomain('LAW')
            }
          ]
        ])

        result = await crossDomainEngine.learnFromAllDomains(mockDomainData)

        processingMetadata = {
          step_completed: 'cross_domain_intelligence',
          processing_time: Date.now() - startTime,
          confidence_score: result.intelligenceMetrics.overallConfidence,
          universal_applicability: result.intelligenceMetrics.universalPatternStrength,
          domain_specialization: result.intelligenceMetrics.domainSpecializationBalance,
          cross_domain_insights: result.crossDomainConnections.length,
          learning_transfers: result.learningTransfers.length,
          predictive_insights: result.predictiveInsights.length
        }

        break

      case 'complete_pipeline':
        console.log(
          `🔄 Running complete Universal Learning Pipeline for ${domain.toUpperCase()}...`
        )

        if (!content || content.trim().length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: 'Content is required for complete pipeline',
              smart_code
            },
            { status: 400 }
          )
        }

        // Step 1: Process Content
        console.log(`📚 Pipeline Step 1: Content Processing...`)
        console.log('🔍 [DEBUG] About to call processor.processTextContent')

        const pipelineProcessedContent = await processor.processTextContent(content, domain, {
          source: metadata.source || 'api_pipeline',
          author: metadata.author || 'API User',
          subject: metadata.subject || domain,
          grade_level: metadata.grade_level || 'Professional',
          language: metadata.language || 'English',
          custom_fields: metadata.custom_fields || {}
        })

        console.log('🔍 [DEBUG] Content processing completed, result structure:', {
          hasUniversalFoundation: !!pipelineProcessedContent.universalFoundation,
          hasUniversalElements: !!pipelineProcessedContent.universalFoundation?.universalElements,
          elementsLength: pipelineProcessedContent.universalFoundation?.universalElements?.length
        })

        // Step 2: AI Analysis
        console.log(`🧠 Pipeline Step 2: AI Analysis...`)
        console.log('🔍 [DEBUG] About to call analyzer.analyzeForUniversalLearning')

        const pipelineAnalysisResult = await analyzer.analyzeForUniversalLearning(
          content,
          domain,
          pipelineProcessedContent.universalFoundation,
          options
        )

        console.log('🔍 [DEBUG] AI Analysis completed, result structure:', {
          hasUniversalElements: !!pipelineAnalysisResult.universalElements,
          universalElementsLength: pipelineAnalysisResult.universalElements?.length,
          hasDomainElements: !!pipelineAnalysisResult.domainSpecificElements,
          domainElementsLength: pipelineAnalysisResult.domainSpecificElements?.length,
          confidenceScore: pipelineAnalysisResult.confidenceScore
        })

        // Step 3: Entity Creation
        console.log(`🏗️ Pipeline Step 3: Entity Creation...`)
        const pipelineEntityResult = await entityCreator.createUniversalEntities(
          pipelineAnalysisResult,
          {
            source: metadata.source || 'api_pipeline',
            author: metadata.author || 'API User',
            subject: metadata.subject || domain,
            grade_level: metadata.grade_level || 'Professional',
            language: metadata.language || 'English',
            custom_fields: metadata.custom_fields || {}
          },
          {
            includeAssessments: options.include_assessments !== false,
            includeRelationships: options.include_relationships !== false,
            includeTransactions: options.include_transactions !== false
          }
        )

        // Step 4: Learning Path Generation
        console.log(`🛤️ Pipeline Step 4: Learning Path Generation...`)
        const pipelineLearningPaths = await pathGenerator.generateUniversalLearningPaths(
          pipelineAnalysisResult,
          pipelineEntityResult,
          {
            targetAudience: options.target_audience || 'mixed',
            learningStyle: options.learning_style || 'adaptive',
            timeConstraint: options.time_constraint || 'flexible',
            assessmentFrequency: options.assessment_frequency || 'adaptive',
            domainFocus: domain,
            crossDomainInsights: options.cross_domain_insights !== false,
            personalization: options.personalization !== false,
            gamification: options.gamification !== false
          }
        )

        // Step 5: Domain Specialization
        console.log(`🎯 Pipeline Step 5: Domain Specialization...`)
        const pipelineSpecialization = await specializationFramework.applyDomainSpecialization(
          domain,
          pipelineAnalysisResult,
          pipelineEntityResult,
          pipelineLearningPaths
        )

        // Step 6: Cross-Domain Intelligence (if enabled)
        let pipelineCrossDomainIntelligence = null
        if (options.cross_domain_insights !== false) {
          console.log(`🧠 Pipeline Step 6: Cross-Domain Intelligence...`)
          const crossDomainData = new Map([
            [
              domain,
              {
                analysis: pipelineAnalysisResult,
                specialization: pipelineSpecialization,
                learningPaths: pipelineLearningPaths
              }
            ]
          ])
          pipelineCrossDomainIntelligence =
            await crossDomainEngine.learnFromAllDomains(crossDomainData)
        }

        // Compile complete pipeline result
        result = {
          content_processing: pipelineProcessedContent,
          ai_analysis: pipelineAnalysisResult,
          entity_creation: pipelineEntityResult,
          learning_paths: pipelineLearningPaths,
          domain_specialization: pipelineSpecialization,
          cross_domain_intelligence: pipelineCrossDomainIntelligence,
          pipeline_summary: {
            total_universal_elements: pipelineAnalysisResult.universalElements.length,
            total_domain_elements: pipelineAnalysisResult.domainSpecificElements.length,
            total_entities_created: pipelineEntityResult.creationMetadata.totalEntitiesCreated,
            total_learning_paths: pipelineLearningPaths.length,
            total_learning_steps: pipelineLearningPaths.reduce(
              (total, path) => total + path.learningSequence.length,
              0
            ),
            specialization_enhancements: pipelineSpecialization.enhancedElements.length,
            cross_domain_insights:
              pipelineCrossDomainIntelligence?.crossDomainConnections.length || 0
          }
        }

        processingMetadata = {
          step_completed: 'complete_pipeline',
          processing_time: Date.now() - startTime,
          confidence_score: pipelineAnalysisResult.confidenceScore,
          universal_applicability: pipelineEntityResult.creationMetadata.universalApplicability,
          domain_specialization: pipelineEntityResult.creationMetadata.domainSpecialization,
          entities_created: pipelineEntityResult.creationMetadata.totalEntitiesCreated,
          learning_paths_generated: pipelineLearningPaths.length,
          cross_domain_insights: pipelineCrossDomainIntelligence?.crossDomainConnections.length || 0
        }

        break

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action: ${action}. Supported actions: process_content, analyze_content, create_entities, generate_paths, specialize_domain, cross_domain_intelligence, complete_pipeline`,
            smart_code
          },
          { status: 400 }
        )
    }

    // Prepare HERA entities for response (if applicable)
    const heraEntities = result.coreEntities
      ? {
          core_entities: result.coreEntities,
          dynamic_data: result.dynamicData,
          relationships: result.relationships,
          transactions: result.transactions
        }
      : undefined

    console.log(
      `✅ HERA Universal Learning API - ${action.toUpperCase()} completed in ${processingMetadata.processing_time}ms`
    )
    console.log(
      `📊 Confidence: ${processingMetadata.confidence_score?.toFixed(2)}, Universal: ${processingMetadata.universal_applicability?.toFixed(2)}, Domain: ${processingMetadata.domain_specialization?.toFixed(2)}`
    )

    return NextResponse.json({
      success: true,
      data: result,
      processing_metadata: processingMetadata,
      smart_code,
      hera_entities: heraEntities
    })
  } catch (error: any) {
    console.error('🔍 [DEBUG] HERA Universal Learning API Error Details:')
    console.error('- Error message:', error.message)
    console.error('- Error stack:', error.stack)
    console.error('- Error name:', error.name)
    console.error('- Full error object:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error during universal learning processing',
        debug_info: {
          error_message: error.message,
          error_stack: error.stack,
          error_name: error.name,
          timestamp: new Date().toISOString()
        },
        smart_code: `HERA.EDU.UNIVERSAL.API.ERROR.v1`
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const action = url.searchParams.get('action')

  try {
    switch (action) {
      case 'health':
        return NextResponse.json({
          success: true,
          status: 'healthy',
          system: 'HERA Universal Learning Platform',
          version: '1.0.0',
          capabilities: [
            'Universal Content Processing',
            'AI-Powered Analysis (Multi-Provider)',
            'HERA 6-Table Entity Creation',
            'Adaptive Learning Path Generation',
            'Domain Specialization Framework',
            'Cross-Domain Intelligence Engine',
            'Complete Pipeline Processing'
          ],
          supported_domains: ['CA', 'MED', 'LAW', 'ENG', 'LANG', 'GENERAL'],
          smart_code: 'HERA.EDU.UNIVERSAL.API.HEALTH.v1'
        })

      case 'capabilities':
        return NextResponse.json({
          success: true,
          endpoints: {
            'POST /api/v1/universal-learning': {
              description: 'Main Universal Learning Platform endpoint',
              actions: {
                process_content: 'Extract universal learning elements from any educational content',
                analyze_content: 'AI-powered analysis with multi-provider routing',
                create_entities: 'Convert learning content to HERA 6-table architecture',
                generate_paths: 'Generate adaptive, personalized learning paths',
                specialize_domain: 'Apply domain-specific enhancements and professional context',
                cross_domain_intelligence: 'Generate cross-domain insights and learning transfers',
                complete_pipeline: 'Run the complete Universal Learning Platform pipeline'
              }
            },
            'GET /api/v1/universal-learning?action=health': 'System health check',
            'GET /api/v1/universal-learning?action=capabilities': 'API capabilities documentation',
            'GET /api/v1/universal-learning?action=domains': 'Supported domain information'
          },
          smart_code: 'HERA.EDU.UNIVERSAL.API.CAPABILITIES.v1'
        })

      case 'domains':
        return NextResponse.json({
          success: true,
          supported_domains: {
            CA: {
              name: 'Chartered Accountancy',
              description: 'Professional accounting and finance education',
              certifications: ['ICAI CA Final', 'ICAI CA Intermediate', 'ICAI CA Foundation'],
              specializations: [
                'Audit',
                'Taxation',
                'Financial Reporting',
                'Management Accounting',
                'Corporate Law'
              ]
            },
            MED: {
              name: 'Medical Education',
              description: 'Healthcare and clinical learning',
              certifications: ['USMLE', 'Medical Board Exams', 'Specialty Certifications'],
              specializations: [
                'Clinical Practice',
                'Medical Research',
                'Patient Care',
                'Medical Ethics',
                'Evidence-Based Medicine'
              ]
            },
            LAW: {
              name: 'Legal Education',
              description: 'Law and jurisprudence studies',
              certifications: ['Bar Exam', 'Legal Specialization Certificates', 'Judicial Exams'],
              specializations: [
                'Constitutional Law',
                'Corporate Law',
                'Criminal Law',
                'Civil Procedure',
                'Legal Research'
              ]
            },
            ENG: {
              name: 'Engineering Education',
              description: 'Technical and applied sciences',
              certifications: ['FE Exam', 'PE License', 'Technical Certifications'],
              specializations: [
                'Design Engineering',
                'Systems Analysis',
                'Project Management',
                'Safety Standards',
                'Innovation'
              ]
            },
            LANG: {
              name: 'Language Learning',
              description: 'Linguistic and cultural education',
              certifications: ['TOEFL', 'IELTS', 'Language Proficiency Certificates'],
              specializations: [
                'Communication Skills',
                'Cultural Context',
                'Professional Language',
                'Translation',
                'Literature'
              ]
            },
            GENERAL: {
              name: 'General Education',
              description: 'Universal learning principles for any subject',
              certifications: ['Educational Standards', 'Learning Certifications'],
              specializations: [
                'Learning Science',
                'Cognitive Psychology',
                'Educational Technology',
                'Assessment Design',
                'Curriculum Development'
              ]
            }
          },
          smart_code: 'HERA.EDU.UNIVERSAL.API.DOMAINS.v1'
        })

      default:
        return NextResponse.json({
          success: true,
          message: 'HERA Universal Learning Platform API',
          version: '1.0.0',
          description:
            'Universal AI-powered learning system that processes ANY educational content and creates adaptive learning experiences across all domains with 95% code reuse',
          endpoints: {
            'POST /': 'Main processing endpoint',
            'GET /?action=health': 'Health check',
            'GET /?action=capabilities': 'API documentation',
            'GET /?action=domains': 'Supported domains'
          },
          smart_code: 'HERA.EDU.UNIVERSAL.API.INFO.v1'
        })
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
        smart_code: 'HERA.EDU.UNIVERSAL.API.ERROR.v1'
      },
      { status: 500 }
    )
  }
}

// Helper methods for mock data (would be replaced with actual database queries in production)
async function getMockAnalysisForDomain(domain: string): Promise<any> {
  return {
    universalElements: Array.from({ length: 5 }, (_, i) => ({
      id: `${domain.toLowerCase()}_element_${i}`,
      type: 'concept',
      title: `${domain} Concept ${i + 1}`,
      content: `Mock content for ${domain} concept ${i + 1}`,
      universalApplicability: 0.8 + Math.random() * 0.2,
      learningScience: {
        bloomsLevel: ['knowledge', 'comprehension', 'application'][i % 3],
        learningStyle: 'multimodal',
        cognitiveLoad: 'medium',
        difficulty: 'intermediate'
      },
      aiEnhancements: {
        explanation: '',
        examples: [],
        analogies: [],
        mnemonics: [],
        visualizations: []
      },
      assessmentQuestions: [],
      prerequisites: [],
      relatedConcepts: []
    })),
    domainSpecificElements: [],
    crossDomainInsights: [],
    confidenceScore: 0.85 + Math.random() * 0.15,
    learningOptimizations: [],
    assessmentRecommendations: [],
    personalizedPaths: [],
    gamificationElements: []
  }
}

async function getMockSpecializationForDomain(domain: string): Promise<any> {
  return {
    domain,
    specializationType: 'professional' as const,
    enhancedElements: [],
    domainContext: {},
    professionalAlignment: {},
    certificationMapping: {},
    practicalApplications: [],
    industryInsights: [],
    careerGuidance: {},
    specializationMetadata: {
      confidenceScore: 0.9,
      universalRetention: 0.8,
      specializationStrength: 0.7
    }
  }
}

async function getMockLearningPathsForDomain(domain: string): Promise<any[]> {
  return [
    {
      pathId: `${domain.toLowerCase()}_path_1`,
      pathName: `${domain} Beginner Path`,
      description: `Beginner learning path for ${domain}`,
      targetDomain: domain,
      difficulty: 'beginner' as const,
      estimatedDuration: 120,
      totalElements: 5,
      learningSequence: [],
      assessmentPoints: [],
      adaptationRules: [],
      gamificationElements: [],
      prerequisites: [],
      learningObjectives: [],
      pathMetadata: {}
    }
  ]
}

// File content extraction function
async function extractContentFromFile(file: File): Promise<string> {
  try {
    const fileName = file.name.toLowerCase()
    const fileType = file.type

    console.log(`🔍 [DEBUG] Extracting content from: ${file.name} (${fileType})`)

    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      // Extract PDF content
      console.log('📄 Processing PDF file...')
      console.log(`📄 File size: ${file.size} bytes`)

      try {
        const arrayBuffer = await file.arrayBuffer()
        console.log(`📄 ArrayBuffer created: ${arrayBuffer.byteLength} bytes`)

        const buffer = Buffer.from(arrayBuffer)
        console.log(`📄 Buffer created: ${buffer.length} bytes`)

        // Use dynamic import to avoid build issues
        const pdfParse = (await import('pdf-parse')).default
        console.log('📄 pdf-parse imported successfully')

        const pdfData = await pdfParse(buffer)
        console.log(`📄 PDF extracted: ${pdfData.text.length} characters`)

        if (pdfData.text.length === 0) {
          return `📄 PDF "${file.name}" processed but no text content found. This might be a scanned PDF or image-based PDF that requires OCR.`
        }

        return `📄 PDF Content from "${file.name}":\n\n${pdfData.text}`
      } catch (pdfError) {
        console.error(`📄 PDF processing error:`, pdfError)
        return `📄 Error processing PDF "${file.name}": ${pdfError.message}. Please try converting to text or using a different PDF.`
      }
    } else if (
      fileType.startsWith('text/') ||
      fileName.endsWith('.txt') ||
      fileName.endsWith('.md')
    ) {
      // Extract text content
      console.log('📝 Processing text file...')
      const text = await file.text()
      console.log(`📝 Text extracted: ${text.length} characters`)
      return `📝 Text Content from "${file.name}":\n\n${text}`
    } else if (fileName.endsWith('.docx')) {
      // For DOCX files, we'd need mammoth or similar library
      // For now, return a placeholder
      console.log('📄 DOCX files require additional processing (not implemented yet)')
      return `📄 Word Document "${file.name}" uploaded but content extraction not yet implemented for DOCX files. Please convert to PDF or text format.`
    } else {
      // Unknown file type
      console.log(`❓ Unknown file type: ${fileType}`)
      return `📎 File "${file.name}" uploaded but content extraction not supported for this file type (${fileType}). Supported types: PDF, TXT, MD.`
    }
  } catch (error) {
    console.error(`❌ Error extracting content from ${file.name}:`, error)
    return `❌ Error extracting content from "${file.name}": ${error.message}`
  }
}
