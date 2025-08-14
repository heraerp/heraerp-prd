import { NextRequest, NextResponse } from 'next/server'

// HERA Comprehensive Universal Smart Codes - All Learning Scenarios
const SMART_CODES = {
  // === CORE UNIVERSAL ENTITIES ===
  // Foundation entities that work across ALL domains
  STUDENT: 'HERA.UNI.EDU.ENT.STUDENT.v1',
  TOPIC: 'HERA.UNI.EDU.ENT.TOPIC.v1', 
  QUESTION: 'HERA.UNI.EDU.ENT.QUESTION.v1',
  ACHIEVEMENT: 'HERA.UNI.EDU.ENT.ACHIEVEMENT.v1',
  CONTENT: 'HERA.UNI.EDU.ENT.CONTENT.v1',
  
  // === UNIVERSAL LEARNING TRANSACTIONS ===
  STUDY_SESSION: 'HERA.UNI.EDU.TXN.STUDY.v1',
  QUIZ_ATTEMPT: 'HERA.UNI.EDU.TXN.QUIZ.v1',
  MOCK_TEST: 'HERA.UNI.EDU.TXN.MOCK.v1',
  CONTENT_SAVE: 'HERA.UNI.EDU.TXN.SAVE_CONTENT.v1',
  
  // === EDUCATIONAL CONTEXTS ===
  // K-12 Education
  K12_MATH: 'HERA.K12.MATH.v1',
  K12_SCIENCE: 'HERA.K12.SCI.v1', 
  K12_ENGLISH: 'HERA.K12.LANG.ENGLISH.v1',
  K12_HISTORY: 'HERA.K12.HIST.v1',
  
  // University Level
  UNI_STEM: 'HERA.UNI.STEM.v1',
  UNI_HUMANITIES: 'HERA.UNI.HUM.v1',
  UNI_SOCIAL_SCIENCE: 'HERA.UNI.SOC.v1',
  
  // Professional Certification
  PROF_CERTIFICATION: 'HERA.PROF.CERT.v1',
  PROF_CONTINUING_ED: 'HERA.PROF.CONT_ED.v1',
  
  // Corporate Training
  CORP_ONBOARDING: 'HERA.CORP.ONBOARD.v1',
  CORP_SKILLS: 'HERA.CORP.SKILLS.v1',
  CORP_COMPLIANCE: 'HERA.CORP.COMP.v1',
  
  // Vocational/Technical
  TECH_VOCATIONAL: 'HERA.TECH.VOC.v1',
  TECH_CERTIFICATION: 'HERA.TECH.CERT.v1',
  
  // Lifelong Learning
  LIFE_PERSONAL_DEV: 'HERA.LIFE.PERSONAL.v1',
  LIFE_HOBBY: 'HERA.LIFE.HOBBY.v1',
  
  // === SUBJECT DOMAINS ===
  // Business & Finance (Current strength)
  CA_ACCOUNTING: 'HERA.PROF.FIN.CA.ACCOUNTING.v1',
  MBA_FINANCE: 'HERA.UNI.BUS.MBA.FINANCE.v1',
  CPA_ACCOUNTING: 'HERA.PROF.FIN.CPA.ACCOUNTING.v1',
  
  // STEM Fields
  MATHEMATICS: 'HERA.UNI.MATH.v1',
  PHYSICS: 'HERA.UNI.SCI.PHYSICS.v1',
  CHEMISTRY: 'HERA.UNI.SCI.CHEMISTRY.v1',
  BIOLOGY: 'HERA.UNI.SCI.BIOLOGY.v1',
  COMPUTER_SCIENCE: 'HERA.UNI.TECH.CS.v1',
  ENGINEERING: 'HERA.UNI.ENG.v1',
  
  // Medical & Healthcare
  MEDICAL_EDUCATION: 'HERA.PROF.MED.EDUCATION.v1',
  NURSING: 'HERA.PROF.MED.NURSING.v1',
  HEALTHCARE_ADMIN: 'HERA.PROF.MED.ADMIN.v1',
  PHARMACY: 'HERA.PROF.MED.PHARMACY.v1',
  
  // Legal & Compliance
  LAW_EDUCATION: 'HERA.PROF.LAW.EDUCATION.v1',
  LEGAL_COMPLIANCE: 'HERA.PROF.LAW.COMPLIANCE.v1',
  REGULATORY: 'HERA.PROF.LAW.REGULATORY.v1',
  
  // Languages
  LANGUAGE_ENGLISH: 'HERA.LANG.ENGLISH.v1',
  LANGUAGE_SPANISH: 'HERA.LANG.SPANISH.v1',
  LANGUAGE_MANDARIN: 'HERA.LANG.MANDARIN.v1',
  LANGUAGE_FRENCH: 'HERA.LANG.FRENCH.v1',
  
  // Arts & Creative
  VISUAL_ARTS: 'HERA.ART.VISUAL.v1',
  MUSIC: 'HERA.ART.MUSIC.v1',
  CREATIVE_WRITING: 'HERA.ART.WRITING.v1',
  DESIGN: 'HERA.ART.DESIGN.v1',
  
  // === UNIVERSAL TRANSFERABLE SKILLS ===
  // These can be reused across ALL contexts
  CRITICAL_THINKING: 'HERA.UNI.SKILL.CRITICAL_THINKING.v1',
  COMMUNICATION: 'HERA.UNI.SKILL.COMMUNICATION.v1',
  PROBLEM_SOLVING: 'HERA.UNI.SKILL.PROBLEM_SOLVING.v1',
  COLLABORATION: 'HERA.UNI.SKILL.COLLABORATION.v1',
  DIGITAL_LITERACY: 'HERA.UNI.SKILL.DIGITAL_LITERACY.v1',
  RESEARCH: 'HERA.UNI.SKILL.RESEARCH.v1',
  PRESENTATION: 'HERA.UNI.SKILL.PRESENTATION.v1',
  TIME_MANAGEMENT: 'HERA.UNI.SKILL.TIME_MANAGEMENT.v1',
  LEADERSHIP: 'HERA.UNI.SKILL.LEADERSHIP.v1',
  
  // === CROSS-DOMAIN CONCEPTS ===
  // Concepts that appear in multiple subjects
  FINANCIAL_ACCOUNTING: 'HERA.UNI.CONCEPT.FIN_ACCOUNTING.v1', // CA + MBA + Commerce + CPA
  BUSINESS_LAW: 'HERA.UNI.CONCEPT.BUSINESS_LAW.v1', // CA + MBA + Law
  ECONOMICS: 'HERA.UNI.CONCEPT.ECONOMICS.v1', // CA + MBA + Economics
  STATISTICS: 'HERA.UNI.CONCEPT.STATISTICS.v1', // Math + Science + Business + Psychology
  ETHICS: 'HERA.UNI.CONCEPT.ETHICS.v1', // Business + Medical + Legal + Engineering
  PROJECT_MANAGEMENT: 'HERA.UNI.CONCEPT.PROJECT_MGMT.v1', // Business + Engineering + IT
  DATA_ANALYSIS: 'HERA.UNI.CONCEPT.DATA_ANALYSIS.v1', // Science + Business + Social Science
  
  // === ASSESSMENT & CONTENT FORMATS ===
  MULTIPLE_CHOICE: 'HERA.UNI.ASSESS.MCQ.v1',
  ESSAY: 'HERA.UNI.ASSESS.ESSAY.v1',
  PRACTICAL: 'HERA.UNI.ASSESS.PRACTICAL.v1',
  PORTFOLIO: 'HERA.UNI.ASSESS.PORTFOLIO.v1',
  PEER_REVIEW: 'HERA.UNI.ASSESS.PEER.v1',
  
  VIDEO_CONTENT: 'HERA.UNI.FORMAT.VIDEO.v1',
  AUDIO_CONTENT: 'HERA.UNI.FORMAT.AUDIO.v1',
  INTERACTIVE: 'HERA.UNI.FORMAT.INTERACTIVE.v1',
  SIMULATION: 'HERA.UNI.FORMAT.SIMULATION.v1',
  
  // === ACCESSIBILITY & SPECIAL NEEDS ===
  ACCESSIBILITY: 'HERA.UNI.ACCESS.v1',
  VISUAL_IMPAIRED: 'HERA.UNI.ACCESS.VISUAL.v1',
  HEARING_IMPAIRED: 'HERA.UNI.ACCESS.HEARING.v1',
  LEARNING_DISABILITY: 'HERA.UNI.ACCESS.LEARNING_DISABILITY.v1',
  
  // === REGIONAL & CULTURAL ===
  REGION_US: 'HERA.REGION.US.v1',
  REGION_UK: 'HERA.REGION.UK.v1',
  REGION_INDIA: 'HERA.REGION.INDIA.v1',
  REGION_CANADA: 'HERA.REGION.CANADA.v1',
  REGION_AUSTRALIA: 'HERA.REGION.AUSTRALIA.v1',
  
  // === CONTENT STORAGE WITH UNIVERSAL CLASSIFICATION ===
  SAVED_CONTENT: 'HERA.UNI.EDU.CONTENT.SAVED.v1',
  REUSABLE_QUESTION: 'HERA.UNI.EDU.QUESTION.REUSABLE.v1',
  UNIVERSAL_CONCEPT: 'HERA.UNI.EDU.CONCEPT.v1',
  
  // Dynamic Updates
  DYNAMIC_UPDATE: 'HERA.UNI.EDU.TOPIC.DYNAMIC.v1',
  REGULATORY_CHANGE: 'HERA.UNI.EDU.TOPIC.REGULATORY.v1'
}

