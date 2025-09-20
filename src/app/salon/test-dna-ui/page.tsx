// ================================================================================
// HERA DNA UI TEST PAGE
// Smart Code: HERA.PAGES.TEST.DNA.UI.V1
// Test page for all HERA DNA UI components with theme system
// ================================================================================

'use client'

import React, { useState } from 'react'
import {
  FormFieldDNA,
  PageHeaderDNA,
  CardDNA,
  InfoCardDNA,
  SuccessCardDNA,
  WarningCardDNA,
  DangerCardDNA,
  ButtonDNA,
  PrimaryButtonDNA,
  SecondaryButtonDNA,
  DangerButtonDNA,
  GhostButtonDNA,
  BadgeDNA,
  SuccessBadgeDNA,
  WarningBadgeDNA,
  DangerBadgeDNA,
  InfoBadgeDNA,
  ScrollAreaDNA
} from '@/lib/dna/components/ui'
import {
  Calendar,
  User,
  Mail,
  Phone,
  Search,
  Filter,
  Plus,
  Save,
  Trash2,
  Edit,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  XCircle,
  Info,
  Settings,
  DollarSign,
  Clock,
  MapPin
} from 'lucide-react'

// Sample data for lists
const sampleCustomers = [
  {
    id: 1,
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    phone: '+1234567890',
    status: 'active'
  },
  { id: 2, name: 'Mike Chen', email: 'mike@example.com', phone: '+0987654321', status: 'pending' },
  {
    id: 3,
    name: 'Emma Wilson',
    email: 'emma@example.com',
    phone: '+1122334455',
    status: 'inactive'
  },
  { id: 4, name: 'John Davis', email: 'john@example.com', phone: '+5544332211', status: 'active' },
  { id: 5, name: 'Lisa Brown', email: 'lisa@example.com', phone: '+9988776655', status: 'active' }
]

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'inactive', label: 'Inactive' }
]

