#!/bin/bash

# HERA Universal Tile System - Disaster Recovery Script
# Emergency procedures for rapid system recovery
# Usage: ./scripts/verification/disaster-recovery.sh <scenario> [options]

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
RECOVERY_LOG="/tmp/hera-disaster-recovery-$(date +%Y%m%d-%H%M%S).log"
EMERGENCY_BACKUP_DIR="/tmp/hera-emergency-backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Emergency contact information
EMERGENCY_CONTACTS=(
  "DevOps Team: [Add Slack channel or phone]"
  "Database Admin: [Add contact]"
  "System Owner: [Add contact]"
)

# Default configuration
ENVIRONMENT=${ENVIRONMENT:-"production"}
FORCE_RECOVERY=${FORCE_RECOVERY:-"false"}
SKIP_VERIFICATION=${SKIP_VERIFICATION:-"false"}

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
    "EMERGENCY")
      echo -e "${RED}🚨 EMERGENCY: $message${NC}"
      ;;
    "STEP")
      echo -e "${PURPLE}🔄 $message${NC}"
      ;;
  esac
  
  echo "[$timestamp] [$level] $message" >> "$RECOVERY_LOG"
}

# Emergency notification function
notify_emergency() {
  local scenario=$1
  local status=$2
  local details=$3
  
  log "EMERGENCY" "DISASTER RECOVERY INITIATED"
  log "EMERGENCY" "Scenario: $scenario"
  log "EMERGENCY" "Status: $status"
  log "EMERGENCY" "Environment: $ENVIRONMENT"
  log "EMERGENCY" "Recovery Log: $RECOVERY_LOG"
  
  if [ -n "$details" ]; then
    log "EMERGENCY" "Details: $details"
  fi
  
  log "INFO" "Emergency contacts:"
  for contact in "${EMERGENCY_CONTACTS[@]}"; do
    log "INFO" "  - $contact"
  done
  
  # In a real implementation, this would send notifications via:
  # - Slack webhook
  # - Email alerts  
  # - SMS notifications
  # - PagerDuty incidents
  echo "🔔 Emergency notifications would be sent here"
}

# Pre-recovery checks
pre_recovery_checks() {
  log "STEP" "Running pre-recovery checks..."
  
  # Check required tools
  local required_tools=("node" "npm" "tsx" "git" "curl")
  for tool in "${required_tools[@]}"; do
    if ! command -v $tool &> /dev/null; then
      log "ERROR" "Required tool not found: $tool"
      exit 1
    fi
  done
  
  # Check environment variables
  if [ -z "$SUPABASE_ANON_KEY" ]; then
    log "ERROR" "SUPABASE_ANON_KEY environment variable is required"
    exit 1
  fi
  
  # Ensure emergency backup directory exists
  mkdir -p "$EMERGENCY_BACKUP_DIR"
  
  log "SUCCESS" "Pre-recovery checks passed"
}

# Emergency backup creation
create_emergency_backup() {
  log "STEP" "Creating emergency backup of current state..."
  
  cd "$PROJECT_ROOT"
  
  local backup_description="Emergency backup - $(date) - Disaster Recovery"
  
  if npx tsx scripts/verification/rollback-procedures.ts backup "$backup_description"; then
    log "SUCCESS" "Emergency backup created successfully"
  else
    log "WARNING" "Emergency backup failed - continuing with recovery"
  fi
}

# System health assessment
assess_system_health() {
  log "STEP" "Assessing current system health..."
  
  cd "$PROJECT_ROOT"
  
  local health_status="unknown"
  
  # Quick health check
  if npm run smoke:test:fast &>/dev/null; then
    health_status="healthy"
    log "SUCCESS" "System health check passed"
  else
    health_status="degraded"
    log "WARNING" "System health check failed"
  fi
  
  # Database connectivity
  if npm run verify:prod:quick &>/dev/null; then
    log "SUCCESS" "Database connectivity confirmed"
  else
    log "ERROR" "Database connectivity issues detected"
    health_status="critical"
  fi
  
  echo $health_status
}

