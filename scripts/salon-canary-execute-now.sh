#!/bin/bash

# SALON CANARY EXECUTION SCRIPT
# Execute this NOW to enable Hair Talkz POS cart playbook mode

echo "🚀 HAIR TALKZ POS CART CANARY - EXECUTION SCRIPT"
echo "=============================================="
echo "Time: $(date)"
echo ""

# Step 1: Enable the flag
echo "📍 STEP 1: Enabling playbook_mode.pos_cart for Hair Talkz..."
npm run salon:canary:enable

# Step 2: Verify flag is enabled
echo -e "\n📍 STEP 2: Verifying flag status..."
npm run salon:canary:status

# Step 3: Run test flows
echo -e "\n📍 STEP 3: Running test flows..."
echo "Please wait for all 3 flows to complete..."
npm run salon:canary:test

# Step 4: Start monitoring
echo -e "\n📍 STEP 4: Starting continuous monitoring..."
echo "Monitor will run in background. Press Ctrl+C to stop."
echo ""
echo "📊 MONITORING DASHBOARD: http://localhost:3000/dashboards/hair-talkz-workflows"
echo ""
echo "⚡ QUICK ROLLBACK COMMAND:"
echo "   npm run salon:canary:rollback"
echo ""
echo "Starting monitor in 5 seconds..."
sleep 5

npm run salon:canary:monitor