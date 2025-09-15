import { NextRequest, NextResponse } from 'next/server'

// HERA Airlines API - Universal Airline Booking System
// Implements flight search, booking, lottery, and loyalty with HERA DNA patterns

interface AirlineApiRequest {
  action:
    | 'search_flights'
    | 'book_flight'
    | 'lottery_entry'
    | 'lottery_draw'
    | 'check_in'
    | 'issue_boarding_pass'
    | 'earn_miles'
    | 'upgrade_status'
    | 'cancel_booking'
    | 'modify_booking'
    | 'flight_status'
    | 'seat_selection'
  data: any
  smart_code: string
  organization_id?: string
}

interface FlightSearchData {
  origin: string
  destination: string
  departure_date: string
  return_date?: string
  passengers: number
  cabin_class: 'economy' | 'premium' | 'business' | 'first'
  flexible_dates?: boolean
  lottery_eligible_only?: boolean
}

interface BookingData {
  flight_id: string
  passengers: {
    first_name: string
    last_name: string
    date_of_birth: string
    passport_number?: string
    frequent_flyer?: string
  }[]
  seat_preferences?: string[]
  add_ons?: string[]
  payment_method: string
  lottery_opt_in: boolean
}

interface LotteryEntryData {
  booking_id: string
  flight_id: string
  customer_id: string
  loyalty_tier?: string
  entry_type: 'automatic' | 'second_chance'
}

// Mock flight inventory
const FLIGHT_INVENTORY = [
  {
    flight_id: 'AA101',
    flight_number: 'AA101',
    airline: 'American Airlines',
    origin: 'JFK',
    destination: 'LAX',
    departure_time: '2025-12-17T08:00:00',
    arrival_time: '2025-12-17T11:30:00',
    duration_minutes: 330,
    aircraft: 'Boeing 787-9',
    available_seats: {
      economy: 145,
      premium: 22,
      business: 8,
      first: 2
    },
    prices: {
      economy: 299,
      premium: 549,
      business: 1299,
      first: 2899
    },
    lottery_eligible: true,
    amenities: ['wifi', 'meals', 'entertainment', 'power'],
    on_time_performance: 0.94
  },
  {
    flight_id: 'UA456',
    flight_number: 'UA456',
    airline: 'United Airlines',
    origin: 'JFK',
    destination: 'LAX',
    departure_time: '2025-12-17T10:15:00',
    arrival_time: '2025-12-17T13:55:00',
    duration_minutes: 340,
    aircraft: 'Boeing 737 MAX 9',
    available_seats: {
      economy: 98,
      premium: 15,
      business: 12,
      first: 0
    },
    prices: {
      economy: 325,
      premium: 575,
      business: 1199,
      first: 0
    },
    lottery_eligible: true,
    amenities: ['wifi', 'entertainment'],
    on_time_performance: 0.92
  }
]

// Lottery algorithm with weighted selection
class LotteryService {
  static calculateWeight(entry: LotteryEntryData): number {
    let weight = 1.0

    // Loyalty tier bonuses
    if (entry.loyalty_tier === 'silver') weight *= 1.2
    if (entry.loyalty_tier === 'gold') weight *= 1.5
    if (entry.loyalty_tier === 'platinum') weight *= 2.0
    if (entry.loyalty_tier === 'diamond') weight *= 2.5

    // Second chance entries get small boost
    if (entry.entry_type === 'second_chance') weight *= 1.1

    return weight
  }

