'use client'

import React from 'react'
import { 
  Building2, 
  User, 
  MapPin, 
  DollarSign,
  FileText
} from 'lucide-react'
import HERAMasterDataTemplate from '@/components/hera/HERAMasterDataTemplate'

// Vendor-specific form configuration
const VENDOR_SECTIONS = [
  { 
    id: 'basic', 
    label: 'Basic Information', 
    icon: Building2, 
    required: true,
    description: 'Enter basic vendor information and categorization'
  },
  { 
    id: 'contact', 
    label: 'Contact Details', 
    icon: User, 
    required: true,
    description: 'Add primary and secondary contact details'
  },
  { 
    id: 'address', 
    label: 'Address Information', 
    icon: MapPin, 
    required: true,
    description: 'Provide vendor business address information'
  },
  { 
    id: 'financial', 
    label: 'Financial Terms', 
    icon: DollarSign, 
    required: false,
    description: 'Configure payment terms and financial settings'
  },
  { 
    id: 'documents', 
    label: 'Documents & Compliance', 
    icon: FileText, 
    required: false,
    description: 'Upload compliance documents and certifications'
  }
]

const VENDOR_FIELDS = [
  // Basic Information
  {
    id: 'vendor_name',
    label: 'Vendor Name',
    type: 'text' as const,
    required: true,
    placeholder: 'Enter vendor company name',
    section: 'basic'
  },
  {
    id: 'vendor_code',
    label: 'Vendor Code',
    type: 'text' as const,
    required: true,
    placeholder: 'Auto-generated from name',
    section: 'basic'
  },
  {
    id: 'category',
    label: 'Category',
    type: 'select' as const,
    required: true,
    section: 'basic',
    options: [
      { value: 'supplier', label: 'Product Supplier', description: 'Companies that supply physical products' },
      { value: 'service', label: 'Service Provider', description: 'Companies that provide services' },
      { value: 'contractor', label: 'Contractor', description: 'Independent contractors and consultants' },
      { value: 'utility', label: 'Utility Provider', description: 'Utilities and infrastructure providers' }
    ]
  },
  {
    id: 'description',
    label: 'Description',
    type: 'textarea' as const,
    placeholder: 'Brief description of vendor services or products',
    section: 'basic'
  },
  {
    id: 'website',
    label: 'Website',
    type: 'url' as const,
    placeholder: 'https://www.vendor-website.com',
    section: 'basic'
  },

  // Contact Details
  {
    id: 'primary_contact_name',
    label: 'Primary Contact Name',
    type: 'text' as const,
    required: true,
    placeholder: 'Contact person\'s full name',
    section: 'contact'
  },
  {
    id: 'primary_contact_email',
    label: 'Primary Contact Email',
    type: 'email' as const,
    required: true,
    placeholder: 'contact@vendor.com',
    section: 'contact',
    validation: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return !emailRegex.test(value) ? 'Please enter a valid email address' : null
    }
  },
  {
    id: 'primary_contact_phone',
    label: 'Primary Contact Phone',
    type: 'phone' as const,
    required: true,
    placeholder: '+1 (555) 123-4567',
    section: 'contact'
  },
  {
    id: 'secondary_contact_name',
    label: 'Secondary Contact Name',
    type: 'text' as const,
    placeholder: 'Secondary contact person',
    section: 'contact'
  },
  {
    id: 'secondary_contact_email',
    label: 'Secondary Contact Email',
    type: 'email' as const,
    placeholder: 'secondary@vendor.com',
    section: 'contact'
  },
  {
    id: 'secondary_contact_phone',
    label: 'Secondary Contact Phone',
    type: 'phone' as const,
    placeholder: '+1 (555) 987-6543',
    section: 'contact'
  },

  // Address Information
  {
    id: 'address_line_1',
    label: 'Address Line 1',
    type: 'text' as const,
    required: true,
    placeholder: 'Street address, building number',
    section: 'address'
  },
  {
    id: 'address_line_2',
    label: 'Address Line 2',
    type: 'text' as const,
    placeholder: 'Apartment, suite, unit, floor (optional)',
    section: 'address'
  },
  {
    id: 'city',
    label: 'City',
    type: 'text' as const,
    required: true,
    placeholder: 'City',
    section: 'address'
  },
  {
    id: 'state',
    label: 'State/Province',
    type: 'text' as const,
    placeholder: 'State or Province',
    section: 'address'
  },
  {
    id: 'postal_code',
    label: 'Postal Code',
    type: 'text' as const,
    placeholder: 'ZIP/Postal Code',
    section: 'address'
  },
  {
    id: 'country',
    label: 'Country',
    type: 'text' as const,
    required: true,
    placeholder: 'Country',
    section: 'address'
  },

  // Financial Terms
  {
    id: 'payment_terms',
    label: 'Payment Terms',
    type: 'select' as const,
    section: 'financial',
    options: [
      { value: 'net15', label: 'Net 15', description: 'Payment due within 15 days' },
      { value: 'net30', label: 'Net 30', description: 'Payment due within 30 days' },
      { value: 'net45', label: 'Net 45', description: 'Payment due within 45 days' },
      { value: 'net60', label: 'Net 60', description: 'Payment due within 60 days' },
      { value: 'immediate', label: 'Immediate', description: 'Payment upon receipt' }
    ]
  },
  {
    id: 'credit_limit',
    label: 'Credit Limit',
    type: 'number' as const,
    placeholder: 'Maximum credit amount',
    section: 'financial'
  },
  {
    id: 'tax_id',
    label: 'Tax ID/VAT Number',
    type: 'text' as const,
    placeholder: 'Tax identification number',
    section: 'financial'
  },
  {
    id: 'bank_account',
    label: 'Bank Account',
    type: 'text' as const,
    placeholder: 'Bank account information',
    section: 'financial'
  },

  // Documents & Compliance
  {
    id: 'business_license',
    label: 'Business License',
    type: 'text' as const,
    placeholder: 'Business license number or reference',
    section: 'documents'
  },
  {
    id: 'insurance_certificate',
    label: 'Insurance Certificate',
    type: 'text' as const,
    placeholder: 'Insurance certificate number or reference',
    section: 'documents'
  },
  {
    id: 'certifications',
    label: 'Additional Certifications',
    type: 'textarea' as const,
    placeholder: 'List any additional certifications, one per line',
    section: 'documents'
  }
]

