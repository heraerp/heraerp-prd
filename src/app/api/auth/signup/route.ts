// ================================================================================
// HERA AUTH SIGNUP API
// Smart Code: HERA.API.AUTH.SIGNUP.v1
// Handles user registration with organization creation
// ================================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { SignupRequest } from '@/lib/schemas/universal'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request
    const result = SignupRequest.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { email, password, name, organizationName } = result.data

    // Create Supabase server client
    const supabase = createServerClient()

    // First check if user already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers()
    const userExists = existingUser?.users?.some(u => u.email === email)

    if (userExists) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in instead.' },
        { status: 409 }
      )
    }

    // Create new user using admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        name,
        organization_name: organizationName
      }
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // User created successfully
    // Admin API doesn't return a session, user needs to confirm email or sign in
    return NextResponse.json({
      success: true,
      needsEmailConfirmation: true,
      message: 'Account created successfully. Please check your email to confirm your account.',
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || name
      }
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
