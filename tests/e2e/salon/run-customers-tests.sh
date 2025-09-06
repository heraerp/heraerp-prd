#!/bin/bash

# Customer CRUD E2E Test Runner
# This script runs the customer CRUD tests with various options

echo "🧪 Customer CRUD E2E Test Runner"
echo "================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Playwright is installed
if ! npx playwright --version &> /dev/null; then
    echo -e "${RED}❌ Playwright is not installed${NC}"
    echo "Installing Playwright..."
    npm run test:e2e:install
fi

# Parse command line arguments
MODE="headless"
BROWSER="chromium"
DEBUG=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --headed)
            MODE="headed"
            shift
            ;;
        --ui)
            MODE="ui"
            shift
            ;;
        --debug)
            DEBUG=true
            shift
            ;;
        --browser)
            BROWSER="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --headed      Run tests with browser visible"
            echo "  --ui          Run tests in Playwright UI mode"
            echo "  --debug       Run tests in debug mode"
            echo "  --browser     Specify browser (chromium, firefox, webkit)"
            echo "  --help        Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                    # Run headless in Chromium"
            echo "  $0 --headed           # Run with browser visible"
            echo "  $0 --ui               # Run in UI mode"
            echo "  $0 --browser firefox  # Run in Firefox"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Start the development server if not already running
if ! curl -s http://localhost:3000 > /dev/null && ! curl -s http://localhost:3001 > /dev/null; then
    echo -e "${YELLOW}Starting development server...${NC}"
    npm run dev &
    DEV_PID=$!
    
    # Wait for server to start
    echo "Waiting for server to start..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null || curl -s http://localhost:3001 > /dev/null; then
            echo -e "${GREEN}✓ Development server started${NC}"
            break
        fi
        sleep 1
    done
fi

# Run the tests based on mode
echo -e "${YELLOW}Running Customer CRUD tests in $MODE mode with $BROWSER browser...${NC}"
echo ""

case $MODE in
    "headed")
        npm run test:e2e:customers:headed -- --project=$BROWSER
        ;;
    "ui")
        npm run test:e2e:customers:ui
        ;;
    *)
        npm run test:e2e:customers -- --project=$BROWSER
        ;;
esac

TEST_EXIT_CODE=$?

# Show test report if tests were run
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ All tests passed!${NC}"
else
    echo ""
    echo -e "${RED}❌ Some tests failed${NC}"
    echo ""
    echo "View detailed report with: npm run test:e2e:report"
fi

# Cleanup
if [ ! -z "$DEV_PID" ]; then
    echo ""
    echo "Stopping development server..."
    kill $DEV_PID 2>/dev/null
fi

exit $TEST_EXIT_CODE