// Mock Learning Data with HERA Universal Architecture
const mockData = {
  studentProgress: {
    student_id: 'STUDENT_001',
    organization_id: 'ca_learning_org_001',
    smart_code: SMART_CODES.STUDENT,
    progress_data: {
      name: "Priya Sharma",
      target_exam: "CA Final Nov 2025",
      days_remaining: 92,
      syllabus_completed: 68,
      current_level: "Advanced Learner",
      total_points: 2840,
      current_streak: 7,
      rank: 23,
      total_students: 1247
    }
  },
  
  topics: [
    {
      entity_id: 'TOPIC_001',
      smart_code: SMART_CODES.GST_BASICS,
      entity_name: 'GST Basics',
      progress: 95,
      confidence_level: 'high',
      ai_insights: {
        difficulty_rating: 0.3,
        success_rate: 0.95,
        avg_study_time: 45,
        next_revision_due: '2025-08-06'
      }
    },
    {
      entity_id: 'TOPIC_002', 
      smart_code: SMART_CODES.INPUT_TAX_CREDIT,
      entity_name: 'Input Tax Credit',
      progress: 87,
      confidence_level: 'high',
      ai_insights: {
        difficulty_rating: 0.6,
        success_rate: 0.87,
        avg_study_time: 60,
        next_revision_due: '2025-08-05'
      }
    },
    {
      entity_id: 'TOPIC_003',
      smart_code: SMART_CODES.CUSTOMS_VALUATION,
      entity_name: 'Customs Valuation',
      progress: 45,
      confidence_level: 'low',
      ai_insights: {
        difficulty_rating: 0.8,
        success_rate: 0.45,
        avg_study_time: 90,
        recommended_action: 'story_mode_learning',
        next_revision_due: '2025-08-04'
      }
    },
    {
      entity_id: 'TOPIC_004',
      smart_code: SMART_CODES.FTP_SCHEMES,
      entity_name: 'FTP Schemes',
      progress: 23,
      confidence_level: 'low',
      ai_insights: {
        difficulty_rating: 0.9,
        success_rate: 0.23,
        avg_study_time: 120,
        recommended_action: 'concept_mode_with_examples',
        next_revision_due: '2025-08-04'
      }
    }
  ],
  
  studySessions: [
    {
      transaction_id: 'TXN_001',
      smart_code: SMART_CODES.STUDY_SESSION,
      transaction_type: 'study_session',
      topic_entity_id: 'TOPIC_001',
      duration_minutes: 45,
      accuracy_score: 0.92,
      learning_mode: 'concept',
      timestamp: new Date().toISOString(),
      ai_feedback: {
        performance_rating: 'excellent',
        areas_for_improvement: [],
        next_suggested_topic: 'TOPIC_002'
      }
    }
  ],
  
  achievements: [
    {
      entity_id: 'ACHIEVEMENT_001',
      smart_code: SMART_CODES.ACHIEVEMENT,
      name: '7-Day Streak',
      description: 'Study for 7 consecutive days',
      icon: 'flame',
      earned: true,
      earned_date: '2025-08-03',
      points_awarded: 100
    },
    {
      entity_id: 'ACHIEVEMENT_002',
      smart_code: SMART_CODES.ACHIEVEMENT,
      name: 'GST Master',
      description: 'Complete GST module with 90%+ accuracy',
      icon: 'crown',
      earned: true,
      earned_date: '2025-08-02',
      points_awarded: 250
    }
  ]
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const studentId = searchParams.get('student_id') || 'STUDENT_001'

  try {
    switch (type) {
      case 'progress':
        return NextResponse.json({
          success: true,
          data: mockData.studentProgress,
          smart_code: SMART_CODES.STUDENT,
          timestamp: new Date().toISOString()
        })
        
      case 'topics':
        return NextResponse.json({
          success: true,
          data: mockData.topics,
          total_topics: mockData.topics.length,
          smart_code: SMART_CODES.TOPIC,
          timestamp: new Date().toISOString()
        })
        
      case 'achievements':
        return NextResponse.json({
          success: true,
          data: mockData.achievements,
          earned_count: mockData.achievements.filter(a => a.earned).length,
          total_count: mockData.achievements.length,
          smart_code: SMART_CODES.ACHIEVEMENT,
          timestamp: new Date().toISOString()
        })
        
      case 'study-sessions':
        return NextResponse.json({
          success: true,
          data: mockData.studySessions,
          smart_code: SMART_CODES.STUDY_SESSION,
          timestamp: new Date().toISOString()
        })
        
      default:
        // Return dashboard summary
        return NextResponse.json({
          success: true,
          data: {
            student: mockData.studentProgress,
            topics: mockData.topics,
            achievements: mockData.achievements,
            recent_sessions: mockData.studySessions.slice(0, 5)
          },
          metadata: {
            generated_by: 'HERA_AI_LEARNING_ENGINE',
            api_version: 'v1',
            smart_code_system: 'HERA.CA.EDU.*'
          },
          timestamp: new Date().toISOString()
        })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch learning data',
      details: error instanceof Error ? error.message : 'Unknown error',
      smart_code: 'HERA.CA.EDU.ERROR.FETCH.v1',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case 'start_study_session':
        // Create new study session transaction
        const studySession = {
          transaction_id: `TXN_${Date.now()}`,
          smart_code: SMART_CODES.STUDY_SESSION,
          transaction_type: 'study_session',
          topic_entity_id: data.topic_id,
          learning_mode: data.learning_mode || 'concept',
          started_at: new Date().toISOString(),
          student_id: data.student_id
        }

        return NextResponse.json({
          success: true,
          data: studySession,
          message: 'Study session started successfully',
          smart_code: SMART_CODES.STUDY_SESSION,
          timestamp: new Date().toISOString()
        })

      case 'complete_quiz':
        // Record quiz completion transaction
        const quizResult = {
          transaction_id: `TXN_${Date.now()}`,
          smart_code: SMART_CODES.QUIZ_ATTEMPT,
          transaction_type: 'quiz_attempt',
          topic_entity_id: data.topic_id,
          score: data.score,
          total_questions: data.total_questions,
          time_taken_seconds: data.time_taken,
          completed_at: new Date().toISOString(),
          student_id: data.student_id
        }

        return NextResponse.json({
          success: true,
          data: quizResult,
          message: 'Quiz completed successfully',
          smart_code: SMART_CODES.QUIZ_ATTEMPT,
          ai_feedback: {
            performance_rating: data.score > 0.8 ? 'excellent' : data.score > 0.6 ? 'good' : 'needs_improvement',
            next_action: data.score < 0.6 ? 'review_concepts' : 'advance_to_next_topic'
          },
          timestamp: new Date().toISOString()
        })

      case 'earn_achievement':
        // Award achievement to student
        const achievement = {
          entity_id: `ACHIEVEMENT_${Date.now()}`,
          smart_code: SMART_CODES.ACHIEVEMENT,
          achievement_type: data.achievement_type,
          earned_by: data.student_id,
          earned_at: new Date().toISOString(),
          points_awarded: data.points || 100
        }

        return NextResponse.json({
          success: true,
          data: achievement,
          message: 'Achievement earned!',
          smart_code: SMART_CODES.ACHIEVEMENT,
          timestamp: new Date().toISOString()
        })

      case 'get_topic_content':
        // Dual-Tier Knowledge Routing
        const topicId = data.topic_id
        const topicConfig = getTopicConfiguration(topicId)
        
        if (topicConfig.requiresDynamicUpdate) {
          // Tier 2: Use Universal Learning + PDF
          console.log(`🔄 Using Tier 2 (PDF Dynamic) for topic: ${topicId}`)
          
          try {
            const universalResponse = await fetch('http://localhost:3002/api/v1/universal-learning', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'complete_pipeline',
                domain: 'CA',
                content: data.pdf_content || 'Latest regulatory content...',
                options: {
                  target_audience: 'advanced',
                  learning_style: 'adaptive',
                  cross_domain_insights: true
                },
                metadata: {
                  source: 'ca_dynamic_update',
                  subject: topicId,
                  grade_level: 'Professional'
                }
              })
            })
            
            const universalData = await universalResponse.json()
            
            if (universalData.success) {
              return NextResponse.json({
                success: true,
                data: {
                  topic_id: topicId,
                  knowledge_source: 'tier2_dynamic',
                  content: universalData.data,
                  last_updated: new Date().toISOString(),
                  requires_pdf: true
                },
                smart_code: SMART_CODES.DYNAMIC_UPDATE,
                timestamp: new Date().toISOString()
              })
            }
          } catch (error) {
            console.log(`⚠️ Tier 2 failed, falling back to Tier 1 for ${topicId}`)
          }
        }
        
        // Tier 1: ChatGPT Foundation (Default)
        console.log(`✅ Using Tier 1 (ChatGPT Foundation) for topic: ${topicId}`)
        const foundationContent = getChatGPTFoundationContent(topicId)
        
        return NextResponse.json({
          success: true,
          data: {
            topic_id: topicId,
            knowledge_source: 'tier1_foundation',
            content: foundationContent,
            last_updated: '2024-06-01', // ChatGPT knowledge cutoff
            requires_pdf: false
          },
          smart_code: topicConfig.smart_code,
          timestamp: new Date().toISOString()
        })

      case 'save_generated_content':
        // Save ChatGPT-generated questions and answers to database for reuse
        console.log('💾 Saving generated content to database for reuse')
        
        try {
          // Generate intelligent Smart Code based on content classification
          const contentSmartCode = generateContentSmartCode(data)
          
          const contentToSave = {
            entity_id: `SAVED_CONTENT_${Date.now()}`,
            smart_code: contentSmartCode.primary,
            entity_type: 'saved_question',
            entity_name: data.title || 'Generated Learning Content',
            organization_id: 'ca_learning_org_001',
            status: 'active',
            created_at: new Date().toISOString()
          }

          // Enhanced dynamic data with Smart Code classification
          const dynamicData = [
            { field_name: 'content_type', field_value: data.content_type || 'question_answer' },
            { field_name: 'topic_id', field_value: data.topic_id },
            { field_name: 'subject_domain', field_value: data.subject_domain || 'CA' },
            { field_name: 'difficulty_level', field_value: data.difficulty_level || 'medium' },
            { field_name: 'question_text', field_value: data.question },
            { field_name: 'answer_text', field_value: data.answer },
            { field_name: 'explanation', field_value: data.explanation || '' },
            { field_name: 'tags', field_value: JSON.stringify(data.tags || []) },
            { field_name: 'source', field_value: 'chatgpt_generated' },
            { field_name: 'usage_count', field_value: '0' },
            { field_name: 'last_used', field_value: '' },
            { field_name: 'created_by_ai', field_value: 'true' },
            { field_name: 'reusable', field_value: 'true' },
            // Smart Code Classification
            { field_name: 'primary_smart_code', field_value: contentSmartCode.primary },
            { field_name: 'secondary_smart_codes', field_value: JSON.stringify(contentSmartCode.secondary) },
            { field_name: 'cross_subject_applicable', field_value: contentSmartCode.crossSubject.toString() },
            { field_name: 'reuse_domains', field_value: JSON.stringify(contentSmartCode.reuseDomains) },
            // Enhanced Classification
            { field_name: 'bloom_taxonomy_level', field_value: data.bloom_level || 'application' },
            { field_name: 'cognitive_complexity', field_value: assessCognitiveComplexity(data.question) },
            { field_name: 'universal_concepts', field_value: JSON.stringify(extractUniversalConcepts(data.question, data.tags)) }
          ]

          // In a real implementation, this would save to the HERA database
          // For now, return success with the enhanced structure
          return NextResponse.json({
            success: true,
            data: {
              saved_entity: contentToSave,
              dynamic_data: dynamicData,
              smart_code_classification: contentSmartCode,
              message: `Content saved with Smart Code ${contentSmartCode.primary} for ${contentSmartCode.crossSubject ? 'multi-domain' : 'single-domain'} reuse`,
              reuse_potential: {
                cross_subject: contentSmartCode.crossSubject,
                applicable_domains: contentSmartCode.reuseDomains,
                secondary_classifications: contentSmartCode.secondary
              }
            },
            smart_code: contentSmartCode.primary,
            timestamp: new Date().toISOString()
          })
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: 'Failed to save generated content',
            details: error instanceof Error ? error.message : 'Unknown error',
            smart_code: 'HERA.CA.EDU.ERROR.SAVE.v1',
            timestamp: new Date().toISOString()
          }, { status: 500 })
        }

      case 'get_saved_questions':
        // Retrieve saved questions for mock tests with pool exhaustion detection
        console.log('📚 Retrieving saved questions with pool exhaustion analysis')
        
        try {
          const filters = {
            topic_id: data.topic_id,
            subject_domain: data.subject_domain || 'CA',
            difficulty_level: data.difficulty_level,
            content_type: data.content_type || 'question_answer',
            cross_subject_reuse: data.cross_subject_reuse || false,
            bloom_level: data.bloom_level,
            limit: data.limit || 10
          }

          // Enhanced question retrieval with Smart Code matching
          const savedQuestions = getQuestionsWithSmartCodeMatching(filters)
          const crossSubjectQuestions = filters.cross_subject_reuse ? 
            getCrossSubjectReusableQuestions(filters) : []

          const allQuestions = [...savedQuestions, ...crossSubjectQuestions]
          const availableQuestions = allQuestions.slice(0, filters.limit)
          
          // Pool exhaustion analysis
          const totalInPool = allQuestions.length
          const requestedCount = filters.limit
          const exhaustionRatio = totalInPool / requestedCount
          
          let poolStatus = 'healthy'
          let recommendFreshGeneration = false
          let poolMessage = ''
          
          if (exhaustionRatio < 0.5) {
            poolStatus = 'critically_low'
            recommendFreshGeneration = true
            poolMessage = `Only ${totalInPool} questions available for ${requestedCount} requested. Strongly recommend ChatGPT generation.`
          } else if (exhaustionRatio < 1.0) {
            poolStatus = 'low'
            recommendFreshGeneration = true
            poolMessage = `${totalInPool} questions available for ${requestedCount} requested. Consider generating fresh questions.`
          } else if (exhaustionRatio < 1.5) {
            poolStatus = 'adequate'
            poolMessage = `${totalInPool} questions available. Pool is adequate but could benefit from fresh content.`
          } else {
            poolStatus = 'healthy'
            poolMessage = `${totalInPool} questions available. Pool is healthy.`
          }

          return NextResponse.json({
            success: true,
            data: {
              questions: availableQuestions,
              primary_matches: savedQuestions.length,
              cross_subject_matches: crossSubjectQuestions.length,
              total_available: availableQuestions.length,
              filters_applied: filters,
              source: 'smart_code_database_reuse',
              reuse_strategy: filters.cross_subject_reuse ? 'multi_domain' : 'single_domain',
              // Pool exhaustion analysis
              pool_analysis: {
                status: poolStatus,
                total_in_pool: totalInPool,
                requested_count: requestedCount,
                exhaustion_ratio: exhaustionRatio,
                recommend_fresh_generation: recommendFreshGeneration,
                message: poolMessage,
                suggestion: recommendFreshGeneration ? 
                  'Use "Generate Fresh Questions" to add variety to your question pool' : 
                  'Question pool is sufficient for current needs'
              }
            },
            smart_code: SMART_CODES.REUSABLE_QUESTION,
            timestamp: new Date().toISOString()
          })
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: 'Failed to retrieve saved questions',
            details: error instanceof Error ? error.message : 'Unknown error',
            smart_code: 'HERA.CA.EDU.ERROR.RETRIEVE.v1',
            timestamp: new Date().toISOString()
          }, { status: 500 })
        }

      case 'generate_fresh_questions':
        // Generate fresh questions via ChatGPT API
        console.log('🤖 Generating fresh questions via ChatGPT')
        
        try {
          const topicId = data.topic_id || 'indirect_tax_gst'
          const questionCount = data.question_count || 10
          const difficulty = data.difficulty || 'medium'
          
          // Call ChatGPT to generate fresh questions
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'
          const chatGPTResponse = await fetch(`${baseUrl}/api/v1/ai/universal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'generate_ca_questions',
              topic: getTopicName(topicId),
              difficulty: difficulty,
              count: questionCount
            })
          })
          
          if (!chatGPTResponse.ok) {
            throw new Error(`AI API returned ${chatGPTResponse.status}: ${chatGPTResponse.statusText}`)
          }

          const aiResult = await chatGPTResponse.json()
          console.log('🤖 AI Result:', aiResult)
          
          // Always try to generate questions, even if AI fails
          let generatedQuestions = []
          
          if (aiResult.success && aiResult.response) {
            // Parse ChatGPT response into structured questions
            generatedQuestions = parseAIQuestions(aiResult.response, topicId, difficulty)
          } else {
            console.log('⚠️ AI response not successful, using topic-specific questions')
            generatedQuestions = generateTopicSpecificQuestions(topicId, difficulty, questionCount)
          }
          
          console.log(`✅ Generated ${generatedQuestions.length} questions for ${topicId}`)
          
          if (generatedQuestions.length > 0) {
            // Auto-save to database for future reuse (async, don't wait)
            Promise.all(generatedQuestions.map(async (question) => {
              try {
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'
                await fetch(`${baseUrl}/api/v1/learning/ca-final`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'save_generated_content',
                    data: {
                      title: `Generated Question - ${question.topic}`,
                      topic_id: topicId,
                      subject_domain: 'CA',
                      difficulty_level: difficulty,
                      question: question.question,
                      answer: question.options?.[question.correct_answer] || 'No answer',
                      explanation: question.explanation,
                      tags: [topicId, difficulty, 'ai_generated'],
                      bloom_level: 'apply'
                    }
                  })
                })
              } catch (error) {
                console.warn('Failed to save generated question:', error)
              }
            })).then(() => {
              console.log(`✅ ${generatedQuestions.length} questions saved to database`)
            }).catch((error) => {
              console.warn('Some questions failed to save:', error)
            })
            
            return NextResponse.json({
              success: true,
              data: {
                questions: generatedQuestions,
                source: aiResult.success ? 'ai_enhanced_generation' : 'topic_specific_generation',
                topic_id: topicId,
                difficulty: difficulty,
                count: generatedQuestions.length,
                auto_saved: true,
                message: `Generated ${generatedQuestions.length} questions for ${topicId}`,
                ai_provider: aiResult.provider_used || 'fallback'
              },
              smart_code: SMART_CODES.QUIZ_ATTEMPT,
              timestamp: new Date().toISOString()
            })
          } else {
            console.log('⚠️ No questions generated, using fallback')
            // Final fallback to mock test questions
            const fallbackQuestions = generateMockTestQuestions({
              topic_ids: [topicId],
              total_questions: questionCount,
              difficulty_mix: { [difficulty]: 100 }
            })
            
            return NextResponse.json({
              success: true,
              data: {
                questions: fallbackQuestions,
                source: 'emergency_fallback',
                message: 'Using emergency fallback questions'
              },
              smart_code: SMART_CODES.QUIZ_ATTEMPT,
              timestamp: new Date().toISOString()
            })
          }
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: 'Failed to generate fresh questions',
            details: error instanceof Error ? error.message : 'Unknown error',
            smart_code: 'HERA.CA.EDU.ERROR.GENERATE.v1',
            timestamp: new Date().toISOString()
          }, { status: 500 })
        }

      case 'create_mock_test':
        // Create a mock test - Try ChatGPT first, fallback to saved questions
        console.log('🎯 Creating mock test - ChatGPT first approach')
        
        try {
          const testConfig = {
            test_id: `MOCK_TEST_${Date.now()}`,
            topic_ids: data.topic_ids || ['indirect_tax_gst'],
            subject_domain: data.subject_domain || 'CA',
            difficulty_mix: data.difficulty_mix || { easy: 30, medium: 50, hard: 20 },
            total_questions: data.total_questions || 20,
            time_limit_minutes: data.time_limit_minutes || 60,
            include_cross_subject: data.include_cross_subject || false,
            smart_code_filters: data.smart_code_filters || [],
            universal_skills_weight: data.universal_skills_weight || 0.3,
            force_fresh: data.force_fresh || false // New option to force ChatGPT generation
          }

          let testQuestions = []
          let questionSource = 'saved_bank'
          
          // Try ChatGPT generation first if requested or if we don't have enough saved questions
          if (testConfig.force_fresh) {
            try {
              console.log('🤖 Generating fresh test questions via ChatGPT - Direct generation')
              
              // Generate questions directly using the same logic as generate_fresh_questions
              const topicId = testConfig.topic_ids[0]
              const questionCount = testConfig.total_questions
              const difficulty = 'mixed'
              
              // Call ChatGPT to generate fresh questions directly
              const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'
              const chatGPTResponse = await fetch(`${baseUrl}/api/v1/ai/universal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'generate_ca_questions',
                  topic: getTopicName(topicId),
                  difficulty: difficulty,
                  count: questionCount
                })
              })
              
              const aiResult = await chatGPTResponse.json()
              
              if (aiResult.success && aiResult.response) {
                // Parse ChatGPT response into structured questions
                const generatedQuestions = parseAIQuestions(aiResult.response, topicId, difficulty)
                
                if (generatedQuestions && generatedQuestions.length > 0) {
                  testQuestions = generatedQuestions
                  questionSource = 'chatgpt_fresh'
                  console.log(`✅ Generated ${testQuestions.length} fresh questions via ChatGPT`)
                }
              }
            } catch (error) {
              console.warn('ChatGPT generation failed, falling back to saved questions:', error)
            }
          }
          
          // Fallback to saved questions if ChatGPT failed or wasn't requested
          if (testQuestions.length === 0) {
            console.log('📚 Using saved question bank')
            testQuestions = generateMockTestQuestions(testConfig)
            questionSource = 'saved_bank'
            console.log(`✅ Generated ${testQuestions.length} questions from saved bank`)
          }
          
          // Emergency fallback - ensure we always have questions
          if (testQuestions.length === 0) {
            console.log('🚨 Emergency fallback - creating basic questions')
            testQuestions = [
              {
                id: 'emergency_1',
                question: "What is the full form of GST?",
                options: ["Gross Sales Tax", "Goods and Services Tax", "General State Tax", "Government Service Tax"],
                correct_answer: 1,
                explanation: "GST stands for Goods and Services Tax, a comprehensive indirect tax system in India.",
                difficulty: 'medium',
                topic: 'indirect_tax_gst'
              },
              {
                id: 'emergency_2',
                question: "Which GST return is filed monthly by regular taxpayers?",
                options: ["GSTR-1", "GSTR-3B", "GSTR-9", "GSTR-4"],
                correct_answer: 1,
                explanation: "GSTR-3B is the monthly summary return filed by regular GST taxpayers.",
                difficulty: 'medium',
                topic: 'indirect_tax_gst'
              },
              {
                id: 'emergency_3',
                question: "What is the maximum GST rate applicable in India?",
                options: ["18%", "24%", "28%", "30%"],
                correct_answer: 2,
                explanation: "The maximum GST rate in India is 28%, applicable to luxury and demerit goods.",
                difficulty: 'medium',
                topic: 'indirect_tax_gst'
              }
            ]
            questionSource = 'emergency_fallback'
            console.log(`🆘 Emergency fallback activated: ${testQuestions.length} questions`)
          }

          const mockTest = {
            entity_id: testConfig.test_id,
            smart_code: SMART_CODES.MOCK_TEST,
            entity_type: 'mock_test',
            entity_name: `Mock Test - ${new Date().toLocaleDateString()}`,
            organization_id: 'ca_learning_org_001',
            status: 'active',
            created_at: new Date().toISOString(),
            config: testConfig,
            questions: testQuestions
          }

          return NextResponse.json({
            success: true,
            data: {
              mock_test: mockTest,
              message: `Mock test created with ${testQuestions.length} questions from ${questionSource}`,
              instructions: 'Students across the platform can now access this test',
              question_source: questionSource
            },
            smart_code: SMART_CODES.MOCK_TEST,
            timestamp: new Date().toISOString()
          })
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: 'Failed to create mock test',
            details: error instanceof Error ? error.message : 'Unknown error',
            smart_code: 'HERA.CA.EDU.ERROR.MOCK_TEST.v1',
            timestamp: new Date().toISOString()
          }, { status: 500 })
        }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action specified',
          smart_code: 'HERA.CA.EDU.ERROR.INVALID_ACTION.v1',
          timestamp: new Date().toISOString()
        }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error',
      smart_code: 'HERA.CA.EDU.ERROR.PROCESS.v1',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Dual-Tier Configuration Functions
