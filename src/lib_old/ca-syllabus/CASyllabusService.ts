/**
 * 🎓 CA Syllabus Service - Universal Schema Integration
 *
 * Reads CA Foundation, Intermediate, and Final syllabus data
 * from HERA's universal 6-table schema
 */

export interface CALevel {
  level: 'foundation' | 'intermediate' | 'final'
  entity_id: string
  exam_framework: any
  syllabus_structure: any
  answer_expectations: any
  success_patterns?: any
}

export interface CAPaper {
  paper: string
  code: string
  max_marks: number
  duration_hours: number
  complexity?: string
  sections?: any
  topics?: any
  key_areas?: string[]
}

export interface CAExamSchedule {
  frequency: string
  months: string[]
  attempts_per_year: number
  next_dates: string[]
  registration_deadlines?: string[]
}

export class CASyllabusService {
  private baseUrl: string

  constructor(baseUrl = 'http://localhost:3002') {
    this.baseUrl = baseUrl
  }

  /**
   * Get complete CA syllabus for all levels
   */
  async getCompleteCASyllabus(): Promise<{
    foundation: CALevel
    intermediate: CALevel
    final: CALevel
  }> {
    try {
      const [foundation, intermediate, final] = await Promise.all([
        this.getCALevel('foundation'),
        this.getCALevel('intermediate'),
        this.getCALevel('final')
      ])

      return { foundation, intermediate, final }
    } catch (error) {
      console.error('Error fetching complete CA syllabus:', error)
      throw error
    }
  }

