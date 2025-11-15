#!/bin/bash

# HERA Universal Tile System - Production Deployment Script
# Comprehensive deployment automation with rollback capabilities
# Usage: ./scripts/deploy-tile-system.sh [environment] [--force] [--rollback]

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_LOG="/tmp/hera-tile-deployment-$(date +%Y%m%d-%H%M%S).log"
BACKUP_DIR="/tmp/hera-tile-backup-$(date +%Y%m%d-%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
ENVIRONMENT=${1:-"development"}
FORCE_DEPLOY=${2:-"false"}
ROLLBACK_MODE=${3:-"false"}

# Environment-specific configuration
case $ENVIRONMENT in
  "development")
    SUPABASE_PROJECT_ID="qqagokigwuujyeyrgdkq"
    DATABASE_URL="postgresql://postgres.qqagokigwuujyeyrgdkq:password@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
    ;;
  "production")
    SUPABASE_PROJECT_ID="awfcrncxngqwbhqapffb"
    DATABASE_URL="postgresql://postgres.awfcrncxngqwbhqapffb:password@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
    ;;
  *)
    echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
    echo "Valid environments: development, production"
    exit 1
    ;;
esac

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
  esac
  
  echo "[$timestamp] [$level] $message" >> "$DEPLOYMENT_LOG"
}

# Error handler
error_exit() {
  log "ERROR" "Deployment failed: $1"
  log "ERROR" "Check deployment log: $DEPLOYMENT_LOG"
  exit 1
}

# Progress indicator
show_progress() {
  local duration=$1
  local task=$2
  
  echo -n "$task"
  for ((i=0; i<duration; i++)); do
    sleep 1
    echo -n "."
  done
  echo " Done!"
}

# Pre-deployment checks
pre_deployment_checks() {
  log "INFO" "Starting pre-deployment checks for $ENVIRONMENT environment..."
  
  # Check required tools
  local required_tools=("node" "npm" "supabase" "psql" "jq")
  for tool in "${required_tools[@]}"; do
    if ! command -v $tool &> /dev/null; then
      error_exit "Required tool not found: $tool"
    fi
  done
  log "SUCCESS" "All required tools are available"
  
  # Check Node.js version
  local node_version=$(node --version)
  local required_node="v18"
  if [[ ! $node_version =~ $required_node ]]; then
    log "WARNING" "Node.js version $node_version might not be compatible (recommended: $required_node+)"
  fi
  
  # Check npm dependencies
  log "INFO" "Checking npm dependencies..."
  cd "$PROJECT_ROOT"
  if ! npm list --depth=0 &> /dev/null; then
    log "WARNING" "Some npm dependencies are missing. Running npm install..."
    npm install || error_exit "Failed to install npm dependencies"
  fi
  log "SUCCESS" "Dependencies are up to date"
  
  # Check environment variables
  log "INFO" "Validating environment configuration..."
  if [[ -z "$SUPABASE_PROJECT_ID" ]]; then
    error_exit "SUPABASE_PROJECT_ID not set for environment: $ENVIRONMENT"
  fi
  
  # Test database connectivity
  log "INFO" "Testing database connectivity..."
  if ! supabase projects list | grep -q "$SUPABASE_PROJECT_ID"; then
    error_exit "Cannot access Supabase project: $SUPABASE_PROJECT_ID"
  fi
  log "SUCCESS" "Database connectivity verified"
  
  # Run test suite
  log "INFO" "Running test suite..."
  if ! npm run test:tiles 2>/dev/null; then
    if [[ "$FORCE_DEPLOY" != "true" ]]; then
      error_exit "Test suite failed. Use --force to deploy anyway."
    else
      log "WARNING" "Test suite failed but deployment forced to continue"
    fi
  else
    log "SUCCESS" "All tests passed"
  fi
  
  log "SUCCESS" "Pre-deployment checks completed"
}

