'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  ChevronLeft,
  ChevronRight,
  X,
  Utensils,
  ShoppingCart,
  ChefHat,
  Users,
  TrendingUp,
  Settings,
  Play,
  CheckCircle,
  Lightbulb
} from 'lucide-react'

// Smart Code: HERA.REST.ONBOARDING.TOUR.PROGRESSIVE.V1
// Progressive disclosure onboarding for restaurant platform

interface TourStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  target?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  content: React.ReactNode
  tips?: string[]
}

interface OnboardingTourProps {
  isOpen: boolean
  onComplete: () => void
  onDismiss: () => void
  userType?: 'customer' | 'staff' | 'manager' | 'owner'
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen,
  onComplete,
  onDismiss,
  userType = 'customer'
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  // Different tour paths based on user type
  const getTourSteps = (type: string): TourStep[] => {
    const commonSteps = [
      {
        id: 'welcome',
        title: 'Welcome to Bella Vista Restaurant',
        description: 'Your complete restaurant experience platform',
        icon: <Utensils className="h-6 w-6 text-red-600" />,
        content: (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
              <Utensils className="h-8 w-8 text-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-100">Welcome to the Future of Dining</h3>
              <p className="text-muted-foreground mt-2">
                Experience our revolutionary platform that brings together customers, kitchen staff,
                and management in perfect harmony.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-red-50 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-red-600 mx-auto mb-1" />
                <div className="text-sm font-medium">Order Online</div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <ChefHat className="h-6 w-6 text-orange-600 mx-auto mb-1" />
                <div className="text-sm font-medium">Live Kitchen</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-1" />
                <div className="text-sm font-medium">Real-time Analytics</div>
              </div>
            </div>
          </div>
        )
      }
    ]

    const customerSteps: TourStep[] = [
      {
        id: 'menu-browsing',
        title: 'Browse Our Delicious Menu',
        description: 'Discover appetizing dishes with detailed information',
        icon: <Utensils className="h-6 w-6 text-red-600" />,
        content: (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-lg border">
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center">
                  <Utensils className="h-8 w-8 text-red-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-100">Grilled Salmon</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Fresh Atlantic salmon with herb butter
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="secondary">18min</Badge>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      Gluten-free
                    </Badge>
                    <Badge variant="secondary">⭐ 4.8 (124 reviews)</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-red-600">$28.99</div>
                  <Button size="sm" className="mt-2 bg-red-600">
                    Add to Cart
                  </Button>
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">
                <strong>💡 Pro Tips:</strong>
              </p>
              <ul className="space-y-1 ml-4">
                <li>• Check dietary information and allergens before ordering</li>
                <li>• View preparation time to plan your meal timing</li>
                <li>• Read reviews from other customers</li>
                <li>• Use filters to find vegetarian, gluten-free, or other options</li>
              </ul>
            </div>
          </div>
        ),
        tips: [
          'Look for the green "Available" indicators',
          'Preparation times help you plan your visit',
          'Check reviews and ratings from other diners'
        ]
      },
      {
        id: 'ordering-process',
        title: 'Simple & Secure Ordering',
        description: 'Add items to cart and checkout seamlessly',
        icon: <ShoppingCart className="h-6 w-6 text-green-600" />,
        content: (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border-green-200 border">
              <h4 className="font-semibold text-gray-100 mb-3">Your Order Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Grilled Salmon × 1</span>
                  <span>$28.99</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Caesar Salad × 1</span>
                  <span>$12.99</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-green-600">$41.98</span>
                  </div>
                </div>
              </div>
              <Button className="w-full mt-3 bg-green-600">Proceed to Checkout</Button>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">
                <strong>🛡️ Secure Checkout Features:</strong>
              </p>
              <ul className="space-y-1 ml-4">
                <li>• Multiple payment options (card, digital wallets)</li>
                <li>• Order confirmation via SMS/email</li>
                <li>• Real-time order tracking</li>
                <li>• Easy order modifications before preparation starts</li>
              </ul>
            </div>
          </div>
        ),
        tips: [
          'Cart items are saved across sessions',
          'You can modify orders until kitchen starts preparing',
          'Choose pickup, delivery, or dine-in options'
        ]
      },
      {
        id: 'order-tracking',
        title: 'Track Your Order Live',
        description: 'Watch your order progress in real-time',
        icon: <CheckCircle className="h-6 w-6 text-primary" />,
        content: (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border-blue-200 border">
              <h4 className="font-semibold text-gray-100 mb-3">Order #ORD-1234</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <div className="font-medium">Order Confirmed</div>
                    <div className="text-xs text-muted-foreground">2:34 PM</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                    <ChefHat className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <div className="font-medium">Being Prepared</div>
                    <div className="text-xs text-muted-foreground">Est. ready: 2:52 PM</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-background rounded-full"></div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Ready for Pickup</div>
                    <div className="text-xs text-muted-foreground">Estimated: 2:55 PM</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">
                <strong>🔔 Notifications:</strong>
              </p>
              <ul className="space-y-1 ml-4">
                <li>• SMS updates at each stage</li>
                <li>• Push notifications on mobile</li>
                <li>• Email receipt and order details</li>
                <li>• Delay notifications if any issues occur</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'loyalty-program',
        title: 'Earn Rewards with Every Order',
        description: 'Join our loyalty program for exclusive benefits',
        icon: <TrendingUp className="h-6 w-6 text-yellow-600" />,
        content: (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-lg border-yellow-200 border">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-yellow-600">2,840</div>
                <div className="text-sm text-muted-foreground">Available Points</div>
                <Progress value={75} className="mt-2" />
                <div className="text-xs text-muted-foreground mt-1">725 points to Gold tier</div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-background p-2 rounded">
                  <div className="font-semibold text-yellow-600">Silver</div>
                  <div className="text-xs">Current Tier</div>
                </div>
                <div className="bg-background p-2 rounded">
                  <div className="font-semibold text-yellow-600">5%</div>
                  <div className="text-xs">Cashback Rate</div>
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">
                <strong>🎁 Member Benefits:</strong>
              </p>
              <ul className="space-y-1 ml-4">
                <li>• Earn 1 point per $1 spent</li>
                <li>• Birthday special offers</li>
                <li>• Early access to new menu items</li>
                <li>• Exclusive member-only events</li>
              </ul>
            </div>
          </div>
        )
      }
    ]

    const staffSteps: TourStep[] = [
      {
        id: 'kitchen-display',
        title: 'Kitchen Display System',
        description: 'Manage orders efficiently with real-time updates',
        icon: <ChefHat className="h-6 w-6 text-orange-600" />,
        content: (
          <div className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-lg border-orange-200 border">
              <h4 className="font-semibold text-gray-100 mb-3">Active Orders</h4>
              <div className="space-y-2">
                {['ORD-001', 'ORD-002'].map(order => (
                  <div key={order} className="bg-background p-3 rounded border-l-4 border-l-orange-500">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{order}</div>
                        <div className="text-sm text-muted-foreground">Table 7 • 3 items</div>
                      </div>
                      <Badge className="bg-orange-100 text-orange-700">Preparing</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'inventory-tracking',
        title: 'Smart Inventory Management',
        description: 'Track stock levels and get automatic alerts',
        icon: <Settings className="h-6 w-6 text-purple-600" />,
        content: (
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg border-purple-200 border">
              <h4 className="font-semibold text-gray-100 mb-3">Inventory Status</h4>
              <div className="space-y-2">
                <div className="p-2 bg-red-50 border border-red-200 rounded">
                  <div className="flex justify-between">
                    <span className="font-medium">Tomatoes</span>
                    <Badge variant="destructive">Low Stock</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">3 lbs remaining</div>
                </div>
              </div>
            </div>
          </div>
        )
      }
    ]

    const managerSteps: TourStep[] = [
      {
        id: 'analytics-dashboard',
        title: 'Real-time Analytics',
        description: 'Monitor performance with comprehensive insights',
        icon: <TrendingUp className="h-6 w-6 text-primary" />,
        content: (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border-blue-200 border">
              <h4 className="font-semibold text-gray-100 mb-3">Today's Performance</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background p-3 rounded text-center">
                  <div className="text-xl font-bold text-primary">$2,850</div>
                  <div className="text-sm text-muted-foreground">Revenue</div>
                </div>
                <div className="bg-background p-3 rounded text-center">
                  <div className="text-xl font-bold text-primary">47</div>
                  <div className="text-sm text-muted-foreground">Orders</div>
                </div>
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'staff-management',
        title: 'Staff Management',
        description: 'Coordinate your team efficiently',
        icon: <Users className="h-6 w-6 text-green-600" />,
        content: (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border-green-200 border">
              <h4 className="font-semibold text-gray-100 mb-3">Staff on Duty</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 bg-background p-2 rounded">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold">
                    EW
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Emma Wilson</div>
                    <div className="text-sm text-muted-foreground">Head Chef</div>
                  </div>
                  <Badge variant="default">On Duty</Badge>
                </div>
              </div>
            </div>
          </div>
        )
      }
    ]

    switch (type) {
      case 'customer':
        return [...commonSteps, ...customerSteps]
      case 'staff':
        return [...commonSteps, ...staffSteps]
      case 'manager':
      case 'owner':
        return [...commonSteps, ...managerSteps, ...staffSteps]
      default:
        return commonSteps
    }
  }

  const tourSteps = getTourSteps(userType)
  const progress = ((currentStep + 1) / tourSteps.length) * 100

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const skipTour = () => {
    onDismiss()
  }

  const playTour = () => {
    setIsPlaying(true)
    // Auto-advance every 5 seconds when playing
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < tourSteps.length - 1) {
          return prev + 1
        } else {
          setIsPlaying(false)
          clearInterval(interval)
          onComplete()
          return prev
        }
      })
    }, 5000)

    // Clean up interval if user manually navigates
    return () => clearInterval(interval)
  }

  if (!tourSteps.length) return null

  const currentStepData = tourSteps[currentStep]

  return (
    <Dialog open={isOpen} onOpenChange={onDismiss}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentStepData.icon}
              <div>
                <DialogTitle className="text-left">{currentStepData.title}</DialogTitle>
                <DialogDescription className="text-left">
                  {currentStepData.description}
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={skipTour}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                Step {currentStep + 1} of {tourSteps.length}
              </span>
              <span>{Math.round(progress)}% complete</span>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          {currentStepData.content}

          {currentStepData.tips && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-blue-900">Pro Tips</span>
              </div>
              <ul className="text-sm text-blue-800 space-y-1">
                {currentStepData.tips.map((tip, index) => (
                  <li key={index}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex gap-2">
            {currentStep === 0 && (
              <Button
                variant="outline"
                onClick={playTour}
                disabled={isPlaying}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                {isPlaying ? 'Playing...' : 'Auto Play'}
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <Button
              onClick={nextStep}
              className="flex items-center gap-1 bg-red-600 hover:bg-red-700"
            >
              {currentStep === tourSteps.length - 1 ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Complete
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default OnboardingTour
