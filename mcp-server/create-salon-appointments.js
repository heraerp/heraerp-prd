// Create salon appointments using HERA CLI
const { exec } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)

const SALON_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'

async function createAppointment(name, code, fields) {
  try {
    // Create appointment entity
    const createCmd = `DEFAULT_ORGANIZATION_ID=${SALON_ORG_ID} node hera-cli.js create-entity appointment "${name}" --code "${code}" --smart-code "HERA.SALON.APPT.ENTITY.APPOINTMENT.V1"`
    const { stdout } = await execAsync(createCmd)
    
    // Extract entity ID from output
    const match = stdout.match(/Entity created: ([\w-]+)/)
    if (\!match) {
      console.error('Failed to extract entity ID from:', stdout)
      return null
    }
    
    const entityId = match[1]
    
    // Set dynamic fields
    for (const [field, value] of Object.entries(fields)) {
      const setCmd = `DEFAULT_ORGANIZATION_ID=${SALON_ORG_ID} node hera-cli.js set-field ${entityId} ${field} "${value}"`
      await execAsync(setCmd)
    }
    
    console.log(`✅ Created appointment: ${code}`)
    return entityId
  } catch (error) {
    console.error(`❌ Error creating appointment ${code}:`, error.message)
    return null
  }
}

async function main() {
  console.log('🎯 Creating salon appointments for Hair Talkz Salon...\n')
  
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  // Create appointments
  const appointments = [
    {
      name: 'Sarah Johnson - Haircut - Today 10:00 AM',
      code: 'APT-TODAY-1000',
      fields: {
        start_time: new Date(today.getTime() + 10 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(today.getTime() + 10.75 * 60 * 60 * 1000).toISOString(),
        status: 'completed',
        notes: 'Regular customer - prefers layered cut',
        price: '150',
        currency_code: 'AED'
      }
    },
    {
      name: 'Emma Williams - Hair Color - Today 11:00 AM', 
      code: 'APT-TODAY-1100',
      fields: {
        start_time: new Date(today.getTime() + 11 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(today.getTime() + 13 * 60 * 60 * 1000).toISOString(),
        status: 'checked_in',
        notes: 'First time coloring - wants subtle highlights',
        price: '350',
        currency_code: 'AED'
      }
    },
    {
      name: 'Lisa Davis - Deep Conditioning - Today 2:00 PM',
      code: 'APT-TODAY-1400',
      fields: {
        start_time: new Date(today.getTime() + 14 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(today.getTime() + 14.5 * 60 * 60 * 1000).toISOString(),
        status: 'booked',
        notes: 'Has dry hair - recommended by stylist',
        price: '120',
        currency_code: 'AED'
      }
    },
    {
      name: 'Maria Garcia - Highlights - Tomorrow 9:00 AM',
      code: 'APT-TOM-0900',
      fields: {
        start_time: new Date(today.getTime() + 33 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(today.getTime() + 34.5 * 60 * 60 * 1000).toISOString(),
        status: 'booked',
        notes: 'Wants face-framing highlights',
        price: '280',
        currency_code: 'AED'
      }
    },
    {
      name: 'Jennifer Brown - Blowout - Tomorrow 3:00 PM',
      code: 'APT-TOM-1500',
      fields: {
        start_time: new Date(today.getTime() + 39 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(today.getTime() + 39.75 * 60 * 60 * 1000).toISOString(),
        status: 'booked',
        notes: 'Special event preparation',
        price: '100',
        currency_code: 'AED'
      }
    }
  ]
  
  for (const apt of appointments) {
    await createAppointment(apt.name, apt.code, apt.fields)
  }
  
  console.log('\n✅ Salon appointments created successfully\!')
  console.log('🌐 Visit http://localhost:3000/salon/appointments to view')
}

main().catch(console.error)
ENDSCRIPT < /dev/null