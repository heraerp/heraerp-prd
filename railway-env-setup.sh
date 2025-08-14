#!/bin/bash

echo "Setting up Railway environment variables..."

# Build the command with all variables
cmd="railway variables"

# Read .env.local and build --set flags
while IFS='=' read -r key value; do
  # Skip empty lines and comments
  if [[ -z "$key" ]] || [[ "$key" =~ ^# ]]; then
    continue
  fi
  
  # Only process variables that start with uppercase letters
  if [[ "$key" =~ ^[A-Z] ]]; then
    echo "Adding $key..."
    # Escape the value properly
    escaped_value=$(printf '%q' "$value")
    cmd="$cmd --set \"$key=$escaped_value\""
  fi
done < .env.local

# Add skip-deploys flag to avoid triggering a deploy for each variable
cmd="$cmd --skip-deploys"

echo ""
echo "Executing: Setting all environment variables..."
eval $cmd

echo ""
echo "✅ Environment variables added to Railway!"
echo ""
echo "You can verify them with: railway variables"