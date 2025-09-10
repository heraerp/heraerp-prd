#!/bin/bash

# HairTalkz Organization Creation E2E Test Runner
# This script runs the comprehensive E2E test for creating a salon organization

echo "🧪 Starting HairTalkz Salon Organization Creation E2E Test"
echo "=================================================="

# Check if development server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Development server is not running on localhost:3000"
    echo "Please start the server with: npm run dev"
    exit 1
fi

echo "✅ Development server is running"

# Create test results directory
mkdir -p ../../../test-results

# Set test environment variables
export NODE_ENV=test
export CI=false

echo "🚀 Running HairTalkz organization creation tests..."

# Run the specific test with detailed output
npx playwright test hairtalkz-creation.spec.ts \
    --config=./playwright.config.ts \
    --reporter=list \
    --headed \
    --trace=on \
    --video=on \
    --screenshot=on

# Check test results
if [ $? -eq 0 ]; then
    echo "✅ All HairTalkz organization creation tests passed!"
    echo ""
    echo "📊 Test Summary:"
    echo "- Organization creation flow: PASSED"
    echo "- Subdomain validation: PASSED"  
    echo "- Error handling: PASSED"
    echo "- Form validation: PASSED"
    echo ""
    echo "🎉 HairTalkz salon organization is ready for production!"
else
    echo "❌ Some tests failed. Check the output above for details."
    echo ""
    echo "🔍 Debug Information:"
    echo "- Screenshots saved to: test-results/"
    echo "- Videos saved to: test-results/"
    echo "- Traces available in Playwright report"
    echo ""
    echo "📖 Common Issues:"
    echo "1. Make sure development server is running (npm run dev)"
    echo "2. Check database connectivity"
    echo "3. Verify Supabase environment variables"
    echo "4. Check browser permissions for localhost"
    exit 1
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Test the created HairTalkz organization manually at: http://localhost:3000/~hairtalkz"
echo "2. Verify salon-specific features are working"
echo "3. Test appointment booking and customer management"
echo "4. Ready for production deployment!"