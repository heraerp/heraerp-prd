'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Rocket, Calendar, Bell, Mail, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ComingSoonProps {
  title: string
  description?: string
  estimatedDate?: string
  features?: string[]
  showNotification?: boolean
  icon?: React.ElementType
  gradient?: string
}

export default function ComingSoon({
  title = 'Coming Soon',
  description = "We're working hard to bring you this amazing feature. Stay tuned!",
  estimatedDate,
  features = [],
  showNotification = true,
  icon: Icon = Rocket,
  gradient = 'from-blue-600 to-purple-600'
}: ComingSoonProps) {
  const router = useRouter()
  const [email, setEmail] = React.useState('')
  const [subscribed, setSubscribed] = React.useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would send to an API
    setSubscribed(true)
    setTimeout(() => setSubscribed(false), 5000)
    setEmail('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Back Button */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        {/* Main Content */}
        <div className="bg-background rounded-3xl shadow-2xl overflow-hidden">
          {/* Header with Gradient */}
          <div className={`bg-gradient-to-r ${gradient} p-12 text-foreground text-center`}>
            <div className="w-24 h-24 mx-auto mb-6 bg-background/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Icon className="w-12 h-12 text-foreground" />
            </div>
            <h1 className="text-4xl font-bold mb-4">{title}</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">{description}</p>
          </div>

          {/* Content Section */}
          <div className="p-12">
            {/* Estimated Date */}
            {estimatedDate && (
              <div className="flex items-center justify-center gap-3 mb-8 text-muted-foreground">
                <Calendar className="w-5 h-5" />
                <span className="text-lg">Expected: {estimatedDate}</span>
              </div>
            )}

            {/* Features Preview */}
            {features.length > 0 && (
              <div className="mb-12">
                <h3 className="text-xl font-semibold text-gray-100 mb-6 text-center">
                  What&apos;s Coming
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-muted rounded-xl">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="ink">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Email Notification */}
            {showNotification && (
              <div className="max-w-md mx-auto">
                <div className="bg-muted rounded-2xl p-8 text-center">
                  <Bell className="w-10 h-10 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-100 mb-2">Get Notified</h3>
                  <p className="text-muted-foreground mb-6">
                    Be the first to know when this feature launches
                  </p>

                  {subscribed ? (
                    <div className="text-green-600 font-medium">
                      ✓ Thanks! We&apos;ll notify you when it&apos;s ready.
                    </div>
                  ) : (
                    <form onSubmit={handleSubscribe} className="flex gap-2">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                        Notify Me
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Back to Dashboard
              </Button>
              <Button
                size="lg"
                onClick={() => router.push('/dashboard')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-foreground"
              >
                Explore Other Features
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-muted-foreground text-sm">
          <p>
            Have questions? Contact us at{' '}
            <a href="mailto:support@heraerp.com" className="text-primary hover:underline">
              support@heraerp.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
