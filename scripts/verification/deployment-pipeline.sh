#!/bin/bash

# HERA Universal Tile System - Deployment Pipeline
# Complete deployment pipeline with verification and rollback capabilities
# Usage: ./scripts/verification/deployment-pipeline.sh [environment] [options]

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}"))" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
DEPLOYMENT_LOG="/tmp/hera-tile-deployment-pipeline-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Default configuration
ENVIRONMENT=${1:-"production"}
SKIP_TESTS=${2:-"false"}
FORCE_DEPLOY=${3:-"false"}
AUTO_ROLLBACK=${4:-"true"}

# Deployment configuration
DEPLOYMENT_TIMEOUT=1800  # 30 minutes
VERIFICATION_TIMEOUT=300 # 5 minutes
ROLLBACK_TIMEOUT=600     # 10 minutes

# Logging function
log() {
  local level=$1
  shift
  local message="$@"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  
  case $level in
    "INFO")
      echo -e "${BLUE}ℹ️  $message${NC}"
      ;;
    "SUCCESS")
      echo -e "${GREEN}✅ $message${NC}"
      ;;
    "WARNING")
      echo -e "${YELLOW}⚠️  $message${NC}"
      ;;
    "ERROR")
      echo -e "${RED}❌ $message${NC}"
      ;;
    "STEP")
      echo -e "${PURPLE}🔄 $message${NC}"
      ;;
  esac
  
  echo "[$timestamp] [$level] $message" >> "$DEPLOYMENT_LOG"
}

# Error handler with rollback
error_exit() {
  log "ERROR" "Deployment pipeline failed: $1"
  log "ERROR" "Check deployment log: $DEPLOYMENT_LOG"
  
  if [ "$AUTO_ROLLBACK" == "true" ]; then
    log "STEP" "Initiating automatic rollback..."
    rollback_deployment
  fi
  
  exit 1
}

# Progress tracking
PIPELINE_STEPS=(
  "Pre-deployment Checks"
  "Build and Quality Gates"  
  "Production Readiness Verification"
  "Smoke Tests"
  "Deployment Execution"
  "Post-deployment Verification"
  "Load Testing"
  "Health Monitoring Setup"
)

