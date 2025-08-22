#!/usr/bin/env node

const fetch = require('node-fetch')

async function testAppointmentCreation() {
  console.log('Testing appointment API...')
  
  const appointmentData = {
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    clientName: 'Test Customer',
    clientPhone: '+971501234567',
    clientEmail: 'test@example.com',
    serviceId: '1',
    serviceName: 'Hair Cut',
    servicePrice: 150,
    stylistId: '1',
    stylistName: 'Emma Johnson',
    date: new Date().toISOString().split('T')[0],
    time: '14:00',
    duration: '30 min',
    notes: 'Test appointment'
  }

  try {
    const response = await fetch('http://localhost:3000/api/v1/salon/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appointmentData)
    })

    const responseText = await response.text()
    console.log('Response status:', response.status)
    console.log('Response:', responseText)

    if (response.ok) {
      const data = JSON.parse(responseText)
      console.log('✅ Appointment created successfully:', data)
    } else {
      console.error('❌ Failed to create appointment')
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testAppointmentCreation()