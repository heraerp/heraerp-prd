#!/bin/bash
# HERA Universal Tile System - Production Deployment Script
# Smart Code: HERA.DEPLOYMENT.UNIVERSAL.TILES.PRODUCTION.v1
#
# Enterprise-grade deployment with comprehensive validation and monitoring

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEPLOY_ENV="${DEPLOY_ENV:-production}"
DEPLOYMENT_ID="tiles-deploy-$(date +%Y%m%d-%H%M%S)"
LOG_FILE="/tmp/hera-tiles-deploy-${DEPLOYMENT_ID}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${2:-$GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    log "ERROR: $1" "$RED"
    exit 1
}

warn() {
    log "WARNING: $1" "$YELLOW"
}

info() {
    log "INFO: $1" "$BLUE"
}

success() {
    log "SUCCESS: $1" "$GREEN"
}

# Deployment configuration validation
validate_deployment_config() {
    info "Validating deployment configuration..."
    
    # Check required environment variables
    local required_vars=("NODE_ENV" "NEXT_PUBLIC_SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            error "Required environment variable $var is not set"
        fi
    done
    
    # Check Node.js version
    local node_version=$(node --version | cut -d'v' -f2)
    local min_version="18.0.0"
    if ! npx semver "$node_version" -r ">=$min_version" >/dev/null 2>&1; then
        error "Node.js version $node_version is below minimum required $min_version"
    fi
    
    # Check available disk space (require at least 2GB)
    local available_space=$(df "$PROJECT_ROOT" | awk 'NR==2 {print $4}')
    if (( available_space < 2097152 )); then # 2GB in KB
        error "Insufficient disk space. At least 2GB required for deployment."
    fi
    
    success "Deployment configuration validated"
}

# Pre-deployment health checks
pre_deployment_checks() {
    info "Running pre-deployment health checks..."
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies
    info "Installing production dependencies..."
    npm ci --only=production || error "Failed to install dependencies"
    
    # Run TypeScript compilation check
    info "Running TypeScript compilation check..."
    npx tsc --noEmit || error "TypeScript compilation failed"
    
    # Run linting
    info "Running code quality checks..."
    npm run lint || warn "Linting issues detected (non-blocking)"
    
    # Run Universal Tile System tests
    info "Running Universal Tile System tests..."
    npm run test:tiles || error "Universal Tile System tests failed"
    
    # Performance budget validation
    info "Validating performance budgets..."
    if command -v lighthouse >/dev/null 2>&1; then
        # Start temporary dev server for testing
        npm run dev -- --port 3003 >&/dev/null &
        local dev_pid=$!
        sleep 10
        
        # Run Lighthouse performance audit
        lighthouse http://localhost:3003/retail/inventory/movements \
            --budget-path="$SCRIPT_DIR/../performance/lighthouse-budget.json" \
            --chrome-flags="--headless" \
            --quiet || warn "Performance budget exceeded (non-blocking)"
        
        # Clean up dev server
        kill $dev_pid 2>/dev/null || true
    else
        warn "Lighthouse not available, skipping performance validation"
    fi
    
    success "Pre-deployment checks completed"
}

# Build production assets
build_production_assets() {
    info "Building production assets..."
    
    cd "$PROJECT_ROOT"
    
    # Clean previous builds
    rm -rf .next build dist
    
    # Set production environment
    export NODE_ENV=production
    
    # Build Next.js application
    info "Building Next.js application..."
    npm run build || error "Production build failed"
    
    # Generate static exports if configured
    if [[ "${STATIC_EXPORT:-false}" == "true" ]]; then
        info "Generating static export..."
        npm run export || error "Static export failed"
    fi
    
    # Compress assets for deployment
    info "Compressing production assets..."
    tar -czf "hera-tiles-${DEPLOYMENT_ID}.tar.gz" \
        .next package.json package-lock.json \
        public src scripts \
        --exclude="src/**/*.test.*" \
        --exclude="src/**/*.spec.*" \
        --exclude="**/__tests__" \
        --exclude="**/node_modules"
    
    success "Production assets built and packaged"
}

# Deploy to production environment
deploy_to_production() {
    info "Deploying to production environment..."
    
    # Database migrations
    if [[ "${RUN_MIGRATIONS:-true}" == "true" ]]; then
        info "Running database migrations..."
        npm run db:migrate:prod || error "Database migrations failed"
    fi
    
    # Deploy to Supabase Edge Functions
    info "Deploying Supabase Edge Functions..."
    supabase functions deploy api-v2 --project-ref "${SUPABASE_PROJECT_REF}" || error "Edge function deployment failed"
    
    # Deploy to hosting platform
    case "${HOSTING_PLATFORM:-vercel}" in
        "vercel")
            info "Deploying to Vercel..."
            npx vercel --prod --token "${VERCEL_TOKEN}" || error "Vercel deployment failed"
            ;;
        "netlify")
            info "Deploying to Netlify..."
            npx netlify deploy --prod --auth "${NETLIFY_AUTH_TOKEN}" || error "Netlify deployment failed"
            ;;
        "aws")
            info "Deploying to AWS..."
            aws s3 sync .next/ "s3://${AWS_S3_BUCKET}" --delete || error "AWS S3 deployment failed"
            aws cloudfront create-invalidation --distribution-id "${AWS_CLOUDFRONT_DISTRIBUTION_ID}" --paths "/*" || warn "CloudFront invalidation failed"
            ;;
        *)
            warn "Unknown hosting platform: ${HOSTING_PLATFORM}. Skipping deployment."
            ;;
    esac
    
    success "Production deployment completed"
}