  static async runLotteryDraw(flight_id: string): Promise<any[]> {
    // In real implementation, this would:
    // 1. Get all eligible entries from database
    // 2. Calculate available upgrade seats
    // 3. Run weighted random selection
    // 4. Create upgrade transactions

    const mockWinners = [
      {
        winner_id: `WIN-${Date.now()}`,
        booking_id: 'BOOK-123',
        customer_name: 'John Doe',
        original_class: 'economy',
        upgraded_class: 'business',
        upgrade_value: 1000,
        notification_sent: true
      }
    ]

    return mockWinners
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: AirlineApiRequest = await request.json()
    const { action, data, smart_code, organization_id = 'default' } = body

    // Validate smart code format
    if (!smart_code || !smart_code.startsWith('HERA.AIR.')) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid smart code. Must follow HERA.AIR.{MODULE}.{TYPE}.{FUNCTION}.v{VERSION} pattern',
          code: 'INVALID_SMART_CODE'
        },
        { status: 400 }
      )
    }

    console.log(`🛫 Airlines API: ${action} with smart code: ${smart_code}`)

    switch (action) {
      case 'search_flights':
        return await handleFlightSearch(data, smart_code, organization_id)

      case 'book_flight':
        return await handleFlightBooking(data, smart_code, organization_id)

      case 'lottery_entry':
        return await handleLotteryEntry(data, smart_code, organization_id)

      case 'lottery_draw':
        return await handleLotteryDraw(data, smart_code, organization_id)

      case 'check_in':
        return await handleCheckIn(data, smart_code, organization_id)

      case 'earn_miles':
        return await handleMilesEarning(data, smart_code, organization_id)

      case 'seat_selection':
        return await handleSeatSelection(data, smart_code, organization_id)

      case 'flight_status':
        return await handleFlightStatus(data, smart_code, organization_id)

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unsupported action: ${action}`,
            supported_actions: [
              'search_flights',
              'book_flight',
              'lottery_entry',
              'lottery_draw',
              'check_in',
              'earn_miles',
              'seat_selection',
              'flight_status'
            ]
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Airlines API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const smart_code = searchParams.get('smart_code')
  const organization_id = searchParams.get('organization_id') || 'default'

  try {
    switch (action) {
      case 'flight_schedule':
        return NextResponse.json({
          success: true,
          data: FLIGHT_INVENTORY,
          smart_code: 'HERA.AIR.SEARCH.ENT.SCHEDULE.v1',
          total_flights: FLIGHT_INVENTORY.length
        })

      case 'lottery_stats':
        return await getLotteryStatistics(organization_id)

      case 'loyalty_status':
        const customer_id = searchParams.get('customer_id')
        return await getLoyaltyStatus(customer_id || '', organization_id)

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Unsupported GET action',
            supported_actions: ['flight_schedule', 'lottery_stats', 'loyalty_status']
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Airlines API GET Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Flight Search Handler (HERA.AIR.SEARCH.TXN.QUERY.v1)
async function handleFlightSearch(
  data: FlightSearchData,
  smart_code: string,
  organization_id: string
) {
  // Filter flights based on search criteria
  const results = FLIGHT_INVENTORY.filter(flight => {
    const matchesRoute = flight.origin === data.origin && flight.destination === data.destination
    const matchesDate = flight.departure_time.startsWith(data.departure_date)
    const hasAvailability = flight.available_seats[data.cabin_class] >= data.passengers
    const matchesLottery = !data.lottery_eligible_only || flight.lottery_eligible

    return matchesRoute && matchesDate && hasAvailability && matchesLottery
  })

  // Calculate dynamic pricing based on availability
  const pricedResults = results.map(flight => {
    const basePrice = flight.prices[data.cabin_class]
    const availabilityRatio = flight.available_seats[data.cabin_class] / 200
    const dynamicMultiplier = availabilityRatio < 0.2 ? 1.5 : availabilityRatio < 0.5 ? 1.2 : 1.0

    return {
      ...flight,
      price_per_passenger: Math.round(basePrice * dynamicMultiplier),
      total_price: Math.round(basePrice * dynamicMultiplier * data.passengers),
      availability_status: availabilityRatio < 0.1 ? 'limited' : 'available',
      lottery_probability: flight.lottery_eligible
        ? calculateLotteryProbability(data.cabin_class)
        : 0
    }
  })

  return NextResponse.json({
    success: true,
    message: 'Flight search completed',
    data: {
      search_id: `SEARCH-${Date.now()}`,
      origin: data.origin,
      destination: data.destination,
      departure_date: data.departure_date,
      return_date: data.return_date,
      passengers: data.passengers,
      results: pricedResults,
      total_results: pricedResults.length
    },
    smart_code,
    organization_id
  })
}

// Flight Booking Handler (HERA.AIR.BOOK.TXN.CREATE.v1)
async function handleFlightBooking(data: BookingData, smart_code: string, organization_id: string) {
  const booking_id = `BOOK-${Date.now()}`
  const confirmation_code = generateConfirmationCode()

  // In real implementation, this would create records in:
  // - universal_transactions (booking transaction)
  // - universal_transaction_lines (each passenger, seat, add-on)
  // - core_entities (passenger records if new)
  // - core_dynamic_data (passport info, preferences)

  return NextResponse.json({
    success: true,
    message: 'Flight booked successfully',
    data: {
      booking_id,
      confirmation_code,
      flight_id: data.flight_id,
      passengers: data.passengers.length,
      total_amount: calculateBookingTotal(data),
      status: 'confirmed',
      lottery_entries: data.lottery_opt_in ? data.passengers.length : 0,
      check_in_opens: '24 hours before departure',
      payment_status: 'processed'
    },
    smart_code,
    organization_id,
    actions: {
      check_in_url: `/airline/checkin/${booking_id}`,
      manage_booking_url: `/airline/bookings/${booking_id}`,
      lottery_status_url: `/airline/lottery/entries/${booking_id}`
    }
  })
}

// Lottery Entry Handler (HERA.AIR.LOTTERY.TXN.ENTER.v1)
async function handleLotteryEntry(
  data: LotteryEntryData,
  smart_code: string,
  organization_id: string
) {
  const entry_id = `ENTRY-${Date.now()}`
  const weight = LotteryService.calculateWeight(data)

  return NextResponse.json({
    success: true,
    message: 'Lottery entry created successfully',
    data: {
      entry_id,
      booking_id: data.booking_id,
      flight_id: data.flight_id,
      entry_type: data.entry_type,
      weight,
      draw_date: calculateDrawDate(data.flight_id),
      status: 'active',
      loyalty_bonus_applied: data.loyalty_tier ? true : false
    },
    smart_code,
    organization_id
  })
}

// Lottery Draw Handler (HERA.AIR.LOTTERY.TXN.DRAW.v1)
async function handleLotteryDraw(data: any, smart_code: string, organization_id: string) {
  const winners = await LotteryService.runLotteryDraw(data.flight_id)

  return NextResponse.json({
    success: true,
    message: 'Lottery draw completed',
    data: {
      draw_id: `DRAW-${Date.now()}`,
      flight_id: data.flight_id,
      total_entries: 487,
      total_winners: winners.length,
      winners,
      next_draw: calculateNextDrawTime(),
      upgrade_pool: {
        economy_to_premium: 5,
        economy_to_business: 2,
        premium_to_business: 1
      }
    },
    smart_code,
    organization_id
  })
}

// Check-in Handler (HERA.AIR.CHECKIN.TXN.PROCESS.v1)
async function handleCheckIn(data: any, smart_code: string, organization_id: string) {
  const checkin_id = `CI-${Date.now()}`

  return NextResponse.json({
    success: true,
    message: 'Check-in completed successfully',
    data: {
      checkin_id,
      booking_id: data.booking_id,
      boarding_passes: generateBoardingPasses(data.booking_id),
      seat_assignments: data.seat_selections || 'Auto-assigned at gate',
      baggage_tags: data.checked_bags || 0,
      security_code: generateSecurityCode(),
      boarding_time: '30 minutes before departure',
      gate: 'B24'
    },
    smart_code,
    organization_id
  })
}

// Miles Earning Handler (HERA.AIR.LOYALTY.TXN.EARN.v1)
async function handleMilesEarning(data: any, smart_code: string, organization_id: string) {
  const base_miles = calculateBaseMiles(data.flight_distance)
  const tier_multiplier = getTierMultiplier(data.loyalty_tier)
  const total_miles = Math.round(base_miles * tier_multiplier)

  return NextResponse.json({
    success: true,
    message: 'Miles credited successfully',
    data: {
      transaction_id: `MILES-${Date.now()}`,
      customer_id: data.customer_id,
      flight_id: data.flight_id,
      base_miles,
      tier_multiplier,
      bonus_miles: total_miles - base_miles,
      total_miles_earned: total_miles,
      new_balance: data.current_balance + total_miles,
      tier_progress: calculateTierProgress(data.current_balance + total_miles)
    },
    smart_code,
    organization_id
  })
}

// Seat Selection Handler (HERA.AIR.BOOK.TXN.SEAT.v1)
async function handleSeatSelection(data: any, smart_code: string, organization_id: string) {
  return NextResponse.json({
    success: true,
    message: 'Seats selected successfully',
    data: {
      selection_id: `SEAT-${Date.now()}`,
      booking_id: data.booking_id,
      selections: data.seat_numbers,
      seat_type: determineSeatType(data.seat_numbers),
      additional_cost: calculateSeatFees(data.seat_numbers),
      confirmed: true
    },
    smart_code,
    organization_id
  })
}

// Flight Status Handler
async function handleFlightStatus(data: any, smart_code: string, organization_id: string) {
  return NextResponse.json({
    success: true,
    data: {
      flight_id: data.flight_id,
      status: 'on_time',
      departure_gate: 'B24',
      arrival_gate: 'C15',
      actual_departure: null,
      actual_arrival: null,
      baggage_claim: '7',
      weather_delay: false,
      mechanical_delay: false
    },
    smart_code: 'HERA.AIR.SEARCH.RPT.STATUS.v1',
    organization_id
  })
}

// Lottery Statistics
async function getLotteryStatistics(organization_id: string) {
  return NextResponse.json({
    success: true,
    data: {
      total_entries_today: 3847,
      total_winners_today: 127,
      average_upgrade_value: 847,
      most_popular_route: 'JFK-LAX',
      win_rate: {
        economy_to_premium: 0.102,
        economy_to_business: 0.048,
        premium_to_business: 0.083
      },
      loyalty_tier_performance: {
        basic: { entries: 2100, wins: 89, rate: 0.042 },
        silver: { entries: 980, wins: 52, rate: 0.053 },
        gold: { entries: 567, wins: 41, rate: 0.072 },
        platinum: { entries: 200, wins: 19, rate: 0.095 }
      }
    },
    smart_code: 'HERA.AIR.LOTTERY.RPT.STATS.v1',
    organization_id
  })
}

// Loyalty Status
async function getLoyaltyStatus(customer_id: string, organization_id: string) {
  return NextResponse.json({
    success: true,
    data: {
      customer_id,
      loyalty_number: 'AA123456789',
      current_tier: 'Gold',
      lifetime_miles: 487293,
      year_to_date_miles: 47832,
      miles_to_next_tier: 2168,
      tier_benefits: [
        'Priority check-in',
        'Free checked bags',
        '1.5x lottery bonus',
        'Lounge access'
      ],
      expiring_miles: {
        amount: 5000,
        expiry_date: '2026-03-31'
      }
    },
    smart_code: 'HERA.AIR.LOYALTY.RPT.STATUS.v1',
    organization_id
  })
}

// Helper Functions
function calculateLotteryProbability(cabin_class: string): number {
  const base_probabilities = {
    economy: 5.2,
    premium: 8.3,
    business: 0,
    first: 0
  }
  return base_probabilities[cabin_class as keyof typeof base_probabilities] || 0
}

function generateConfirmationCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function calculateBookingTotal(data: BookingData): number {
  // Mock calculation
  return 299 * data.passengers.length
}

function calculateDrawDate(flight_id: string): string {
  // 36 hours before departure
  const departure = new Date('2025-12-17T08:00:00')
  departure.setHours(departure.getHours() - 36)
  return departure.toISOString()
}

function calculateNextDrawTime(): string {
  const now = new Date()
  now.setHours(now.getHours() + 24)
  return now.toISOString()
}

function generateBoardingPasses(booking_id: string): any[] {
  return [
    {
      pass_id: `BP-${Date.now()}`,
      passenger_name: 'John Doe',
      seat: '12A',
      boarding_group: 'B',
      qr_code: `QR-${booking_id}`,
      tsa_precheck: true
    }
  ]
}

function generateSecurityCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

function calculateBaseMiles(distance: number = 2475): number {
  return distance
}

function getTierMultiplier(tier: string = 'gold'): number {
  const multipliers = {
    basic: 1.0,
    silver: 1.2,
    gold: 1.5,
    platinum: 2.0,
    diamond: 2.5
  }
  return multipliers[tier as keyof typeof multipliers] || 1.0
}

function calculateTierProgress(total_miles: number): any {
  const tiers = [
    { name: 'Silver', threshold: 25000 },
    { name: 'Gold', threshold: 50000 },
    { name: 'Platinum', threshold: 100000 },
    { name: 'Diamond', threshold: 200000 }
  ]

  const current_tier = tiers.findIndex(tier => total_miles < tier.threshold)
  const next_tier = tiers[current_tier] || tiers[tiers.length - 1]

  return {
    current_tier: current_tier > 0 ? tiers[current_tier - 1].name : 'Basic',
    next_tier: next_tier.name,
    progress: total_miles,
    required: next_tier.threshold,
    percentage: Math.round((total_miles / next_tier.threshold) * 100)
  }
}

function determineSeatType(seat_numbers: string[]): string {
  // Mock implementation
  return seat_numbers[0]?.includes('A') ? 'Window' : 'Aisle'
}

function calculateSeatFees(seat_numbers: string[]): number {
  // Mock implementation - premium seats cost extra
  return seat_numbers.filter(seat => parseInt(seat) <= 10).length * 49
}
