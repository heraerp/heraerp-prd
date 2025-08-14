import { NextRequest, NextResponse } from 'next/server'

// Mock user database
const mockUsers = new Map()

// Add demo user
mockUsers.set('mario@restaurant.com', {
  id: 'usr_demo_mario_123',
  email: 'mario@restaurant.com',
  password: 'securepass123',
  full_name: 'Mario Rossi',
  role: 'owner',
  organization: {
    id: 'org_demo_restaurant_456',
    organization_name: "Mario's Italian Restaurant",
    organization_type: 'restaurant'
  }
})

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Authorization header required' 
        },
        { status: 401 }
      )
    }

    // Extract token
    const token = authHeader.substring(7)
    
    // Decode mock JWT token
    if (!token.startsWith('mock_jwt_')) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid token format' 
        },
        { status: 401 }
      )
    }

    try {
      const payload = JSON.parse(
        Buffer.from(token.substring(9), 'base64').toString()
      )
      
      // Find user by email from token
      const user = mockUsers.get(payload.email)
      
      if (!user || !user.organization) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Organization not found' 
          },
          { status: 404 }
        )
      }

      // Return organization data
      return NextResponse.json({
        success: true,
        organization: user.organization
      })
      
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid token' 
        },
        { status: 401 }
      )
    }

  } catch (error) {
    console.error('Get organization error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}