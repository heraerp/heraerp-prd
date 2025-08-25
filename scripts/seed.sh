#!/bin/bash
# HERA Ledger Engine - Seed Application Script
# Applies seeds in order with placeholder substitution

set -euo pipefail # Exit on error, undefined variables, pipe failures

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Function to check required environment variables
check_required_vars() {
    local required_vars=("DB_HOST" "DB_PORT" "DB_NAME" "DB_USER" "ORG_ID")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_error "Missing required environment variables: ${missing_vars[*]}"
        echo "Usage: $0"
        echo "Required environment variables:"
        echo "  DB_HOST     - Database host"
        echo "  DB_PORT     - Database port"
        echo "  DB_NAME     - Database name" 
        echo "  DB_USER     - Database user"
        echo "  DB_PASSWORD - Database password (optional, will prompt)"
        echo "  ORG_ID      - Organization UUID"
        echo ""
        echo "Optional for specific seeds:"
        echo "  SCHEMA_ID      - Posting schema entity ID (for seed 11)"
        echo "  TAX_PROFILE_ID - Tax profile entity ID (for seeds 02-03)"
        echo "  DSL_JSON       - Path to DSL JSON file (for seed 10)"
        echo "  PROFILE_NAME   - Tax profile name (for seed 01)"
        exit 1
    fi
}

# Function to execute SQL with placeholders
execute_sql() {
    local sql_file=$1
    local description=$2
    
    log_info "Applying: $description"
    log_info "File: $sql_file"
    
    # Check if file exists
    if [[ ! -f "$sql_file" ]]; then
        log_error "SQL file not found: $sql_file"
        return 1
    fi
    
    # Build psql command
    local psql_cmd="psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER"
    
    # Add password if provided
    if [[ -n "${DB_PASSWORD:-}" ]]; then
        export PGPASSWORD="$DB_PASSWORD"
    fi
    
    # Set variables for placeholder substitution
    local psql_vars=(
        "-v" "org='$ORG_ID'"
    )
    
    # Add optional variables if present
    if [[ -n "${SCHEMA_ID:-}" ]]; then
        psql_vars+=("-v" "schema_id='$SCHEMA_ID'")
    fi
    
    if [[ -n "${TAX_PROFILE_ID:-}" ]]; then
        psql_vars+=("-v" "tax_profile_id='$TAX_PROFILE_ID'")
    fi
    
    if [[ -n "${PROFILE_NAME:-}" ]]; then
        psql_vars+=("-v" "profile_name='$PROFILE_NAME'")
    fi
    
    # Handle DSL JSON
    if [[ -n "${DSL_JSON:-}" ]]; then
        if [[ -f "$DSL_JSON" ]]; then
            local json_content=$(cat "$DSL_JSON" | jq -c .)
            psql_vars+=("-v" "dsl_json='$json_content'")
        else
            log_error "DSL JSON file not found: $DSL_JSON"
            return 1
        fi
    fi
    
    # Execute SQL
    if $psql_cmd "${psql_vars[@]}" -f "$sql_file"; then
        log_info "✓ Successfully applied: $description"
        return 0
    else
        log_error "✗ Failed to apply: $description"
        return 1
    fi
}

# Main execution
main() {
    log_info "HERA Ledger Engine - Seed Application"
    log_info "======================================"
    
    # Check prerequisites
    check_required_vars
    
    # Base directory for seeds
    SEED_DIR="${SEED_DIR:-$(dirname "$0")/../seeds/sql}"
    
    # Verify seed directory exists
    if [[ ! -d "$SEED_DIR" ]]; then
        log_error "Seed directory not found: $SEED_DIR"
        exit 1
    fi
    
    log_info "Seed directory: $SEED_DIR"
    log_info "Organization ID: $ORG_ID"
    echo ""
    
    # Track if we should continue
    local continue_execution=true
    
    # Apply seeds in order
    
    # Tax Profile (optional)
    if [[ -n "${PROFILE_NAME:-}" ]]; then
        if ! execute_sql "$SEED_DIR/01_tax_profile_template.sql" "Tax Profile Template"; then
            continue_execution=false
        fi
        
        if [[ "$continue_execution" == true && -n "${TAX_PROFILE_ID:-}" ]]; then
            if ! execute_sql "$SEED_DIR/02_tax_rates_template.sql" "Tax Rates"; then
                continue_execution=false
            fi
        else
            log_warn "Skipping tax rates - TAX_PROFILE_ID not set"
        fi
    else
        log_info "Skipping tax profile creation - PROFILE_NAME not set"
    fi
    
    # Posting Schema
    if [[ "$continue_execution" == true && -n "${DSL_JSON:-}" ]]; then
        if ! execute_sql "$SEED_DIR/10_posting_schema_global.sql" "Global Posting Schema"; then
            continue_execution=false
        fi
        
        # Capture schema ID from output if needed
        if [[ "$continue_execution" == true && -z "${SCHEMA_ID:-}" ]]; then
            log_warn "SCHEMA_ID not set - cannot apply bindings"
            log_warn "Run: SELECT id FROM core_entities WHERE smart_code = 'HERA.POS.POSTING.SCHEMA.v1' AND organization_id = '$ORG_ID';"
        fi
    else
        log_warn "Skipping posting schema - DSL_JSON not set"
    fi
    
    # Bindings
    if [[ "$continue_execution" == true && -n "${SCHEMA_ID:-}" ]]; then
        if ! execute_sql "$SEED_DIR/11_bind_schema_sale.sql" "Bind Schema to Sale Event"; then
            continue_execution=false
        fi
        
        if [[ "$continue_execution" == true && -n "${TAX_PROFILE_ID:-}" ]]; then
            if ! execute_sql "$SEED_DIR/03_bind_schema_tax.sql" "Bind Schema to Tax Profile"; then
                continue_execution=false
            fi
        else
            log_warn "Skipping tax binding - TAX_PROFILE_ID not set"
        fi
    fi
    
    echo ""
    if [[ "$continue_execution" == true ]]; then
        log_info "✓ All seeds applied successfully!"
    else
        log_error "✗ Some seeds failed to apply"
        exit 1
    fi
    
    # Cleanup
    unset PGPASSWORD
}

# Run main function
main "$@"