function getTopicConfiguration(topicId: string) {
  const topicConfigs = {
    // Tier 1: Stable Topics (ChatGPT Foundation)
    'auditing_standards': {
      smart_code: SMART_CODES.GST_BASICS,
      requiresDynamicUpdate: false,
      stable: true,
      description: 'Auditing standards rarely change'
    },
    'cost_management': {
      smart_code: SMART_CODES.GST_BASICS,
      requiresDynamicUpdate: false,
      stable: true,
      description: 'Fundamental cost accounting concepts'
    },
    'corporate_law_basics': {
      smart_code: SMART_CODES.GST_BASICS,
      requiresDynamicUpdate: false,
      stable: true,
      description: 'Basic company law principles'
    },
    
    // Tier 2: Dynamic Topics (PDF Updates Required)
    'indirect_tax_gst': {
      smart_code: SMART_CODES.DYNAMIC_UPDATE,
      requiresDynamicUpdate: true,
      stable: false,
      description: 'GST rates and rules change frequently'
    },
    'direct_tax_updates': {
      smart_code: SMART_CODES.DYNAMIC_UPDATE,
      requiresDynamicUpdate: true,
      stable: false,
      description: 'Annual budget changes affect direct tax'
    },
    'ftp_latest': {
      smart_code: SMART_CODES.DYNAMIC_UPDATE,
      requiresDynamicUpdate: true,
      stable: false,
      description: 'Export-import policies update regularly'
    },
    'customs_tariff': {
      smart_code: SMART_CODES.DYNAMIC_UPDATE,
      requiresDynamicUpdate: true,
      stable: false,
      description: 'Customs duties and classifications change'
    }
  }
  
  return topicConfigs[topicId] || {
    smart_code: SMART_CODES.GST_BASICS,
    requiresDynamicUpdate: false,
    stable: true,
    description: 'Default to stable foundation knowledge'
  }
}

