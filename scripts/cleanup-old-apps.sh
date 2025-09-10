#!/bin/bash

# Cleanup Script for Old Apps
# Keeps: salon-data, restaurant, furniture, healthcare, and essential system features

echo "🧹 Starting App Directory Cleanup"
echo "================================="
echo ""

# Apps to remove - Old/Duplicate versions
echo "📁 Removing old/duplicate versions..."
rm -rf src/app/salon-data-with-sidebar
rm -rf src/app/analytics-chat  # keeping v2
rm -rf src/app/readiness-dashboard-test
echo "✅ Removed duplicate versions"

# Remove demo/example apps
echo "📁 Removing demo/example apps..."
rm -rf src/app/urp-demo
rm -rf src/app/showcase
rm -rf src/app/build
rm -rf src/app/deploy
echo "✅ Removed demo apps"

# Remove marketing/landing pages
echo "📁 Removing marketing/landing pages..."
rm -rf src/app/landing
rm -rf src/app/get-started
rm -rf src/app/how-it-works
rm -rf src/app/investor
rm -rf src/app/partner
rm -rf src/app/partners
rm -rf src/app/franchise
rm -rf src/app/discover
echo "✅ Removed marketing pages"

# Remove unused business modules
echo "📁 Removing unused business modules..."
rm -rf src/app/hairtalkz
rm -rf src/app/pos
rm -rf src/app/inventory
rm -rf src/app/finance
rm -rf src/app/financial
rm -rf src/app/budgeting
rm -rf src/app/auto-journal
rm -rf src/app/trial-balance
echo "✅ Removed unused business modules"

# Remove WhatsApp related (uncomment if not using)
echo "📁 Removing WhatsApp modules..."
rm -rf src/app/whatsapp-desktop
rm -rf src/app/whatsapp-messages
rm -rf src/app/whatsapp-setup-guide
echo "✅ Removed WhatsApp modules"

# Remove other unused apps
echo "📁 Removing other unused apps..."
rm -rf src/app/actions
rm -rf src/app/ai-assistants
rm -rf src/app/analytics-chat-v2
rm -rf src/app/apps
rm -rf src/app/audit  # Remove if not using audit module
rm -rf src/app/calendar
rm -rf src/app/development
rm -rf src/app/design-system
rm -rf src/app/enterprise
rm -rf src/app/financial-integration
rm -rf src/app/learning
rm -rf src/app/universal-learning
rm -rf src/app/offline
rm -rf src/app/pwm
rm -rf src/app/readiness-dashboard
rm -rf src/app/readiness-questionnaire
rm -rf src/app/refresh
rm -rf src/app/setup
rm -rf src/app/validate
rm -rf src/app/wizard
echo "✅ Removed other unused apps"

echo ""
echo "📊 Cleanup Summary:"
echo "=================="
echo "✅ Kept active business modules: salon-data, restaurant, furniture, healthcare"
echo "✅ Kept system features: api, auth, org, admin, control-center, docs"
echo "✅ Kept developer tools: digital-accountant, mcp-*, sql-editor"
echo ""
echo "Remaining directories:"
ls src/app | wc -l
echo ""
echo "🎉 Cleanup complete!"