#!/bin/bash

# HERA Supabase Setup Script
# Automates the Supabase authentication setup process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if required tools are available
check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v psql &> /dev/null; then
        log_warn "psql not found. Install PostgreSQL client for direct database access."
    fi
    
    if ! command -v supabase &> /dev/null; then
        log_warn "Supabase CLI not found. Install with: npm install -g supabase"
        log_info "Alternative: Use the Supabase Dashboard SQL Editor"
    fi
    
    log_success "Dependency check complete"
}

# Load environment variables
load_env() {
    if [ -f .env.local ]; then
        export $(grep -v '^#' .env.local | xargs)
        log_success "Loaded environment variables from .env.local"
    else
        log_warn ".env.local not found. Please create it from .env.local.template"
        return 1
    fi
}

# Run the migration using different methods
run_migration() {
    local migration_file="database/migrations/001_supabase_auth_setup.sql"
    
    if [ ! -f "$migration_file" ]; then
        log_error "Migration file not found: $migration_file"
        return 1
    fi
    
    log_info "Available migration methods:"
    echo "1. Supabase Dashboard SQL Editor (recommended)"
    echo "2. Supabase CLI"
    echo "3. Direct PostgreSQL connection"
    echo "4. Node.js script"
    
    read -p "Choose method (1-4): " method
    
    case $method in
        1)
            log_info "Opening migration instructions for Dashboard..."
            echo "=================================================="
            echo "MANUAL STEPS FOR SUPABASE DASHBOARD:"
            echo "1. Go to your Supabase Dashboard"
            echo "2. Navigate to SQL Editor"
            echo "3. Copy the contents of: $migration_file"
            echo "4. Paste and run in the SQL Editor"
            echo "=================================================="
            
            if command -v open &> /dev/null; then
                open "$migration_file"
                log_success "Opened migration file for copying"
            elif command -v xdg-open &> /dev/null; then
                xdg-open "$migration_file"
            else
                log_info "Please manually open: $migration_file"
            fi
            ;;
            
        2)
            if command -v supabase &> /dev/null; then
                log_info "Running migration with Supabase CLI..."
                supabase db push
                log_success "Migration completed with Supabase CLI"
            else
                log_error "Supabase CLI not installed"
                return 1
            fi
            ;;
            
        3)
            if [ -z "$DATABASE_URL" ]; then
                log_error "DATABASE_URL not set in .env.local"
                return 1
            fi
            
            if command -v psql &> /dev/null; then
                log_info "Running migration with psql..."
                psql "$DATABASE_URL" -f "$migration_file"
                log_success "Migration completed with psql"
            else
                log_error "psql not installed"
                return 1
            fi
            ;;
            
        4)
            if [ -f "scripts/run-supabase-migration.js" ]; then
                log_info "Running migration with Node.js script..."
                node scripts/run-supabase-migration.js
                log_success "Migration completed with Node.js"
            else
                log_error "Node.js migration script not found"
                return 1
            fi
            ;;
            
        *)
            log_error "Invalid option selected"
            return 1
            ;;
    esac
}

# Test the migration
test_migration() {
    log_info "Testing migration with Node.js..."
    
    if [ -f "scripts/test-supabase-auth.js" ]; then
        node scripts/test-supabase-auth.js
    else
        log_warn "Test script not found. Manual testing required."
        log_info "Use supabase-auth-setup.html for manual testing"
    fi
}

# Update the HTML test file with environment variables
update_test_file() {
    local html_file="supabase-auth-setup.html"
    
    if [ -f "$html_file" ] && [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
        log_info "Updating test HTML file with your credentials..."
        
        # Create a backup
        cp "$html_file" "$html_file.backup"
        
        # Replace the placeholder values
        sed -i.tmp "s|const supabaseUrl = 'YOUR_SUPABASE_URL'|const supabaseUrl = '$NEXT_PUBLIC_SUPABASE_URL'|g" "$html_file"
        sed -i.tmp "s|const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'|const supabaseKey = '$NEXT_PUBLIC_SUPABASE_ANON_KEY'|g" "$html_file"
        
        # Clean up temp file
        rm "$html_file.tmp" 2>/dev/null || true
        
        log_success "Updated $html_file with your Supabase credentials"
        log_info "You can now open $html_file in a browser to test authentication"
    else
        log_warn "Could not update HTML test file. Please update manually."
    fi
}

# Main execution
main() {
    echo "🚀 HERA Supabase Authentication Setup"
    echo "======================================"
    
    check_dependencies
    
    if load_env; then
        log_success "Environment loaded successfully"
        
        # Update test file with credentials
        update_test_file
        
        # Run migration
        run_migration
        
        # Optionally test
        echo ""
        read -p "Run authentication test? (y/N): " run_test
        if [[ $run_test =~ ^[Yy]$ ]]; then
            test_migration
        fi
        
        echo ""
        log_success "Setup completed! Next steps:"
        echo "1. Test signup using supabase-auth-setup.html"
        echo "2. Check your Supabase dashboard for new entities"
        echo "3. Integrate with your HERA application"
        
    else
        log_error "Please configure your environment variables first"
        echo ""
        echo "Steps to configure:"
        echo "1. Copy .env.local.template to .env.local"
        echo "2. Fill in your Supabase credentials"
        echo "3. Re-run this script"
    fi
}

# Run the main function
main "$@"