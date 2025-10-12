#!/bin/bash

# ============================================================================
# HERA Product Costing v2: Test Runner Script
# 
# Enterprise-grade test runner for Product Costing v2 with proper environment
# setup, database validation, and comprehensive reporting.
# 
# Smart Code: HERA.COST.PRODUCT.TEST.RUNNER.V2
# ============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${TEST_DIR}/../.." && pwd)"
COVERAGE_DIR="${PROJECT_ROOT}/coverage/productcosting-v2"
RESULTS_DIR="${PROJECT_ROOT}/test-results/productcosting-v2"

# Default values
RUN_COVERAGE=false
RUN_INTEGRATION=true
RUN_PERFORMANCE=true
RUN_SECURITY=true
VERBOSE=false
WATCH_MODE=false
SPECIFIC_TEST=""
TIMEOUT=30000

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --coverage)
      RUN_COVERAGE=true
      shift
      ;;
    --no-integration)
      RUN_INTEGRATION=false
      shift
      ;;
    --no-performance)
      RUN_PERFORMANCE=false
      shift
      ;;
    --no-security)
      RUN_SECURITY=false
      shift
      ;;
    --verbose|-v)
      VERBOSE=true
      shift
      ;;
    --watch|-w)
      WATCH_MODE=true
      shift
      ;;
    --test)
      SPECIFIC_TEST="$2"
      shift 2
      ;;
    --timeout)
      TIMEOUT="$2"
      shift 2
      ;;
    --help|-h)
      echo "HERA Product Costing v2 Test Runner"
      echo ""
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --coverage           Generate coverage report"
      echo "  --no-integration     Skip integration tests"
      echo "  --no-performance     Skip performance tests"
      echo "  --no-security        Skip security tests"
      echo "  --verbose, -v        Enable verbose output"
      echo "  --watch, -w          Run in watch mode"
      echo "  --test <pattern>     Run specific test pattern"
      echo "  --timeout <ms>       Set test timeout (default: 30000)"
      echo "  --help, -h           Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0                               # Run all tests"
      echo "  $0 --coverage                    # Run with coverage"
      echo "  $0 --test 'Guardrails'          # Run guardrails tests only"
      echo "  $0 --watch --verbose            # Watch mode with verbose output"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Function to print colored output
print_status() {
  echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

# Function to validate environment
validate_environment() {
  print_status "Validating test environment..."
  
  # Check Node.js version
  if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
  fi
  
  NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js 18+ is required (current: $(node --version))"
    exit 1
  fi
  
  # Check npm
  if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
  fi
  
  # Check Jest
  if ! npm list jest &> /dev/null && ! npm list -g jest &> /dev/null; then
    print_warning "Jest not found, installing dependencies..."
    cd "$PROJECT_ROOT"
    npm install
  fi
  
  # Check environment variables
  if [ -z "$SUPABASE_URL" ]; then
    print_warning "SUPABASE_URL not set, using default"
    export SUPABASE_URL="http://localhost:54321"
  fi
  
  if [ -z "$SUPABASE_ANON_KEY" ]; then
    print_warning "SUPABASE_ANON_KEY not set, tests may fail"
  fi
  
  print_success "Environment validation complete"
}

# Function to setup test directories
setup_directories() {
  print_status "Setting up test directories..."
  
  mkdir -p "$COVERAGE_DIR"
  mkdir -p "$RESULTS_DIR"
  
  print_success "Test directories ready"
}

# Function to run database checks
check_database() {
  print_status "Checking database connectivity..."
  
  # Test basic connectivity (this would need to be implemented)
  # For now, we'll just check if the URL is accessible
  if command -v curl &> /dev/null; then
    if ! curl -f -s "$SUPABASE_URL/health" &> /dev/null; then
      print_warning "Database health check failed, continuing anyway..."
    else
      print_success "Database connectivity verified"
    fi
  else
    print_warning "curl not available, skipping database check"
  fi
}

# Function to build Jest command
build_jest_command() {
  local cmd="npx jest --config=${TEST_DIR}/jest.config.js"
  
  if [ "$RUN_COVERAGE" = true ]; then
    cmd="$cmd --coverage"
  fi
  
  if [ "$VERBOSE" = true ]; then
    cmd="$cmd --verbose"
  fi
  
  if [ "$WATCH_MODE" = true ]; then
    cmd="$cmd --watch"
  fi
  
  if [ -n "$SPECIFIC_TEST" ]; then
    cmd="$cmd --testNamePattern='$SPECIFIC_TEST'"
  fi
  
  if [ "$RUN_INTEGRATION" = false ]; then
    cmd="$cmd --testNamePattern='(?!.*Integration)'"
  fi
  
  if [ "$RUN_PERFORMANCE" = false ]; then
    cmd="$cmd --testNamePattern='(?!.*Performance)'"
  fi
  
  if [ "$RUN_SECURITY" = false ]; then
    cmd="$cmd --testNamePattern='(?!.*Security)'"
  fi
  
  cmd="$cmd --testTimeout=$TIMEOUT"
  
  echo "$cmd"
}

# Function to run tests
run_tests() {
  print_status "Running HERA Product Costing v2 tests..."
  
  cd "$PROJECT_ROOT"
  
  # Set environment variables
  export NODE_ENV=test
  export JEST_TIMEOUT=$TIMEOUT
  export TEST_API_URL=${TEST_API_URL:-"http://localhost:3000/api"}
  
  # Build and execute Jest command
  local jest_cmd
  jest_cmd=$(build_jest_command)
  
  print_status "Executing: $jest_cmd"
  
  if eval "$jest_cmd"; then
    print_success "All tests passed!"
    return 0
  else
    print_error "Some tests failed"
    return 1
  fi
}

# Function to generate reports
generate_reports() {
  if [ "$RUN_COVERAGE" = true ]; then
    print_status "Generating test reports..."
    
    # Coverage report location
    if [ -d "$COVERAGE_DIR" ]; then
      print_success "Coverage report generated: $COVERAGE_DIR/lcov-report/index.html"
    fi
    
    # JUnit report location
    if [ -f "$RESULTS_DIR/junit.xml" ]; then
      print_success "JUnit report generated: $RESULTS_DIR/junit.xml"
    fi
    
    # Print coverage summary
    if [ -f "$COVERAGE_DIR/lcov.info" ]; then
      print_status "Coverage Summary:"
      if command -v lcov &> /dev/null; then
        lcov --summary "$COVERAGE_DIR/lcov.info"
      else
        print_warning "lcov not available for coverage summary"
      fi
    fi
  fi
}

# Function to cleanup
cleanup() {
  print_status "Cleaning up..."
  
  # Remove test artifacts if needed
  # (This would be implemented based on specific cleanup needs)
  
  print_success "Cleanup complete"
}

# Main execution flow
main() {
  print_status "🧬 HERA Product Costing v2 Test Suite"
  print_status "======================================"
  
  validate_environment
  setup_directories
  check_database
  
  # Set trap for cleanup on exit
  trap cleanup EXIT
  
  if run_tests; then
    generate_reports
    print_success "🎉 Test suite completed successfully!"
    exit 0
  else
    generate_reports
    print_error "💥 Test suite failed!"
    exit 1
  fi
}

# Run main function
main "$@"