# Scenario 1: Complete System Failure
scenario_complete_failure() {
  log "EMERGENCY" "Initiating complete system failure recovery"
  notify_emergency "complete_failure" "in_progress" "Total system failure detected"
  
  pre_recovery_checks
  
  # Step 1: Try to create emergency backup
  create_emergency_backup
  
  # Step 2: Get latest known good backup
  log "STEP" "Identifying latest stable backup..."
  cd "$PROJECT_ROOT"
  
  if ! npx tsx scripts/verification/rollback-procedures.ts list > /tmp/backup_list.txt; then
    log "ERROR" "Unable to list available backups"
    exit 1
  fi
  
  # Step 3: Perform rollback to latest backup
  log "STEP" "Rolling back to latest stable backup..."
  
  if [ "$FORCE_RECOVERY" == "true" ]; then
    if npx tsx scripts/verification/rollback-procedures.ts rollback --yes; then
      log "SUCCESS" "System rollback completed"
    else
      log "ERROR" "System rollback failed"
      notify_emergency "complete_failure" "failed" "Rollback procedure failed"
      exit 1
    fi
  else
    log "WARNING" "Manual confirmation required for rollback"
    log "INFO" "Use FORCE_RECOVERY=true to skip confirmation"
    exit 1
  fi
  
  # Step 4: Verify recovery
  if [ "$SKIP_VERIFICATION" != "true" ]; then
    verify_recovery
  fi
  
  notify_emergency "complete_failure" "completed" "System recovery successful"
}

# Scenario 2: Database Corruption
scenario_database_corruption() {
  log "EMERGENCY" "Initiating database corruption recovery"
  notify_emergency "database_corruption" "in_progress" "Database corruption detected"
  
  pre_recovery_checks
  
  # Step 1: Stop write operations (if possible)
  log "STEP" "Attempting to stop write operations..."
  # In a real system, this might involve:
  # - Setting application to read-only mode
  # - Stopping background jobs
  # - Redirecting traffic to maintenance page
  
  # Step 2: Create backup of corrupted state for analysis
  log "STEP" "Backing up corrupted state for analysis..."
  create_emergency_backup
  
  # Step 3: Rollback to pre-corruption backup
  log "STEP" "Rolling back to pre-corruption backup..."
  
  if [ "$FORCE_RECOVERY" == "true" ]; then
    if npx tsx scripts/verification/rollback-procedures.ts rollback --yes; then
      log "SUCCESS" "Database rollback completed"
    else
      log "ERROR" "Database rollback failed"
      notify_emergency "database_corruption" "failed" "Database rollback failed"
      exit 1
    fi
  else
    log "WARNING" "Manual confirmation required for rollback"
    exit 1
  fi
  
  # Step 4: Verify data integrity
  verify_recovery
  
  notify_emergency "database_corruption" "completed" "Database recovery successful"
}

# Scenario 3: Performance Degradation
scenario_performance_degradation() {
  log "WARNING" "Initiating performance degradation recovery"
  notify_emergency "performance_degradation" "in_progress" "Severe performance issues detected"
  
  pre_recovery_checks
  
  # Step 1: Create baseline backup
  create_emergency_backup
  
  # Step 2: Assess current performance
  log "STEP" "Running performance assessment..."
  cd "$PROJECT_ROOT"
  
  if npm run load:test:quick; then
    log "SUCCESS" "Performance within acceptable thresholds"
    log "INFO" "Consider targeted performance fixes instead of rollback"
  else
    log "WARNING" "Performance severely degraded"
    
    # Step 3: Consider rollback if performance is critical
    if [ "$FORCE_RECOVERY" == "true" ]; then
      log "STEP" "Performing rollback due to severe performance issues..."
      npx tsx scripts/verification/rollback-procedures.ts rollback --yes
      
      # Verify performance improvement
      if npm run load:test:quick; then
        log "SUCCESS" "Performance restored after rollback"
      else
        log "ERROR" "Performance issues persist after rollback"
      fi
    else
      log "INFO" "Manual decision required for performance rollback"
    fi
  fi
  
  notify_emergency "performance_degradation" "completed" "Performance assessment complete"
}

# Scenario 4: Security Breach
scenario_security_breach() {
  log "EMERGENCY" "Initiating security breach response"
  notify_emergency "security_breach" "in_progress" "Security breach detected"
  
  pre_recovery_checks
  
  # Step 1: Immediate containment
  log "STEP" "Implementing immediate security containment..."
  
  # Create forensic backup before any changes
  log "STEP" "Creating forensic backup..."
  create_emergency_backup
  
  # Step 2: Assess breach scope
  log "STEP" "Assessing breach scope..."
  
  # Check for unauthorized changes
  cd "$PROJECT_ROOT"
  
  # In a real implementation, this would:
  # - Check audit logs for unauthorized access
  # - Scan for malicious code changes
  # - Verify data integrity
  # - Check for privilege escalation
  
  # Step 3: Rollback to known secure state
  log "STEP" "Rolling back to known secure state..."
  
  if [ "$FORCE_RECOVERY" == "true" ]; then
    npx tsx scripts/verification/rollback-procedures.ts rollback --yes
    log "SUCCESS" "Rollback to secure state completed"
  else
    log "WARNING" "Manual confirmation required for security rollback"
    exit 1
  fi
  
  # Step 4: Security verification
  log "STEP" "Running security verification..."
  
  # Verify security configuration
  if npm run verify:prod:security; then
    log "SUCCESS" "Security verification passed"
  else
    log "ERROR" "Security issues remain after rollback"
  fi
  
  notify_emergency "security_breach" "completed" "Security response complete"
}