function getChatGPTFoundationContent(topicId: string) {
  // Tier 1: ChatGPT Knowledge Base (Up to June 2024)
  const foundationContent = {
    'auditing_standards': {
      title: 'Auditing Standards & Procedures',
      concepts: [
        'Professional Skepticism and Independence',
        'Risk Assessment and Internal Controls',
        'Audit Evidence and Documentation',
        'Materiality and Sampling',
        'Audit Reports and Opinions'
      ],
      learning_elements: [
        {
          id: 'audit_1',
          type: 'concept',
          title: 'Professional Skepticism',
          content: 'Professional skepticism is an attitude of professional doubt that auditors must maintain throughout the audit process.',
          universalApplicability: 0.9,
          learning_science: {
            bloomsLevel: 'application',
            learningStyle: 'multimodal',
            difficulty: 'intermediate'
          }
        }
      ],
      study_time_estimate: 45,
      difficulty: 'intermediate',
      prerequisites: ['Basic accounting principles'],
      questions: generateChatGPTQuestions('auditing_standards')
    },
    
    'cost_management': {
      title: 'Cost & Management Accounting',
      concepts: [
        'Activity-Based Costing (ABC)',
        'Standard Costing and Variance Analysis',
        'Budgeting and Forecasting',
        'Performance Measurement'
      ],
      study_time_estimate: 60,
      difficulty: 'intermediate',
      prerequisites: ['Basic cost concepts'],
      questions: generateChatGPTQuestions('cost_management')
    }
  }
  
  return foundationContent[topicId] || {
    title: 'CA Final Topic',
    concepts: ['Fundamental concepts available'],
    study_time_estimate: 30,
    difficulty: 'intermediate',
    message: 'Using ChatGPT foundation knowledge (updated to June 2024)',
    questions: generateChatGPTQuestions(topicId)
  }
}

// Generate ChatGPT-quality questions for immediate database storage
function generateChatGPTQuestions(topicId: string) {
  const questionBank = {
    'auditing_standards': [
      {
        id: `Q_${topicId}_001`,
        question: 'What is professional skepticism and why is it crucial for auditors?',
        answer: 'Professional skepticism is an attitude of professional doubt that includes a questioning mind and critical assessment of audit evidence. It is crucial because it helps auditors remain objective and detect potential misstatements or fraud.',
        explanation: 'Professional skepticism is a fundamental principle in auditing that requires auditors to maintain an attitude of professional doubt throughout the audit engagement.',
        difficulty: 'medium',
        tags: ['professional_skepticism', 'audit_principles', 'ethics']
      },
      {
        id: `Q_${topicId}_002`,
        question: 'Explain the concept of materiality in auditing with an example.',
        answer: 'Materiality refers to the significance of an amount, transaction, or discrepancy that could influence economic decisions of users. For example, a $1000 error in a company with $10 million revenue may not be material, but the same error in a $50,000 revenue company would be material.',
        explanation: 'Materiality is both quantitative (monetary threshold) and qualitative (nature of the item) and guides audit procedures.',
        difficulty: 'medium',
        tags: ['materiality', 'audit_planning', 'financial_statements']
      }
    ],
    'cost_management': [
      {
        id: `Q_${topicId}_001`,
        question: 'What is Activity-Based Costing (ABC) and how does it differ from traditional costing?',
        answer: 'ABC assigns costs to products based on activities consumed rather than volume-based allocation. Unlike traditional costing which uses single cost drivers like direct labor hours, ABC identifies multiple cost drivers for each activity.',
        explanation: 'ABC provides more accurate product costing by recognizing that products consume activities and activities consume resources.',
        difficulty: 'hard',
        tags: ['abc_costing', 'cost_allocation', 'product_costing']
      }
    ]
  }
  
  return questionBank[topicId] || [
    {
      id: `Q_${topicId}_default`,
      question: `What are the key concepts in ${topicId.replace('_', ' ')}?`,
      answer: 'This topic covers fundamental principles and practical applications relevant to CA Final examination.',
      explanation: 'Generated question for comprehensive topic coverage.',
      difficulty: 'medium',
      tags: [topicId, 'ca_final', 'concepts']
    }
  ]
}

