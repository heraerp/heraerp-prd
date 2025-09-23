'use client'

import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Home, Monitor, Shield, Zap, Users, TrendingUp, CheckCircle, ArrowRight, Globe, Wifi } from 'lucide-react'

export default function ISPPresentation() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const slides = [
    // Slide 1: Title Slide
    {
      id: 'title',
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="mb-8">
            <Wifi className="w-24 h-24 text-white mx-auto mb-4 animate-pulse" />
          </div>
          <h1 className="text-6xl md:text-7xl font-bold mb-6 text-white">
            HERA ERP for ISP
          </h1>
          <p className="text-2xl md:text-3xl text-white/90 mb-8">
            Revolutionary Business Management Solution
          </p>
          <p className="text-xl text-white/80">
            Transforming Internet Service Providers with Universal Architecture
          </p>
        </div>
      )
    },
    // Slide 2: The Challenge
    {
      id: 'challenge',
      content: (
        <div className="flex flex-col justify-center h-full">
          <h2 className="text-5xl font-bold mb-8 text-center" style={{ color: '#E85D75' }}>
            The ISP Challenge
          </h2>
          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h3 className="text-2xl font-semibold mb-3 text-white">Manual Operations</h3>
                <p className="text-white/80">Spreadsheets, paper forms, and disconnected systems slowing down growth</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h3 className="text-2xl font-semibold mb-3 text-white">Billing Complexity</h3>
                <p className="text-white/80">Managing thousands of subscribers with varying plans and payment cycles</p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h3 className="text-2xl font-semibold mb-3 text-white">Service Tracking</h3>
                <p className="text-white/80">No real-time visibility into network status and customer issues</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h3 className="text-2xl font-semibold mb-3 text-white">Growth Barriers</h3>
                <p className="text-white/80">Traditional ERPs cost millions and take years to implement</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    // Slide 3: HERA Solution
    {
      id: 'solution',
      content: (
        <div className="flex flex-col justify-center h-full">
          <h2 className="text-5xl font-bold mb-8 text-center" style={{ color: '#5457A6' }}>
            The HERA Solution
          </h2>
          <p className="text-2xl text-center mb-12 text-white/90">
            One Universal Platform • Zero Schema Changes • Infinite Possibilities
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/30 hover:scale-105 transition-transform">
              <Monitor className="w-12 h-12 mb-4" style={{ color: '#FF6600' }} />
              <h3 className="text-xl font-semibold mb-2 text-white">30-Second Setup</h3>
              <p className="text-white/80">From zero to fully operational ISP management system</p>
            </div>
            <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/30 hover:scale-105 transition-transform">
              <Shield className="w-12 h-12 mb-4" style={{ color: '#FFD700' }} />
              <h3 className="text-xl font-semibold mb-2 text-white">6-Table Architecture</h3>
              <p className="text-white/80">Universal design handles all ISP complexity without customization</p>
            </div>
            <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/30 hover:scale-105 transition-transform">
              <Zap className="w-12 h-12 mb-4" style={{ color: '#FF6600' }} />
              <h3 className="text-xl font-semibold mb-2 text-white">AI-Powered</h3>
              <p className="text-white/80">Smart automation for billing, support, and network management</p>
            </div>
          </div>
        </div>
      )
    },
    // Slide 4: Key Features
    {
      id: 'features',
      content: (
        <div className="flex flex-col justify-center h-full">
          <h2 className="text-5xl font-bold mb-10 text-center" style={{ color: '#E85D75' }}>
            ISP-Specific Features
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 flex-shrink-0 mt-1" style={{ color: '#FFD700' }} />
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Subscriber Management</h3>
                  <p className="text-white/80">Complete lifecycle from signup to service delivery</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 flex-shrink-0 mt-1" style={{ color: '#FFD700' }} />
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Automated Billing</h3>
                  <p className="text-white/80">Recurring invoices, payment tracking, and dunning</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 flex-shrink-0 mt-1" style={{ color: '#FFD700' }} />
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Network Monitoring</h3>
                  <p className="text-white/80">Real-time status of all connections and equipment</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 flex-shrink-0 mt-1" style={{ color: '#FFD700' }} />
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Support Ticketing</h3>
                  <p className="text-white/80">AI-powered customer support and issue resolution</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 flex-shrink-0 mt-1" style={{ color: '#FFD700' }} />
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Financial Reporting</h3>
                  <p className="text-white/80">Real-time P&L, cash flow, and revenue analytics</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 flex-shrink-0 mt-1" style={{ color: '#FFD700' }} />
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Mobile App</h3>
                  <p className="text-white/80">Field technicians and customers on the go</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    // Slide 5: Business Impact
    {
      id: 'impact',
      content: (
        <div className="flex flex-col justify-center h-full">
          <h2 className="text-5xl font-bold mb-10 text-center" style={{ color: '#5457A6' }}>
            Transformational Impact
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20">
              <div className="text-4xl font-bold mb-2" style={{ color: '#FF6600' }}>90%</div>
              <p className="text-white/80">Reduction in manual work</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20">
              <div className="text-4xl font-bold mb-2" style={{ color: '#FFD700' }}>24/7</div>
              <p className="text-white/80">Automated operations</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20">
              <div className="text-4xl font-bold mb-2" style={{ color: '#FF6600' }}>5x</div>
              <p className="text-white/80">Faster customer onboarding</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20">
              <div className="text-4xl font-bold mb-2" style={{ color: '#FFD700' }}>₹2L</div>
              <p className="text-white/80">Monthly savings</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/30">
            <p className="text-xl text-center text-white">
              <span className="font-semibold">Kerala Vision Case Study:</span> Managing 50,000+ subscribers 
              with zero downtime, automated billing, and real-time network monitoring
            </p>
          </div>
        </div>
      )
    },
    // Slide 6: Implementation
    {
      id: 'implementation',
      content: (
        <div className="flex flex-col justify-center h-full">
          <h2 className="text-5xl font-bold mb-10 text-center" style={{ color: '#E85D75' }}>
            Implementation Timeline
          </h2>
          <div className="max-w-4xl mx-auto w-full">
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full w-16 h-16 flex items-center justify-center font-bold text-xl flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-white mb-2">Week 1-2: Setup & Migration</h3>
                  <p className="text-white/80">Import subscriber data, configure billing cycles, set up user accounts</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-full w-16 h-16 flex items-center justify-center font-bold text-xl flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-white mb-2">Week 3-4: Integration</h3>
                  <p className="text-white/80">Connect payment gateways, SMS providers, and network monitoring tools</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full w-16 h-16 flex items-center justify-center font-bold text-xl flex-shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-white mb-2">Week 5-6: Training & Launch</h3>
                  <p className="text-white/80">Staff training, pilot testing, and full production launch</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    // Slide 7: Call to Action
    {
      id: 'cta',
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-8" style={{ color: '#5457A6' }}>
            Ready to Transform?
          </h2>
          <p className="text-2xl mb-12 text-white/90 max-w-3xl">
            Join the revolution in ISP management. Deploy HERA in 30 seconds and see immediate results.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 mb-12">
            <button className="px-8 py-4 text-xl font-semibold rounded-xl transition-all transform hover:scale-105" 
                    style={{ backgroundColor: '#FF6600', color: 'white' }}>
              Schedule Demo
              <ArrowRight className="inline ml-2" />
            </button>
            <button className="px-8 py-4 text-xl font-semibold rounded-xl border-2 text-white transition-all transform hover:scale-105"
                    style={{ borderColor: '#FFD700' }}>
              Download Whitepaper
            </button>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20">
            <p className="text-lg mb-4 text-white">Contact Information</p>
            <p className="text-xl font-semibold text-white">sales@heraerp.com | +91 98765 43210</p>
            <p className="text-lg mt-2 text-white/80">www.heraerp.com/isp</p>
          </div>
        </div>
      )
    }
  ]

  const nextSlide = () => {
    if (!isAnimating && currentSlide < slides.length - 1) {
      setIsAnimating(true)
      setCurrentSlide(prev => prev + 1)
      setTimeout(() => setIsAnimating(false), 600)
    }
  }

  const prevSlide = () => {
    if (!isAnimating && currentSlide > 0) {
      setIsAnimating(true)
      setCurrentSlide(prev => prev - 1)
      setTimeout(() => setIsAnimating(false), 600)
    }
  }

  const goToSlide = (index: number) => {
    if (!isAnimating && index !== currentSlide) {
      setIsAnimating(true)
      setCurrentSlide(index)
      setTimeout(() => setIsAnimating(false), 600)
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        nextSlide()
      } else if (e.key === 'ArrowLeft') {
        prevSlide()
      } else if (e.key === 'Escape') {
        goToSlide(0)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentSlide, isAnimating])

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #7A004B 0%, #1C1F66 100%)'
    }}>
      {/* Background particles effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 rounded-full blur-3xl opacity-20"
             style={{ background: '#FF6600', top: '-10%', right: '-10%' }} />
        <div className="absolute w-96 h-96 rounded-full blur-3xl opacity-20"
             style={{ background: '#FFD700', bottom: '-10%', left: '-10%' }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-6xl mx-auto">
          {/* Slide container */}
          <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl p-12 border border-white/10 shadow-2xl min-h-[600px]">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`absolute inset-0 p-12 transition-all duration-600 ${
                  index === currentSlide 
                    ? 'opacity-100 translate-x-0' 
                    : index < currentSlide 
                      ? 'opacity-0 -translate-x-full' 
                      : 'opacity-0 translate-x-full'
                }`}
              >
                {slide.content}
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className={`p-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 transition-all ${
                currentSlide === 0 
                  ? 'opacity-30 cursor-not-allowed' 
                  : 'hover:bg-white/20 hover:scale-105'
              }`}
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>

            {/* Slide indicators */}
            <div className="flex gap-3">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentSlide 
                      ? 'w-8 bg-white' 
                      : 'w-2 bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextSlide}
              disabled={currentSlide === slides.length - 1}
              className={`p-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 transition-all ${
                currentSlide === slides.length - 1 
                  ? 'opacity-30 cursor-not-allowed' 
                  : 'hover:bg-white/20 hover:scale-105'
              }`}
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Slide counter */}
          <div className="text-center mt-4 text-white/60">
            {currentSlide + 1} / {slides.length}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 text-white/60 text-sm">
        <p>Use arrow keys or space bar to navigate</p>
      </div>
    </div>
  )
}