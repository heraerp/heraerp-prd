'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BookOpen, 
  Play, 
  CheckCircle, 
  Clock,
  Award,
  Star,
  Target,
  Users,
  Video,
  FileText,
  Trophy,
  Zap,
  GraduationCap,
  ArrowRight,
  Lock,
  Unlock,
  PlayCircle
} from 'lucide-react'

/**
 * HERA Partner Training & Certification Portal
 * 
 * Meta Breakthrough: Training system powered by HERA's universal architecture
 * All learning paths, assessments, and certifications managed via 6-table system
 */

interface TrainingModule {
  id: string
  name: string
  description: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  sequence_order: number
  estimated_duration: string
  prerequisites: string[]
  learning_objectives: string[]
  is_required: boolean
  completion_status: 'not_started' | 'in_progress' | 'completed'
  assessment_score?: number
}

interface Certification {
  id: string
  name: string
  description: string
  badge_url?: string
  status: 'available' | 'in_progress' | 'earned'
  difficulty: string
  estimated_hours: number
  requirements: any[]
}

interface TrainingData {
  training_path: TrainingModule[]
  certifications: Certification[]
  partner_progress?: {
    completed_modules: string[]
    current_module: string | null
    overall_progress: number
    certification_progress: number
    assessment_scores: Record<string, any>
  }
  training_statistics: {
    total_modules: number
    required_modules: number
    optional_modules: number
    total_estimated_hours: number
  }
}

