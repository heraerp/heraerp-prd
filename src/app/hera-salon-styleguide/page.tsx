'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/hera-salon/Button'
import { Input } from '@/components/ui/hera-salon/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/hera-salon/Card'
import { Badge } from '@/components/ui/hera-salon/Badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/hera-salon/Alert'
import { Modal, ModalContent, ModalDescription, ModalHeader, ModalTitle, ModalTrigger } from '@/components/ui/hera-salon/Modal'
import { Label } from '@/components/ui/hera-salon/Label'
import { Textarea } from '@/components/ui/hera-salon/Textarea'
import { Checkbox } from '@/components/ui/hera-salon/Checkbox'
import { 
  Calendar,
  Heart, 
  Scissors,
  Sparkles,
  Star,
  Sun,
  Moon,
  Palette,
  Type,
  Square,
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
  Search,
  Mail,
  Phone
} from 'lucide-react'

export default function HERASalonStyleGuide() {
  const [darkMode, setDarkMode] = useState(false)
  const [loading, setLoading] = useState(false)

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const colors = {
    primary: [
      { shade: '50', hex: '#EEF2FF', name: 'primary-50' },
      { shade: '100', hex: '#E0E7FF', name: 'primary-100' },
      { shade: '200', hex: '#C7D2FE', name: 'primary-200' },
      { shade: '300', hex: '#A5B4FC', name: 'primary-300' },
      { shade: '400', hex: '#8B80F9', name: 'primary-400' },
      { shade: '500', hex: '#7C7CF4', name: 'primary-500' },
      { shade: '600', hex: '#6366F1', name: 'primary-600' },
      { shade: '700', hex: '#4338CA', name: 'primary-700' },
      { shade: '800', hex: '#3730A3', name: 'primary-800' },
      { shade: '900', hex: '#312E81', name: 'primary-900' },
    ],
    pink: [
      { shade: '50', hex: '#FDF2F8', name: 'pink-50' },
      { shade: '100', hex: '#FCE7F3', name: 'pink-100' },
      { shade: '200', hex: '#FBCFE8', name: 'pink-200' },
      { shade: '300', hex: '#F9A8D4', name: 'pink-300' },
      { shade: '400', hex: '#F472B6', name: 'pink-400' },
      { shade: '500', hex: '#EC4899', name: 'pink-500' },
      { shade: '600', hex: '#DB2777', name: 'pink-600' },
      { shade: '700', hex: '#BE185D', name: 'pink-700' },
      { shade: '800', hex: '#9D174D', name: 'pink-800' },
      { shade: '900', hex: '#831843', name: 'pink-900' },
    ],
    teal: [
      { shade: '50', hex: '#ECFDF5', name: 'teal-50' },
      { shade: '100', hex: '#D1FAE5', name: 'teal-100' },
      { shade: '200', hex: '#A7F3D0', name: 'teal-200' },
      { shade: '300', hex: '#6EE7B7', name: 'teal-300' },
      { shade: '400', hex: '#34D399', name: 'teal-400' },
      { shade: '500', hex: '#10B981', name: 'teal-500' },
      { shade: '600', hex: '#059669', name: 'teal-600' },
      { shade: '700', hex: '#047857', name: 'teal-700' },
      { shade: '800', hex: '#065F46', name: 'teal-800' },
      { shade: '900', hex: '#064E3B', name: 'teal-900' },
    ]
  }

  const handleLoadingDemo = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <div className="border-b border-hera-line-200 dark:border-hera-border bg-white dark:bg-hera-card">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-hera-primary-500 to-hera-pink-500 flex items-center justify-center">
                <Scissors className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="hera-h1">HERA Salon</h1>
                <p className="hera-subtle">Design System & Style Guide</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {darkMode ? 'Light' : 'Dark'} Mode
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-12">
        
        {/* Brand Colors */}
        <section>
          <div className="flex items-center space-x-2 mb-6">
            <Palette className="w-5 h-5 text-hera-primary-600" />
            <h2 className="hera-h2">Brand Colors</h2>
          </div>
          
          <div className="space-y-8">
            {Object.entries(colors).map(([colorName, shades]) => (
              <div key={colorName}>
                <h3 className="hera-h4 mb-4 capitalize">{colorName}</h3>
                <div className="grid grid-cols-10 gap-2">
                  {shades.map((color) => (
                    <div key={color.shade} className="text-center">
                      <div 
                        className="w-full h-16 rounded-lg shadow-hera-sm mb-2"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div className="text-xs">
                        <div className="font-medium">{color.shade}</div>
                        <div className="hera-subtle">{color.hex}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Functional Colors */}
          <div className="mt-8">
            <h3 className="hera-h4 mb-4">Functional Colors</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-full h-16 rounded-lg bg-green-500 shadow-hera-sm mb-2" />
                <div className="text-sm font-medium">Success</div>
                <div className="hera-subtle">#22C55E</div>
              </div>
              <div className="text-center">
                <div className="w-full h-16 rounded-lg bg-yellow-500 shadow-hera-sm mb-2" />
                <div className="text-sm font-medium">Warning</div>
                <div className="hera-subtle">#F59E0B</div>
              </div>
              <div className="text-center">
                <div className="w-full h-16 rounded-lg bg-red-500 shadow-hera-sm mb-2" />
                <div className="text-sm font-medium">Danger</div>
                <div className="hera-subtle">#EF4444</div>
              </div>
              <div className="text-center">
                <div className="w-full h-16 rounded-lg bg-blue-500 shadow-hera-sm mb-2" />
                <div className="text-sm font-medium">Info</div>
                <div className="hera-subtle">#3B82F6</div>
              </div>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section>
          <div className="flex items-center space-x-2 mb-6">
            <Type className="w-5 h-5 text-hera-primary-600" />
            <h2 className="hera-h2">Typography</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <h1 className="hera-h1">Heading 1 - Welcome to HERA Salon</h1>
              <p className="hera-subtle mt-1">48px/56px • font-bold • tracking-tight</p>
            </div>
            
            <div>
              <h2 className="hera-h2">Heading 2 - Premium Beauty Services</h2>
              <p className="hera-subtle mt-1">32px/40px • font-semibold • tracking-tight</p>
            </div>
            
            <div>
              <h3 className="hera-h3">Heading 3 - Hair & Spa Treatments</h3>
              <p className="hera-subtle mt-1">24px/32px • font-semibold</p>
            </div>
            
            <div>
              <h4 className="hera-h4">Heading 4 - Booking Information</h4>
              <p className="hera-subtle mt-1">20px/28px • font-semibold</p>
            </div>
            
            <div>
              <p className="hera-body-lg">Body Large - Experience the finest in beauty and wellness at HERA Salon, where luxury meets expertise.</p>
              <p className="hera-subtle mt-1">18px/28px • leading-7</p>
            </div>
            
            <div>
              <p className="hera-body">Body Text - Our skilled professionals use premium products and cutting-edge techniques to deliver exceptional results tailored to your unique style and preferences.</p>
              <p className="hera-subtle mt-1">16px/26px • leading-relaxed</p>
            </div>
            
            <div>
              <p className="hera-subtle">Subtle Text - Additional information and supporting details are displayed in this lighter tone to maintain hierarchy.</p>
              <p className="hera-subtle mt-1">14px/22px • text-muted</p>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section>
          <div className="flex items-center space-x-2 mb-6">
            <Square className="w-5 h-5 text-hera-primary-600" />
            <h2 className="hera-h2">Buttons</h2>
          </div>
          
          <div className="space-y-8">
            <div>
              <h3 className="hera-h4 mb-4">Variants</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Book Appointment</Button>
                <Button variant="secondary">View Services</Button>
                <Button variant="ghost">Learn More</Button>
                <Button variant="destructive">Cancel Booking</Button>
                <Button variant="link">Contact Us</Button>
              </div>
            </div>

            <div>
              <h3 className="hera-h4 mb-4">Sizes</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm">Small Button</Button>
                <Button size="md">Medium Button</Button>
                <Button size="lg">Large Button</Button>
              </div>
            </div>

            <div>
              <h3 className="hera-h4 mb-4">States</h3>
              <div className="flex flex-wrap gap-4">
                <Button>Normal</Button>
                <Button disabled>Disabled</Button>
                <Button loading={loading} onClick={handleLoadingDemo}>
                  {loading ? 'Booking...' : 'Book Now'}
                </Button>
                <Button leftIcon={<Calendar />}>With Left Icon</Button>
                <Button rightIcon={<Heart />}>With Right Icon</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Form Controls */}
        <section>
          <h2 className="hera-h2 mb-6">Form Controls</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Input Fields</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="Enter your name" className="mt-1" />
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="you@example.com" 
                    leftIcon={<Mail />}
                    className="mt-1" 
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="+1 (555) 123-4567" 
                    leftIcon={<Phone />}
                    className="mt-1" 
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Enter password"
                    className="mt-1" 
                  />
                </div>

                <div>
                  <Label htmlFor="error-input">Error State</Label>
                  <Input 
                    id="error-input" 
                    error 
                    placeholder="This field has an error"
                    className="mt-1" 
                  />
                </div>

                <div>
                  <Label htmlFor="search">Search</Label>
                  <Input 
                    id="search" 
                    placeholder="Search services..." 
                    rightIcon={<Search />}
                    className="mt-1" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Other Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Tell us about your beauty goals..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="error-message">Error Message</Label>
                  <Textarea 
                    id="error-message" 
                    error 
                    placeholder="This textarea has an error"
                    className="mt-1"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Preferences</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="newsletter" />
                      <Label htmlFor="newsletter">Subscribe to newsletter</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="sms" />
                      <Label htmlFor="sms">Receive SMS reminders</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="promotions" defaultChecked />
                      <Label htmlFor="promotions">Special offers & promotions</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Cards */}
        <section>
          <h2 className="hera-h2 mb-6">Cards</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Scissors className="w-5 h-5 text-hera-primary-600" />
                  <CardTitle>Hair Services</CardTitle>
                </div>
                <CardDescription>
                  Professional cuts, styling, and treatments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="hera-body">From classic cuts to avant-garde styles, our expert stylists create looks that reflect your personality.</p>
                <Button className="w-full mt-4" size="sm">View Services</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-hera-pink-600" />
                  <CardTitle>Spa Treatments</CardTitle>
                </div>
                <CardDescription>
                  Rejuvenating facials and wellness therapies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="hera-body">Indulge in our luxurious spa treatments designed to relax, rejuvenate, and restore your natural glow.</p>
                <Button className="w-full mt-4" size="sm" variant="secondary">Book Treatment</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-hera-teal-600" />
                  <CardTitle>VIP Packages</CardTitle>
                </div>
                <CardDescription>
                  Exclusive experiences for our valued clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="hera-body">Enjoy premium services with priority booking, complimentary refreshments, and personalized attention.</p>
                <Button className="w-full mt-4" size="sm" variant="ghost">Learn More</Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Badges */}
        <section>
          <h2 className="hera-h2 mb-6">Badges</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="hera-h4 mb-3">Variants</h3>
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="primary">Primary</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="pink">Pink</Badge>
                <Badge variant="teal">Teal</Badge>
              </div>
            </div>

            <div>
              <h3 className="hera-h4 mb-3">Usage Examples</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="success">Available</Badge>
                <Badge variant="warning">Busy</Badge>
                <Badge variant="destructive">Closed</Badge>
                <Badge variant="pink">VIP Client</Badge>
                <Badge variant="teal">New Service</Badge>
                <Badge variant="outline">Premium</Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Alerts */}
        <section>
          <h2 className="hera-h2 mb-6">Alerts</h2>
          
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>
                Your appointment has been confirmed for tomorrow at 2:00 PM.
              </AlertDescription>
            </Alert>

            <Alert variant="success">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                Your booking has been successfully processed! Check your email for confirmation details.
              </AlertDescription>
            </Alert>

            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Please arrive 15 minutes early for your chemical treatment to allow time for consultation.
              </AlertDescription>
            </Alert>

            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Unable to process your payment. Please check your card details and try again.
              </AlertDescription>
            </Alert>
          </div>
        </section>

        {/* Modal */}
        <section>
          <h2 className="hera-h2 mb-6">Modal</h2>
          
          <Modal>
            <ModalTrigger asChild>
              <Button>Open Booking Modal</Button>
            </ModalTrigger>
            <ModalContent className="max-w-md">
              <ModalHeader>
                <ModalTitle>Book Your Appointment</ModalTitle>
                <ModalDescription>
                  Schedule your next beauty session with our expert team.
                </ModalDescription>
              </ModalHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="service-select">Select Service</Label>
                  <Input id="service-select" placeholder="Choose a service..." className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="date-select">Preferred Date</Label>
                  <Input id="date-select" type="date" className="mt-1" />
                </div>
                <div className="flex space-x-2">
                  <Button className="flex-1">Book Now</Button>
                  <Button variant="outline" className="flex-1">Cancel</Button>
                </div>
              </div>
            </ModalContent>
          </Modal>
        </section>

      </div>
    </div>
  )
}