#!/bin/bash

echo "Copy and paste these environment variables into Railway's Raw Editor:"
echo "================================================================"
echo ""

# Read .env.local and format for Railway
while IFS='=' read -r key value; do
  # Skip empty lines and comments
  if [[ -z "$key" ]] || [[ "$key" =~ ^# ]]; then
    continue
  fi
  
  # Only process variables that start with uppercase letters
  if [[ "$key" =~ ^[A-Z] ]]; then
    echo "$key=$value"
  fi
done < .env.local

# Add additional production variables
echo "NODE_ENV=production"
echo ""
echo "================================================================"
echo "Remember to update NEXT_PUBLIC_APP_URL with your Railway app URL after deployment!"