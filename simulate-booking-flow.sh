#!/bin/bash

echo "📱 Simulating Hair Talkz Booking Flow"
echo "===================================="
echo ""
echo "This shows what messages you would receive if the booking handler was deployed:"
echo ""

# Function to simulate bot response
send_response() {
    local message="$1"
    echo "🤖 Hair Talkz Bot:"
    echo "$message"
    echo ""
    sleep 2
}

echo "👤 You: appointment"
send_response "Welcome to Hair Talkz! 💇‍♀️

I'll help you book an appointment.

Please select a service:
1. Haircut & Style (60min - AED 150)
2. Hair Color (180min - AED 280)
3. Keratin Treatment (180min - AED 350)
4. Bridal Package (360min - AED 800)
5. Spa Treatment (120min - AED 300)

Reply with the number of your choice."

echo "👤 You: 1"
send_response "Great! You selected Haircut & Style.

Please select your preferred stylist:
1. Rocky - Senior Stylist
2. Maya - Color Specialist
3. Sophia - Bridal Specialist
4. Any Available - First Available

Reply with the number."

echo "👤 You: 1"
send_response "Perfect! Rocky will take care of you.

Please select a date:
1. Monday, Dec 25
2. Tuesday, Dec 26
3. Wednesday, Dec 27
4. Thursday, Dec 28
5. Friday, Dec 29
6. Saturday, Dec 30
7. Sunday, Dec 31

Reply with the number."

echo "👤 You: 2"
send_response "Great! Booking for Tuesday, Dec 26.

Available time slots:
1. 09:00
2. 10:00
3. 11:00
4. 12:00
5. 14:00
6. 15:00
7. 16:00
8. 17:00
9. 18:00

Reply with the number."

echo "👤 You: 3"
send_response "📅 *Booking Summary*

Service: Haircut & Style
Stylist: Rocky
Date: Tuesday, Dec 26
Time: 11:00
Duration: 60 minutes
Price: AED 150

Reply 'YES' to confirm or 'NO' to cancel."

echo "👤 You: YES"
send_response "✅ *Appointment Confirmed!*

Your appointment for Haircut & Style with Rocky on Tuesday, Dec 26 at 11:00 has been booked.

You'll receive a reminder 24 hours before your appointment.

Thank you for choosing Hair Talkz! 💇‍♀️

To manage your booking, reply 'manage'."

echo "===================================="
echo "This is how the booking system would work once deployed."