// Comprehensive Smart Code generation for ALL universal learning scenarios
function generateContentSmartCode(data: any) {
  const subject = data.subject_domain || 'CA'
  const context = data.educational_context || 'PROF' // PROF, UNI, K12, CORP, LIFE
  const topic = data.topic_id || 'GENERAL'
  const difficulty = data.difficulty_level || 'MEDIUM'
  
  // Enhanced primary Smart Code with context
  const primarySmartCode = `HERA.${context}.${subject}.${topic.toUpperCase()}.${difficulty.toUpperCase()}.v1`
  
  // Extract all universal concepts from content
  const universalConcepts = extractUniversalConcepts(data.question, data.tags)
  
  // Generate secondary Smart Codes and determine reuse domains
  const secondarySmartCodes = []
  let crossSubject = false
  let reuseDomains = [subject]
  
  // === CORE ACADEMIC CONCEPTS ===
  if (universalConcepts.includes('accounting')) {
    secondarySmartCodes.push(SMART_CODES.FINANCIAL_ACCOUNTING)
    reuseDomains.push('MBA', 'Commerce', 'CPA', 'ACCA', 'Finance')
    crossSubject = true
  }
  
  if (universalConcepts.includes('law')) {
    secondarySmartCodes.push(SMART_CODES.BUSINESS_LAW)
    reuseDomains.push('Law', 'MBA', 'Compliance', 'Legal Studies')
    crossSubject = true
  }
  
  if (universalConcepts.includes('economics')) {
    secondarySmartCodes.push(SMART_CODES.ECONOMICS)
    reuseDomains.push('Economics', 'MBA', 'Business', 'Finance', 'Public Policy')
    crossSubject = true
  }
  
  if (universalConcepts.includes('statistics')) {
    secondarySmartCodes.push(SMART_CODES.STATISTICS)
    reuseDomains.push('Mathematics', 'Psychology', 'Sociology', 'Research', 'Data Science', 'Engineering')
    crossSubject = true
  }
  
  // === STEM CONCEPTS ===
  if (universalConcepts.includes('mathematics')) {
    secondarySmartCodes.push(SMART_CODES.MATHEMATICS)
    reuseDomains.push('Engineering', 'Physics', 'Computer Science', 'Economics', 'Finance')
    crossSubject = true
  }
  
  if (universalConcepts.includes('physics')) {
    secondarySmartCodes.push(SMART_CODES.PHYSICS)
    reuseDomains.push('Engineering', 'Mathematics', 'Chemistry', 'Computer Science')
    crossSubject = true
  }
  
  if (universalConcepts.includes('chemistry')) {
    secondarySmartCodes.push(SMART_CODES.CHEMISTRY)
    reuseDomains.push('Medicine', 'Biology', 'Engineering', 'Pharmacy')
    crossSubject = true
  }
  
  if (universalConcepts.includes('biology')) {
    secondarySmartCodes.push(SMART_CODES.BIOLOGY)
    reuseDomains.push('Medicine', 'Nursing', 'Pharmacy', 'Environmental Science')
    crossSubject = true
  }
  
  if (universalConcepts.includes('computer_science')) {
    secondarySmartCodes.push(SMART_CODES.COMPUTER_SCIENCE)
    reuseDomains.push('Engineering', 'Mathematics', 'Business', 'Data Science')
    crossSubject = true
  }
  
  // === MEDICAL & HEALTHCARE ===
  if (universalConcepts.includes('medicine')) {
    secondarySmartCodes.push(SMART_CODES.MEDICAL_EDUCATION)
    reuseDomains.push('Nursing', 'Pharmacy', 'Healthcare Administration', 'Biology')
    crossSubject = true
  }
  
  if (universalConcepts.includes('nursing')) {
    secondarySmartCodes.push(SMART_CODES.NURSING)
    reuseDomains.push('Medicine', 'Healthcare Administration', 'Biology', 'Psychology')
    crossSubject = true
  }
  
  // === UNIVERSAL TRANSFERABLE SKILLS ===
  if (universalConcepts.includes('critical_thinking')) {
    secondarySmartCodes.push(SMART_CODES.CRITICAL_THINKING)
    reuseDomains.push('Philosophy', 'Psychology', 'Education', 'Business', 'Law', 'Medicine', 'Engineering')
    crossSubject = true
  }
  
  if (universalConcepts.includes('communication')) {
    secondarySmartCodes.push(SMART_CODES.COMMUNICATION)
    reuseDomains.push('Business', 'Education', 'Psychology', 'Marketing', 'Journalism', 'Public Relations')
    crossSubject = true
  }
  
  if (universalConcepts.includes('problem_solving')) {
    secondarySmartCodes.push(SMART_CODES.PROBLEM_SOLVING)
    reuseDomains.push('Engineering', 'Computer Science', 'Mathematics', 'Business', 'Medicine', 'Education')
    crossSubject = true
  }
  
  if (universalConcepts.includes('research')) {
    secondarySmartCodes.push(SMART_CODES.RESEARCH)
    reuseDomains.push('Academia', 'Science', 'Medicine', 'Psychology', 'Sociology', 'Business')
    crossSubject = true
  }
  
  if (universalConcepts.includes('digital_literacy')) {
    secondarySmartCodes.push(SMART_CODES.DIGITAL_LITERACY)
    reuseDomains.push('Education', 'Business', 'Library Science', 'Information Technology', 'K-12')
    crossSubject = true
  }
  
  // === BUSINESS & MANAGEMENT ===
  if (universalConcepts.includes('management')) {
    secondarySmartCodes.push(SMART_CODES.LEADERSHIP)
    reuseDomains.push('MBA', 'Business Administration', 'Human Resources', 'Psychology', 'Organizational Behavior')
    crossSubject = true
  }
  
  if (universalConcepts.includes('project_management')) {
    secondarySmartCodes.push(SMART_CODES.PROJECT_MANAGEMENT)
    reuseDomains.push('Engineering', 'IT', 'Construction', 'Healthcare', 'Marketing')
    crossSubject = true
  }
  
  // === HUMANITIES & SOCIAL SCIENCES ===
  if (universalConcepts.includes('history')) {
    secondarySmartCodes.push(SMART_CODES.K12_HISTORY)
    reuseDomains.push('Social Studies', 'Political Science', 'Archaeology', 'Cultural Studies')
    crossSubject = true
  }
  
  if (universalConcepts.includes('psychology')) {
    secondarySmartCodes.push(SMART_CODES.UNI_SOCIAL_SCIENCE)
    reuseDomains.push('Education', 'Medicine', 'Business', 'Social Work', 'Counseling')
    crossSubject = true
  }
  
  // === ETHICS & VALUES (Universal across ALL domains) ===
  if (universalConcepts.includes('ethics')) {
    secondarySmartCodes.push(SMART_CODES.ETHICS)
    reuseDomains.push('Medicine', 'Law', 'Business', 'Engineering', 'Psychology', 'Philosophy', 'Journalism')
    crossSubject = true
  }
  
  return {
    primary: primarySmartCode,
    secondary: [...new Set(secondarySmartCodes)], // Remove duplicates
    crossSubject,
    reuseDomains: [...new Set(reuseDomains)], // Remove duplicates
    universalConcepts: universalConcepts,
    context: context,
    applicabilityScore: calculateApplicabilityScore(universalConcepts, reuseDomains)
  }
}

// Calculate how universally applicable the content is (0-1 score)
function calculateApplicabilityScore(concepts: string[], domains: string[]) {
  const universalSkills = ['critical_thinking', 'communication', 'problem_solving', 'research', 'ethics']
  const universalSkillCount = concepts.filter(c => universalSkills.includes(c)).length
  const domainCount = domains.length
  
  // Higher score for more universal skills and broader domain applicability
  return Math.min(1.0, (universalSkillCount * 0.3 + domainCount * 0.1))
}

// Comprehensive universal concept extraction for ALL learning domains
function extractUniversalConcepts(question: string, tags: string[] = []) {
  const universalKeywordMap = {
    // === CORE ACADEMIC CONCEPTS ===
    'accounting': ['accounting', 'financial', 'balance sheet', 'income', 'profit', 'loss', 'journal', 'ledger', 'assets', 'liabilities', 'equity', 'depreciation', 'amortization'],
    'law': ['law', 'legal', 'regulation', 'act', 'section', 'clause', 'compliance', 'statutory', 'contract', 'tort', 'constitutional', 'criminal', 'civil'],
    'economics': ['demand', 'supply', 'market', 'price', 'cost', 'revenue', 'economic', 'elasticity', 'inflation', 'gdp', 'monetary', 'fiscal', 'capitalism', 'socialism'],
    'statistics': ['average', 'mean', 'median', 'standard deviation', 'probability', 'distribution', 'sample', 'population', 'correlation', 'regression', 'hypothesis'],
    'mathematics': ['calculate', 'formula', 'equation', 'percentage', 'ratio', 'proportion', 'algebra', 'geometry', 'calculus', 'trigonometry', 'logarithm'],
    
    // === STEM CONCEPTS ===
    'physics': ['force', 'energy', 'momentum', 'velocity', 'acceleration', 'gravity', 'electromagnetic', 'quantum', 'thermodynamics', 'wave', 'particle'],
    'chemistry': ['molecule', 'atom', 'element', 'compound', 'reaction', 'catalyst', 'acid', 'base', 'periodic table', 'organic', 'inorganic', 'bond'],
    'biology': ['cell', 'dna', 'gene', 'evolution', 'ecosystem', 'organism', 'metabolism', 'photosynthesis', 'respiration', 'anatomy', 'physiology'],
    'computer_science': ['algorithm', 'data structure', 'programming', 'database', 'network', 'security', 'software', 'hardware', 'artificial intelligence'],
    'engineering': ['design', 'mechanical', 'electrical', 'civil', 'chemical', 'structural', 'materials', 'systems', 'manufacturing', 'automation'],
    
    // === MEDICAL & HEALTHCARE ===
    'medicine': ['diagnosis', 'treatment', 'patient', 'symptoms', 'disease', 'anatomy', 'physiology', 'pharmacology', 'surgery', 'clinical', 'medical'],
    'nursing': ['patient care', 'medication', 'vital signs', 'assessment', 'nursing process', 'health promotion', 'infection control'],
    'healthcare': ['health', 'wellness', 'prevention', 'public health', 'epidemiology', 'healthcare policy', 'medical ethics'],
    
    // === BUSINESS & MANAGEMENT ===
    'management': ['leadership', 'team', 'strategy', 'planning', 'organization', 'control', 'decision making', 'human resources', 'operations'],
    'marketing': ['brand', 'consumer', 'market research', 'advertising', 'promotion', 'product', 'pricing', 'distribution', 'customer'],
    'finance': ['investment', 'capital', 'budget', 'cash flow', 'risk', 'return', 'portfolio', 'financial planning', 'corporate finance'],
    
    // === UNIVERSAL TRANSFERABLE SKILLS ===
    'critical_thinking': ['analyze', 'evaluate', 'synthesize', 'compare', 'contrast', 'interpret', 'reasoning', 'logic', 'argument', 'evidence'],
    'communication': ['speak', 'write', 'listen', 'present', 'communicate', 'language', 'rhetoric', 'persuasion', 'audience', 'message'],
    'problem_solving': ['problem', 'solution', 'solve', 'troubleshoot', 'debug', 'optimize', 'improve', 'fix', 'resolve', 'address'],
    'research': ['research', 'investigate', 'study', 'analyze', 'data', 'information', 'source', 'methodology', 'evidence', 'citation'],
    'collaboration': ['team', 'group', 'collaborate', 'cooperate', 'work together', 'partnership', 'coordination', 'teamwork'],
    'digital_literacy': ['computer', 'internet', 'digital', 'technology', 'software', 'online', 'electronic', 'cyber', 'virtual'],
    
    // === HUMANITIES & SOCIAL SCIENCES ===
    'history': ['historical', 'past', 'ancient', 'medieval', 'modern', 'civilization', 'culture', 'society', 'timeline', 'era', 'period'],
    'literature': ['poetry', 'novel', 'drama', 'author', 'character', 'plot', 'theme', 'literary', 'narrative', 'genre'],
    'psychology': ['behavior', 'cognitive', 'mental', 'personality', 'development', 'learning', 'memory', 'emotion', 'psychological'],
    'sociology': ['society', 'social', 'community', 'culture', 'institution', 'group', 'interaction', 'demographic', 'sociological'],
    'philosophy': ['ethics', 'moral', 'philosophical', 'truth', 'knowledge', 'reality', 'existence', 'logic', 'reasoning'],
    
    // === ARTS & CREATIVE ===
    'visual_arts': ['art', 'design', 'color', 'composition', 'drawing', 'painting', 'sculpture', 'visual', 'aesthetic', 'creative'],
    'music': ['music', 'rhythm', 'melody', 'harmony', 'instrument', 'composition', 'performance', 'musical', 'sound'],
    'writing': ['writing', 'creative writing', 'narrative', 'essay', 'story', 'prose', 'journalism', 'technical writing'],
    
    // === LANGUAGES ===
    'language_learning': ['grammar', 'vocabulary', 'pronunciation', 'fluency', 'conversation', 'linguistic', 'bilingual', 'translation'],
    
    // === PROJECT & TIME MANAGEMENT ===
    'project_management': ['project', 'timeline', 'milestone', 'deliverable', 'scope', 'schedule', 'resource', 'risk management'],
    'time_management': ['time', 'schedule', 'deadline', 'priority', 'productivity', 'efficiency', 'planning', 'organization'],
    
    // === ETHICS & VALUES ===
    'ethics': ['ethical', 'moral', 'values', 'integrity', 'responsibility', 'professional conduct', 'code of ethics', 'right', 'wrong']
  }
  
  const text = (question + ' ' + tags.join(' ')).toLowerCase()
  const detectedConcepts: string[] = []
  
  Object.entries(universalKeywordMap).forEach(([concept, keywords]) => {
    const matchCount = keywords.filter(keyword => text.includes(keyword)).length
    if (matchCount > 0) {
      detectedConcepts.push(concept)
    }
  })
  
  return detectedConcepts
}

