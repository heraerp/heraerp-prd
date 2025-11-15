#!/bin/bash

# HERA Integration Runtime - Deployment Script
# Smart Code: HERA.PLATFORM.INTEGRATION.DEPLOYMENT.SCRIPT.v1
#
# This script automates the deployment of HERA Integration Runtime
# for both development and production environments

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists npm; then
        print_error "npm is not installed. Please install Node.js and npm."
        exit 1
    fi
    
    if ! command_exists supabase; then
        print_error "Supabase CLI is not installed. Please install it first:"
        echo "npm install -g @supabase/cli"
        exit 1
    fi
    
    if ! command_exists psql; then
        print_error "PostgreSQL client (psql) is not installed."
        exit 1
    fi
    
    print_success "All prerequisites are installed"
}

# Development deployment
deploy_development() {
    print_status "🚀 Starting HERA Integration Runtime Development Deployment..."
    
    # Start Supabase local development
    print_status "Starting Supabase local development..."
    supabase start
    
    # Apply database migrations
    print_status "Applying database migrations..."
    supabase migration up
    
    # Deploy edge functions
    print_status "Deploying edge functions..."
    supabase functions deploy api-v2 --no-verify-jwt=false
    supabase functions deploy outbox-worker --no-verify-jwt=false
    
    # Setup pre-built connectors
    print_status "Setting up pre-built connectors..."
    psql -h localhost -p 54322 -U postgres -d postgres -f scripts/setup-prebuilt-connectors.sql
    
    # Verify deployment
    print_status "Verifying deployment..."
    
    # Test API v2 health
    if curl -s -f "http://localhost:54321/functions/v1/api-v2/health" > /dev/null; then
        print_success "API v2 Gateway is healthy"
    else
        print_warning "API v2 Gateway health check failed"
    fi
    
    # Test Outbox Worker health  
    if curl -s -f "http://localhost:54321/functions/v1/outbox-worker/health" > /dev/null; then
        print_success "Outbox Worker is healthy"
    else
        print_warning "Outbox Worker health check failed"
    fi
    
    # Verify connectors
    CONNECTOR_COUNT=$(psql -h localhost -p 54322 -U postgres -d postgres -t -c "
        SELECT count(*) FROM core_entities 
        WHERE entity_type = 'INTEGRATION_CONNECTOR_DEF' 
        AND entity_code IN ('whatsapp-business-cloud', 'linkedin-api', 'meta-graph-api', 'zapier-webhook', 'hubspot-crm')
    " 2>/dev/null || echo "0")
    
    if [ "$CONNECTOR_COUNT" -eq 5 ]; then
        print_success "All 5 pre-built connectors created successfully"
    else
        print_warning "Only $CONNECTOR_COUNT of 5 connectors created"
    fi
    
    print_success "🎉 Development deployment completed!"
    echo ""
    echo "Next steps:"
    echo "1. Start the development server: npm run dev"
    echo "2. Navigate to Integration Control Center: http://localhost:3000/platform/integrations/control-center"
    echo "3. Navigate to Integration Hub: http://localhost:3000/settings/integrations"
}

# Production deployment
deploy_production() {
    print_status "🚀 Starting HERA Integration Runtime Production Deployment..."
    
    # Check if production project ref is provided
    if [ -z "$PRODUCTION_PROJECT_REF" ]; then
        print_error "PRODUCTION_PROJECT_REF environment variable is required for production deployment"
        echo "Example: export PRODUCTION_PROJECT_REF=awfcrncxngqwbhqapffb"
        exit 1
    fi
    
    # Link to production project
    print_status "Linking to production project: $PRODUCTION_PROJECT_REF"
    supabase link --project-ref "$PRODUCTION_PROJECT_REF"
    
    # Apply database migrations to production
    print_status "Applying migrations to production database..."
    supabase db push
    
    # Deploy edge functions to production
    print_status "Deploying edge functions to production..."
    supabase functions deploy api-v2 --project-ref "$PRODUCTION_PROJECT_REF" --no-verify-jwt=false
    supabase functions deploy outbox-worker --project-ref "$PRODUCTION_PROJECT_REF" --no-verify-jwt=false
    
    # Setup pre-built connectors in production
    print_status "Setting up pre-built connectors in production..."
    
    if [ -z "$PRODUCTION_DB_HOST" ] || [ -z "$PRODUCTION_DB_PASSWORD" ]; then
        print_warning "Production database credentials not provided. Please run connector setup manually:"
        echo "psql -h <production_host> -U postgres -d postgres -f scripts/setup-prebuilt-connectors.sql"
    else
        export PGPASSWORD="$PRODUCTION_DB_PASSWORD"
        psql -h "$PRODUCTION_DB_HOST" -U postgres -d postgres -f scripts/setup-prebuilt-connectors.sql
        unset PGPASSWORD
    fi
    
    # Verify production deployment
    print_status "Verifying production deployment..."
    
    PRODUCTION_URL="https://$PRODUCTION_PROJECT_REF.supabase.co/functions/v1"
    
    # Note: Health checks for production require proper authentication
    print_warning "Production health checks require authentication. Please verify manually:"
    echo "1. API v2 Health: $PRODUCTION_URL/api-v2/health"
    echo "2. Outbox Worker Health: $PRODUCTION_URL/outbox-worker/health"
    
    print_success "🎉 Production deployment completed!"
    echo ""
    echo "Important: Please verify the following manually:"
    echo "1. Edge functions are accessible and healthy"
    echo "2. Database migrations were applied correctly"
    echo "3. Pre-built connectors are available in the Integration Control Center"
    echo "4. Environment variables are configured correctly"
}

# Verify deployment
verify_deployment() {
    local environment=$1
    print_status "🔍 Verifying HERA Integration Runtime deployment for $environment..."
    
    if [ "$environment" = "development" ]; then
        # Development verification
        BASE_URL="http://localhost:54321/functions/v1"
        DB_HOST="localhost"
        DB_PORT="54322"
    elif [ "$environment" = "production" ]; then
        # Production verification  
        if [ -z "$PRODUCTION_PROJECT_REF" ]; then
            print_error "PRODUCTION_PROJECT_REF is required for production verification"
            exit 1
        fi
        BASE_URL="https://$PRODUCTION_PROJECT_REF.supabase.co/functions/v1"
        DB_HOST="${PRODUCTION_DB_HOST:-$PRODUCTION_PROJECT_REF.supabase.co}"
        DB_PORT="${PRODUCTION_DB_PORT:-5432}"
    fi
    
    # Check edge functions
    print_status "Checking edge function health..."
    
    if curl -s -f "$BASE_URL/api-v2/health" > /dev/null; then
        print_success "✓ API v2 Gateway is healthy"
    else
        print_error "✗ API v2 Gateway health check failed"
    fi
    
    if curl -s -f "$BASE_URL/outbox-worker/health" > /dev/null; then
        print_success "✓ Outbox Worker is healthy"  
    else
        print_error "✗ Outbox Worker health check failed"
    fi
    
    # Check database functions
    print_status "Checking database functions..."
    
    if [ "$environment" = "development" ]; then
        FUNCTION_CHECK=$(psql -h "$DB_HOST" -p "$DB_PORT" -U postgres -d postgres -t -c "
            SELECT count(*) FROM information_schema.routines 
            WHERE routine_name IN (
                'hera_integration_event_in_v1',
                'hera_integration_connector_v1', 
                'hera_webhook_config_v1',
                'hera_outbox_get_pending_v1'
            )
        " 2>/dev/null || echo "0")
        
        if [ "$FUNCTION_CHECK" -eq 4 ]; then
            print_success "✓ All integration RPC functions are installed"
        else
            print_error "✗ Integration RPC functions missing (found $FUNCTION_CHECK of 4)"
        fi
        
        # Check connector definitions
        CONNECTOR_CHECK=$(psql -h "$DB_HOST" -p "$DB_PORT" -U postgres -d postgres -t -c "
            SELECT count(*) FROM core_entities 
            WHERE entity_type = 'INTEGRATION_CONNECTOR_DEF'
        " 2>/dev/null || echo "0")
        
        if [ "$CONNECTOR_CHECK" -ge 5 ]; then
            print_success "✓ Pre-built connectors are installed ($CONNECTOR_CHECK found)"
        else
            print_error "✗ Pre-built connectors missing (found $CONNECTOR_CHECK)"
        fi
    fi
    
    print_success "🎉 Deployment verification completed for $environment"
}

# Display usage
usage() {
    echo "HERA Integration Runtime Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  dev        Deploy to development environment"
    echo "  prod       Deploy to production environment"
    echo "  verify     Verify deployment"
    echo "  help       Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  PRODUCTION_PROJECT_REF    - Supabase production project reference (required for prod)"
    echo "  PRODUCTION_DB_HOST        - Production database host (optional)"
    echo "  PRODUCTION_DB_PASSWORD    - Production database password (optional)"
    echo ""
    echo "Examples:"
    echo "  $0 dev                              # Deploy to development"
    echo "  PRODUCTION_PROJECT_REF=abc123 $0 prod  # Deploy to production"
    echo "  $0 verify development               # Verify development deployment"
    echo "  $0 verify production                # Verify production deployment"
}

# Main script logic
main() {
    case "${1:-help}" in
        "dev"|"development")
            check_prerequisites
            deploy_development
            ;;
        "prod"|"production")
            check_prerequisites
            deploy_production
            ;;
        "verify")
            if [ -z "$2" ]; then
                print_error "Please specify environment: development or production"
                exit 1
            fi
            verify_deployment "$2"
            ;;
        "help"|"--help"|"-h")
            usage
            ;;
        *)
            print_error "Unknown command: $1"
            usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"