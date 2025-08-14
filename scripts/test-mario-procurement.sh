#!/bin/bash

# Mario's Restaurant Procurement & Inventory Testing Script
# Comprehensive testing of HERA's universal architecture for supply chain management

echo "🍝 Starting Mario's Restaurant Procurement & Inventory Testing..."
echo "Testing HERA's Universal Architecture for Supply Chain Management"
echo "=============================================================="

# Check if the dev server is running
echo "📡 Checking if development server is running..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Development server not running. Please start with 'npm run dev' first."
    exit 1
fi

echo "✅ Development server is running"

# Run procurement tests with detailed reporting
echo ""
echo "🧪 Running Mario Restaurant Procurement Tests..."
echo "Testing Components:"
echo "  • Dashboard Overview & Quick Actions"
echo "  • Supplier Management (Universal Entities)"
echo "  • Product Catalog (Dynamic Specifications)"
echo "  • Purchase Orders (Universal Transactions)"
echo "  • Complete Workflow Integration"
echo ""

# Create test report directory
mkdir -p test-reports/procurement

# Run the procurement test suite
echo "🚀 Executing Playwright Tests for Procurement System..."
npx playwright test tests/e2e/procurement/ \
  --reporter=html \
  --output-dir=test-reports/procurement \
  --project="chromium" \
  --headed

# Check test results
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All Mario Restaurant Procurement Tests Passed!"
    echo ""
    echo "🎉 HERA Universal Architecture Validation Complete!"
    echo "   • Universal 6-table schema successfully supports supply chain management"
    echo "   • Steve Jobs-inspired UI provides intuitive procurement workflow"
    echo "   • System demonstrates scalability across industry verticals"
    echo ""
    echo "📊 Test Report: test-reports/procurement/index.html"
    echo "🍝 Mario's restaurant is ready for full supply chain operations!"
else
    echo ""
    echo "❌ Some tests failed. Check the detailed report for issues."
    echo "📊 Test Report: test-reports/procurement/index.html"
    exit 1
fi