export default function PartnerTrainingPage() {
  const [trainingData, setTrainingData] = useState<TrainingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null)
  const [selectedCertification, setSelectedCertification] = useState<Certification | null>(null)
  const [activeTab, setActiveTab] = useState<'training' | 'certifications' | 'progress'>('training')
  const [currentPartnerId] = useState('demo-partner-123') // Would come from auth

  useEffect(() => {
    loadTrainingData()
  }, [])

  const loadTrainingData = async () => {
    try {
      setLoading(true)
      
      // In real app, would call actual API
      // const response = await fetch(`/api/v1/partner-system/training?partner_id=${currentPartnerId}&include_progress=true&certification_status=all`)
      // const result = await response.json()
      
      // Mock data for demo
      setTrainingData({
        training_path: [
          {
            id: 'module-001',
            name: 'HERA Fundamentals',
            description: 'Introduction to HERA\'s universal architecture and core concepts',
            category: 'foundation',
            difficulty: 'beginner',
            sequence_order: 1,
            estimated_duration: '2 hours',
            prerequisites: [],
            learning_objectives: [
              'Understand HERA\'s 6-table architecture',
              'Learn the Meta Breakthrough concept',
              'Identify HERA vs SAP advantages'
            ],
            is_required: true,
            completion_status: 'completed',
            assessment_score: 96
          },
          {
            id: 'module-002',
            name: 'Sales & Business Development',
            description: 'How to identify prospects, qualify leads, and position HERA effectively',
            category: 'sales',
            difficulty: 'intermediate',
            sequence_order: 2,
            estimated_duration: '3 hours',
            prerequisites: ['module-001'],
            learning_objectives: [
              'Master HERA\'s value proposition',
              'Handle SAP migration objections',
              'Identify high-value prospects'
            ],
            is_required: true,
            completion_status: 'in_progress',
            assessment_score: undefined
          },
          {
            id: 'module-003',
            name: 'Technical Implementation',
            description: 'Hands-on implementation techniques and best practices',
            category: 'technical',
            difficulty: 'advanced',
            sequence_order: 3,
            estimated_duration: '4 hours',
            prerequisites: ['module-001', 'module-002'],
            learning_objectives: [
              'Deploy HERA environments',
              'Configure business modules',
              'Handle data migrations'
            ],
            is_required: true,
            completion_status: 'not_started'
          },
          {
            id: 'module-004',
            name: 'Industry Specialization: Manufacturing',
            description: 'HERA implementation patterns for manufacturing businesses',
            category: 'industry',
            difficulty: 'intermediate',
            sequence_order: 4,
            estimated_duration: '2.5 hours',
            prerequisites: ['module-003'],
            learning_objectives: [
              'Manufacturing-specific workflows',
              'Inventory management patterns',
              'Cost accounting setup'
            ],
            is_required: false,
            completion_status: 'not_started'
          }
        ],
        certifications: [
          {
            id: 'cert-001',
            name: 'HERA Certified Partner',
            description: 'Foundation certification for all HERA partners',
            badge_url: '/images/badges/hera-certified-partner.png',
            status: 'in_progress',
            difficulty: 'intermediate',
            estimated_hours: 8,
            requirements: [
              { type: 'module_completion', module_id: 'module-001' },
              { type: 'module_completion', module_id: 'module-002' },
              { type: 'minimum_score', module_id: 'module-001', score: 80 },
              { type: 'minimum_score', module_id: 'module-002', score: 80 }
            ]
          },
          {
            id: 'cert-002',
            name: 'HERA Implementation Specialist',
            description: 'Advanced certification for technical implementation',
            badge_url: '/images/badges/hera-implementation-specialist.png',
            status: 'available',
            difficulty: 'advanced',
            estimated_hours: 16,
            requirements: [
              { type: 'certification', certification_id: 'cert-001' },
              { type: 'module_completion', module_id: 'module-003' },
              { type: 'minimum_score', module_id: 'module-003', score: 85 }
            ]
          }
        ],
        partner_progress: {
          completed_modules: ['module-001'],
          current_module: 'module-002',
          overall_progress: 37.5,
          certification_progress: 50,
          assessment_scores: {
            'module-001': { score: 96, passed: true, completed_at: '2024-03-20' }
          }
        },
        training_statistics: {
          total_modules: 4,
          required_modules: 3,
          optional_modules: 1,
          total_estimated_hours: 11.5
        }
      })
      
    } catch (error) {
      console.error('Training data load error:', error)
    } finally {
      setLoading(false)
    }
  }

  const startModule = async (moduleId: string) => {
    try {
      // In real app: 
      // await fetch('/api/v1/partner-system/training', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     partner_id: currentPartnerId,
      //     action: 'start_module',
      //     module_id: moduleId
      //   })
      // })
      
      // Update UI optimistically
      if (trainingData) {
        const updatedModules = trainingData.training_path.map(module =>
          module.id === moduleId 
            ? { ...module, completion_status: 'in_progress' as const }
            : module
        )
        
        setTrainingData({
          ...trainingData,
          training_path: updatedModules,
          partner_progress: {
            ...trainingData.partner_progress!,
            current_module: moduleId
          }
        })
      }
      
    } catch (error) {
      console.error('Start module error:', error)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-blue-100 text-blue-800'
      case 'advanced': return 'bg-purple-100 text-purple-800'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  const getStatusIcon = (status: string, score?: number) => {
    switch (status) {
      case 'completed':
        return score && score >= 90 
          ? <Trophy className="h-4 w-4 text-amber-500" />
          : <CheckCircle className="h-4 w-4 text-emerald-500" />
      case 'in_progress':
        return <PlayCircle className="h-4 w-4 text-blue-500" />
      case 'not_started':
        return <Lock className="h-4 w-4 text-slate-400" />
      default:
        return <BookOpen className="h-4 w-4 text-slate-400" />
    }
  }

  const canStartModule = (module: TrainingModule) => {
    if (!trainingData?.partner_progress) return false
    
    // Check prerequisites
    return module.prerequisites.every(prereq => 
      trainingData.partner_progress!.completed_modules.includes(prereq)
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading training portal...</p>
        </div>
      </div>
    )
  }

  if (!trainingData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">Failed to load training data</p>
          <Button onClick={loadTrainingData} className="mt-4">Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Sales Mastery Training</h1>
              <p className="text-emerald-100">Master modern sales. Generate viral growth. Maximize revenue.</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {trainingData.partner_progress?.overall_progress.toFixed(1)}%
              </div>
              <div className="text-sm text-emerald-100">Overall Progress</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-slate-200 rounded-lg p-1 mb-8">
          {[
            { id: 'training', label: 'Training Path', icon: BookOpen },
            { id: 'certifications', label: 'Certifications', icon: Award },
            { id: 'progress', label: 'My Progress', icon: Target }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-md font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Training Path Tab */}
        {activeTab === 'training' && (
          <div>
            {/* Training Statistics */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <BookOpen className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{trainingData.training_statistics.total_modules}</div>
                  <div className="text-sm text-slate-600">Total Modules</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{trainingData.training_statistics.total_estimated_hours}h</div>
                  <div className="text-sm text-slate-600">Est. Duration</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Target className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{trainingData.training_statistics.required_modules}</div>
                  <div className="text-sm text-slate-600">Required</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Star className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{trainingData.training_statistics.optional_modules}</div>
                  <div className="text-sm text-slate-600">Optional</div>
                </CardContent>
              </Card>
            </div>

            {/* Training Modules */}
            <div className="space-y-6">
              {trainingData.training_path.map((module, index) => (
                <Card key={module.id} className={`${
                  module.completion_status === 'completed' ? 'bg-emerald-50 border-emerald-200' :
                  module.completion_status === 'in_progress' ? 'bg-blue-50 border-blue-200' :
                  'bg-white border-slate-200'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(module.completion_status, module.assessment_score)}
                            <h3 className="text-xl font-bold">{module.name}</h3>
                          </div>
                          <Badge className={getDifficultyColor(module.difficulty)}>
                            {module.difficulty}
                          </Badge>
                          {module.is_required && (
                            <Badge variant="outline" className="text-red-600 border-red-200">
                              Required
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-slate-600 mb-4">{module.description}</p>
                        
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="text-sm font-semibold mb-2">Learning Objectives:</div>
                            <ul className="text-sm text-slate-600 space-y-1">
                              {module.learning_objectives.map((objective, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                  {objective}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          {module.prerequisites.length > 0 && (
                            <div>
                              <div className="text-sm font-semibold mb-2">Prerequisites:</div>
                              <div className="space-y-1">
                                {module.prerequisites.map(prereqId => {
                                  const prereq = trainingData.training_path.find(m => m.id === prereqId)
                                  const completed = trainingData.partner_progress?.completed_modules.includes(prereqId)
                                  return (
                                    <div key={prereqId} className="flex items-center gap-2 text-sm">
                                      {completed ? (
                                        <CheckCircle className="h-3 w-3 text-emerald-500" />
                                      ) : (
                                        <div className="h-3 w-3 border border-slate-300 rounded-full" />
                                      )}
                                      <span className={completed ? 'text-emerald-600' : 'text-slate-600'}>
                                        {prereq?.name}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {module.estimated_duration}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {module.category}
                          </div>
                          {module.assessment_score && (
                            <div className="flex items-center gap-1">
                              <Trophy className="h-4 w-4 text-amber-500" />
                              {module.assessment_score >= 95 ? 'Elite Performance' : 
                               module.assessment_score >= 90 ? 'Excellent' : 
                               `Score: ${module.assessment_score}%`}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-6">
                        {module.completion_status === 'completed' ? (
                          <Button variant="outline" size="sm">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Completed
                          </Button>
                        ) : module.completion_status === 'in_progress' ? (
                          <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                            <PlayCircle className="h-4 w-4 mr-2" />
                            Continue
                          </Button>
                        ) : canStartModule(module) ? (
                          <Button 
                            size="sm" 
                            className="bg-emerald-500 hover:bg-emerald-600"
                            onClick={() => startModule(module.id)}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Start Module
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" disabled>
                            <Lock className="h-4 w-4 mr-2" />
                            Locked
                          </Button>
                        )}
                        
                        <Button variant="ghost" size="sm" onClick={() => setSelectedModule(module)}>
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Certifications Tab */}
        {activeTab === 'certifications' && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Available Certifications</h2>
              <p className="text-slate-600">
                Earn industry-recognized certifications that validate your HERA expertise and boost your credibility with prospects.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {trainingData.certifications.map(cert => (
                <Card key={cert.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <GraduationCap className="h-5 w-5 text-amber-500" />
                          {cert.name}
                        </CardTitle>
                        <p className="text-slate-600 mt-1">{cert.description}</p>
                      </div>
                      {cert.badge_url && (
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center">
                          <Award className="h-8 w-8 text-amber-600" />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Difficulty:</span>
                        <Badge className={getDifficultyColor(cert.difficulty)}>
                          {cert.difficulty}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Time Investment:</span>
                        <span className="font-semibold">{cert.estimated_hours} hours</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Status:</span>
                        <Badge variant={
                          cert.status === 'earned' ? 'default' :
                          cert.status === 'in_progress' ? 'secondary' : 'outline'
                        }>
                          {cert.status === 'earned' ? 'Earned' :
                           cert.status === 'in_progress' ? 'In Progress' : 'Available'}
                        </Badge>
                      </div>
                      
                      <div className="pt-4 border-t">
                        {cert.status === 'earned' ? (
                          <Button className="w-full" variant="outline">
                            <Trophy className="h-4 w-4 mr-2" />
                            View Certificate
                          </Button>
                        ) : cert.status === 'in_progress' ? (
                          <Button className="w-full">
                            <Zap className="h-4 w-4 mr-2" />
                            Continue Certification
                          </Button>
                        ) : (
                          <Button 
                            className="w-full" 
                            variant="outline"
                            onClick={() => setSelectedCertification(cert)}
                          >
                            <ArrowRight className="h-4 w-4 mr-2" />
                            View Requirements
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Training Progress Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">Overall Progress</span>
                      <span className="text-2xl font-bold text-emerald-600">
                        {trainingData.partner_progress?.overall_progress.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={trainingData.partner_progress?.overall_progress} className="h-3" />
                    <div className="flex justify-between text-sm text-slate-600 mt-1">
                      <span>
                        {trainingData.partner_progress?.completed_modules.length} of {trainingData.training_statistics.total_modules} modules
                      </span>
                      <span>
                        {(trainingData.training_statistics.total_modules - (trainingData.partner_progress?.completed_modules.length || 0))} remaining
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">Certification Progress</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {trainingData.partner_progress?.certification_progress.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={trainingData.partner_progress?.certification_progress} className="h-3" />
                    <div className="text-sm text-slate-600 mt-1">
                      Ready for HERA Sales Champion certification
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <div>
                      <div className="font-semibold">Business Impact & Value Mastered</div>
                      <div className="text-sm text-slate-600">Elite Performance 96% • March 20, 2024</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <PlayCircle className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-semibold">Modern Lead Generation Started</div>
                      <div className="text-sm text-slate-600">In progress • Learning viral growth tactics</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Meta Breakthrough Badge */}
        <div className="mt-12 text-center">
          <Badge className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-4 py-2">
            🚀 Meta Breakthrough: Training system powered by HERA's universal 6-table architecture
          </Badge>
        </div>
      </div>
    </div>
  )
}