export default function TestDNAUIPage() {
  // Form states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [status, setStatus] = useState('active')
  const [notes, setNotes] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(false)

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  const handleSave = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 2000)
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main content - sidebar handled by layout */}
      <main>
        <PageHeaderDNA
          title="HERA DNA UI Components"
          subtitle="Complete UI kit with built-in dark mode support"
          icon={Settings}
          actions={
            <ButtonDNA icon={theme === 'light' ? Clock : Calendar} onClick={toggleTheme}>
              {theme === 'light' ? 'Dark' : 'Light'} Mode
            </ButtonDNA>
          }
        />

        <div className="container mx-auto px-6 py-8 space-y-12">
          {/* Form Section */}
          <section id="forms">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
              Form Components
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CardDNA title="Customer Information" icon={User}>
                <div className="space-y-4">
                  <FormFieldDNA
                    type="text"
                    label="Full Name"
                    value={name}
                    onChange={setName}
                    placeholder="Enter customer name"
                    icon={User}
                    helper="Legal name as it appears on documents"
                  />

                  <FormFieldDNA
                    type="email"
                    label="Email Address"
                    value={email}
                    onChange={setEmail}
                    placeholder="customer@example.com"
                    icon={Mail}
                    error={email && !email.includes('@') ? 'Invalid email format' : undefined}
                  />

                  <FormFieldDNA
                    type="tel"
                    label="Phone Number"
                    value={phone}
                    onChange={setPhone}
                    placeholder="+1 (555) 123-4567"
                    icon={Phone}
                  />

                  <FormFieldDNA
                    type="select"
                    label="Status"
                    value={status}
                    onChange={setStatus}
                    options={[
                      { value: 'active', label: 'Active' },
                      { value: 'pending', label: 'Pending Approval' },
                      { value: 'inactive', label: 'Inactive' }
                    ]}
                  />
                </div>
              </CardDNA>

              <CardDNA title="Appointment Details" icon={Calendar}>
                <div className="space-y-4">
                  <FormFieldDNA
                    type="date"
                    label="Appointment Date"
                    value={date}
                    onChange={setDate}
                    icon={Calendar}
                  />

                  <FormFieldDNA
                    type="time"
                    label="Appointment Time"
                    value={time}
                    onChange={setTime}
                    icon={Clock}
                  />

                  <FormFieldDNA
                    type="textarea"
                    label="Special Notes"
                    value={notes}
                    onChange={setNotes}
                    placeholder="Any special requirements or notes..."
                    rows={4}
                    helper="This will be visible to the service provider"
                  />

                  <div className="flex gap-3">
                    <PrimaryButtonDNA
                      icon={Save}
                      loading={loading}
                      loadingText="Saving..."
                      onClick={handleSave}
                      className="flex-1"
                    >
                      Save Appointment
                    </PrimaryButtonDNA>

                    <SecondaryButtonDNA icon={ArrowLeft}>Cancel</SecondaryButtonDNA>
                  </div>
                </div>
              </CardDNA>
            </div>
          </section>

          {/* Card Variants Section */}
          <section id="cards">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
              Card Variants
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <CardDNA title="Default Card" icon={Settings}>
                <p className="text-gray-600 dark:text-gray-400">
                  Standard card with violet theme colors and hover effects.
                </p>
                <div className="mt-4">
                  <BadgeDNA>Default</BadgeDNA>
                </div>
              </CardDNA>

              <InfoCardDNA title="Information" icon={Info}>
                <p className="text-gray-600 dark:text-gray-400">
                  Use for informational content and help messages.
                </p>
                <div className="mt-4">
                  <InfoBadgeDNA>Info</InfoBadgeDNA>
                </div>
              </InfoCardDNA>

              <SuccessCardDNA title="Success State" icon={CheckCircle}>
                <p className="text-gray-600 dark:text-gray-400">
                  Perfect for positive outcomes and confirmations.
                </p>
                <div className="mt-4">
                  <SuccessBadgeDNA>Active</SuccessBadgeDNA>
                </div>
              </SuccessCardDNA>

              <WarningCardDNA title="Warning" icon={AlertCircle}>
                <p className="text-gray-600 dark:text-gray-400">
                  Draw attention to important information.
                </p>
                <div className="mt-4">
                  <WarningBadgeDNA>Pending</WarningBadgeDNA>
                </div>
              </WarningCardDNA>
            </div>

            <div className="mt-4">
              <DangerCardDNA title="Danger Zone" icon={XCircle} className="max-w-md">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Use danger cards for destructive actions or critical errors. Always provide clear
                  warnings before irreversible actions.
                </p>
                <DangerButtonDNA icon={Trash2}>Delete Account</DangerButtonDNA>
              </DangerCardDNA>
            </div>
          </section>

          {/* Button Styles Section */}
          <section id="buttons">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
              Button Styles
            </h2>

            <CardDNA>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-3 text-gray-900 dark:text-gray-100">
                    Primary Actions
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    <PrimaryButtonDNA icon={Plus}>Create New</PrimaryButtonDNA>
                    <PrimaryButtonDNA icon={Save}>Save Changes</PrimaryButtonDNA>
                    <PrimaryButtonDNA loading loadingText="Processing...">
                      Submit
                    </PrimaryButtonDNA>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3 text-gray-900 dark:text-gray-100">
                    Secondary Actions
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    <SecondaryButtonDNA icon={ArrowLeft}>Go Back</SecondaryButtonDNA>
                    <SecondaryButtonDNA icon={Edit}>Edit Details</SecondaryButtonDNA>
                    <SecondaryButtonDNA disabled>Disabled</SecondaryButtonDNA>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3 text-gray-900 dark:text-gray-100">
                    Danger Actions
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    <DangerButtonDNA icon={Trash2}>Delete Item</DangerButtonDNA>
                    <DangerButtonDNA icon={XCircle}>Cancel Subscription</DangerButtonDNA>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3 text-gray-900 dark:text-gray-100">
                    Ghost Actions
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    <GhostButtonDNA icon={Settings}>Settings</GhostButtonDNA>
                    <GhostButtonDNA icon={Filter}>Filter</GhostButtonDNA>
                    <GhostButtonDNA icon={Search}>Search</GhostButtonDNA>
                  </div>
                </div>
              </div>
            </CardDNA>
          </section>

          {/* Badge Types Section */}
          <section id="badges">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
              Badge Types
            </h2>

            <CardDNA>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <BadgeDNA>Default</BadgeDNA>
                  <BadgeDNA variant="secondary">Secondary</BadgeDNA>
                  <SuccessBadgeDNA icon={CheckCircle}>Active</SuccessBadgeDNA>
                  <WarningBadgeDNA icon={AlertCircle}>Pending</WarningBadgeDNA>
                  <DangerBadgeDNA icon={XCircle}>Expired</DangerBadgeDNA>
                  <InfoBadgeDNA icon={Info}>New Feature</InfoBadgeDNA>
                </div>

                <div>
                  <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">
                    Usage Examples
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p>
                      • Use <span className="font-mono">SuccessBadgeDNA</span> for active states and
                      positive outcomes
                    </p>
                    <p>
                      • Use <span className="font-mono">WarningBadgeDNA</span> for pending actions
                      or warnings
                    </p>
                    <p>
                      • Use <span className="font-mono">DangerBadgeDNA</span> for errors or expired
                      states
                    </p>
                    <p>
                      • Use <span className="font-mono">InfoBadgeDNA</span> for informational labels
                    </p>
                  </div>
                </div>
              </div>
            </CardDNA>
          </section>

          {/* List with ScrollArea Section */}
          <section id="lists">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
              List & Scroll Area
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CardDNA title="Customer List" icon={User}>
                <div className="space-y-4 mb-4">
                  <FormFieldDNA
                    type="text"
                    label="Search Customers"
                    value={search}
                    onChange={setSearch}
                    placeholder="Search by name or email..."
                    icon={Search}
                  />

                  <FormFieldDNA
                    type="select"
                    label="Filter by Status"
                    value={filter}
                    onChange={setFilter}
                    options={statusOptions}
                    icon={Filter}
                  />
                </div>

                <ScrollAreaDNA height="h-96">
                  <div className="space-y-2 pr-4">
                    {sampleCustomers
                      .filter(customer => {
                        if (search) {
                          const searchLower = search.toLowerCase()
                          return (
                            customer.name.toLowerCase().includes(searchLower) ||
                            customer.email.toLowerCase().includes(searchLower)
                          )
                        }
                        return true
                      })
                      .filter(customer => {
                        if (filter === 'all') return true
                        return customer.status === filter
                      })
                      .map(customer => (
                        <div
                          key={customer.id}
                          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                {customer.name}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {customer.email}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-500">
                                {customer.phone}
                              </p>
                            </div>
                            <BadgeDNA
                              variant={
                                customer.status === 'active'
                                  ? 'success'
                                  : customer.status === 'pending'
                                    ? 'warning'
                                    : 'secondary'
                              }
                            >
                              {customer.status}
                            </BadgeDNA>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollAreaDNA>
              </CardDNA>

              <CardDNA title="Service Pricing" icon={DollarSign}>
                <ScrollAreaDNA height="h-[500px]">
                  <div className="space-y-3 pr-4">
                    {[
                      { name: 'Basic Haircut', price: 50, duration: 30 },
                      { name: 'Premium Cut & Style', price: 120, duration: 60 },
                      { name: 'Hair Color', price: 200, duration: 120 },
                      { name: 'Highlights', price: 250, duration: 150 },
                      { name: 'Keratin Treatment', price: 350, duration: 180 },
                      { name: 'Deep Conditioning', price: 80, duration: 45 },
                      { name: 'Beard Trim', price: 30, duration: 20 },
                      { name: 'Hair Extensions', price: 500, duration: 240 },
                      { name: 'Bridal Package', price: 800, duration: 300 },
                      { name: 'Kids Haircut', price: 35, duration: 20 }
                    ].map((service, index) => (
                      <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {service.name}
                          </h4>
                          <span className="font-semibold text-violet-600 dark:text-violet-400">
                            AED {service.price}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {service.duration} min
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollAreaDNA>
              </CardDNA>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
