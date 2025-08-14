/**
 * HERA Partner Journey Orchestration
 * Steve Jobs-Inspired Seamless Experience Engine
 * 
 * "Simplicity is the ultimate sophistication." - Steve Jobs
 * 
 * This system creates the invisible magic that makes the partner experience
 * feel inevitable, intuitive, and inspiring.
 */

interface JourneyStep {
  id: string
  name: string
  path: string
  requiredData?: string[]
  completionCriteria: string[]
  nextStep?: string
  experience: {
    mood: 'curiosity' | 'excitement' | 'commitment' | 'mastery' | 'success'
    message: string
    cta: string
  }
}

interface PartnerProgress {
  currentStep: string
  completedSteps: string[]
  userData: Record<string, any>
  startedAt: string
  lastActivity: string
  engagement: {
    timeSpent: number
    interactions: number
    enthusiasm: 'low' | 'medium' | 'high'
  }
}

export class PartnerJourneyOrchestrator {
  private static instance: PartnerJourneyOrchestrator
  private journeyMap: Map<string, JourneyStep>
  private partnerProgress: Map<string, PartnerProgress>

  private constructor() {
    this.journeyMap = new Map()
    this.partnerProgress = new Map()
    this.initializeJourney()
  }

  static getInstance(): PartnerJourneyOrchestrator {
    if (!PartnerJourneyOrchestrator.instance) {
      PartnerJourneyOrchestrator.instance = new PartnerJourneyOrchestrator()
    }
    return PartnerJourneyOrchestrator.instance
  }

  private initializeJourney() {
    const steps: JourneyStep[] = [
      {
        id: 'discover',
        name: 'Discover the Revolution',
        path: '/partners',
        completionCriteria: ['viewed_value_prop', 'calculated_earnings', 'watched_demo'],
        nextStep: 'envision',
        experience: {
          mood: 'curiosity',
          message: 'What if ERP partnerships could be different?',
          cta: 'Show me how HERA is different'
        }
      },
      {
        id: 'envision',
        name: 'Envision Your Success',
        path: '/partners#calculator',
        completionCriteria: ['used_calculator', 'saw_competitor_comparison', 'understood_model'],
        nextStep: 'join',
        experience: {
          mood: 'excitement',
          message: 'I can actually build a real business with this',
          cta: 'I want to become a partner'
        }
      },
      {
        id: 'join',
        name: 'Join the Movement',
        path: '/partner-system/register',
        requiredData: ['basic_info', 'business_details', 'agreements'],
        completionCriteria: ['completed_registration', 'agreement_signed'],
        nextStep: 'master',
        experience: {
          mood: 'commitment',
          message: 'I am officially part of something revolutionary',
          cta: 'Start my training'
        }
      },
      {
        id: 'master',
        name: 'Master Modern Sales',
        path: '/partner-system/training',
        completionCriteria: ['completed_core_modules', 'passed_assessments', 'earned_certification'],
        nextStep: 'thrive',
        experience: {
          mood: 'mastery',
          message: 'I have the skills to succeed at the highest level',
          cta: 'Start selling'
        }
      },
      {
        id: 'thrive',
        name: 'Thrive & Scale',
        path: '/partner-system/dashboard',
        completionCriteria: ['first_customer', 'first_commission', 'viral_referral'],
        experience: {
          mood: 'success',
          message: 'This is exactly what partnership should feel like',
          cta: 'Scale my business'
        }
      }
    ]

    steps.forEach(step => {
      this.journeyMap.set(step.id, step)
    })
  }

  // Track partner progress through the journey
  trackProgress(partnerId: string, stepId: string, action: string, data?: any): void {
    let progress = this.partnerProgress.get(partnerId)
    
    if (!progress) {
      progress = {
        currentStep: stepId,
        completedSteps: [],
        userData: {},
        startedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        engagement: {
          timeSpent: 0,
          interactions: 1,
          enthusiasm: 'medium'
        }
      }
    }

    // Update activity
    progress.lastActivity = new Date().toISOString()
    progress.engagement.interactions++
    
    // Store action data
    if (data) {
      progress.userData = { ...progress.userData, ...data }
    }

    // Check if step is completed
    const step = this.journeyMap.get(stepId)
    if (step && this.isStepCompleted(partnerId, step)) {
      if (!progress.completedSteps.includes(stepId)) {
        progress.completedSteps.push(stepId)
      }
      
      // Move to next step
      if (step.nextStep && progress.currentStep === stepId) {
        progress.currentStep = step.nextStep
      }
    }

    // Update enthusiasm based on engagement
    progress.engagement.enthusiasm = this.calculateEnthusiasm(progress)

    this.partnerProgress.set(partnerId, progress)
  }

  // Get the perfect next action for a partner
  getNextAction(partnerId: string): {
    step: JourneyStep
    message: string
    urgency: 'low' | 'medium' | 'high'
    personalizedCTA: string
  } {
    const progress = this.partnerProgress.get(partnerId)
    const currentStepId = progress?.currentStep || 'discover'
    const step = this.journeyMap.get(currentStepId)!

    const completionRate = this.getStepCompletionRate(partnerId, step)
    const enthusiasm = progress?.engagement.enthusiasm || 'medium'

    let message = step.experience.message
    let urgency: 'low' | 'medium' | 'high' = 'medium'
    let personalizedCTA = step.experience.cta

    // Personalize based on progress and enthusiasm
    if (completionRate > 0.7) {
      message = "You're so close! Let's finish this."
      urgency = 'high'
      personalizedCTA = `Complete ${step.name}`
    } else if (enthusiasm === 'high' && completionRate > 0.3) {
      message = "You're making great progress!"
      urgency = 'medium'
    } else if (enthusiasm === 'low') {
      message = "Let's make this simple..."
      urgency = 'low'
      personalizedCTA = "Take one small step"
    }

    return {
      step,
      message,
      urgency,
      personalizedCTA
    }
  }