export default function NewVendorPage() {
  
  const handleVendorSubmit = async (formData: Record<string, any>) => {
    // Generate HERA DNA smart code
    const smartCode = `HERA.PROCUREMENT.VENDOR.${formData.category?.toUpperCase() || 'STANDARD'}.${formData.vendor_code}.v1`
    
    // Prepare vendor data for HERA API v2
    const vendorData = {
      entity_type: 'vendor',
      entity_name: formData.vendor_name,
      entity_code: formData.vendor_code,
      smart_code: smartCode,
      dynamic_fields: [
        { field_name: 'category', field_value_text: formData.category, field_type: 'text' },
        { field_name: 'description', field_value_text: formData.description, field_type: 'text' },
        { field_name: 'website', field_value_text: formData.website, field_type: 'text' },
        { field_name: 'primary_contact_name', field_value_text: formData.primary_contact_name, field_type: 'text' },
        { field_name: 'primary_contact_email', field_value_text: formData.primary_contact_email, field_type: 'email' },
        { field_name: 'primary_contact_phone', field_value_text: formData.primary_contact_phone, field_type: 'phone' },
        { field_name: 'address_line_1', field_value_text: formData.address_line_1, field_type: 'text' },
        { field_name: 'city', field_value_text: formData.city, field_type: 'text' },
        { field_name: 'country', field_value_text: formData.country, field_type: 'text' },
        { field_name: 'payment_terms', field_value_text: formData.payment_terms, field_type: 'text' },
      ].filter(field => field.field_value_text) // Only include non-empty fields
    }
    
    console.log('Creating vendor with HERA API v2:', vendorData)
    
    // For now, save to localStorage to show in the list
    const newVendor = {
      id: Date.now().toString(),
      entity_name: formData.vendor_name,
      entity_code: formData.vendor_code,
      vendor_type: formData.category?.toUpperCase() || 'SUPPLIER',
      email: formData.primary_contact_email,
      phone: formData.primary_contact_phone,
      status: 'active'
    }
    
    // Get existing vendors from localStorage
    const existingVendors = JSON.parse(localStorage.getItem('hera_vendors') || '[]')
    
    // Add new vendor
    const updatedVendors = [...existingVendors, newVendor]
    
    // Save back to localStorage
    localStorage.setItem('hera_vendors', JSON.stringify(updatedVendors))
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Here you would call the HERA API v2 to create the vendor
    // const result = await apiV2.post('entities', vendorData)
  }

  return (
    <HERAMasterDataTemplate
      entityType="vendor"
      entityLabel="Vendor"
      sections={VENDOR_SECTIONS}
      fields={VENDOR_FIELDS}
      backUrl="/enterprise/procurement/vendors"
      onSubmit={handleVendorSubmit}
      defaultValues={{}}
      className=""
    />
  )
}