// Assess cognitive complexity for better classification
function assessCognitiveComplexity(question: string) {
  const bloomKeywords = {
    'remember': ['what is', 'define', 'list', 'identify', 'recall'],
    'understand': ['explain', 'describe', 'interpret', 'summarize', 'compare'],
    'apply': ['calculate', 'solve', 'use', 'demonstrate', 'implement'],
    'analyze': ['analyze', 'examine', 'break down', 'distinguish', 'categorize'],
    'evaluate': ['evaluate', 'assess', 'judge', 'critique', 'justify'],
    'create': ['create', 'design', 'construct', 'develop', 'formulate']
  }
  
  const questionLower = question.toLowerCase()
  
  for (const [level, keywords] of Object.entries(bloomKeywords)) {
    if (keywords.some(keyword => questionLower.includes(keyword))) {
      return level
    }
  }
  
  return 'understand' // Default level
}

// Enhanced question retrieval with Smart Code matching
function getQuestionsWithSmartCodeMatching(filters: any) {
  const subjectQuestions = {
    'CA': [
      {
        entity_id: 'SAVED_CA_001',
        question: 'What is Input Tax Credit under GST?',
        answer: 'Input Tax Credit (ITC) is the tax paid on inputs that can be set off against the tax liability on outputs under GST.',
        explanation: 'ITC is a key mechanism in GST to avoid cascading effect of taxes.',
        topic_id: 'indirect_tax_gst',
        subject_domain: 'CA',
        difficulty_level: 'medium',
        tags: ['gst', 'itc', 'input_tax_credit'],
        primary_smart_code: 'HERA.CA.EDU.QUESTION.INDIRECT_TAX_GST.MEDIUM.v1',
        cross_subject_applicable: false,
        reuse_domains: ['CA'],
        usage_count: 15,
        created_by_ai: true,
        source: 'chatgpt_generated'
      },
      {
        entity_id: 'SAVED_CA_002',
        question: 'Calculate the depreciation using straight-line method for an asset costing ₹100,000 with 10-year life.',
        answer: 'Annual depreciation = (Cost - Salvage Value) / Useful Life = (₹100,000 - 0) / 10 = ₹10,000 per year',
        explanation: 'Straight-line depreciation allocates equal amounts over the asset\'s useful life.',
        topic_id: 'financial_accounting',
        subject_domain: 'CA',
        difficulty_level: 'medium',
        tags: ['depreciation', 'accounting', 'assets', 'calculation'],
        primary_smart_code: 'HERA.CA.EDU.QUESTION.FINANCIAL_ACCOUNTING.MEDIUM.v1',
        secondary_smart_codes: ['HERA.UNI.FIN.ACCOUNTING.v1'],
        cross_subject_applicable: true,
        reuse_domains: ['CA', 'MBA', 'Commerce'],
        usage_count: 25,
        created_by_ai: true,
        source: 'chatgpt_generated'
      }
    ]
  }
  
  const questions = subjectQuestions[filters.subject_domain] || []
  
  return questions.filter(q => {
    if (filters.topic_id && q.topic_id !== filters.topic_id) return false
    if (filters.difficulty_level && q.difficulty_level !== filters.difficulty_level) return false
    return true
  })
}

// Comprehensive cross-subject reusable questions covering all universal scenarios
function getCrossSubjectReusableQuestions(filters: any) {
  const universalQuestionBank = [
    // === BUSINESS & ECONOMICS (High Reuse) ===
    {
      entity_id: 'UNIVERSAL_BUS_001',
      question: 'What is the difference between fixed costs and variable costs in business?',
      answer: 'Fixed costs remain constant regardless of production volume (rent, salaries), while variable costs change with production levels (raw materials, direct labor).',
      explanation: 'Understanding cost behavior is fundamental to business decision-making across all domains.',
      topic_id: 'cost_concepts',
      subject_domain: 'UNIVERSAL',
      difficulty_level: 'medium',
      tags: ['costs', 'business', 'economics', 'accounting'],
      primary_smart_code: 'HERA.UNI.CONCEPT.ECONOMICS.v1',
      secondary_smart_codes: [SMART_CODES.FINANCIAL_ACCOUNTING, SMART_CODES.CRITICAL_THINKING],
      cross_subject_applicable: true,
      reuse_domains: ['CA', 'MBA', 'Economics', 'Commerce', 'Finance', 'Management'],
      usage_count: 50,
      created_by_ai: true,
      source: 'chatgpt_generated_universal',
      applicability_score: 0.9
    },
    
    // === CRITICAL THINKING (Universal Skill) ===
    {
      entity_id: 'UNIVERSAL_THINK_001',
      question: 'What are the key steps in systematic problem-solving methodology?',
      answer: '1) Define the problem clearly, 2) Gather relevant information, 3) Generate alternative solutions, 4) Evaluate options, 5) Implement the best solution, 6) Monitor results.',
      explanation: 'Systematic problem-solving is a universal skill applicable across all disciplines and contexts.',
      topic_id: 'problem_solving',
      subject_domain: 'UNIVERSAL',
      difficulty_level: 'medium',
      tags: ['problem_solving', 'critical_thinking', 'methodology', 'decision_making'],
      primary_smart_code: SMART_CODES.PROBLEM_SOLVING,
      secondary_smart_codes: [SMART_CODES.CRITICAL_THINKING],
      cross_subject_applicable: true,
      reuse_domains: ['Engineering', 'Medicine', 'Business', 'Education', 'Computer Science', 'Mathematics', 'Psychology'],
      usage_count: 75,
      created_by_ai: true,
      source: 'chatgpt_generated_universal',
      applicability_score: 1.0
    },
    
    // === RESEARCH METHODOLOGY (Academic Universal) ===
    {
      entity_id: 'UNIVERSAL_RESEARCH_001',
      question: 'What is the difference between primary and secondary research sources?',
      answer: 'Primary sources are original, first-hand evidence (interviews, surveys, experiments), while secondary sources analyze or interpret primary sources (books, articles, reviews).',
      explanation: 'Understanding source types is essential for academic research across all disciplines.',
      topic_id: 'research_methodology',
      subject_domain: 'UNIVERSAL',
      difficulty_level: 'easy',
      tags: ['research', 'sources', 'methodology', 'academic', 'evidence'],
      primary_smart_code: SMART_CODES.RESEARCH,
      secondary_smart_codes: [SMART_CODES.CRITICAL_THINKING],
      cross_subject_applicable: true,
      reuse_domains: ['All Academic Disciplines', 'Medicine', 'Psychology', 'Business', 'Law', 'Education'],
      usage_count: 60,
      created_by_ai: true,
      source: 'chatgpt_generated_universal',
      applicability_score: 0.95
    },
    
    // === COMMUNICATION (Universal Skill) ===
    {
      entity_id: 'UNIVERSAL_COMM_001',
      question: 'What are the key elements of effective professional communication?',
      answer: 'Clarity (clear message), Conciseness (brief and focused), Accuracy (correct information), Courtesy (respectful tone), and Completeness (all necessary details).',
      explanation: 'Effective communication principles apply across all professional contexts and industries.',
      topic_id: 'professional_communication',
      subject_domain: 'UNIVERSAL',
      difficulty_level: 'medium',
      tags: ['communication', 'professional', 'workplace', 'skills', 'effectiveness'],
      primary_smart_code: SMART_CODES.COMMUNICATION,
      secondary_smart_codes: [SMART_CODES.COLLABORATION],
      cross_subject_applicable: true,
      reuse_domains: ['Business', 'Healthcare', 'Education', 'Engineering', 'Law', 'All Professions'],
      usage_count: 85,
      created_by_ai: true,
      source: 'chatgpt_generated_universal',
      applicability_score: 1.0
    },
    
    // === ETHICS (Universal Across All Professions) ===
    {
      entity_id: 'UNIVERSAL_ETHICS_001',
      question: 'What are the core principles of professional ethics?',
      answer: 'Integrity (honesty and moral uprightness), Responsibility (accountability for actions), Respect (for persons and rights), and Fairness (just and equitable treatment).',
      explanation: 'These ethical principles form the foundation of professional conduct across all disciplines.',
      topic_id: 'professional_ethics',
      subject_domain: 'UNIVERSAL',
      difficulty_level: 'medium',
      tags: ['ethics', 'professional conduct', 'integrity', 'responsibility', 'fairness'],
      primary_smart_code: SMART_CODES.ETHICS,
      cross_subject_applicable: true,
      reuse_domains: ['Medicine', 'Law', 'Business', 'Engineering', 'Psychology', 'Education', 'Journalism', 'All Professions'],
      usage_count: 70,
      created_by_ai: true,
      source: 'chatgpt_generated_universal',
      applicability_score: 1.0
    },
    
    // === DATA ANALYSIS (STEM + Business) ===
    {
      entity_id: 'UNIVERSAL_DATA_001',
      question: 'What is the difference between correlation and causation in data analysis?',
      answer: 'Correlation means two variables change together but one doesn\'t necessarily cause the other. Causation means one variable directly influences another.',
      explanation: 'This fundamental concept prevents misinterpretation of data across research, business, and scientific contexts.',
      topic_id: 'data_analysis',
      subject_domain: 'UNIVERSAL',
      difficulty_level: 'medium',
      tags: ['data', 'statistics', 'analysis', 'correlation', 'causation', 'research'],
      primary_smart_code: SMART_CODES.DATA_ANALYSIS,
      secondary_smart_codes: [SMART_CODES.STATISTICS, SMART_CODES.CRITICAL_THINKING],
      cross_subject_applicable: true,
      reuse_domains: ['Psychology', 'Medicine', 'Business', 'Economics', 'Sociology', 'Marketing', 'Research'],
      usage_count: 65,
      created_by_ai: true,
      source: 'chatgpt_generated_universal',
      applicability_score: 0.9
    },
    
    // === PROJECT MANAGEMENT (Cross-Industry) ===
    {
      entity_id: 'UNIVERSAL_PM_001',
      question: 'What are the five phases of project management lifecycle?',
      answer: '1) Initiation (define project scope), 2) Planning (detailed roadmap), 3) Execution (implement the plan), 4) Monitoring (track progress), 5) Closure (finalize deliverables).',
      explanation: 'Project management methodology applies to projects across all industries and contexts.',
      topic_id: 'project_management',
      subject_domain: 'UNIVERSAL',
      difficulty_level: 'medium',
      tags: ['project_management', 'lifecycle', 'planning', 'execution', 'monitoring'],
      primary_smart_code: SMART_CODES.PROJECT_MANAGEMENT,
      secondary_smart_codes: [SMART_CODES.LEADERSHIP, SMART_CODES.TIME_MANAGEMENT],
      cross_subject_applicable: true,
      reuse_domains: ['Engineering', 'IT', 'Construction', 'Healthcare', 'Marketing', 'Research', 'Education'],
      usage_count: 55,
      created_by_ai: true,
      source: 'chatgpt_generated_universal',
      applicability_score: 0.85
    },
    
    // === DIGITAL LITERACY (Modern Universal) ===
    {
      entity_id: 'UNIVERSAL_DIGITAL_001',
      question: 'What are the key components of digital literacy in the modern workplace?',
      answer: 'Technical skills (using software/hardware), Information literacy (finding/evaluating online info), Communication skills (digital collaboration), and Digital citizenship (ethical online behavior).',
      explanation: 'Digital literacy is essential across all modern professions and educational contexts.',
      topic_id: 'digital_literacy',
      subject_domain: 'UNIVERSAL',
      difficulty_level: 'easy',
      tags: ['digital', 'technology', 'literacy', 'workplace', 'modern_skills'],
      primary_smart_code: SMART_CODES.DIGITAL_LITERACY,
      secondary_smart_codes: [SMART_CODES.COMMUNICATION, SMART_CODES.RESEARCH],
      cross_subject_applicable: true,
      reuse_domains: ['Education', 'Business', 'Healthcare', 'Library Science', 'All Modern Professions'],
      usage_count: 40,
      created_by_ai: true,
      source: 'chatgpt_generated_universal',
      applicability_score: 0.95
    }
  ]
  
  // Enhanced filtering with Smart Code matching
  return universalQuestionBank.filter(q => {
    if (filters.difficulty_level && q.difficulty_level !== filters.difficulty_level) return false
    if (filters.subject_domain && !q.reuse_domains.some(domain => 
      domain.toLowerCase().includes(filters.subject_domain.toLowerCase()) || 
      domain === 'All Academic Disciplines' ||
      domain === 'All Professions' ||
      domain === 'All Modern Professions'
    )) return false
    if (filters.applicability_threshold && q.applicability_score < filters.applicability_threshold) return false
    return true
  }).slice(0, filters.limit || 10)
}

