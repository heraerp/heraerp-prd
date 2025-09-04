#!/bin/bash

echo "Testing WhatsApp API..."

# Test environment
echo -e "\n1. Testing environment configuration:"
curl -s http://localhost:3002/api/v1/whatsapp/test-env | python3 -m json.tool

# Test sending message
echo -e "\n\n2. Testing message send:"
curl -X POST http://localhost:3002/api/v1/whatsapp/test-direct \
  -H "Content-Type: application/json" \
  -d '{"to":"+919945896033","message":"Test from HERA"}' \
  -s | python3 -m json.tool

echo -e "\nDone!"