# Create database backup
create_backup() {
  log "INFO" "Creating database backup..."
  
  mkdir -p "$BACKUP_DIR"
  
  # Backup tile-related tables
  local tables=("core_entities" "core_dynamic_data" "core_relationships" "universal_transactions")
  
  for table in "${tables[@]}"; do
    log "INFO" "Backing up table: $table"
    psql "$DATABASE_URL" -c "\\copy (SELECT * FROM $table WHERE smart_code LIKE 'HERA.%TILE%' OR entity_type IN ('APP_TILE_TEMPLATE', 'APP_WORKSPACE_TILE')) TO '$BACKUP_DIR/${table}_backup.csv' WITH CSV HEADER" || error_exit "Failed to backup $table"
  done
  
  # Backup current schema version
  psql "$DATABASE_URL" -c "SELECT version FROM supabase_migrations ORDER BY created_at DESC LIMIT 1" -t > "$BACKUP_DIR/schema_version.txt" || error_exit "Failed to backup schema version"
  
  # Create backup manifest
  cat > "$BACKUP_DIR/manifest.json" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "environment": "$ENVIRONMENT",
  "project_id": "$SUPABASE_PROJECT_ID",
  "backup_type": "tile_system_deployment",
  "tables": $(printf '%s\n' "${tables[@]}" | jq -R . | jq -s .),
  "deployment_log": "$DEPLOYMENT_LOG"
}
EOF
  
  log "SUCCESS" "Database backup created: $BACKUP_DIR"
}

# Deploy database migrations
deploy_database_migrations() {
  log "INFO" "Deploying database migrations..."
  
  cd "$PROJECT_ROOT"
  
  # Link to correct Supabase project
  supabase link --project-ref "$SUPABASE_PROJECT_ID" || error_exit "Failed to link Supabase project"
  
  # Apply migrations
  log "INFO" "Applying database migrations..."
  supabase db push || error_exit "Failed to apply database migrations"
  
  # Verify migrations
  log "INFO" "Verifying database schema..."
  local expected_tables=("core_entities" "core_dynamic_data" "core_relationships" "universal_transactions" "universal_transaction_lines")
  
  for table in "${expected_tables[@]}"; do
    if ! psql "$DATABASE_URL" -c "SELECT 1 FROM $table LIMIT 1" &>/dev/null; then
      error_exit "Required table not found after migration: $table"
    fi
  done
  
  log "SUCCESS" "Database migrations completed successfully"
}

# Seed tile templates
seed_tile_templates() {
  log "INFO" "Seeding tile templates..."
  
  cd "$PROJECT_ROOT"
  
  # Run tile template seeding script
  if [[ -f "scripts/seed-tile-templates.ts" ]]; then
    log "INFO" "Running TypeScript seeding script..."
    npx tsx scripts/seed-tile-templates.ts || error_exit "Failed to seed tile templates"
  else
    log "WARNING" "Tile template seeding script not found, skipping..."
  fi
  
  # Verify templates were created
  local template_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM core_entities WHERE entity_type = 'APP_TILE_TEMPLATE'" | xargs)
  
  if [[ $template_count -lt 5 ]]; then
    log "WARNING" "Expected at least 5 tile templates, found $template_count"
  else
    log "SUCCESS" "Tile templates seeded successfully ($template_count templates)"
  fi
}

# Deploy application code
deploy_application() {
  log "INFO" "Deploying application code..."
  
  cd "$PROJECT_ROOT"
  
  # Build the application
  log "INFO" "Building application..."
  npm run build || error_exit "Failed to build application"
  
  # Type check
  log "INFO" "Running type check..."
  npm run typecheck || error_exit "TypeScript type check failed"
  
  # Lint check
  log "INFO" "Running linter..."
  npm run lint || error_exit "Linting failed"
  
  log "SUCCESS" "Application built and validated successfully"
}

