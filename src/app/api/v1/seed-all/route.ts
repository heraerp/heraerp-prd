import { NextRequest, NextResponse } from 'next/server'

// GET /api/v1/seed-all - Create all sample data for Mario's Restaurant
export async function GET(request: NextRequest) {
  try {
    const baseUrl = request.url.replace('/seed-all', '')
    
    console.log('🌱 Starting to seed all data for Mario\'s Restaurant...')

    // 1. Create menu items first
    console.log('📋 Creating menu items...')
    const menuResponse = await fetch(`${baseUrl}/seed-menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    const menuResult = await menuResponse.json()
    
    if (!menuResult.success) {
      throw new Error(`Menu seeding failed: ${menuResult.message}`)
    }
    
    console.log('✅ Menu items created:', menuResult.data.length)

    // 2. Create sample orders
    console.log('🍽️ Creating sample orders...')
    const ordersResponse = await fetch(`${baseUrl}/seed-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    const ordersResult = await ordersResponse.json()
    
    if (!ordersResult.success) {
      throw new Error(`Orders seeding failed: ${ordersResult.message}`)
    }
    
    console.log('✅ Sample orders created:', ordersResult.data.length)

    return NextResponse.json({
      success: true,
      message: 'Successfully seeded all data for Mario\'s Restaurant!',
      data: {
        menu_items: menuResult.data,
        orders: ordersResult.data,
        summary: {
          menu_items_created: menuResult.data.length,
          orders_created: ordersResult.data.length
        }
      }
    })

  } catch (error) {
    console.error('Seed all error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: `Failed to seed data: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    )
  }
}