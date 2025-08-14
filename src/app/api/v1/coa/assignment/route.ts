// API Routes for COA Template Assignment
import { NextRequest, NextResponse } from 'next/server';

// Mock database - replace with actual database calls
const mockAssignments: Record<string, any> = {};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // In real implementation, call: get_organization_coa_assignment(organizationId)
    const assignment = mockAssignments[organizationId] || {
      organization_id: organizationId,
      base_template: 'universal_base',
      country_template: null,
      industry_template: null,
      status: 'no_assignment',
      message: 'No COA template assigned to this organization'
    };

    return NextResponse.json(assignment);
  } catch (error) {
    console.error('Error fetching COA assignment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organizationId,
      countryTemplate,
      industryTemplate,
      assignedBy,
      allowCustomAccounts = true,
      changeReason
    } = body;

    // Validate required fields
    if (!organizationId || !assignedBy) {
      return NextResponse.json(
        { error: 'Organization ID and assigned by are required' },
        { status: 400 }
      );
    }

    // In real implementation, call: assign_coa_template() database function
    const configurationId = `config_${Date.now()}`;
    const assignment = {
      id: configurationId,
      organizationId,
      baseTemplate: 'universal_base',
      countryTemplate,
      industryTemplate,
      assignedBy,
      assignedAt: new Date().toISOString(),
      effectiveDate: new Date().toISOString().split('T')[0],
      status: 'active',
      isLocked: false,
      allowCustomAccounts,
      autoSyncUpdates: true
    };

    // Store mock assignment
    mockAssignments[organizationId] = assignment;

    // Calculate total accounts
    let totalAccounts = 67; // Base template
    if (countryTemplate) totalAccounts += 40;
    if (industryTemplate) totalAccounts += 30;

    const result = {
      success: true,
      configurationId,
      message: `COA template assigned successfully. Templates: universal_base${countryTemplate ? `, ${countryTemplate}` : ''}${industryTemplate ? `, ${industryTemplate}` : ''}`,
      coaStructure: {
        totalAccounts,
        layers: [
          { layer: 'base', template: 'universal_base', accounts: 67 },
          countryTemplate && { layer: 'country', template: countryTemplate, accounts: 40 },
          industryTemplate && { layer: 'industry', template: industryTemplate, accounts: 30 }
        ].filter(Boolean)
      },
      assignment
    };

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error assigning COA template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organizationId,
      countryTemplate,
      industryTemplate,
      assignedBy,
      allowCustomAccounts,
      changeReason
    } = body;

    if (!organizationId || !assignedBy) {
      return NextResponse.json(
        { error: 'Organization ID and assigned by are required' },
        { status: 400 }
      );
    }

    // Check if assignment exists
    const existingAssignment = mockAssignments[organizationId];
    if (!existingAssignment) {
      return NextResponse.json(
        { error: 'No existing COA assignment found for this organization' },
        { status: 404 }
      );
    }

    // Update assignment
    const updatedAssignment = {
      ...existingAssignment,
      countryTemplate,
      industryTemplate,
      assignedBy,
      allowCustomAccounts,
      updatedAt: new Date().toISOString()
    };

    mockAssignments[organizationId] = updatedAssignment;

    return NextResponse.json({
      success: true,
      message: 'COA template assignment updated successfully',
      assignment: updatedAssignment
    });
  } catch (error) {
    console.error('Error updating COA assignment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}