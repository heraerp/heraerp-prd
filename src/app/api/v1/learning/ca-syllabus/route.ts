/**
 * 🎓 CA Syllabus API - Universal Schema Integration
 *
 * Provides complete CA Foundation, Intermediate, and Final syllabus data
 * integrated with HERA's universal 6-table schema
 */

import { NextRequest, NextResponse } from 'next/server'
import { caSyllabusService } from '@/lib/ca-syllabus/CASyllabusService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'get_complete_syllabus'
    const level = searchParams.get('level') as 'foundation' | 'intermediate' | 'final' | null
    const group = searchParams.get('group')
      ? (parseInt(searchParams.get('group')!) as 1 | 2)
      : undefined
    const searchTerm = searchParams.get('search')

    console.log(`🎓 CA Syllabus API: ${action} for level: ${level}`)

    switch (action) {
      case 'get_complete_syllabus':
        const completeSyllabus = await caSyllabusService.getCompleteCASyllabus()
        return NextResponse.json({
          success: true,
          action: 'complete_syllabus_retrieved',
          data: completeSyllabus,
          smart_code: 'HERA.EDU.CA.SYLLABUS.COMPLETE.v1',
          timestamp: new Date().toISOString()
        })

      case 'get_level':
        if (!level) {
          return NextResponse.json(
            {
              success: false,
              error: 'Level parameter required (foundation/intermediate/final)',
              smart_code: 'HERA.EDU.CA.ERROR.MISSING_LEVEL.v1'
            },
            { status: 400 }
          )
        }

        const levelData = await caSyllabusService.getCALevel(level)
        return NextResponse.json({
          success: true,
          action: 'level_data_retrieved',
          level,
          data: levelData,
          smart_code: `HERA.EDU.CA.${level.toUpperCase()}.SYLLABUS.v1`,
          timestamp: new Date().toISOString()
        })

      case 'get_papers':
        if (!level) {
          return NextResponse.json(
            {
              success: false,
              error: 'Level parameter required for papers',
              smart_code: 'HERA.EDU.CA.ERROR.MISSING_LEVEL.v1'
            },
            { status: 400 }
          )
        }

        const papers = await caSyllabusService.getPapers(level, group)
        return NextResponse.json({
          success: true,
          action: 'papers_retrieved',
          level,
          group: group || 'all',
          count: papers.length,
          data: { papers },
          smart_code: `HERA.EDU.CA.${level.toUpperCase()}.PAPERS.v1`,
          timestamp: new Date().toISOString()
        })

      case 'get_paper8_details':
        const paper8Details = await caSyllabusService.getCAPaper8Details()
        return NextResponse.json({
          success: true,
          action: 'paper8_details_retrieved',
          data: paper8Details,
          smart_code: 'HERA.EDU.CA.FINAL.P8.DETAILS.v1',
          focus: 'Our specialization - Indirect Tax Laws',
          timestamp: new Date().toISOString()
        })

      case 'get_exam_schedule':
        if (!level) {
          return NextResponse.json(
            {
              success: false,
              error: 'Level parameter required for exam schedule',
              smart_code: 'HERA.EDU.CA.ERROR.MISSING_LEVEL.v1'
            },
            { status: 400 }
          )
        }

        const schedule = await caSyllabusService.getExamSchedule(level)
        return NextResponse.json({
          success: true,
          action: 'exam_schedule_retrieved',
          level,
          data: { schedule },
          smart_code: `HERA.EDU.CA.${level.toUpperCase()}.SCHEDULE.v1`,
          timestamp: new Date().toISOString()
        })

      case 'search_topics':
        if (!searchTerm) {
          return NextResponse.json(
            {
              success: false,
              error: 'Search term required for topic search',
              smart_code: 'HERA.EDU.CA.ERROR.MISSING_SEARCH.v1'
            },
            { status: 400 }
          )
        }

        const searchResults = await caSyllabusService.searchTopics(searchTerm, level)
        return NextResponse.json({
          success: true,
          action: 'topics_searched',
          search_term: searchTerm,
          level: level || 'all',
          results_count: searchResults.length,
          data: { results: searchResults },
          smart_code: 'HERA.EDU.CA.SEARCH.TOPICS.v1',
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action: ${action}`,
            available_actions: [
              'get_complete_syllabus',
              'get_level',
              'get_papers',
              'get_paper8_details',
              'get_exam_schedule',
              'search_topics'
            ],
            smart_code: 'HERA.EDU.CA.ERROR.UNKNOWN_ACTION.v1'
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('CA Syllabus API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        smart_code: 'HERA.EDU.CA.ERROR.INTERNAL.v1',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...requestData } = body

    console.log(`🎓 CA Syllabus POST: ${action}`)

    switch (action) {
      case 'get_learning_path':
        const { student_level, target_paper, weak_areas = [] } = requestData

        if (!student_level || !target_paper) {
          return NextResponse.json(
            {
              success: false,
              error: 'student_level and target_paper are required',
              smart_code: 'HERA.EDU.CA.ERROR.MISSING_PARAMS.v1'
            },
            { status: 400 }
          )
        }

        // Generate personalized learning path based on CA syllabus
        const learningPath = await generateLearningPath(student_level, target_paper, weak_areas)

        return NextResponse.json({
          success: true,
          action: 'learning_path_generated',
          data: learningPath,
          smart_code: 'HERA.EDU.CA.LEARNING_PATH.GENERATE.v1',
          timestamp: new Date().toISOString()
        })

      case 'analyze_syllabus_coverage':
        const { completed_topics = [], target_level } = requestData

        if (!target_level) {
          return NextResponse.json(
            {
              success: false,
              error: 'target_level is required',
              smart_code: 'HERA.EDU.CA.ERROR.MISSING_LEVEL.v1'
            },
            { status: 400 }
          )
        }

        const coverage = await analyzeSyllabusCoverage(completed_topics, target_level)

        return NextResponse.json({
          success: true,
          action: 'syllabus_coverage_analyzed',
          data: coverage,
          smart_code: 'HERA.EDU.CA.COVERAGE.ANALYZE.v1',
          timestamp: new Date().toISOString()
        })

      case 'get_study_recommendations':
        const { current_performance, target_exam_date, available_study_hours } = requestData

        const recommendations = await getStudyRecommendations({
          current_performance,
          target_exam_date,
          available_study_hours
        })

        return NextResponse.json({
          success: true,
          action: 'study_recommendations_generated',
          data: recommendations,
          smart_code: 'HERA.EDU.CA.STUDY.RECOMMEND.v1',
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown POST action: ${action}`,
            available_actions: [
              'get_learning_path',
              'analyze_syllabus_coverage',
              'get_study_recommendations'
            ],
            smart_code: 'HERA.EDU.CA.ERROR.UNKNOWN_POST_ACTION.v1'
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('CA Syllabus POST Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        smart_code: 'HERA.EDU.CA.ERROR.INTERNAL_POST.v1',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * Generate personalized learning path
 */
async function generateLearningPath(
  studentLevel: string,
  targetPaper: string,
  weakAreas: string[]
) {
  // Get paper details
  let paperDetails = {}
  if (targetPaper === 'paper8' || targetPaper === 'indirect_tax') {
    paperDetails = await caSyllabusService.getCAPaper8Details()
  }

  return {
    student_level: studentLevel,
    target_paper: targetPaper,
    weak_areas: weakAreas,
    recommended_sequence: [
      'Start with basic concepts',
      'Focus on weak areas identified',
      'Practice calculations and procedures',
      'Complete mock tests',
      'Final revision'
    ],
    paper_details: paperDetails,
    estimated_completion_time: '12-16 weeks',
    priority_topics:
      weakAreas.length > 0 ? weakAreas : ['GST Basics', 'Input Tax Credit', 'Customs Valuation']
  }
}

/**
 * Analyze syllabus coverage
 */
async function analyzeSyllabusCoverage(completedTopics: string[], targetLevel: string) {
  const levelData = await caSyllabusService.getCALevel(targetLevel as any)
  const allPapers = await caSyllabusService.getPapers(targetLevel as any)

  return {
    target_level: targetLevel,
    total_papers: allPapers.length,
    completed_topics: completedTopics.length,
    coverage_percentage: Math.min(100, (completedTopics.length / (allPapers.length * 5)) * 100), // Rough estimate
    remaining_topics: Math.max(0, allPapers.length * 5 - completedTopics.length),
    level_data: levelData,
    recommendation:
      completedTopics.length < 10
        ? 'Focus on completing more topics'
        : 'Good progress, maintain consistency'
  }
}

/**
 * Get study recommendations
 */
async function getStudyRecommendations(params: {
  current_performance?: any
  target_exam_date?: string
  available_study_hours?: number
}) {
  const { current_performance, target_exam_date, available_study_hours = 6 } = params

  const recommendations = {
    daily_schedule: {
      study_hours: available_study_hours,
      theory_time: Math.ceil(available_study_hours * 0.6),
      practice_time: Math.ceil(available_study_hours * 0.4),
      revision_frequency: 'Weekly'
    },
    focus_areas: [
      'Paper 8 - Indirect Tax (60% focus)',
      'Weak areas from current performance',
      'Mock tests and time management'
    ],
    milestones: [
      { week: 4, target: 'Complete basic concepts' },
      { week: 8, target: 'Finish advanced topics' },
      { week: 12, target: 'Complete practice tests' },
      { week: 16, target: 'Final revision complete' }
    ],
    target_exam_date,
    success_probability: current_performance ? 'High' : 'Good with consistent effort'
  }

  return recommendations
}
