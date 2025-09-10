#!/bin/bash

# HERA Enterprise Test Runner
# Comprehensive script for running different test suites

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
TEST_TYPE="all"
BROWSER="chromium"
HEADED=false
DEBUG=false
REPORT=true
PARALLEL=true
COVERAGE=false

# Function to display usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -t, --type      Test type: unit|api|e2e|integration|all (default: all)"
    echo "  -b, --browser   Browser for E2E tests: chromium|firefox|webkit|all (default: chromium)"
    echo "  -h, --headed    Run E2E tests in headed mode"
    echo "  -d, --debug     Run tests in debug mode"
    echo "  -r, --report    Generate test reports (default: true)"
    echo "  -s, --serial    Run tests serially instead of parallel"
    echo "  -c, --coverage  Generate coverage report"
    echo "  --help          Display this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -t unit                    # Run only unit tests"
    echo "  $0 -t e2e -b firefox -h      # Run E2E tests in Firefox with UI"
    echo "  $0 -t api -c                  # Run API tests with coverage"
    echo "  $0 -d                         # Run all tests in debug mode"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            TEST_TYPE="$2"
            shift 2
            ;;
        -b|--browser)
            BROWSER="$2"
            shift 2
            ;;
        -h|--headed)
            HEADED=true
            shift
            ;;
        -d|--debug)
            DEBUG=true
            shift
            ;;
        -r|--report)
            REPORT="$2"
            shift 2
            ;;
        -s|--serial)
            PARALLEL=false
            shift
            ;;
        -c|--coverage)
            COVERAGE=true
            shift
            ;;
        --help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Function to run unit tests
run_unit_tests() {
    echo -e "${BLUE}Running Unit Tests...${NC}"
    
    if [ "$COVERAGE" = true ]; then
        npm run test:unit -- --coverage
    else
        npm run test:unit
    fi
}

# Function to run API tests
run_api_tests() {
    echo -e "${BLUE}Running API Tests...${NC}"
    
    # Ensure test database is ready
    npm run db:test:setup
    
    if [ "$COVERAGE" = true ]; then
        npm run test:api -- --coverage
    else
        npm run test:api
    fi
}

# Function to run E2E tests
run_e2e_tests() {
    echo -e "${BLUE}Running E2E Tests...${NC}"
    
    # Build command
    E2E_CMD="npx playwright test"
    
    # Add browser selection
    if [ "$BROWSER" != "all" ]; then
        E2E_CMD="$E2E_CMD --project=$BROWSER"
    fi
    
    # Add headed mode
    if [ "$HEADED" = true ]; then
        E2E_CMD="$E2E_CMD --headed"
    fi
    
    # Add debug mode
    if [ "$DEBUG" = true ]; then
        E2E_CMD="$E2E_CMD --debug"
    fi
    
    # Disable parallelization if requested
    if [ "$PARALLEL" = false ]; then
        E2E_CMD="$E2E_CMD --workers=1"
    fi
    
    # Ensure dev server is running
    echo "Starting development server..."
    npm run dev &
    DEV_PID=$!
    
    # Wait for server to be ready
    echo "Waiting for server to be ready..."
    npx wait-on http://localhost:3000 -t 30000
    
    # Run E2E tests
    eval $E2E_CMD
    E2E_EXIT_CODE=$?
    
    # Stop dev server
    kill $DEV_PID
    
    return $E2E_EXIT_CODE
}

# Function to run integration tests
run_integration_tests() {
    echo -e "${BLUE}Running Integration Tests...${NC}"
    
    if [ "$COVERAGE" = true ]; then
        npm run test:integration -- --coverage
    else
        npm run test:integration
    fi
}

# Function to generate reports
generate_reports() {
    echo -e "${BLUE}Generating Test Reports...${NC}"
    
    # Generate HTML report for E2E tests
    if [ -f "tests/reports/test-results.json" ]; then
        npx playwright show-report tests/reports/html
    fi
    
    # Generate coverage report
    if [ "$COVERAGE" = true ] && [ -d "coverage" ]; then
        echo "Coverage report available at: coverage/lcov-report/index.html"
    fi
    
    # Generate consolidated report
    node scripts/generate-test-report.js
}

# Main execution
echo -e "${GREEN}🚀 HERA Enterprise Test Runner${NC}"
echo "================================"
echo "Test Type: $TEST_TYPE"
echo "Browser: $BROWSER"
echo "Headed: $HEADED"
echo "Debug: $DEBUG"
echo "Parallel: $PARALLEL"
echo "Coverage: $COVERAGE"
echo "================================"
echo ""

# Set environment variables
export NODE_ENV=test
export CI=true

# Create reports directory
mkdir -p tests/reports

# Run tests based on type
case $TEST_TYPE in
    unit)
        run_unit_tests
        ;;
    api)
        run_api_tests
        ;;
    e2e)
        run_e2e_tests
        ;;
    integration)
        run_integration_tests
        ;;
    all)
        run_unit_tests
        run_api_tests
        run_e2e_tests
        run_integration_tests
        ;;
    *)
        echo -e "${RED}Invalid test type: $TEST_TYPE${NC}"
        usage
        exit 1
        ;;
esac

# Generate reports if enabled
if [ "$REPORT" = true ]; then
    generate_reports
fi

echo ""
echo -e "${GREEN}✨ Test run completed!${NC}"