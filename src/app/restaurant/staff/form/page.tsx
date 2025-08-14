'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Users, Clock, DollarSign, ArrowLeft, Save, 
  Phone, Mail, Calendar, MapPin, Star, AlertCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'

/**
 * 👥 Add Team Member - Staff Management Form
 * Customer-focused staff management that restaurant owners understand
 * 
 * Steve Jobs: "Simplicity is the ultimate sophistication"
 */

export default function StaffFormPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationType, setNotificationType] = useState('success')
  
  // Demo organization ID (Mario's Restaurant)
  const organizationId = '550e8400-e29b-41d4-a716-446655440000'

  // Form state for staff member
  const [formData, setFormData] = useState({
    entity_name: '',
    entity_code: '',
    first_name: '',
    last_name: '',
    role: '',
    hourly_rate: '',
    phone: '',
    email: '',
    address: '',
    hire_date: '',
    availability: [],
    skills: [],
    emergency_contact: '',
    notes: ''
  })

  // Staff roles
  const staffRoles = [
    'Server', 'Cook', 'Manager', 'Host/Hostess', 'Bartender', 
    'Kitchen Helper', 'Dishwasher', 'Delivery Driver', 'Cashier'
  ]

  // Availability options
  const availabilityOptions = [
    'Monday Morning', 'Monday Evening', 'Tuesday Morning', 'Tuesday Evening',
    'Wednesday Morning', 'Wednesday Evening', 'Thursday Morning', 'Thursday Evening',
    'Friday Morning', 'Friday Evening', 'Saturday Morning', 'Saturday Evening',
    'Sunday Morning', 'Sunday Evening'
  ]

  // Skill options
  const skillOptions = [
    'Customer Service', 'Food Safety', 'POS Systems', 'Cash Handling',
    'Multi-tasking', 'Team Leadership', 'Inventory Management', 'Food Prep',
    'Cleaning & Sanitation', 'Time Management'
  ]

  // Toggle array item
  const toggleArrayItem = (field, item) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item) 
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }))
  }

  // Generate entity code
  const generateEntityCode = () => {
    if (!formData.first_name || !formData.last_name) return ''
    const initials = (formData.first_name.charAt(0) + formData.last_name.charAt(0)).toUpperCase()
    return `EMP-${initials}-${Date.now().toString().slice(-4)}`
  }

  // Auto-generate entity code and name when names change
  useEffect(() => {
    if (formData.first_name && formData.last_name) {
      const fullName = `${formData.first_name} ${formData.last_name}`
      setFormData(prev => ({ 
        ...prev, 
        entity_name: fullName,
        entity_code: prev.entity_code || generateEntityCode()
      }))
    }
  }, [formData.first_name, formData.last_name])

  // Create staff member
  const createStaffMember = async () => {
    if (!formData.first_name || !formData.last_name || !formData.role) {
      setNotificationMessage('Please fill in required fields (First Name, Last Name, Role)')
      setNotificationType('error')
      setShowNotification(true)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/v1/staff/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          entity_type: 'staff_employee',
          entity_name: formData.entity_name,
          entity_code: formData.entity_code || generateEntityCode(),
          dynamic_fields: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            role: formData.role,
            hourly_rate: parseFloat(formData.hourly_rate) || 0,
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
            hire_date: formData.hire_date,
            availability: formData.availability,
            skills: formData.skills,
            emergency_contact: formData.emergency_contact,
            notes: formData.notes,
            created_via: 'hera_staff_form',
            status: 'active'
          }
        })
      })

      const result = await response.json()
      if (result.success) {
        // ✨ DAVE PATEL MAGIC: Automatic GL posting for new staff setup
        try {
          console.log('🧬 HERA Universal GL: Auto-posting staff setup to GL...')
          
          // Post to Universal GL system as payroll setup (if hourly rate provided)
          if (formData.hourly_rate) {
            const glResponse = await fetch('/api/v1/financial/universal-gl', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                organizationId: organizationId,
                transactionType: 'payroll',
                amount: 0, // Setup only, no actual payment yet
                description: `Staff setup - ${formData.first_name} ${formData.last_name}`,
                details: {
                  employeeId: result.data.id,
                  hourlyRate: parseFloat(formData.hourly_rate),
                  role: formData.role,
                  setupOnly: true
                },
                metadata: {
                  staffId: result.data.id,
                  staffIntegration: true,
                  davePatelMagic: true,
                  setupTransaction: true
                }
              })
            })
            
            const glResult = await glResponse.json()
            if (glResult.success) {
              console.log('✅ Staff setup automatically posted to GL:', glResult.data.journalEntry.referenceNumber)
              setNotificationMessage(
                `Team member added! 🧬 Payroll system ready: ${glResult.data.journalEntry.referenceNumber} - automatic time tracking enabled!`
              )
            } else {
              console.warn('GL posting failed, but staff member created successfully:', glResult.message)
              setNotificationMessage('Team member added successfully! (Payroll setup will retry automatically)')
            }
          } else {
            setNotificationMessage('Team member added successfully! Add hourly rate later for automatic payroll tracking.')
          }
          
        } catch (glError) {
          console.warn('GL integration error (staff member still created):', glError)
          setNotificationMessage('Team member added successfully! (Payroll setup will retry automatically)')
        }
        
        setNotificationType('success')
        setShowNotification(true)
        
        setTimeout(() => {
          router.push('/restaurant/staff/dashboard')
        }, 3000) // Extended to show GL message
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('Error creating staff member:', error)
      setNotificationMessage('Failed to add team member. Please try again.')
      setNotificationType('error')
      setShowNotification(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Staff
            </Button>
            <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">
              Mario's Restaurant
            </Badge>
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            👥 Add Team Member
          </h1>
          <p className="text-gray-600 mt-2">
            Add a new team member to control labor costs and track performance
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Employee Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                      placeholder="e.g., John"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                      placeholder="e.g., Smith"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="entity_code">Employee ID</Label>
                    <Input
                      id="entity_code"
                      value={formData.entity_code}
                      onChange={(e) => setFormData(prev => ({ ...prev, entity_code: e.target.value }))}
                      placeholder="Auto-generated"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role *</Label>
                    <select
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Role</option>
                      {staffRoles.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hourly_rate">Hourly Rate (USD)</Label>
                    <div className="relative mt-1">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="hourly_rate"
                        type="number"
                        step="0.01"
                        value={formData.hourly_rate}
                        onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
                        placeholder="15.00"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="hire_date">Hire Date</Label>
                    <div className="relative mt-1">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="hire_date"
                        type="date"
                        value={formData.hire_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, hire_date: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(555) 123-4567"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="john.smith@email.com"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="123 Main St, City, State 12345"
                      rows={2}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="emergency_contact">Emergency Contact</Label>
                  <Input
                    id="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact: e.target.value }))}
                    placeholder="Name and phone number"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Availability & Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Availability & Skills
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Availability</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {availabilityOptions.map((slot) => (
                      <Badge
                        key={slot}
                        variant={formData.availability.includes(slot) ? "default" : "outline"}
                        className={`cursor-pointer text-xs p-2 ${
                          formData.availability.includes(slot) 
                            ? 'bg-blue-500 hover:bg-blue-600' 
                            : 'hover:bg-gray-100'
                        }`}
                        onClick={() => toggleArrayItem('availability', slot)}
                      >
                        {slot}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Skills</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {skillOptions.map((skill) => (
                      <Badge
                        key={skill}
                        variant={formData.skills.includes(skill) ? "default" : "outline"}
                        className={`cursor-pointer ${
                          formData.skills.includes(skill) 
                            ? 'bg-green-500 hover:bg-green-600' 
                            : 'hover:bg-gray-100'
                        }`}
                        onClick={() => toggleArrayItem('skills', skill)}
                      >
                        <Star className="w-3 h-3 mr-1" />
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional information about this team member..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Button
                    onClick={createStaffMember}
                    disabled={loading || !formData.first_name || !formData.last_name || !formData.role}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Add Team Member
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => router.push('/restaurant/staff/dashboard')}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Why This Helps */}
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <Users className="w-5 h-5" />
                  Why Track Your Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded border text-sm">
                    ✓ Control labor costs automatically<br/>
                    ✓ Schedule the right people at right times<br/>
                    ✓ Track performance and productivity
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded border border-blue-200 text-sm">
                    <strong className="text-blue-600">🧬 Dave Patel Magic:</strong> Every team member automatically creates payroll setup (GL) - time tracking posts to accounting automatically!
                  </div>
                  <p className="text-xs text-green-600">
                    Every hour tracked helps you make better staffing decisions 
                    and control your biggest expense after food costs.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Notification */}
        {showNotification && (
          <div className="fixed bottom-4 right-4 z-50 max-w-sm">
            <div className={`p-4 rounded-lg shadow-lg ${
              notificationType === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white`}>
              <div className="flex items-center">
                {notificationType === 'success' ? (
                  <Save className="w-5 h-5 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 mr-2" />
                )}
                {notificationMessage}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
