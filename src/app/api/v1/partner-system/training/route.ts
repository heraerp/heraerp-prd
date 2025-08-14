'use server'

import { NextRequest, NextResponse } from 'next/server'
import { getHeraAPI } from '@/lib/hera-api'

/**
 * HERA Partner Training & Certification API
 * Smart Code: HERA.PAR.TRN.ENT.TRAINING.v1
 * 
 * META BREAKTHROUGH: Training modules as entities, progress as dynamic data
 * Certifications tracked via universal transactions - proving HERA's flexibility
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const partnerId = searchParams.get('partner_id')
    const moduleId = searchParams.get('module_id')
    const includeProgress = searchParams.get('include_progress') === 'true'
    const certificationStatus = searchParams.get('certification_status')
    
    const heraApi = getHeraAPI()
    
    if (moduleId) {
      // Get specific training module
      const module = await heraApi.getEntity(moduleId)
      
      if (!module || module.entity_type !== 'training_module') {
        return NextResponse.json(
          { error: 'Training module not found' },
          { status: 404 }
        )
      }
      
      // Get module content and assessments
      const moduleContent = await heraApi.getDynamicData(moduleId, [
        'content_outline',
        'video_urls',
        'documentation_links',
        'assessment_questions',
        'completion_criteria',
        'estimated_duration'
      ])
      
      return NextResponse.json({
        success: true,
        data: {
          ...module,
          content: moduleContent,
          type: 'training_module'
        },
        smart_code: 'HERA.PAR.TRN.ENT.TRAINING.v1'
      })
    }
    
    // Get all training modules
    const trainingModules = await heraApi.getEntities('training_module', {
      organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945',
      status: 'active',
      order_by: 'metadata->sequence_order ASC'
    })
    
    let partnerProgress = {}
    if (partnerId && includeProgress) {
      // Get partner's training progress
      const progressData = await heraApi.getDynamicData(partnerId, [
        'training_progress',
        'completed_modules',
        'current_module',
        'certification_progress',
        'assessment_scores'
      ])
      
      partnerProgress = {
        completed_modules: JSON.parse(progressData.completed_modules || '[]'),
        current_module: progressData.current_module || null,
        overall_progress: parseFloat(progressData.training_progress || '0'),
        certification_progress: parseFloat(progressData.certification_progress || '0'),
        assessment_scores: JSON.parse(progressData.assessment_scores || '{}')
      }
    }
    
    // Get certifications if requested
    let certifications = []
    if (certificationStatus) {
      const certificationEntities = await heraApi.getEntities('certification', {
        organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945',
        ...(certificationStatus !== 'all' && { 
          'metadata->status': certificationStatus 
        })
      })
      
      certifications = certificationEntities.map(cert => ({
        id: cert.id,
        name: cert.entity_name,
        description: cert.metadata?.description,
        requirements: cert.metadata?.requirements || [],
        badge_url: cert.metadata?.badge_url,
        status: cert.metadata?.status || 'available',
        difficulty: cert.metadata?.difficulty || 'intermediate',
        estimated_hours: cert.metadata?.estimated_hours || 8
      }))
    }
    
    // Structure training path
    const trainingPath = trainingModules.map(module => ({
      id: module.id,
      name: module.entity_name,
      description: module.metadata?.description,
      category: module.metadata?.category || 'general',
      difficulty: module.metadata?.difficulty || 'beginner',
      sequence_order: module.metadata?.sequence_order || 1,
      estimated_duration: module.metadata?.estimated_duration || '30 minutes',
      prerequisites: module.metadata?.prerequisites || [],
      learning_objectives: module.metadata?.learning_objectives || [],
      is_required: module.metadata?.is_required || false,
      ...(partnerId && {
        completion_status: partnerProgress.completed_modules?.includes(module.id) ? 'completed' : 
                          partnerProgress.current_module === module.id ? 'in_progress' : 'not_started',
        assessment_score: partnerProgress.assessment_scores?.[module.id] || null
      })
    }))
    
    return NextResponse.json({
      success: true,
      data: {
        training_path: trainingPath,
        certifications: certifications,
        ...(partnerId && { partner_progress: partnerProgress }),
        training_statistics: {
          total_modules: trainingModules.length,
          required_modules: trainingModules.filter(m => m.metadata?.is_required).length,
          optional_modules: trainingModules.filter(m => !m.metadata?.is_required).length,
          total_estimated_hours: trainingModules.reduce((sum, m) => {
            const hours = parseFloat(m.metadata?.estimated_duration?.replace(' hours', '') || '0.5')
            return sum + hours
          }, 0)
        }
      },
      smart_code: 'HERA.PAR.TRN.ENT.TRAINING.v1',
      meta_breakthrough: 'Training system managed by HERA universal architecture'
    })

  } catch (error) {
    console.error('Training API error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve training data', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      partner_id, 
      action, 
      module_id, 
      assessment_data,
      certification_id 
    } = body
    
    if (!partner_id || !action) {
      return NextResponse.json(
        { error: 'partner_id and action are required' },
        { status: 400 }
      )
    }
    
    const heraApi = getHeraAPI()
    
    switch (action) {
      case 'start_module':
        return await startTrainingModule(partner_id, module_id, heraApi)
      
      case 'complete_module':
        return await completeTrainingModule(partner_id, module_id, assessment_data, heraApi)
      
      case 'submit_assessment':
        return await submitAssessment(partner_id, module_id, assessment_data, heraApi)
      
      case 'request_certification':
        return await requestCertification(partner_id, certification_id, heraApi)
      
      case 'update_progress':
        return await updateTrainingProgress(partner_id, body.progress_data, heraApi)
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Training action error:', error)
    return NextResponse.json(
      { error: 'Failed to process training action', details: error.message },
      { status: 500 }
    )
  }
}

// Helper functions
async function startTrainingModule(partnerId: string, moduleId: string, heraApi: any) {
  // Update partner's current module
  await heraApi.setDynamicData(partnerId, {
    current_module: moduleId,
    [`module_${moduleId}_started`]: new Date().toISOString()
  })
  
  // Create training activity transaction
  await heraApi.createTransaction({
    organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945',
    transaction_type: 'partner_training',
    transaction_subtype: 'module_started',
    entity_id: partnerId,
    transaction_data: {
      module_id: moduleId,
      started_at: new Date().toISOString(),
      progress_tracking: true
    },
    smart_code: 'HERA.PAR.TRN.TXN.START.v1'
  })
  
  return NextResponse.json({
    success: true,
    message: 'Training module started',
    data: {
      current_module: moduleId,
      started_at: new Date().toISOString()
    }
  })
}

async function completeTrainingModule(partnerId: string, moduleId: string, assessmentData: any, heraApi: any) {
  // Get current progress
  const progressData = await heraApi.getDynamicData(partnerId, [
    'completed_modules',
    'training_progress',
    'assessment_scores'
  ])
  
  const completedModules = JSON.parse(progressData.completed_modules || '[]')
  const assessmentScores = JSON.parse(progressData.assessment_scores || '{}')
  
  // Add to completed modules
  if (!completedModules.includes(moduleId)) {
    completedModules.push(moduleId)
  }
  
  // Store assessment score if provided
  if (assessmentData?.score) {
    assessmentScores[moduleId] = {
      score: assessmentData.score,
      passed: assessmentData.score >= (assessmentData.passing_score || 80),
      completed_at: new Date().toISOString(),
      attempts: (assessmentScores[moduleId]?.attempts || 0) + 1
    }
  }
  
  // Calculate overall progress
  const totalModules = await heraApi.getEntities('training_module', {
    entity_type: 'training_module',
    status: 'active'
  })
  
  const progressPercentage = (completedModules.length / totalModules.length) * 100
  
  // Update partner progress
  await heraApi.setDynamicData(partnerId, {
    completed_modules: JSON.stringify(completedModules),
    assessment_scores: JSON.stringify(assessmentScores),
    training_progress: progressPercentage.toString(),
    current_module: null, // Clear current module
    [`module_${moduleId}_completed`]: new Date().toISOString()
  })
  
  // Create completion transaction
  await heraApi.createTransaction({
    organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945',
    transaction_type: 'partner_training',
    transaction_subtype: 'module_completed',
    entity_id: partnerId,
    transaction_data: {
      module_id: moduleId,
      completed_at: new Date().toISOString(),
      assessment_score: assessmentData?.score || null,
      assessment_passed: assessmentData?.score >= (assessmentData?.passing_score || 80),
      overall_progress: progressPercentage
    },
    smart_code: 'HERA.PAR.TRN.TXN.COMPLETE.v1'
  })
  
  // Check for automatic certifications
  const eligibleCertifications = await checkCertificationEligibility(partnerId, completedModules, heraApi)
  
  return NextResponse.json({
    success: true,
    message: 'Training module completed',
    data: {
      module_completed: moduleId,
      overall_progress: progressPercentage,
      total_completed: completedModules.length,
      assessment_score: assessmentData?.score || null,
      eligible_certifications: eligibleCertifications
    }
  })
}

async function submitAssessment(partnerId: string, moduleId: string, assessmentData: any, heraApi: any) {
  const { answers, time_taken } = assessmentData
  
  // Get module assessment questions
  const moduleData = await heraApi.getDynamicData(moduleId, ['assessment_questions'])
  const questions = JSON.parse(moduleData.assessment_questions || '[]')
  
  // Calculate score
  let correctAnswers = 0
  const results = questions.map((question: any, index: number) => {
    const userAnswer = answers[index]
    const isCorrect = userAnswer === question.correct_answer
    if (isCorrect) correctAnswers++
    
    return {
      question_id: question.id,
      user_answer: userAnswer,
      correct_answer: question.correct_answer,
      is_correct: isCorrect
    }
  })
  
  const score = Math.round((correctAnswers / questions.length) * 100)
  const passed = score >= (questions[0]?.passing_score || 80)
  
  // Store assessment result
  await heraApi.createTransaction({
    organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945',
    transaction_type: 'partner_assessment',
    transaction_subtype: passed ? 'passed' : 'failed',
    entity_id: partnerId,
    transaction_data: {
      module_id: moduleId,
      score: score,
      passing_score: questions[0]?.passing_score || 80,
      time_taken_minutes: time_taken,
      total_questions: questions.length,
      correct_answers: correctAnswers,
      assessment_results: results,
      submitted_at: new Date().toISOString()
    },
    smart_code: 'HERA.PAR.ASS.TXN.SUBMIT.v1'
  })
  
  return NextResponse.json({
    success: true,
    data: {
      score: score,
      passed: passed,
      correct_answers: correctAnswers,
      total_questions: questions.length,
      time_taken: time_taken,
      can_retake: !passed,
      next_step: passed ? 'module_completion' : 'review_and_retake'
    }
  })
}

async function requestCertification(partnerId: string, certificationId: string, heraApi: any) {
  // Get certification requirements
  const certification = await heraApi.getEntity(certificationId)
  const requirements = certification.metadata?.requirements || []
  
  // Check if partner meets requirements
  const partnerData = await heraApi.getDynamicData(partnerId, [
    'completed_modules',
    'assessment_scores',
    'training_progress'
  ])
  
  const completedModules = JSON.parse(partnerData.completed_modules || '[]')
  const assessmentScores = JSON.parse(partnerData.assessment_scores || '{}')
  
  const requirementsMet = requirements.every((req: any) => {
    switch (req.type) {
      case 'module_completion':
        return completedModules.includes(req.module_id)
      case 'minimum_score':
        return assessmentScores[req.module_id]?.score >= req.score
      case 'overall_progress':
        return parseFloat(partnerData.training_progress || '0') >= req.percentage
      default:
        return false
    }
  })
  
  if (!requirementsMet) {
    return NextResponse.json({
      success: false,
      error: 'Certification requirements not met',
      data: {
        requirements: requirements,
        current_progress: {
          completed_modules: completedModules,
          assessment_scores: assessmentScores,
          overall_progress: partnerData.training_progress
        }
      }
    }, { status: 400 })
  }
  
  // Create certification request
  await heraApi.createTransaction({
    organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945',
    transaction_type: 'partner_certification',
    transaction_subtype: 'requested',
    entity_id: partnerId,
    transaction_data: {
      certification_id: certificationId,
      certification_name: certification.entity_name,
      requested_at: new Date().toISOString(),
      requirements_met: requirements,
      auto_approve: certification.metadata?.auto_approve || false
    },
    smart_code: 'HERA.PAR.CRT.TXN.REQUEST.v1'
  })
  
  // Auto-approve if configured
  if (certification.metadata?.auto_approve) {
    await approveCertification(partnerId, certificationId, heraApi)
  }
  
  return NextResponse.json({
    success: true,
    message: 'Certification requested successfully',
    data: {
      certification_id: certificationId,
      status: certification.metadata?.auto_approve ? 'approved' : 'pending_review',
      estimated_processing: certification.metadata?.auto_approve ? 'immediate' : '24-48 hours'
    }
  })
}

async function updateTrainingProgress(partnerId: string, progressData: any, heraApi: any) {
  const allowedFields = [
    'learning_preferences',
    'schedule_preference',
    'notification_settings',
    'training_goals'
  ]
  
  const updateData: any = {}
  for (const field of allowedFields) {
    if (progressData[field] !== undefined) {
      updateData[field] = typeof progressData[field] === 'object' 
        ? JSON.stringify(progressData[field]) 
        : progressData[field]
    }
  }
  
  await heraApi.setDynamicData(partnerId, updateData)
  
  return NextResponse.json({
    success: true,
    message: 'Training progress updated',
    data: updateData
  })
}

async function checkCertificationEligibility(partnerId: string, completedModules: string[], heraApi: any) {
  const certifications = await heraApi.getEntities('certification', {
    organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945',
    status: 'active'
  })
  
  const eligible = []
  for (const cert of certifications) {
    const requirements = cert.metadata?.requirements || []
    const isEligible = requirements.every((req: any) => {
      if (req.type === 'module_completion') {
        return completedModules.includes(req.module_id)
      }
      return true
    })
    
    if (isEligible) {
      eligible.push({
        id: cert.id,
        name: cert.entity_name,
        description: cert.metadata?.description,
        badge_url: cert.metadata?.badge_url
      })
    }
  }
  
  return eligible
}

async function approveCertification(partnerId: string, certificationId: string, heraApi: any) {
  // Update partner certification status
  const partnerCertifications = await heraApi.getDynamicData(partnerId, ['certifications'])
  const certs = JSON.parse(partnerCertifications.certifications || '[]')
  
  certs.push({
    certification_id: certificationId,
    earned_at: new Date().toISOString(),
    status: 'active',
    expires_at: null // HERA certifications don't expire
  })
  
  await heraApi.setDynamicData(partnerId, {
    certifications: JSON.stringify(certs),
    certification_status: 'certified'
  })
  
  // Create certification earned transaction
  await heraApi.createTransaction({
    organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945',
    transaction_type: 'partner_certification',
    transaction_subtype: 'earned',
    entity_id: partnerId,
    transaction_data: {
      certification_id: certificationId,
      earned_at: new Date().toISOString(),
      achievement_level: 'certified_partner'
    },
    smart_code: 'HERA.PAR.CRT.TXN.EARNED.v1'
  })
}