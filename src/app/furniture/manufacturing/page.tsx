'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Factory,
  ArrowRight,
  CheckCircle,
  Clock,
  Users,
  Package,
  Settings,
  Zap,
  Target,
  Award,
  TrendingUp,
  BarChart3,
  Activity,
  Palette,
  TreePine,
  Hammer,
  Wrench,
  Eye,
  Play,
  FileText,
  Calendar,
  DollarSign,
  Globe,
  Shield,
  Star,
  ArrowLeft
} from 'lucide-react'

export default function ManufacturingPage() {
  const router = useRouter()
  const [completedSteps, setCompletedSteps] = useState([])
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      number: 1,
      titleJa: '設計',
      titleEn: 'Design',
      description: 'AI-powered design generation from natural language descriptions. Create professional CAD drawings and technical specifications in seconds with intelligent material suggestions.',
      action: 'Start Design Process',
      path: '/furniture/manufacturing/design',
      icon: Palette,
      status: 'available',
      duration: '15-30 minutes',
      complexity: 'Medium',
      features: [
        'AI-powered CAD generation',
        'Material optimization',
        'Cost estimation',
        'Export-ready specifications'
      ],
      kpis: {
        timeReduction: '85%',
        accuracy: '96%',
        costSavings: '₹45,000'
      }
    },
    {
      number: 2,
      titleJa: '材料',
      titleEn: 'Materials',
      description: 'Intelligent material selection and cut list optimization. Advanced algorithms minimize waste while ensuring quality standards and delivery schedules are met.',
      action: 'Select Materials',
      path: '/furniture/manufacturing/materials',
      icon: TreePine,
      status: 'locked',
      duration: '20-40 minutes',
      complexity: 'High',
      features: [
        'Intelligent material selection',
        'Cut list optimization',
        'Waste minimization algorithms',
        'Supplier integration'
      ],
      kpis: {
        wasteReduction: '32%',
        efficiency: '94%',
        costSavings: '₹78,000'
      }
    },
    {
      number: 3,
      titleJa: '生産',
      titleEn: 'Production',
      description: 'CNC-ready toolpaths and comprehensive shop floor instructions. Complete manufacturing workflow from raw materials to finished furniture pieces.',
      action: 'Begin Production',
      path: '/furniture/manufacturing/production',
      icon: Settings,
      status: 'locked',
      duration: '2-8 hours',
      complexity: 'Expert',
      features: [
        'CNC toolpath generation',
        'Quality control checkpoints',
        'Real-time progress tracking',
        'Automated documentation'
      ],
      kpis: {
        productionSpeed: '67%',
        qualityScore: '98%',
        efficiency: '91%'
      }
    }
  ]

  const manufacturingStats = [
    {
      title: 'Active Projects',
      value: '12',
      subtitle: 'In production pipeline',
      icon: Activity,
      trend: '+18%',
      color: 'blue'
    },
    {
      title: 'Completion Rate',
      value: '94.2%',
      subtitle: 'On-time delivery',
      icon: Target,
      trend: '+5.2%',
      color: 'green'
    },
    {
      title: 'Quality Score',
      value: '98.1%',
      subtitle: 'Quality assurance',
      icon: Award,
      trend: '+2.1%',
      color: 'purple'
    },
    {
      title: 'Cost Efficiency',
      value: '₹2.1L',
      subtitle: 'Monthly savings',
      icon: DollarSign,
      trend: '+12%',
      color: 'amber'
    }
  ]

  const recentProjects = [
    {
      id: 'PRJ-001',
      name: 'Executive Boardroom Set',
      client: 'ITC Grand Chola',
      stage: 'Production',
      progress: 78,
      dueDate: '2024-02-20',
      value: '₹8.5L',
      priority: 'high'
    },
    {
      id: 'PRJ-002',
      name: 'Traditional Dining Collection',
      client: 'Heritage Resort Kumarakom',
      stage: 'Materials',
      progress: 45,
      dueDate: '2024-02-25',
      value: '₹3.2L',
      priority: 'medium'
    },
    {
      id: 'PRJ-003',
      name: 'Modern Office Workstations',
      client: 'Infosys Trivandrum',
      stage: 'Design',
      progress: 25,
      dueDate: '2024-03-15',
      value: '₹9.25L',
      priority: 'urgent'
    }
  ]

  const handleStepComplete = (stepNumber) => {
    if (!completedSteps.includes(stepNumber)) {
      setCompletedSteps(prev => [...prev, stepNumber])
      
      // Unlock next step
      const updatedSteps = [...steps]
      const nextStepIndex = steps.findIndex(s => s.number === stepNumber + 1)
      if (nextStepIndex !== -1) {
        updatedSteps[nextStepIndex].status = 'available'
      }
    }
  }

  const navigateToStep = (path, stepNumber) => {
    if (stepNumber === 1 || completedSteps.includes(stepNumber - 1)) {
      handleStepComplete(stepNumber)
      router.push(path)
    }
  }

  const getStepStatus = (step) => {
    if (completedSteps.includes(step.number)) return 'completed'
    if (step.number === 1 || completedSteps.includes(step.number - 1)) return 'available'
    return 'locked'
  }

  const getStatusColor = (status) => {
    const colors = {
      'completed': 'bg-green-500/10 text-green-700 border-green-500/30',
      'available': 'bg-blue-500/10 text-blue-700 border-blue-500/30',
      'locked': 'bg-gray-500/10 text-gray-700 border-gray-500/30'
    }
    return colors[status] || colors.locked
  }

  const getPriorityColor = (priority) => {
    const colors = {
      'urgent': 'bg-red-500/10 text-red-700 border-red-500/30',
      'high': 'bg-orange-500/10 text-orange-700 border-orange-500/30',
      'medium': 'bg-amber-500/10 text-amber-700 border-amber-500/30',
      'low': 'bg-gray-500/10 text-gray-700 border-gray-500/30'
    }
    return colors[priority] || colors.medium
  }

  const getStatColor = (color) => {
    const colors = {
      'blue': 'from-blue-500 to-cyan-500',
      'green': 'from-green-500 to-emerald-500',
      'purple': 'from-purple-500 to-violet-500',
      'amber': 'from-amber-500 to-orange-500'
    }
    return colors[color] || colors.blue
  }

  useEffect(() => {
    // Initialize first step as available
    if (steps.length > 0) {
      steps[0].status = 'available'
    }
  }, [])

  return (
    <div className="min-h-screen">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="jewelry-glass-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/furniture')}
                  className="jewelry-glass-btn gap-2 jewelry-text-luxury hover:jewelry-text-gold"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <div className="jewelry-crown-glow p-3 rounded-xl">
                  <Factory className="h-8 w-8 jewelry-text-gold" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold jewelry-text-luxury">
                    製造工程 <span className="text-2xl font-normal">Manufacturing</span>
                  </h1>
                  <p className="text-lg text-gray-300">Kerala Furniture Production Workflow</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-500/10 text-green-700 border-green-500/30">
                  <Activity className="h-3 w-3 mr-1" />
                  Production Active
                </Badge>
              </div>
            </div>
          </div>

          {/* Manufacturing Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {manufacturingStats.map((stat, index) => {
              const IconComponent = stat.icon
              return (
                <div key={index} className="jewelry-glass-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${getStatColor(stat.color)} flex items-center justify-center`}>
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-300">{stat.title}</p>
                      <p className="text-2xl font-bold jewelry-text-luxury">{stat.value}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-300">{stat.subtitle}</p>
                    <span className="text-xs text-green-600">{stat.trend}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Introduction */}
          <div className="jewelry-glass-card p-8 text-center">
            <h2 className="text-2xl font-bold jewelry-text-luxury mb-4">
              Three Steps from Concept to Production
            </h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
              コンセプトから生産まで、3つのステップ
              <br />
              <span className="text-base mt-2 block">
                Advanced AI-powered manufacturing workflow designed for Kerala furniture craftsmen
              </span>
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="jewelry-glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold jewelry-text-luxury">Manufacturing Progress</h3>
              <span className="text-sm text-gray-300">
                {completedSteps.length} of {steps.length} steps completed
              </span>
            </div>
            <Progress value={(completedSteps.length / steps.length) * 100} className="h-2" />
            <div className="flex justify-between mt-2 text-xs text-gray-300">
              {steps.map(step => (
                <span key={step.number} className={completedSteps.includes(step.number) ? 'text-green-600' : ''}>
                  {step.number}. {step.titleEn}
                </span>
              ))}
            </div>
          </div>

          {/* Manufacturing Steps */}
          <div className="space-y-8">
            {steps.map((step, index) => {
              const IconComponent = step.icon
              const status = getStepStatus(step)
              const isAvailable = status === 'available' || status === 'completed'
              
              return (
                <div key={step.number} className="jewelry-glass-card p-8">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-6 flex-1">
                      {/* Step Icon & Number */}
                      <div className="flex flex-col items-center gap-4">
                        <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${
                          status === 'completed' ? 'from-green-500 to-emerald-500' :
                          status === 'available' ? 'from-blue-500 to-cyan-500' :
                          'from-gray-500 to-gray-600'
                        } flex items-center justify-center`}>
                          {status === 'completed' ? (
                            <CheckCircle className="h-8 w-8 text-white" />
                          ) : (
                            <IconComponent className="h-8 w-8 text-white" />
                          )}
                        </div>
                        <div className="text-4xl font-light text-gray-400 opacity-50">
                          {step.number}
                        </div>
                      </div>

                      {/* Step Content */}
                      <div className="flex-1">
                        {/* Title - Bilingual */}
                        <div className="mb-4">
                          <h2 className="text-3xl font-bold jewelry-text-luxury mb-1">
                            {step.titleJa}
                          </h2>
                          <h3 className="text-xl font-normal text-gray-300">
                            {step.titleEn}
                          </h3>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-3 mb-4">
                          <Badge className={getStatusColor(status)}>
                            {status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {status === 'available' && <Play className="h-3 w-3 mr-1" />}
                            {status === 'locked' && <Clock className="h-3 w-3 mr-1" />}
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </Badge>
                          <Badge variant="outline" className="text-xs jewelry-badge-text">
                            {step.duration}
                          </Badge>
                          <Badge variant="outline" className="text-xs jewelry-badge-text">
                            {step.complexity}
                          </Badge>
                        </div>

                        {/* Description */}
                        <p className="text-lg text-gray-300 leading-relaxed mb-6 max-w-3xl">
                          {step.description}
                        </p>

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          <div>
                            <h4 className="text-sm font-medium jewelry-text-luxury mb-2">Key Features:</h4>
                            <ul className="space-y-1">
                              {step.features.map((feature, idx) => (
                                <li key={idx} className="text-sm text-gray-300 flex items-center gap-2">
                                  <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium jewelry-text-luxury mb-2">Performance:</h4>
                            <div className="space-y-1">
                              {Object.entries(step.kpis).map(([key, value]) => (
                                <div key={key} className="text-sm text-gray-300 flex justify-between">
                                  <span>{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                  <span className="font-medium text-green-600">{value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <Button
                          onClick={() => navigateToStep(step.path, step.number)}
                          disabled={!isAvailable}
                          className={`gap-3 text-lg ${
                            status === 'completed' 
                              ? 'jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold' 
                              : isAvailable 
                                ? 'jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold' 
                                : 'opacity-50 cursor-not-allowed'
                          }`}
                        >
                          {status === 'completed' ? 'View Results' : step.action}
                          <ArrowRight className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Recent Projects */}
          <div className="jewelry-glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold jewelry-text-luxury">Recent Manufacturing Projects</h3>
              <Button variant="outline" className="jewelry-glass-btn gap-2 jewelry-text-luxury hover:jewelry-text-gold">
                <Eye className="h-4 w-4" />
                View All
              </Button>
            </div>
            
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div key={project.id} className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium jewelry-text-luxury">{project.name}</h4>
                      <Badge className={getPriorityColor(project.priority)}>
                        {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-medium jewelry-text-luxury">{project.value}</div>
                      <div className="text-sm text-gray-300">Due: {project.dueDate}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-gray-300">
                      <span className="font-medium">Client:</span> {project.client}
                    </div>
                    <div className="text-sm text-gray-300">
                      <span className="font-medium">Stage:</span> {project.stage}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Progress</span>
                      <span className="text-sm font-medium jewelry-text-luxury">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Message */}
          <div className="jewelry-glass-card p-8 text-center">
            <p className="text-lg jewelry-text-luxury mb-2">
              始める準備はできていますか？
            </p>
            <p className="text-gray-300">
              Ready to begin your manufacturing journey?
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}