  /**
   * Get specific CA level data
   */
  async getCALevel(level: 'foundation' | 'intermediate' | 'final'): Promise<CALevel> {
    try {
      // Get entity data from universal API
      const entityResponse = await fetch(`${this.baseUrl}/api/v1/entities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get',
          entity_type: 'exam_framework',
          filters: {
            entity_name: `CA ${level.charAt(0).toUpperCase() + level.slice(1)}`
          }
        })
      })

      if (!entityResponse.ok) {
        throw new Error(`Failed to fetch CA ${level} entity`)
      }

      const entityData = await entityResponse.json()

      if (!entityData.success || !entityData.data?.length) {
        // Return mock data if not found in database
        return this.getMockCALevel(level)
      }

      const entity = entityData.data[0]

      // Get dynamic data for this entity
      const dynamicResponse = await fetch(`${this.baseUrl}/api/v1/entities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_dynamic_data',
          entity_id: entity.entity_id
        })
      })

      let dynamicData = {}
      if (dynamicResponse.ok) {
        const dynamicResult = await dynamicResponse.json()
        if (dynamicResult.success) {
          // Convert dynamic data array to object
          dynamicResult.data.forEach((item: any) => {
            try {
              dynamicData[item.field_name] = JSON.parse(item.field_value)
            } catch {
              dynamicData[item.field_name] = item.field_value
            }
          })
        }
      }

      return {
        level,
        entity_id: entity.entity_id,
        exam_framework: entity,
        syllabus_structure: dynamicData['syllabus_structure'] || {},
        answer_expectations: dynamicData['answer_expectations'] || {},
        success_patterns: dynamicData['success_patterns'] || null
      }
    } catch (error) {
      console.error(`Error fetching CA ${level}:`, error)
      // Return mock data as fallback
      return this.getMockCALevel(level)
    }
  }

  /**
   * Get CA Final Paper 8 detailed structure (our focus)
   */
  async getCAPaper8Details(): Promise<{
    paper_info: CAPaper
    detailed_structure: any
    answer_expectations: any
    success_strategy: any
  }> {
    try {
      const finalLevel = await this.getCALevel('final')
      const paper8 = finalLevel.syllabus_structure?.group_2?.papers?.find(
        (p: CAPaper) => p.code === 'FINAL_P8_INDIRECT_TAX'
      )

      // Get Paper 8 specific answer expectations
      const paper8Response = await fetch(`${this.baseUrl}/api/v1/entities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_dynamic_data',
          entity_id: 'ca_final',
          field_name: 'paper8_answer_expectations'
        })
      })

      let paper8Expectations = {}
      if (paper8Response.ok) {
        const result = await paper8Response.json()
        if (result.success && result.data?.length) {
          try {
            paper8Expectations = JSON.parse(result.data[0].field_value)
          } catch {
            paper8Expectations = {}
          }
        }
      }

      return {
        paper_info: paper8 || this.getMockPaper8(),
        detailed_structure: paper8?.sections || {},
        answer_expectations: paper8Expectations,
        success_strategy: paper8Expectations['winning_strategy'] || {}
      }
    } catch (error) {
      console.error('Error fetching Paper 8 details:', error)
      return {
        paper_info: this.getMockPaper8(),
        detailed_structure: {},
        answer_expectations: {},
        success_strategy: {}
      }
    }
  }

  /**
   * Get exam schedule for specific level
   */
  async getExamSchedule(level: 'foundation' | 'intermediate' | 'final'): Promise<CAExamSchedule> {
    try {
      const levelData = await this.getCALevel(level)
      return levelData.syllabus_structure?.exam_schedule || this.getMockExamSchedule()
    } catch (error) {
      console.error(`Error fetching exam schedule for ${level}:`, error)
      return this.getMockExamSchedule()
    }
  }

  /**
   * Get papers for specific level and group
   */
  async getPapers(
    level: 'foundation' | 'intermediate' | 'final',
    group?: 1 | 2
  ): Promise<CAPaper[]> {
    try {
      const levelData = await this.getCALevel(level)
      const syllabusStructure = levelData.syllabus_structure

      if (level === 'foundation') {
        return syllabusStructure?.papers || []
      }

      if (group === 1) {
        return syllabusStructure?.group_1?.papers || []
      } else if (group === 2) {
        return syllabusStructure?.group_2?.papers || []
      } else {
        // Return all papers
        return [
          ...(syllabusStructure?.group_1?.papers || []),
          ...(syllabusStructure?.group_2?.papers || [])
        ]
      }
    } catch (error) {
      console.error(`Error fetching papers for ${level} group ${group}:`, error)
      return []
    }
  }

  /**
   * Search topics across CA syllabus
   */
  async searchTopics(
    searchTerm: string,
    level?: 'foundation' | 'intermediate' | 'final'
  ): Promise<
    {
      level: string
      paper: string
      topic: string
      smart_code: string
    }[]
  > {
    try {
      const results = []
      const levels = level ? [level] : ['foundation', 'intermediate', 'final']

      for (const currentLevel of levels) {
        const levelData = await this.getCALevel(currentLevel)
        const papers = await this.getPapers(currentLevel)

        papers.forEach((paper: CAPaper) => {
          // Search in key areas
          if (paper.key_areas) {
            paper.key_areas.forEach(area => {
              if (area.toLowerCase().includes(searchTerm.toLowerCase())) {
                results.push({
                  level: currentLevel,
                  paper: paper.paper,
                  topic: area,
                  smart_code: this.generateSmartCode(currentLevel, paper.code, area)
                })
              }
            })
          }

          // Search in sections
          if (paper.sections) {
            Object.values(paper.sections).forEach((section: any) => {
              if (section.topics) {
                section.topics.forEach(topic => {
                  if (topic.toLowerCase().includes(searchTerm.toLowerCase())) {
                    results.push({
                      level: currentLevel,
                      paper: paper.paper,
                      topic: topic,
                      smart_code: this.generateSmartCode(currentLevel, paper.code, topic)
                    })
                  }
                })
              }
            })
          }
        })
      }

      return results
    } catch (error) {
      console.error('Error searching topics:', error)
      return []
    }
  }

  /**
   * Generate smart code for topic
   */
  private generateSmartCode(level: string, paperCode: string, topic: string): string {
    const levelCode = level.toUpperCase().substring(0, 5) // FOUND, INTER, FINAL
    const topicCode = topic.replace(/\s+/g, '_').toUpperCase().substring(0, 10)
    return `HERA.EDU.CA.${levelCode}.${paperCode}.${topicCode}.v1`
  }

  /**
   * Mock data fallbacks
   */
  private getMockCALevel(level: 'foundation' | 'intermediate' | 'final'): CALevel {
    return {
      level,
      entity_id: `ca_${level}_mock`,
      exam_framework: {
        entity_name: `CA ${level.charAt(0).toUpperCase() + level.slice(1)}`,
        entity_type: 'exam_framework'
      },
      syllabus_structure: {
        frequency: 'thrice_yearly',
        months: ['January', 'May', 'September'],
        attempts_per_year: 3
      },
      answer_expectations: {
        strategy: 'Focus on understanding concepts and practice'
      }
    }
  }

  private getMockPaper8(): CAPaper {
    return {
      paper: 'Paper 8 - Indirect Tax Laws',
      code: 'FINAL_P8_INDIRECT_TAX',
      max_marks: 100,
      duration_hours: 3.5,
      complexity: 'high',
      sections: {
        section_a: {
          name: 'Goods & Services Tax (GST)',
          marks: 60,
          weightage_percent: 60
        },
        section_b: {
          name: 'Customs Law',
          marks: 25,
          weightage_percent: 25
        },
        section_c: {
          name: 'Foreign Trade Policy (FTP)',
          marks: 15,
          weightage_percent: 15
        }
      }
    }
  }

  private getMockExamSchedule(): CAExamSchedule {
    return {
      frequency: 'thrice_yearly',
      months: ['January', 'May', 'September'],
      attempts_per_year: 3,
      next_dates: ['2025-01-15', '2025-05-15', '2025-09-15']
    }
  }
}

// Export singleton instance
export const caSyllabusService = new CASyllabusService()