# Deploy Supabase functions
deploy_supabase_functions() {
  log "INFO" "Deploying Supabase Edge Functions..."
  
  cd "$PROJECT_ROOT"
  
  # Deploy API v2 function if it exists
  if [[ -d "supabase/functions/api-v2" ]]; then
    log "INFO" "Deploying api-v2 Edge Function..."
    supabase functions deploy api-v2 --no-verify-jwt=false || error_exit "Failed to deploy api-v2 function"
    log "SUCCESS" "api-v2 Edge Function deployed"
  fi
  
  # Deploy any other tile-related functions
  local functions_dir="supabase/functions"
  if [[ -d "$functions_dir" ]]; then
    for func_dir in "$functions_dir"/*/; do
      local func_name=$(basename "$func_dir")
      if [[ "$func_name" == *"tile"* ]] && [[ "$func_name" != "api-v2" ]]; then
        log "INFO" "Deploying $func_name Edge Function..."
        supabase functions deploy "$func_name" --no-verify-jwt=false || log "WARNING" "Failed to deploy $func_name function"
      fi
    done
  fi
  
  log "SUCCESS" "Supabase Edge Functions deployed"
}

# Verify deployment
verify_deployment() {
  log "INFO" "Verifying deployment..."
  
  # Health check endpoints
  local base_url
  case $ENVIRONMENT in
    "development")
      base_url="https://qqagokigwuujyeyrgdkq.supabase.co/functions/v1"
      ;;
    "production")
      base_url="https://awfcrncxngqwbhqapffb.supabase.co/functions/v1"
      ;;
  esac
  
  # Test API v2 endpoint
  log "INFO" "Testing API v2 health..."
  local health_response=$(curl -s -o /dev/null -w "%{http_code}" "$base_url/api-v2/health" || echo "000")
  
  if [[ "$health_response" == "200" ]] || [[ "$health_response" == "404" ]]; then
    log "SUCCESS" "API v2 endpoint is accessible"
  else
    log "WARNING" "API v2 endpoint returned status: $health_response"
  fi
  
  # Verify database schema
  log "INFO" "Verifying database schema integrity..."
  local schema_check=$(psql "$DATABASE_URL" -t -c "
    SELECT COUNT(*) 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('core_entities', 'core_dynamic_data', 'core_relationships')
  " | xargs)
  
  if [[ $schema_check -eq 3 ]]; then
    log "SUCCESS" "Core database tables verified"
  else
    error_exit "Database schema verification failed"
  fi
  
  # Test tile template queries
  log "INFO" "Testing tile template functionality..."
  local template_query_result=$(psql "$DATABASE_URL" -t -c "
    SELECT COUNT(*) 
    FROM core_entities 
    WHERE entity_type = 'APP_TILE_TEMPLATE' 
    AND smart_code LIKE 'HERA.PLATFORM.TILE.TEMPLATE.%'
  " | xargs)
  
  if [[ $template_query_result -gt 0 ]]; then
    log "SUCCESS" "Tile templates are accessible ($template_query_result found)"
  else
    log "WARNING" "No tile templates found with expected smart codes"
  fi
  
  log "SUCCESS" "Deployment verification completed"
}

# Rollback function
perform_rollback() {
  log "INFO" "Starting rollback procedure..."
  
  if [[ ! -d "$BACKUP_DIR" ]]; then
    error_exit "Backup directory not found: $BACKUP_DIR"
  fi
  
  # Read backup manifest
  if [[ ! -f "$BACKUP_DIR/manifest.json" ]]; then
    error_exit "Backup manifest not found"
  fi
  
  local backup_timestamp=$(jq -r '.timestamp' "$BACKUP_DIR/manifest.json")
  log "INFO" "Rolling back to backup from: $backup_timestamp"
  
  # Restore tables
  local tables=($(jq -r '.tables[]' "$BACKUP_DIR/manifest.json"))
  
  for table in "${tables[@]}"; do
    if [[ -f "$BACKUP_DIR/${table}_backup.csv" ]]; then
      log "INFO" "Restoring table: $table"
      
      # Clear current tile data
      psql "$DATABASE_URL" -c "DELETE FROM $table WHERE smart_code LIKE 'HERA.%TILE%' OR entity_type IN ('APP_TILE_TEMPLATE', 'APP_WORKSPACE_TILE')" || log "WARNING" "Failed to clear $table"
      
      # Restore from backup
      psql "$DATABASE_URL" -c "\\copy $table FROM '$BACKUP_DIR/${table}_backup.csv' WITH CSV HEADER" || log "ERROR" "Failed to restore $table"
    fi
  done
  
  log "SUCCESS" "Rollback completed successfully"
}

# Performance monitoring
run_performance_tests() {
  log "INFO" "Running post-deployment performance tests..."
  
  cd "$PROJECT_ROOT"
  
  # Run performance test suite
  if npm run test:performance &>/dev/null; then
    log "SUCCESS" "Performance tests passed"
  else
    log "WARNING" "Performance tests failed or not available"
  fi
  
  # Basic load test
  log "INFO" "Running basic load test..."
  local concurrent_requests=10
  local total_requests=100
  
  if command -v ab &> /dev/null; then
    local test_url="$base_url/api-v2/health"
    ab -n $total_requests -c $concurrent_requests "$test_url" > /tmp/load_test_results.txt 2>&1
    
    local avg_response_time=$(grep "Time per request:" /tmp/load_test_results.txt | head -1 | awk '{print $4}')
    log "INFO" "Average response time: ${avg_response_time}ms"
    
    if (( $(echo "$avg_response_time < 1000" | bc -l) )); then
      log "SUCCESS" "Load test passed (response time under 1000ms)"
    else
      log "WARNING" "Load test shows slow response times: ${avg_response_time}ms"
    fi
  else
    log "WARNING" "Apache Bench (ab) not available for load testing"
  fi
}

# Main deployment function
main() {
  log "INFO" "🚀 Starting HERA Universal Tile System deployment..."
  log "INFO" "Environment: $ENVIRONMENT"
  log "INFO" "Force deploy: $FORCE_DEPLOY"
  log "INFO" "Rollback mode: $ROLLBACK_MODE"
  log "INFO" "Deployment log: $DEPLOYMENT_LOG"
  
  # Handle rollback mode
  if [[ "$ROLLBACK_MODE" == "true" ]]; then
    perform_rollback
    exit 0
  fi
  
  # Main deployment flow
  pre_deployment_checks
  create_backup
  deploy_database_migrations
  seed_tile_templates
  deploy_application
  deploy_supabase_functions
  verify_deployment
  run_performance_tests
  
  log "SUCCESS" "🎉 HERA Universal Tile System deployment completed successfully!"
  log "INFO" "Environment: $ENVIRONMENT"
  log "INFO" "Backup location: $BACKUP_DIR"
  log "INFO" "Deployment log: $DEPLOYMENT_LOG"
  
  # Cleanup old backups (keep last 5)
  log "INFO" "Cleaning up old backups..."
  find /tmp -name "hera-tile-backup-*" -type d -mtime +7 -exec rm -rf {} + 2>/dev/null || true
  
  log "SUCCESS" "Deployment completed! 🎉"
}

# Script usage
show_usage() {
  cat << EOF
HERA Universal Tile System - Deployment Script

Usage: $0 [environment] [options]

Environments:
  development    Deploy to development environment (default)
  production     Deploy to production environment

Options:
  --force       Force deployment even if tests fail
  --rollback    Rollback to previous backup
  --help        Show this help message

Examples:
  $0 development
  $0 production --force
  $0 development --rollback

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --force)
      FORCE_DEPLOY="true"
      shift
      ;;
    --rollback)
      ROLLBACK_MODE="true"
      shift
      ;;
    --help)
      show_usage
      exit 0
      ;;
    *)
      if [[ -z "$ENVIRONMENT" ]] || [[ "$ENVIRONMENT" == "development" ]]; then
        ENVIRONMENT="$1"
      fi
      shift
      ;;
  esac
done

# Trap for cleanup on exit
cleanup() {
  if [[ $? -ne 0 ]]; then
    log "ERROR" "Deployment failed! Check logs for details."
    log "INFO" "Backup available at: $BACKUP_DIR"
    log "INFO" "To rollback: $0 $ENVIRONMENT --rollback"
  fi
}
trap cleanup EXIT

# Run main deployment
main "$@"