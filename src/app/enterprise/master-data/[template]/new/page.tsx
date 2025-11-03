

/**
 * New Master Data Entity Page
 * Smart Code: HERA.ENTERPRISE.MASTER_DATA.NEW_ENTITY.v1
 * 
 * Dynamic page for creating new master data entities using YAML templates
 */

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MasterDataForm } from '@/components/enterprise/MasterDataForm'
import { MasterDataErrorBoundary } from '@/components/enterprise/MasterDataErrorBoundary'
import { MasterDataTemplate, MasterDataYamlParser } from '@/lib/master-data/yaml-parser'
import { AlertCircle, Loader2 } from 'lucide-react'

export default function NewMasterDataEntityPage() {
  const params = useParams()
  const router = useRouter()
  const templateId = params.template as string

  const [template, setTemplate] = useState<MasterDataTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isTemplateValid, setIsTemplateValid] = useState(false)

  // Load template configuration
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setLoading(true)
        setError(null)

        // In a real implementation, this would load from an API or file system
        // For now, we'll simulate loading the customer template
        const templateData = await loadTemplateData(templateId)
        
        if (!templateData) {
          throw new Error(`Template '${templateId}' not found`)
        }

        const parsedTemplate = MasterDataYamlParser.parseYamlContent(templateData)
        
        // Additional validation
        if (!parsedTemplate.ui?.tabs || !Array.isArray(parsedTemplate.ui.tabs) || parsedTemplate.ui.tabs.length === 0) {
          throw new Error('Invalid template: missing or empty tabs configuration')
        }
        
        if (!parsedTemplate.fields || !Array.isArray(parsedTemplate.fields) || parsedTemplate.fields.length === 0) {
          throw new Error('Invalid template: missing or empty fields configuration')
        }
        
        setTemplate(parsedTemplate)
        setIsTemplateValid(true)

      } catch (err) {
        console.error('Failed to load template:', err)
        setError(err instanceof Error ? err.message : 'Failed to load template')
        setIsTemplateValid(false)
      } finally {
        setLoading(false)
      }
    }

    if (templateId) {
      loadTemplate()
    }
  }, [templateId])

  // Handle form submission
  const handleSubmit = async (values: Record<string, any>) => {
    try {
      // Here you would submit to your API
      console.log('Submitting master data:', values)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Redirect to the entity list or detail page
      router.push(`/enterprise/master-data/${templateId}`)
      
    } catch (error) {
      console.error('Failed to create entity:', error)
      throw error
    }
  }

  // Handle cancel
  const handleCancel = () => {
    router.back()
  }

  // Loading state
  if (loading) {
    return (
      <div className="sap-font min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Loading Template</h2>
          <p className="text-gray-600">Loading {templateId} template configuration...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !template) {
    return (
      <div className="sap-font min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Template Not Found</h2>
          <p className="text-gray-600 mb-6">
            {error || `The template '${templateId}' could not be loaded.`}
          </p>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={() => router.push('/enterprise/master-data')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Templates
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Only render form when template is valid and loaded
  if (loading || !template || !isTemplateValid) {
    return loading ? (
      <div className="sap-font min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Loading Template</h2>
          <p className="text-gray-600">Loading {templateId} template configuration...</p>
        </div>
      </div>
    ) : null
  }

  // Render the master data form with error boundary
  return (
    <MasterDataErrorBoundary>
      <MasterDataForm
        template={template}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        showNavbar={true}
      />
    </MasterDataErrorBoundary>
  )
}

// Simulated template loading function
async function loadTemplateData(templateId: string): Promise<any> {
  // First try to load from the actual YAML file
  try {
    const response = await fetch(`/enterprise/modules/templates/${templateId}.yaml`)
    if (response.ok) {
      const yamlContent = await response.text()
      // Parse YAML content - for now we'll assume it's already in JSON format for the mock
      // In a real implementation, you'd use a YAML parser
      console.log('Loaded YAML template:', templateId)
      // For now, fall back to mock data since we can't parse YAML on client-side easily
    }
  } catch (error) {
    console.log('Could not load YAML file, using mock data')
  }
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500))

  // Mock template data - in a real implementation, this would come from an API or file system
  const templates: Record<string, any> = {
    customer: {
      version: "1.0",
      template: "MasterDataForm",
      description: "Comprehensive customer master data form for enterprise CRM. Includes contact information, business details, relationships, and workflow automation for customer onboarding.",
      entityName: "Customer",
      smartCode: "HERA.ENTERPRISE.CUSTOMER.v1",
      fields: [
        {
          name: "customerName",
          type: "string",
          label: "Customer Name",
          required: true,
          tab: "basicInfo",
          placeholder: "Enter customer or company name",
          validation: {
            minLength: 2,
            maxLength: 100,
            message: "Customer name must be between 2 and 100 characters"
          }
        },
        {
          name: "customerType",
          type: "select",
          label: "Customer Type",
          required: true,
          tab: "basicInfo",
          options: [
            { label: "Individual", value: "INDIVIDUAL" },
            { label: "Business", value: "BUSINESS" },
            { label: "Government", value: "GOVERNMENT" },
            { label: "Non-Profit", value: "NON_PROFIT" }
          ]
        },
        {
          name: "companyName",
          type: "string",
          label: "Company Name",
          required: false,
          tab: "basicInfo",
          placeholder: "Company or organization name",
          validation: {
            maxLength: 150
          }
        },
        {
          name: "primaryContactName",
          type: "string",
          label: "Primary Contact Name",
          required: true,
          tab: "contact",
          placeholder: "Full name of primary contact",
          validation: {
            minLength: 2,
            maxLength: 100
          }
        },
        {
          name: "email",
          type: "email",
          label: "Email Address",
          required: true,
          tab: "contact",
          placeholder: "primary@example.com",
          validation: {
            pattern: "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$",
            message: "Please enter a valid email address"
          }
        },
        {
          name: "phone",
          type: "phone",
          label: "Phone Number",
          required: true,
          tab: "contact",
          placeholder: "+1 (555) 123-4567",
          validation: {
            pattern: "^[\\+]?[1-9][\\d]{0,15}$",
            message: "Please enter a valid phone number"
          }
        },
        {
          name: "addressLine1",
          type: "string",
          label: "Address Line 1",
          required: true,
          tab: "address",
          placeholder: "Street address",
          validation: {
            maxLength: 100
          }
        },
        {
          name: "city",
          type: "string",
          label: "City",
          required: true,
          tab: "address",
          placeholder: "City name",
          validation: {
            maxLength: 50
          }
        },
        {
          name: "state",
          type: "string",
          label: "State/Province",
          required: true,
          tab: "address",
          placeholder: "State or province",
          validation: {
            maxLength: 50
          }
        },
        {
          name: "country",
          type: "select",
          label: "Country",
          required: true,
          tab: "address",
          defaultValue: "US",
          options: [
            { label: "United States", value: "US" },
            { label: "Canada", value: "CA" },
            { label: "United Kingdom", value: "GB" },
            { label: "Australia", value: "AU" },
            { label: "Other", value: "OTHER" }
          ]
        },
        {
          name: "creditLimit",
          type: "number",
          label: "Credit Limit",
          required: false,
          tab: "business",
          placeholder: "0.00",
          validation: {
            min: 0,
            max: 10000000
          }
        },
        {
          name: "paymentTerms",
          type: "select",
          label: "Payment Terms",
          required: false,
          tab: "business",
          defaultValue: "NET_30",
          options: [
            { label: "Net 15 Days", value: "NET_15" },
            { label: "Net 30 Days", value: "NET_30" },
            { label: "Net 45 Days", value: "NET_45" },
            { label: "Cash on Delivery", value: "COD" }
          ]
        },
        {
          name: "notes",
          type: "textarea",
          label: "Notes",
          required: false,
          tab: "business",
          placeholder: "Additional notes about this customer",
          validation: {
            maxLength: 1000
          }
        }
      ],
      relationships: [
        {
          name: "assignedSalesRep",
          type: "manyToOne",
          targetEntity: "User",
          label: "Assigned Sales Representative",
          uiComponent: "select",
          tab: "business",
          required: false,
          searchFields: ["display_name", "email"],
          displayField: "display_name",
          valueField: "user_id"
        }
      ],
      ui: {
        tabs: [
          {
            id: "basicInfo",
            title: "Basic Information",
            icon: "user",
            description: "Essential customer details and identification",
            order: 1
          },
          {
            id: "contact",
            title: "Contact Details",
            icon: "phone",
            description: "Communication and contact information",
            order: 2
          },
          {
            id: "address",
            title: "Address",
            icon: "map-pin",
            description: "Physical address and location details",
            order: 3
          },
          {
            id: "business",
            title: "Business Information",
            icon: "briefcase",
            description: "Commercial terms, credit, and business details",
            order: 4
          }
        ],
        progressIndicator: {
          type: "stepper",
          labels: true,
          icons: true,
          consistent: true,
          colourScheme: {
            completed: "#00b388",
            active: "#0073e6",
            upcoming: "#bdbdbd",
            error: "#e74c3c"
          },
          autoUpdate: true,
          showPercentage: true
        }
      },
      behaviour: {
        validation: {
          invalidColour: "#e74c3c",
          validColour: "#00b388",
          showErrorMessages: true,
          validateOnChange: true,
          validateOnBlur: true,
          showRequiredIndicator: true
        },
        navigation: {
          showNextButton: true,
          showPreviousButton: true,
          disableNextUntilValid: true,
          saveOnNavigate: true,
          allowSkipOptionalTabs: false,
          confirmOnExit: true
        }
      }
    },
    
    // Add other templates here...
    vendor: {
      version: "1.0",
      template: "MasterDataForm",
      description: "Vendor and supplier master data template",
      entityName: "Vendor",
      smartCode: "HERA.ENTERPRISE.VENDOR.v1",
      fields: [
        {
          name: "vendorName",
          type: "string",
          label: "Vendor Name",
          required: true,
          tab: "basicInfo",
          placeholder: "Enter vendor name"
        },
        {
          name: "email",
          type: "email",
          label: "Email Address",
          required: true,
          tab: "contact",
          placeholder: "vendor@example.com"
        }
      ],
      relationships: [],
      ui: {
        tabs: [
          {
            id: "basicInfo",
            title: "Basic Information",
            icon: "building",
            description: "Essential vendor details",
            order: 1
          },
          {
            id: "contact",
            title: "Contact Details",
            icon: "phone",
            description: "Communication information",
            order: 2
          }
        ],
        progressIndicator: {
          type: "stepper",
          labels: true,
          icons: true,
          consistent: true,
          colourScheme: {
            completed: "#00b388",
            active: "#0073e6",
            upcoming: "#bdbdbd",
            error: "#e74c3c"
          },
          autoUpdate: true,
          showPercentage: true
        }
      },
      behaviour: {
        validation: {
          invalidColour: "#e74c3c",
          validColour: "#00b388",
          showErrorMessages: true,
          validateOnChange: true,
          validateOnBlur: true,
          showRequiredIndicator: true
        },
        navigation: {
          showNextButton: true,
          showPreviousButton: true,
          disableNextUntilValid: true,
          saveOnNavigate: true,
          allowSkipOptionalTabs: false,
          confirmOnExit: true
        }
      }
    }
  }

  return templates[templateId] || null
}