CURRENT_STEP=0
TOTAL_STEPS=${#PIPELINE_STEPS[@]}

show_progress() {
  CURRENT_STEP=$((CURRENT_STEP + 1))
  local progress=$((CURRENT_STEP * 100 / TOTAL_STEPS))
  log "STEP" "Step $CURRENT_STEP/$TOTAL_STEPS ($progress%): ${PIPELINE_STEPS[$((CURRENT_STEP - 1))]}"
}

# Pre-deployment checks
pre_deployment_checks() {
  show_progress
  
  log "INFO" "Running pre-deployment checks..."
  
  # Check required tools
  local required_tools=("node" "npm" "tsx" "git" "curl")
  for tool in "${required_tools[@]}"; do
    if ! command -v $tool &> /dev/null; then
      error_exit "Required tool not found: $tool"
    fi
  done
  
  # Check environment variables
  if [ -z "$SUPABASE_ANON_KEY" ]; then
    error_exit "SUPABASE_ANON_KEY environment variable is required"
  fi
  
  # Check git status
  if [ "$ENVIRONMENT" == "production" ]; then
    local git_status=$(git status --porcelain)
    if [ -n "$git_status" ] && [ "$FORCE_DEPLOY" != "true" ]; then
      error_exit "Working directory not clean. Use --force to deploy anyway."
    fi
    
    local current_branch=$(git rev-parse --abbrev-ref HEAD)
    if [ "$current_branch" != "main" ] && [ "$current_branch" != "develop" ] && [ "$FORCE_DEPLOY" != "true" ]; then
      error_exit "Not on main or develop branch. Current: $current_branch"
    fi
  fi
  
  log "SUCCESS" "Pre-deployment checks completed"
}

# Build and quality gates
build_and_quality() {
  show_progress
  
  log "INFO" "Running build and quality gates..."
  
  cd "$PROJECT_ROOT"
  
  if [ "$SKIP_TESTS" != "true" ]; then
    # Run TypeScript check
    log "INFO" "Running TypeScript check..."
    npm run typecheck || error_exit "TypeScript check failed"
    
    # Run linting
    log "INFO" "Running linter..."
    npm run lint || error_exit "Linting failed"
    
    # Run tile system tests
    log "INFO" "Running tile system tests..."
    npm run test:tiles || error_exit "Tile system tests failed"
  else
    log "WARNING" "Skipping tests as requested"
  fi
  
  # Build application
  log "INFO" "Building application..."
  npm run build || error_exit "Build failed"
  
  log "SUCCESS" "Build and quality gates completed"
}

# Production readiness verification
production_readiness() {
  show_progress
  
  log "INFO" "Running production readiness verification..."
  
  cd "$PROJECT_ROOT"
  
  # Run production readiness checks
  if npm run verify:prod; then
    log "SUCCESS" "Production readiness verification passed"
  else
    local exit_code=$?
    if [ $exit_code -eq 1 ]; then
      error_exit "Production readiness verification failed - system not ready"
    elif [ $exit_code -eq 2 ]; then
      log "WARNING" "Production readiness verification shows partial readiness"
      if [ "$FORCE_DEPLOY" != "true" ]; then
        error_exit "Partial readiness detected. Use --force to deploy anyway."
      fi
    fi
  fi
}

# Smoke tests
smoke_tests() {
  show_progress
  
  log "INFO" "Running smoke tests..."
  
  cd "$PROJECT_ROOT"
  
  # Run smoke tests
  if npm run smoke:test; then
    log "SUCCESS" "Smoke tests passed"
  else
    error_exit "Smoke tests failed"
  fi
}

# Deployment execution
deployment_execution() {
  show_progress
  
  log "INFO" "Executing deployment..."
  
  cd "$PROJECT_ROOT"
  
  # Run deployment script
  local deployment_cmd="./scripts/deploy-tile-system.sh $ENVIRONMENT"
  if [ "$FORCE_DEPLOY" == "true" ]; then
    deployment_cmd="$deployment_cmd --force"
  fi
  
  log "INFO" "Running: $deployment_cmd"
  
  # Run with timeout
  if timeout $DEPLOYMENT_TIMEOUT $deployment_cmd; then
    log "SUCCESS" "Deployment completed successfully"
  else
    local exit_code=$?
    if [ $exit_code -eq 124 ]; then
      error_exit "Deployment timed out after $DEPLOYMENT_TIMEOUT seconds"
    else
      error_exit "Deployment script failed with exit code: $exit_code"
    fi
  fi
}

# Post-deployment verification
post_deployment_verification() {
  show_progress
  
  log "INFO" "Running post-deployment verification..."
  
  # Wait for deployment to settle
  log "INFO" "Waiting 30 seconds for deployment to settle..."
  sleep 30
  
  cd "$PROJECT_ROOT"
  
  # Run verification again to ensure deployment worked
  if timeout $VERIFICATION_TIMEOUT npm run verify:prod; then
    log "SUCCESS" "Post-deployment verification passed"
  else
    error_exit "Post-deployment verification failed - deployment may have issues"
  fi
  
  # Run smoke tests again
  if timeout $VERIFICATION_TIMEOUT npm run smoke:test:fast; then
    log "SUCCESS" "Post-deployment smoke tests passed"
  else
    error_exit "Post-deployment smoke tests failed"
  fi
}

# Load testing
load_testing() {
  show_progress
  
  log "INFO" "Running load testing..."
  
  cd "$PROJECT_ROOT"
  
  # Run quick load test for production validation
  if npm run load:test:quick; then
    log "SUCCESS" "Load testing passed"
  else
    log "WARNING" "Load testing failed - system may have performance issues"
    if [ "$FORCE_DEPLOY" != "true" ]; then
      error_exit "Load testing failed. Use --force to accept anyway."
    fi
  fi
}

# Health monitoring setup
health_monitoring() {
  show_progress
  
  log "INFO" "Setting up health monitoring..."
  
  cd "$PROJECT_ROOT"
  
  # Start monitoring in background
  log "INFO" "Starting health monitoring..."
  nohup npm run health:monitor > /tmp/health-monitor.log 2>&1 &
  local health_pid=$!
  echo $health_pid > /tmp/health-monitor.pid
  
  # Start performance monitoring in background
  log "INFO" "Starting performance monitoring..."
  nohup npm run perf:monitor > /tmp/perf-monitor.log 2>&1 &
  local perf_pid=$!
  echo $perf_pid > /tmp/perf-monitor.pid
  
  log "SUCCESS" "Health monitoring started (PIDs: $health_pid, $perf_pid)"
}

# Rollback deployment
rollback_deployment() {
  log "STEP" "Starting deployment rollback..."
  
  cd "$PROJECT_ROOT"
  
  # Run rollback
  if timeout $ROLLBACK_TIMEOUT ./scripts/deploy-tile-system.sh $ENVIRONMENT --rollback; then
    log "SUCCESS" "Rollback completed successfully"
    
    # Verify rollback
    if npm run smoke:test:fast; then
      log "SUCCESS" "Rollback verification passed"
    else
      log "ERROR" "Rollback verification failed - manual intervention required"
    fi
  else
    log "ERROR" "Rollback failed - manual intervention required"
  fi
}

# Main deployment pipeline
main() {
  log "INFO" "🚀 Starting HERA Tile System deployment pipeline..."
  log "INFO" "Environment: $ENVIRONMENT"
  log "INFO" "Skip Tests: $SKIP_TESTS"
  log "INFO" "Force Deploy: $FORCE_DEPLOY"
  log "INFO" "Auto Rollback: $AUTO_ROLLBACK"
  log "INFO" "Deployment Log: $DEPLOYMENT_LOG"
  log "INFO" ""
  
  local start_time=$(date +%s)
  
  # Set trap for cleanup
  trap 'log "ERROR" "Pipeline interrupted"; exit 1' INT TERM
  
  # Execute pipeline steps
  pre_deployment_checks
  build_and_quality
  production_readiness
  smoke_tests
  deployment_execution
  post_deployment_verification
  load_testing
  health_monitoring
  
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  
  log "SUCCESS" "🎉 Deployment pipeline completed successfully!"
  log "SUCCESS" "Environment: $ENVIRONMENT"
  log "SUCCESS" "Total Duration: ${duration}s"
  log "SUCCESS" "Deployment Log: $DEPLOYMENT_LOG"
  log "SUCCESS" ""
  log "SUCCESS" "🔍 Next Steps:"
  log "SUCCESS" "  - Monitor health: npm run monitor:dashboard"
  log "SUCCESS" "  - Check logs: tail -f /tmp/health-monitor.log"
  log "SUCCESS" "  - Run stress test: npm run load:test:stress"
}

# Show usage
show_usage() {
  cat << EOF
HERA Universal Tile System - Deployment Pipeline

Usage: $0 [environment] [skip-tests] [force-deploy] [auto-rollback]

Environment:
  development    Deploy to development environment (default)
  production     Deploy to production environment

Options:
  skip-tests     Skip test execution (true/false, default: false)
  force-deploy   Force deployment even with warnings (true/false, default: false) 
  auto-rollback  Auto rollback on failure (true/false, default: true)

Examples:
  $0 production false false true
  $0 development true false false

Environment Variables:
  SUPABASE_ANON_KEY         Required - Supabase anonymous key
  
EOF
}

# Parse command line arguments
case "${1:-help}" in
  "help"|"--help"|"-h")
    show_usage
    exit 0
    ;;
  *)
    main "$@"
    ;;
esac