# Recovery verification
verify_recovery() {
  log "STEP" "Verifying recovery..."
  
  cd "$PROJECT_ROOT"
  
  # Run production readiness checks
  if npm run verify:prod; then
    log "SUCCESS" "Production readiness verification passed"
  else
    log "ERROR" "Production readiness verification failed"
    return 1
  fi
  
  # Run smoke tests
  if npm run smoke:test; then
    log "SUCCESS" "Smoke tests passed"
  else
    log "ERROR" "Smoke tests failed"
    return 1
  fi
  
  # Quick load test
  if npm run load:test:quick; then
    log "SUCCESS" "Performance verification passed"
  else
    log "WARNING" "Performance verification failed"
  fi
  
  log "SUCCESS" "Recovery verification completed"
}

# Generate recovery report
generate_recovery_report() {
  local scenario=$1
  local status=$2
  
  cat << EOF > "/tmp/recovery-report-$(date +%Y%m%d-%H%M%S).md"
# HERA Disaster Recovery Report

**Date:** $(date)
**Scenario:** $scenario
**Status:** $status
**Environment:** $ENVIRONMENT
**Recovery Log:** $RECOVERY_LOG

## Timeline

$(grep "EMERGENCY\|STEP\|SUCCESS\|ERROR" "$RECOVERY_LOG" | head -20)

## Actions Taken

1. Pre-recovery checks completed
2. Emergency backup created (if possible)
3. System rollback executed
4. Recovery verification performed

## Current System Status

$(npm run verify:prod 2>&1 | head -10)

## Recommendations

1. Monitor system closely for next 24 hours
2. Review logs for root cause analysis
3. Update monitoring and alerting
4. Consider additional preventive measures

---
*Generated by HERA Disaster Recovery System*
EOF

  log "SUCCESS" "Recovery report generated: /tmp/recovery-report-$(date +%Y%m%d-%H%M%S).md"
}

# Main execution
main() {
  local scenario=${1:-"help"}
  
  case $scenario in
    "complete-failure")
      scenario_complete_failure
      generate_recovery_report "Complete System Failure" "Success"
      ;;
    "database-corruption")
      scenario_database_corruption
      generate_recovery_report "Database Corruption" "Success"
      ;;
    "performance-degradation")
      scenario_performance_degradation
      generate_recovery_report "Performance Degradation" "Success"
      ;;
    "security-breach")
      scenario_security_breach
      generate_recovery_report "Security Breach" "Success"
      ;;
    "health-check")
      health_status=$(assess_system_health)
      log "INFO" "Current system health: $health_status"
      ;;
    "emergency-backup")
      create_emergency_backup
      ;;
    "help"|*)
      cat << EOF
HERA Disaster Recovery System

Usage: $0 <scenario> [options]

DISASTER SCENARIOS:
  complete-failure          Full system failure recovery
  database-corruption       Database corruption recovery
  performance-degradation   Severe performance issues
  security-breach          Security incident response

UTILITY COMMANDS:
  health-check             Assess current system health
  emergency-backup         Create immediate backup

ENVIRONMENT VARIABLES:
  ENVIRONMENT              Target environment (default: production)
  FORCE_RECOVERY           Skip confirmation prompts (default: false)
  SKIP_VERIFICATION        Skip post-recovery verification (default: false)

EXAMPLES:
  # Emergency system recovery
  FORCE_RECOVERY=true $0 complete-failure

  # Performance issue assessment
  $0 performance-degradation

  # Quick health check
  $0 health-check

EMERGENCY CONTACTS:
EOF
      for contact in "${EMERGENCY_CONTACTS[@]}"; do
        echo "  - $contact"
      done
      ;;
  esac
}

# Handle script interruption
trap 'log "ERROR" "Recovery script interrupted"; exit 1' INT TERM

# Execute main function
main "$@"