  // Create seamless transitions between steps
  createTransition(fromStep: string, toStep: string): {
    animation: 'slide' | 'fade' | 'zoom'
    duration: number
    message: string
    prebriefing?: string
  } {
    const transitions: Record<string, any> = {
      'discover->envision': {
        animation: 'slide',
        duration: 800,
        message: "Now let's see what this means for you...",
        prebriefing: "Based on what you've seen, here's your potential"
      },
      'envision->join': {
        animation: 'zoom',
        duration: 600,
        message: "Ready to make this real?",
        prebriefing: "Let's get you set up in just 4 simple steps"
      },
      'join->master': {
        animation: 'fade',
        duration: 1000,
        message: "Welcome to HERA! Time to become unstoppable.",
        prebriefing: "Your partner account is ready. Now let's make you a sales master."
      },
      'master->thrive': {
        animation: 'slide',
        duration: 700,
        message: "You're ready. Let's see your success in real-time.",
        prebriefing: "Welcome to your partner dashboard - your mission control"
      }
    }

    const key = `${fromStep}->${toStep}`
    return transitions[key] || {
      animation: 'fade',
      duration: 500,
      message: "Let's continue your journey..."
    }
  }

  // Smart routing - knows where partner should go next
  getSmartRoute(partnerId: string, currentPath: string): {
    recommendedPath: string
    reason: string
    confidence: number
  } {
    const progress = this.partnerProgress.get(partnerId)
    if (!progress) {
      return {
        recommendedPath: '/partner',
        reason: 'Start your journey from the beginning',
        confidence: 1.0
      }
    }

    const currentStep = this.journeyMap.get(progress.currentStep)!
    const nextAction = this.getNextAction(partnerId)

    // If they're on the wrong path, guide them back
    if (currentPath !== currentStep.path && currentPath !== nextAction.step.path) {
      return {
        recommendedPath: currentStep.path,
        reason: `Continue where you left off: ${currentStep.name}`,
        confidence: 0.9
      }
    }

    // If they've completed current step, move them forward
    if (this.isStepCompleted(partnerId, currentStep) && currentStep.nextStep) {
      const nextStep = this.journeyMap.get(currentStep.nextStep)!
      return {
        recommendedPath: nextStep.path,
        reason: `You're ready for: ${nextStep.name}`,
        confidence: 0.95
      }
    }

    return {
      recommendedPath: currentPath,
      reason: 'You\'re exactly where you need to be',
      confidence: 1.0
    }
  }

  // Generate personalized encouragement
  getEncouragement(partnerId: string): string {
    const progress = this.partnerProgress.get(partnerId)
    if (!progress) return "Ready to start something amazing?"

    const completedCount = progress.completedSteps.length
    const enthusiasm = progress.engagement.enthusiasm

    const encouragements = {
      high: [
        "You're absolutely crushing this! 🚀",
        "Your enthusiasm is contagious! Keep going! ⚡",
        "This is exactly the energy we love to see! 🔥"
      ],
      medium: [
        "Great progress! You're building something special. 📈",
        "Steady and strong - that's how empires are built. 🏗️",
        "One step at a time, you're getting there! 👍"
      ],
      low: [
        "Every great journey starts with a single step. 🌱",
        "Take your time - we're here when you're ready. 🤝",
        "Small progress is still progress. You've got this! 💪"
      ]
    }

    const messages = encouragements[enthusiasm]
    const baseMessage = messages[Math.floor(Math.random() * messages.length)]

    if (completedCount > 0) {
      return `${baseMessage} You've completed ${completedCount} major steps!`
    }

    return baseMessage
  }

  // Private helper methods
  private isStepCompleted(partnerId: string, step: JourneyStep): boolean {
    const progress = this.partnerProgress.get(partnerId)
    if (!progress) return false

    return step.completionCriteria.every(criteria => {
      return progress.userData[criteria] === true
    })
  }

  private getStepCompletionRate(partnerId: string, step: JourneyStep): number {
    const progress = this.partnerProgress.get(partnerId)
    if (!progress) return 0

    const completed = step.completionCriteria.filter(criteria => 
      progress.userData[criteria] === true
    ).length

    return completed / step.completionCriteria.length
  }

  private calculateEnthusiasm(progress: PartnerProgress): 'low' | 'medium' | 'high' {
    const { interactions, timeSpent } = progress.engagement
    const daysSinceStart = (Date.now() - new Date(progress.startedAt).getTime()) / (1000 * 60 * 60 * 24)
    
    // High engagement indicators
    if (interactions > 10 && timeSpent > 1800 && daysSinceStart < 7) return 'high'
    
    // Low engagement indicators  
    if (interactions < 3 && daysSinceStart > 3) return 'low'
    
    return 'medium'
  }
}

// Export singleton instance
export const partnerJourney = PartnerJourneyOrchestrator.getInstance()

// Helper hook for React components
export function usePartnerJourney(partnerId?: string) {
  if (!partnerId) return null

  return {
    trackProgress: (stepId: string, action: string, data?: any) => 
      partnerJourney.trackProgress(partnerId, stepId, action, data),
    
    getNextAction: () => partnerJourney.getNextAction(partnerId),
    
    getSmartRoute: (currentPath: string) => 
      partnerJourney.getSmartRoute(partnerId, currentPath),
    
    getEncouragement: () => partnerJourney.getEncouragement(partnerId),
    
    createTransition: (fromStep: string, toStep: string) =>
      partnerJourney.createTransition(fromStep, toStep)
  }
}