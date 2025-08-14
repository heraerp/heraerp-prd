import { NextRequest, NextResponse } from 'next/server'

// Test endpoint to verify jewelry authentication logic
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    console.log('🧪 Testing jewelry auth credentials:', { email, passwordLength: password?.length })
    
    // Simulate the exact DualAuthProvider login logic
    if (email === 'sarah@luxurygems.com' && password === 'jewelry123') {
      console.log('✅ Jewelry demo credentials MATCHED!')
      
      const jewelryUser = {
        id: 'demo-jewelry-001',
        email: email,
        full_name: 'Sarah Mitchell',
        role: 'owner'
      }
      
      const organization = {
        id: 'demo-jewelry-org-001',
        organization_name: 'Luxury Gems & Jewelry',
        organization_type: 'jewelry',
        subscription_plan: 'premium'
      }
      
      return NextResponse.json({
        success: true,
        message: 'Jewelry credentials validated successfully',
        user: jewelryUser,
        organization: organization,
        matchedCredentials: {
          email: email === 'sarah@luxurygems.com',
          password: password === 'jewelry123',
          bothMatch: email === 'sarah@luxurygems.com' && password === 'jewelry123'
        }
      })
    }
    
    // Test Mario credentials too
    if (email === 'mario@restaurant.com' && password === 'securepass123') {
      console.log('✅ Mario demo credentials MATCHED!')
      return NextResponse.json({
        success: true,
        message: 'Mario credentials validated successfully',
        user: { id: 'demo-user-001', email, full_name: 'Mario Rossi' }
      })
    }
    
    console.log('❌ No demo credentials matched')
    return NextResponse.json({
      success: false,
      message: 'Demo credentials not recognized',
      receivedCredentials: {
        email,
        passwordLength: password?.length,
        emailMatches: email === 'sarah@luxurygems.com',
        passwordMatches: password === 'jewelry123'
      }
    })
    
  } catch (error: any) {
    console.error('Auth test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Jewelry Auth Test Endpoint',
    testCredentials: {
      jewelry: {
        email: 'sarah@luxurygems.com',
        password: 'jewelry123'
      },
      mario: {
        email: 'mario@restaurant.com', 
        password: 'securepass123'
      }
    },
    usage: 'POST with { email, password } to test credentials'
  })
}