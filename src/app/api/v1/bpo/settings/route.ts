import { NextRequest, NextResponse } from 'next/server'

// Mock settings storage (in production, this would be a database)
let mockSettings: Record<string, any> = {}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'default-user'

    // Return stored settings or defaults
    const userSettings = mockSettings[userId] || {
      profile: {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@company.com',
        phone: '+1 (555) 123-4567',
        title: 'Finance Manager',
        department: 'Finance'
      },
      organization: {
        name: 'ACME Corporation',
        address: '123 Business Ave, Suite 100',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'United States',
        taxId: '12-3456789',
        website: 'https://acme.com'
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        invoiceSubmitted: true,
        invoiceProcessed: true,
        queryRaised: true,
        slaWarning: true,
        slaBreach: true,
        weeklyReports: true,
        monthlyReports: false
      },
      sla: {
        autoEscalation: true,
        escalationHours: 24,
        warningThreshold: 80,
        businessHours: true,
        weekendProcessing: false,
        holidayProcessing: false
      },
      security: {
        twoFactorAuth: false,
        sessionTimeout: 60,
        passwordExpiry: 90,
        loginNotifications: true,
        apiAccess: false,
        auditLogging: true
      },
      cloudStorage: {
        provider: 'default',
        awsConfig: {
          accessKeyId: '',
          secretAccessKey: '',
          region: 'us-east-1',
          bucketName: '',
          path: 'bpo-documents/'
        },
        azureConfig: {
          accountName: '',
          accountKey: '',
          containerName: '',
          path: 'bpo-documents/'
        },
        gcpConfig: {
          projectId: '',
          keyFile: '',
          bucketName: '',
          path: 'bpo-documents/'
        },
        customConfig: {
          endpoint: '',
          accessKey: '',
          secretKey: '',
          bucketName: '',
          path: 'bpo-documents/',
          ssl: true,
          region: ''
        },
        permissions: {
          read: true,
          write: true,
          delete: false,
          process: true
        },
        advanced: {
          compressionEnabled: true,
          encryptionEnabled: true,
          versioningEnabled: false,
          maxFileSize: 50,
          allowedFileTypes: ['pdf', 'jpg', 'jpeg', 'png', 'docx', 'xlsx']
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: userSettings,
      message: 'Settings retrieved successfully'
    })
  } catch (error) {
    console.error('Error retrieving BPO settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId = 'default-user', settings } = body

    if (!settings) {
      return NextResponse.json(
        { success: false, error: 'Settings data is required' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (settings.profile?.email && !/\S+@\S+\.\S+/.test(settings.profile.email)) {
      return NextResponse.json({ success: false, error: 'Invalid email format' }, { status: 400 })
    }

    // Store settings (in production, save to database)
    mockSettings[userId] = {
      ...mockSettings[userId],
      ...settings,
      updatedAt: new Date().toISOString()
    }

    // Create audit log entry using HERA universal structure
    const auditEntry = {
      transaction_type: 'bpo_settings_update',
      smart_code: 'HERA.BPO.SETTINGS.UPDATED.V1',
      user_id: userId,
      changes: Object.keys(settings),
      timestamp: new Date().toISOString(),
      ip_address: request.headers.get('x-forwarded-for') || 'localhost'
    }

    console.log('BPO Settings Updated:', auditEntry)

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 500))

    return NextResponse.json({
      success: true,
      data: mockSettings[userId],
      message: 'Settings saved successfully',
      auditId: `audit-${Date.now()}`
    })
  } catch (error) {
    console.error('Error saving BPO settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  // Handle partial updates
  try {
    const body = await request.json()
    const { userId = 'default-user', category, updates } = body

    if (!category || !updates) {
      return NextResponse.json(
        { success: false, error: 'Category and updates are required' },
        { status: 400 }
      )
    }

    // Initialize if doesn't exist
    if (!mockSettings[userId]) {
      mockSettings[userId] = {}
    }

    // Update specific category
    mockSettings[userId][category] = {
      ...mockSettings[userId][category],
      ...updates
    }

    mockSettings[userId].updatedAt = new Date().toISOString()

    return NextResponse.json({
      success: true,
      data: mockSettings[userId],
      message: `${category} settings updated successfully`
    })
  } catch (error) {
    console.error('Error updating BPO settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'default-user'
    const category = searchParams.get('category')

    if (category) {
      // Delete specific category
      if (mockSettings[userId] && mockSettings[userId][category]) {
        delete mockSettings[userId][category]
        return NextResponse.json({
          success: true,
          message: `${category} settings deleted successfully`
        })
      }
    } else {
      // Delete all user settings
      delete mockSettings[userId]
      return NextResponse.json({
        success: true,
        message: 'All settings deleted successfully'
      })
    }

    return NextResponse.json({ success: false, error: 'Settings not found' }, { status: 404 })
  } catch (error) {
    console.error('Error deleting BPO settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