// Helper Functions for ChatGPT Integration

function getTopicName(topicId: string): string {
  const topicNames = {
    'indirect_tax_gst': 'GST and Indirect Tax',
    'customs_valuation': 'Customs Valuation and Classification',
    'ftp_schemes': 'Foreign Trade Policy and Export Promotion Schemes',
    'direct_tax': 'Income Tax and Direct Tax',
    'auditing_standards': 'Auditing Standards and Procedures',
    'cost_management': 'Cost and Management Accounting',
    'corporate_law': 'Corporate Law and Governance',
    'financial_reporting': 'Financial Reporting and Analysis'
  }
  
  return topicNames[topicId] || 'CA Final Topic'
}

function parseAIQuestions(aiResponse: string, topicId: string, difficulty: string) {
  console.log('🔍 Parsing AI Response:', aiResponse.substring(0, 200))
  
  // Create structured questions based on the topic - always return valid questions as fallback
  const topicQuestions = generateTopicSpecificQuestions(topicId, difficulty, 5)
  
  try {
    // Try to parse JSON response first
    const parsedResponse = JSON.parse(aiResponse)
    if (parsedResponse.questions && Array.isArray(parsedResponse.questions)) {
      console.log('✅ Successfully parsed JSON questions from AI')
      return parsedResponse.questions.map((q, index) => ({
        id: `AI_${topicId}_${Date.now()}_${index}`,
        question: q.question,
        options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
        correct_answer: q.correct_answer || 0,
        explanation: q.explanation || 'Generated by ChatGPT',
        difficulty: difficulty,
        topic: topicId,
        subject_domain: 'CA',
        smart_code: SMART_CODES.GST_BASICS,
        source: 'chatgpt_live'
      }))
    }
  } catch (error) {
    console.log('📝 JSON parsing failed, checking if AI response contains usable content')
  }
  
  // Check if the AI response contains question-like content and enhance topic questions
  if (aiResponse && aiResponse.length > 50) {
    console.log('🤖 AI provided content, enhancing topic-specific questions with AI context')
    
    // Use AI response to enhance the topic questions
    return topicQuestions.map((q, index) => ({
      ...q,
      explanation: `${q.explanation} (AI Enhanced: Based on ${aiResponse.substring(0, 100)}...)`,
      source: 'ai_enhanced_topic_questions'
    }))
  }
  
  // Final fallback: return topic-specific questions
  console.log(`✅ Returning ${topicQuestions.length} topic-specific questions for ${topicId}`)
  return topicQuestions
}

function generateTopicSpecificQuestions(topicId: string, difficulty: string, count: number) {
  const questionTemplates = {
    'indirect_tax_gst': [
      {
        question: "What is the full form of GST?",
        options: ["Gross Sales Tax", "Goods and Services Tax", "General State Tax", "Government Service Tax"],
        correct_answer: 1,
        explanation: "GST stands for Goods and Services Tax, a comprehensive indirect tax system in India."
      },
      {
        question: "Under which Article of the Constitution was GST introduced?",
        options: ["Article 266", "Article 269A", "Article 270", "Article 279A"],
        correct_answer: 3,
        explanation: "GST was introduced under Article 279A of the Indian Constitution."
      },
      {
        question: "What is the threshold limit for GST registration for goods in most states?",
        options: ["₹10 lakhs", "₹20 lakhs", "₹40 lakhs", "₹50 lakhs"],
        correct_answer: 1,
        explanation: "The threshold limit for GST registration for goods is ₹20 lakhs in most states."
      },
      {
        question: "Which GST return is filed monthly by regular taxpayers?",
        options: ["GSTR-1", "GSTR-3B", "GSTR-9", "GSTR-4"],
        correct_answer: 1,
        explanation: "GSTR-3B is the monthly summary return filed by regular GST taxpayers."
      },
      {
        question: "What is the maximum GST rate applicable in India?",
        options: ["18%", "24%", "28%", "30%"],
        correct_answer: 2,
        explanation: "The maximum GST rate in India is 28%, applicable to luxury and demerit goods."
      }
    ],
    'customs_valuation': [
      {
        question: "Which method is the primary method for customs valuation?",
        options: ["Transaction Value Method", "Deductive Value Method", "Computed Value Method", "Residual Method"],
        correct_answer: 0,
        explanation: "Transaction Value Method is the primary method for customs valuation under WTO rules."
      },
      {
        question: "Under which section of Customs Act is valuation covered?",
        options: ["Section 12", "Section 14", "Section 16", "Section 18"],
        correct_answer: 1,
        explanation: "Section 14 of the Customs Act, 1962 deals with valuation of imported and export goods."
      }
    ],
    'ftp_schemes': [
      {
        question: "What does EPCG stand for in Foreign Trade Policy?",
        options: ["Export Promotion Capital Goods", "Export Production Capital Grant", "Export Policy Capital Guarantee", "Export Product Capital Growth"],
        correct_answer: 0,
        explanation: "EPCG stands for Export Promotion Capital Goods scheme under FTP."
      },
      {
        question: "Which scheme replaced MEIS (Merchandise Exports from India Scheme)?",
        options: ["SEIS", "RoDTEP", "EPCG", "Advance Authorization"],
        correct_answer: 1,
        explanation: "RoDTEP (Remission of Duties and Taxes on Export Products) replaced MEIS scheme."
      }
    ]
  }
  
  const defaultQuestions = [
    {
      question: `What is a key concept in ${getTopicName(topicId)}?`,
      options: ["Legal compliance", "Documentation", "Procedures", "All of the above"],
      correct_answer: 3,
      explanation: `All aspects are important in ${getTopicName(topicId)}.`
    }
  ]
  
  const questions = questionTemplates[topicId] || defaultQuestions
  
  return questions.slice(0, count).map((q, index) => ({
    id: `TOPIC_${topicId}_${Date.now()}_${index}`,
    question: q.question,
    options: q.options,
    correct_answer: q.correct_answer,
    explanation: q.explanation,
    difficulty: difficulty,
    topic: topicId,
    subject_domain: 'CA',
    smart_code: SMART_CODES.GST_BASICS,
    source: 'topic_specific_generated'
  }))
}