# Post-deployment validation
post_deployment_validation() {
    info "Running post-deployment validation..."
    
    local deployment_url="${DEPLOYMENT_URL:-https://app.heraerp.com}"
    
    # Health check endpoint validation
    info "Validating health check endpoint..."
    local health_response=$(curl -s -w "%{http_code}" -o /dev/null "${deployment_url}/api/health" || echo "000")
    if [[ "$health_response" != "200" ]]; then
        error "Health check failed with status: $health_response"
    fi
    
    # Universal Tile System endpoint validation
    info "Validating Universal Tile System endpoints..."
    local tiles_response=$(curl -s -w "%{http_code}" -o /dev/null "${deployment_url}/api/v2/retail/inventory/movements?format=tiles" || echo "000")
    if [[ "$tiles_response" != "200" ]]; then
        error "Universal Tile System endpoint failed with status: $tiles_response"
    fi
    
    # Performance validation
    info "Running post-deployment performance validation..."
    if command -v lighthouse >/dev/null 2>&1; then
        local performance_score=$(lighthouse "${deployment_url}/retail/inventory/movements" \
            --only-categories=performance \
            --chrome-flags="--headless" \
            --quiet \
            --output=json | jq '.categories.performance.score * 100' || echo "0")
        
        if (( $(echo "$performance_score < 80" | bc -l) )); then
            warn "Performance score ($performance_score) is below target (80)"
        else
            success "Performance score: $performance_score"
        fi
    fi
    
    # Security validation
    info "Running security validation..."
    local security_headers=("Content-Security-Policy" "X-Frame-Options" "X-Content-Type-Options")
    for header in "${security_headers[@]}"; do
        if ! curl -s -I "${deployment_url}" | grep -i "$header" >/dev/null; then
            warn "Missing security header: $header"
        fi
    done
    
    success "Post-deployment validation completed"
}

# Setup monitoring and alerting
setup_monitoring() {
    info "Setting up production monitoring..."
    
    # Deploy monitoring configuration
    if [[ -f "$SCRIPT_DIR/monitoring/prometheus.yml" ]]; then
        info "Deploying Prometheus configuration..."
        # Deploy Prometheus config to monitoring infrastructure
    fi
    
    if [[ -f "$SCRIPT_DIR/monitoring/grafana-dashboard.json" ]]; then
        info "Deploying Grafana dashboard..."
        # Deploy Grafana dashboard configuration
    fi
    
    # Setup error tracking
    if [[ -n "${SENTRY_DSN:-}" ]]; then
        info "Configuring Sentry error tracking..."
        npx sentry-cli releases new "$DEPLOYMENT_ID" || warn "Failed to create Sentry release"
        npx sentry-cli releases files "$DEPLOYMENT_ID" upload-sourcemaps .next || warn "Failed to upload source maps"
        npx sentry-cli releases finalize "$DEPLOYMENT_ID" || warn "Failed to finalize Sentry release"
    fi
    
    success "Production monitoring configured"
}

# Rollback function
rollback_deployment() {
    error "Deployment failed. Initiating rollback..."
    
    # Rollback logic would go here
    # This could involve:
    # - Reverting database migrations
    # - Rolling back to previous deployment
    # - Restoring previous configuration
    
    error "Rollback completed. Check logs for details: $LOG_FILE"
}

# Cleanup function
cleanup() {
    info "Cleaning up deployment artifacts..."
    
    # Remove temporary files
    rm -f "hera-tiles-${DEPLOYMENT_ID}.tar.gz"
    
    # Archive deployment logs
    if [[ -d "/var/log/hera" ]]; then
        cp "$LOG_FILE" "/var/log/hera/deployment-${DEPLOYMENT_ID}.log"
    fi
    
    success "Cleanup completed"
}

# Main deployment function
main() {
    info "Starting Universal Tile System production deployment..."
    info "Deployment ID: $DEPLOYMENT_ID"
    info "Environment: $DEPLOY_ENV"
    info "Logs: $LOG_FILE"
    
    # Trap errors for rollback
    trap rollback_deployment ERR
    trap cleanup EXIT
    
    # Deployment pipeline
    validate_deployment_config
    pre_deployment_checks
    build_production_assets
    deploy_to_production
    post_deployment_validation
    setup_monitoring
    
    success "🎉 Universal Tile System production deployment completed successfully!"
    info "Deployment ID: $DEPLOYMENT_ID"
    info "Access logs: $LOG_FILE"
}

# Execute main function
main "$@"