import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { HERAJWTService } from '@/lib/auth/jwt-service'
import bcrypt from 'bcryptjs'

const jwtService = new HERAJWTService()

// Helper function to extract organization_id from JWT token
async function getOrganizationFromAuth(request: NextRequest): Promise<string> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Authentication required')
  }

  const token = authHeader.replace('Bearer ', '')
  const payload = await jwtService.verifyToken(token)
  
  if (!payload.organization_id) {
    throw new Error('Organization context missing')
  }
  
  return payload.organization_id
}

// Helper function to get user permissions from JWT
async function getUserFromAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Authentication required')
  }

  const token = authHeader.replace('Bearer ', '')
  const payload = await jwtService.verifyToken(token)
  
  return {
    id: payload.sub,
    organization_id: payload.organization_id,
    role: payload.role,
    permissions: payload.permissions
  }
}

// Check if user has required permission
function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission) || 
         userPermissions.includes('users:manage') ||
         userPermissions.includes('*')
}

// GET /api/v1/users - Fetch organization users
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const department = searchParams.get('department')
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const include_inactive = searchParams.get('include_inactive') === 'true'
    
    // Get organization_id and verify permissions
    const organizationId = await getOrganizationFromAuth(request)
    const currentUser = await getUserFromAuth(request)
    
    if (!hasPermission(currentUser.permissions, 'users:read')) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions to view users' },
        { status: 403 }
      )
    }

    // Build query for users (entity_type = 'user')
    let query = supabaseAdmin
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'user')

    if (!include_inactive) {
      query = query.eq('status', 'active')
    }

    if (status) {
      query = query.eq('status', status)
    }

    // Filter by department or role requires checking metadata
    if (department || role) {
      // We'll filter in memory since we need to check metadata
    }

    query = query.order('created_at', { ascending: false })

    const { data: users, error: usersError } = await query

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    // Filter by metadata if needed
    let filteredUsers = users || []
    if (department) {
      filteredUsers = filteredUsers.filter(user => 
        user.metadata && user.metadata.department === department
      )
    }
    if (role) {
      filteredUsers = filteredUsers.filter(user => 
        user.metadata && user.metadata.role === role
      )
    }

    // Get user statistics
    const stats = {
      total: filteredUsers.length,
      active: filteredUsers.filter(u => u.status === 'active').length,
      inactive: filteredUsers.filter(u => u.status === 'inactive').length,
      pending: filteredUsers.filter(u => u.status === 'pending').length,
      by_department: {},
      by_role: {}
    }

    // Calculate department distribution
    filteredUsers.forEach(user => {
      const dept = (user.metadata as any)?.department || 'Unassigned'
      stats.by_department[dept] = (stats.by_department[dept] || 0) + 1
      
      const userRole = (user.metadata as any)?.role || 'user'
      stats.by_role[userRole] = (stats.by_role[userRole] || 0) + 1
    })

    return NextResponse.json({
      success: true,
      data: filteredUsers,
      count: filteredUsers.length,
      statistics: stats,
      organization_id: organizationId
    })

  } catch (error) {
    console.error('User fetch error:', error)
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/v1/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const body = await request.json()
    
    // Get organization_id and verify permissions
    const organizationId = await getOrganizationFromAuth(request)
    const currentUser = await getUserFromAuth(request)
    
    if (!hasPermission(currentUser.permissions, 'users:create')) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions to create users' },
        { status: 403 }
      )
    }

    const {
      entity_name,
      entity_code,
      description,
      status = 'active',
      email,
      phone,
      department,
      job_title,
      hire_date,
      manager_id,
      location,
      role = 'user',
      permissions = [],
      password,
      send_welcome_email = false
    } = body

    // Validate required fields
    if (!entity_name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    // Check if email already exists in this organization
    const { data: existingUser } = await supabaseAdmin
      .from('core_entities')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'user')
      .filter('metadata->>email', 'eq', email.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'A user with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const saltRounds = 12
    const password_hash = await bcrypt.hash(password, saltRounds)

    // Generate user code if not provided
    const userCode = entity_code || `USER${Date.now()}`

    // Prepare user metadata
    const metadata = {
      email: email.toLowerCase(),
      phone: phone || null,
      department: department || null,
      job_title: job_title || null,
      hire_date: hire_date || null,
      manager_id: manager_id || null,
      location: location || null,
      role: role,
      permissions: permissions,
      password_hash,
      created_by: currentUser.id,
      last_updated_by: currentUser.id,
      account_locked: false,
      failed_login_attempts: 0,
      last_login: null,
      password_changed_at: new Date().toISOString(),
      must_change_password: send_welcome_email // Force password change if welcome email sent
    }

    // Create user entity
    const { data: user, error: userError } = await supabaseAdmin
      .from('core_entities')
      .insert({
        organization_id: organizationId,
        entity_type: 'user',
        entity_name,
        entity_code: userCode,
        description,
        status,
        metadata
      })
      .select()
      .single()

    if (userError) {
      console.error('Error creating user:', userError)
      return NextResponse.json(
        { success: false, message: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Send welcome email if requested
    if (send_welcome_email && user) {
      try {
        await sendWelcomeEmail(email, entity_name, password, organizationId)
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError)
        // Don't fail the user creation if email fails
      }
    }

    // Remove sensitive data from response
    const sanitizedUser = {
      ...user,
      metadata: {
        ...user.metadata,
        password_hash: undefined
      }
    }

    return NextResponse.json({
      success: true,
      data: sanitizedUser,
      message: `User ${entity_name} created successfully`
    })

  } catch (error) {
    console.error('Create user error:', error)
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/v1/users - Update user
export async function PUT(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const body = await request.json()
    
    // Get organization_id and verify permissions
    const organizationId = await getOrganizationFromAuth(request)
    const currentUser = await getUserFromAuth(request)
    
    if (!hasPermission(currentUser.permissions, 'users:update')) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions to update users' },
        { status: 403 }
      )
    }

    const {
      id,
      entity_name,
      entity_code,
      description,
      status,
      email,
      phone,
      department,
      job_title,
      hire_date,
      manager_id,
      location,
      role,
      permissions,
      password,
      reset_failed_attempts = false
    } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get existing user
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('core_entities')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .eq('entity_type', 'user')
      .single()

    if (fetchError || !existingUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent users from editing their own role/permissions unless they're owner
    if (existingUser.id === currentUser.id && currentUser.role !== 'owner') {
      if (role !== (existingUser.metadata as any)?.role || JSON.stringify(permissions) !== JSON.stringify((existingUser.metadata as any)?.permissions)) {
        return NextResponse.json(
          { success: false, message: 'You cannot modify your own role or permissions' },
          { status: 403 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Update basic fields
    if (entity_name !== undefined) updateData.entity_name = entity_name
    if (entity_code !== undefined) updateData.entity_code = entity_code
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status

    // Update metadata
    const updatedMetadata = { ...existingUser.metadata }
    
    if (email !== undefined) {
      // Check if new email already exists
      if (email !== (existingUser.metadata as any)?.email) {
        const { data: emailExists } = await supabaseAdmin
          .from('core_entities')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('entity_type', 'user')
          .filter('metadata->>email', 'eq', email.toLowerCase())
          .neq('id', id)
          .single()

        if (emailExists) {
          return NextResponse.json(
            { success: false, message: 'A user with this email already exists' },
            { status: 400 }
          )
        }
        updatedMetadata.email = email.toLowerCase()
      }
    }

    if (phone !== undefined) updatedMetadata.phone = phone
    if (department !== undefined) updatedMetadata.department = department
    if (job_title !== undefined) updatedMetadata.job_title = job_title
    if (hire_date !== undefined) updatedMetadata.hire_date = hire_date
    if (manager_id !== undefined) updatedMetadata.manager_id = manager_id
    if (location !== undefined) updatedMetadata.location = location
    if (role !== undefined) updatedMetadata.role = role
    if (permissions !== undefined) updatedMetadata.permissions = permissions
    
    updatedMetadata.last_updated_by = currentUser.id

    // Handle password update
    if (password) {
      const saltRounds = 12
      updatedMetadata.password_hash = await bcrypt.hash(password, saltRounds)
      updatedMetadata.password_changed_at = new Date().toISOString()
      updatedMetadata.must_change_password = false
    }

    // Handle failed attempts reset
    if (reset_failed_attempts) {
      updatedMetadata.failed_login_attempts = 0
      updatedMetadata.account_locked = false
    }

    updateData.metadata = updatedMetadata

    // Update user
    const { error: updateError } = await supabaseAdmin
      .from('core_entities')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to update user' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    })

  } catch (error) {
    console.error('Update user error:', error)
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/users - Delete user (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    // Get organization_id and verify permissions
    const organizationId = await getOrganizationFromAuth(request)
    const currentUser = await getUserFromAuth(request)
    
    if (!hasPermission(currentUser.permissions, 'users:delete')) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions to delete users' },
        { status: 403 }
      )
    }

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      )
    }

    // Prevent self-deletion
    if (id === currentUser.id) {
      return NextResponse.json(
        { success: false, message: 'You cannot delete your own account' },
        { status: 403 }
      )
    }

    // Get user to check if they're an owner
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('core_entities')
      .select('metadata')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .eq('entity_type', 'user')
      .single()

    if (fetchError || !user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent deletion of owner accounts
    if ((user.metadata as any)?.role === 'owner') {
      return NextResponse.json(
        { success: false, message: 'Owner accounts cannot be deleted' },
        { status: 403 }
      )
    }

    // Soft delete by setting status to 'deleted'
    const { error: deleteError } = await supabaseAdmin
      .from('core_entities')
      .update({
        status: 'deleted',
        updated_at: new Date().toISOString(),
        metadata: {
          ...user.metadata,
          deleted_by: currentUser.id,
          deleted_at: new Date().toISOString()
        }
      })
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return NextResponse.json(
        { success: false, message: 'Failed to delete user' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('Delete user error:', error)
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to send welcome email
async function sendWelcomeEmail(email: string, name: string, password: string, organizationId: string): Promise<void> {
  // In production, this would integrate with your email service (SendGrid, AWS SES, etc.)
  console.log(`📧 Welcome email would be sent to ${email} for ${name}`)
  console.log(`   Organization: ${organizationId}`)
  console.log(`   Temporary password: ${password}`)
  console.log(`   Instructions: Log in and change password on first use`)
  
  // Example email content:
  // Subject: Welcome to HERA - Your Account is Ready
  // Body: Welcome ${name}, your HERA account has been created...
}