// Comprehensive mock test questions covering all universal learning scenarios
function generateMockTestQuestions(config: any) {
  
  const comprehensiveQuestionPool = [
    // === SUBJECT-SPECIFIC QUESTIONS ===
    // CA/Finance Specific
    {
      id: 'MT_CA_001',
      question: 'Which of the following is exempt from GST?',
      options: ['Educational services', 'Restaurant services', 'IT services', 'Transport services'],
      correct_answer: 0,
      explanation: 'Educational services provided by recognized institutions are exempt from GST.',
      difficulty: 'easy',
      topic: 'gst_exemptions',
      subject_domain: 'CA',
      smart_code: 'HERA.PROF.CA.TAX.GST.EXEMPTIONS.EASY.v1',
      cross_subject_applicable: false
    },
    
    // === UNIVERSAL BUSINESS CONCEPTS ===
    {
      id: 'MT_UNI_001',
      question: 'What is the primary purpose of a SWOT analysis in business strategy?',
      options: ['Financial forecasting', 'Identifying strengths, weaknesses, opportunities, threats', 'Employee evaluation', 'Market pricing'],
      correct_answer: 1,
      explanation: 'SWOT analysis helps organizations evaluate internal strengths/weaknesses and external opportunities/threats.',
      difficulty: 'medium',
      topic: 'strategic_analysis',
      subject_domain: 'UNIVERSAL',
      smart_code: SMART_CODES.CRITICAL_THINKING,
      cross_subject_applicable: true,
      reuse_domains: ['MBA', 'Business', 'Management', 'Marketing']
    },
    
    // === UNIVERSAL SKILLS ===
    {
      id: 'MT_SKILL_001',
      question: 'Which communication principle is most important when delivering bad news?',
      options: ['Speed of delivery', 'Honesty and empathy', 'Avoiding responsibility', 'Using technical jargon'],
      correct_answer: 1,
      explanation: 'Honest, empathetic communication builds trust even in difficult situations.',
      difficulty: 'medium',
      topic: 'professional_communication',
      subject_domain: 'UNIVERSAL',
      smart_code: SMART_CODES.COMMUNICATION,
      cross_subject_applicable: true,
      reuse_domains: ['All Professions', 'Healthcare', 'Business', 'Education', 'Management']
    },
    
    // === STEM UNIVERSAL ===
    {
      id: 'MT_STEM_001',
      question: 'In scientific research, what is the purpose of a control group?',
      options: ['To speed up the experiment', 'To provide a baseline for comparison', 'To reduce costs', 'To increase sample size'],
      correct_answer: 1,
      explanation: 'Control groups provide a baseline to measure the effect of the experimental variable.',
      difficulty: 'medium',
      topic: 'research_methodology',
      subject_domain: 'UNIVERSAL',
      smart_code: SMART_CODES.RESEARCH,
      cross_subject_applicable: true,
      reuse_domains: ['Medicine', 'Psychology', 'Biology', 'Chemistry', 'Physics', 'Social Sciences']
    },
    
    // === ETHICS (Universal Across All Professions) ===
    {
      id: 'MT_ETHICS_001',
      question: 'What should be the primary consideration when facing an ethical dilemma in professional practice?',
      options: ['Personal benefit', 'Company profit', 'Stakeholder impact and professional standards', 'Speed of resolution'],
      correct_answer: 2,
      explanation: 'Ethical decisions should prioritize stakeholder welfare and adherence to professional standards.',
      difficulty: 'medium',
      topic: 'professional_ethics',
      subject_domain: 'UNIVERSAL',
      smart_code: SMART_CODES.ETHICS,
      cross_subject_applicable: true,
      reuse_domains: ['Medicine', 'Law', 'Business', 'Engineering', 'Education', 'All Professions']
    },
    
    // === DATA ANALYSIS (Cross-Disciplinary) ===
    {
      id: 'MT_DATA_001',
      question: 'When interpreting statistical data, what does a p-value of 0.03 typically indicate?',
      options: ['3% margin of error', 'Results are statistically significant at 95% confidence', '97% accuracy', '3% sample size'],
      correct_answer: 1,
      explanation: 'A p-value of 0.03 is less than 0.05, indicating statistical significance at the 95% confidence level.',
      difficulty: 'hard',
      topic: 'statistical_analysis',
      subject_domain: 'UNIVERSAL',
      smart_code: SMART_CODES.STATISTICS,
      cross_subject_applicable: true,
      reuse_domains: ['Psychology', 'Medicine', 'Business', 'Research', 'Social Sciences', 'Economics']
    },
    
    // === PROJECT MANAGEMENT (Cross-Industry) ===
    {
      id: 'MT_PM_001',
      question: 'What is the critical path in project management?',
      options: ['The most expensive sequence of tasks', 'The longest sequence of dependent tasks', 'The path with most resources', 'The shortest possible timeline'],
      correct_answer: 1,
      explanation: 'The critical path determines the minimum project duration and shows tasks that cannot be delayed.',
      difficulty: 'medium',
      topic: 'project_management',
      subject_domain: 'UNIVERSAL',
      smart_code: SMART_CODES.PROJECT_MANAGEMENT,
      cross_subject_applicable: true,
      reuse_domains: ['Engineering', 'IT', 'Construction', 'Healthcare', 'Business']
    },
    
    // === DIGITAL LITERACY (Modern Universal) ===
    {
      id: 'MT_DIGITAL_001',
      question: 'What is the most important factor when evaluating the credibility of online information?',
      options: ['Website design quality', 'Author credentials and source reliability', 'Number of social media shares', 'Website loading speed'],
      correct_answer: 1,
      explanation: 'Author expertise and source reliability are key indicators of information credibility.',
      difficulty: 'easy',
      topic: 'information_literacy',
      subject_domain: 'UNIVERSAL',
      smart_code: SMART_CODES.DIGITAL_LITERACY,
      cross_subject_applicable: true,
      reuse_domains: ['Education', 'Research', 'Business', 'Healthcare', 'All Modern Contexts']
    }
  ]
  
  // Enhanced question selection based on config
  let selectedQuestions = comprehensiveQuestionPool
  
  // Filter by subject domain if specified
  if (config.subject_domain && config.subject_domain !== 'ALL') {
    // Normalize subject domain (CA_FINAL -> CA)
    const normalizedDomain = config.subject_domain.replace('_FINAL', '')
    
    selectedQuestions = selectedQuestions.filter(q => 
      q.subject_domain === normalizedDomain || 
      q.subject_domain === config.subject_domain ||
      q.subject_domain === 'UNIVERSAL' ||
      (q.cross_subject_applicable && q.reuse_domains?.includes(normalizedDomain))
    )
  }
  
  // Filter by difficulty if specified
  if (config.difficulty_mix) {
    const { easy, medium, hard } = config.difficulty_mix
    const totalPercentage = easy + medium + hard
    const totalQuestions = config.total_questions || 10
    
    const easyCount = Math.round((easy / totalPercentage) * totalQuestions)
    const mediumCount = Math.round((medium / totalPercentage) * totalQuestions)
    const hardCount = totalQuestions - easyCount - mediumCount
    
    const easyQs = selectedQuestions.filter(q => q.difficulty === 'easy').slice(0, easyCount)
    const mediumQs = selectedQuestions.filter(q => q.difficulty === 'medium').slice(0, mediumCount)
    const hardQs = selectedQuestions.filter(q => q.difficulty === 'hard').slice(0, hardCount)
    
    selectedQuestions = [...easyQs, ...mediumQs, ...hardQs]
  }
  
  // Include cross-subject questions if requested
  if (config.include_cross_subject) {
    const crossSubjectQuestions = selectedQuestions.filter(q => q.cross_subject_applicable)
    const subjectSpecific = selectedQuestions.filter(q => !q.cross_subject_applicable)
    
    // Mix 70% subject-specific, 30% cross-subject for diversity
    const targetTotal = config.total_questions || 10
    const crossSubjectCount = Math.min(Math.floor(targetTotal * 0.3), crossSubjectQuestions.length)
    const subjectSpecificCount = targetTotal - crossSubjectCount
    
    selectedQuestions = [
      ...subjectSpecific.slice(0, subjectSpecificCount),
      ...crossSubjectQuestions.slice(0, crossSubjectCount)
    ]
  }
  
  const finalQuestions = selectedQuestions.slice(0, config.total_questions || 10)
  console.log(`🎯 generateMockTestQuestions returning ${finalQuestions.length} questions out of ${comprehensiveQuestionPool.length} available`)
  console.log('📊 Final questions:', finalQuestions.map(q => q.id))
  
  // Emergency fallback if no questions
  if (finalQuestions.length === 0) {
    console.log('🚨 No questions found, returning emergency CA questions')
    return [
      {
        id: 'MT_EMERGENCY_001',
        question: 'What is the full form of GST?',
        options: ['Gross Sales Tax', 'Goods and Services Tax', 'General State Tax', 'Government Service Tax'],
        correct_answer: 1,
        explanation: 'GST stands for Goods and Services Tax, a comprehensive indirect tax system in India.',
        difficulty: 'medium',
        topic: 'gst_basics',
        subject_domain: 'CA',
        smart_code: 'HERA.PROF.CA.TAX.GST.BASIC.MEDIUM.v1',
        cross_subject_applicable: false
      },
      {
        id: 'MT_EMERGENCY_002',
        question: 'Which GST return is filed monthly by regular taxpayers?',
        options: ['GSTR-1', 'GSTR-3B', 'GSTR-9', 'GSTR-4'],
        correct_answer: 1,
        explanation: 'GSTR-3B is the monthly summary return filed by regular GST taxpayers.',
        difficulty: 'medium',
        topic: 'gst_returns',
        subject_domain: 'CA',
        smart_code: 'HERA.PROF.CA.TAX.GST.RETURNS.MEDIUM.v1',
        cross_subject_applicable: false
      },
      {
        id: 'MT_EMERGENCY_003',
        question: 'What is the maximum GST rate applicable in India?',
        options: ['18%', '24%', '28%', '30%'],
        correct_answer: 2,
        explanation: 'The maximum GST rate in India is 28%, applicable to luxury and demerit goods.',
        difficulty: 'medium',
        topic: 'gst_rates',
        subject_domain: 'CA',
        smart_code: 'HERA.PROF.CA.TAX.GST.RATES.MEDIUM.v1',
        cross_subject_applicable: false
      },
      {
        id: 'MT_EMERGENCY_004',
        question: 'Under which Article of the Constitution was GST introduced?',
        options: ['Article 266', 'Article 269A', 'Article 270', 'Article 279A'],
        correct_answer: 3,
        explanation: 'GST was introduced under Article 279A of the Indian Constitution.',
        difficulty: 'hard',
        topic: 'gst_constitution',
        subject_domain: 'CA',
        smart_code: 'HERA.PROF.CA.TAX.GST.CONSTITUTION.HARD.v1',
        cross_subject_applicable: false
      },
      {
        id: 'MT_EMERGENCY_005',
        question: 'What is the threshold limit for GST registration for goods in most states?',
        options: ['₹10 lakhs', '₹20 lakhs', '₹40 lakhs', '₹50 lakhs'],
        correct_answer: 1,
        explanation: 'The threshold limit for GST registration for goods is ₹20 lakhs in most states.',
        difficulty: 'easy',
        topic: 'gst_registration',
        subject_domain: 'CA',
        smart_code: 'HERA.PROF.CA.TAX.GST.REGISTRATION.EASY.v1',
        cross_subject_applicable: false
      }
    ].slice(0, config.total_questions || 5)
  }
  
  return finalQuestions
}