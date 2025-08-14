#!/bin/bash

# 🚀 HERA Bundled Deployment Script
# Handles GitHub commit/push and Railway deployment in one command

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
ORANGE='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${ORANGE}[STEP $1]${NC} $2"
}

# Banner
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           🚀 HERA BUNDLED DEPLOYMENT SYSTEM 🚀            ║"
echo "║                GitHub + Railway Deploy                     ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install git first."
    exit 1
fi

# Check if railway is installed
if ! command -v railway &> /dev/null; then
    print_error "Railway CLI is not installed. Please install Railway CLI first."
    echo "Install with: npm install -g @railway/cli"
    exit 1
fi

# Get deployment message
if [ -z "$1" ]; then
    echo "Usage: ./deploy.sh \"Your deployment message\""
    echo "Example: ./deploy.sh \"Fix user authentication bug\""
    exit 1
fi

COMMIT_MESSAGE="$1"

# Start deployment process
print_status "Starting bundled deployment process..."
echo ""

# Step 1: Check git status
print_step "1/6" "Checking git status..."
CHANGES=$(git status --porcelain)
if [ -z "$CHANGES" ]; then
    print_error "No changes to deploy. Make some changes first."
    exit 1
fi

echo "Changes detected:"
git status --short
echo ""

# Step 2: Build the application
print_step "2/6" "Building application..."
if npm run build; then
    print_success "Build completed successfully"
else
    print_error "Build failed. Please fix build errors before deploying."
    exit 1
fi
echo ""

# Step 3: Stage all changes
print_step "3/6" "Staging changes..."
git add .
print_success "All changes staged"
echo ""

# Step 4: Commit changes
print_step "4/6" "Committing to Git..."
FULL_COMMIT_MESSAGE="🚀 $COMMIT_MESSAGE

Deployed via HERA Bundled Deployment System
- GitHub commit and push
- Railway production deployment

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

if git commit -m "$FULL_COMMIT_MESSAGE"; then
    print_success "Changes committed"
    COMMIT_HASH=$(git rev-parse --short HEAD)
    echo "Commit hash: $COMMIT_HASH"
else
    print_error "Commit failed"
    exit 1
fi
echo ""

# Step 5: Push to GitHub
print_step "5/6" "Pushing to GitHub..."
if git push origin main; then
    print_success "Pushed to GitHub successfully"
    GITHUB_URL="https://github.com/heraerp/heraprd/commit/$COMMIT_HASH"
    echo "GitHub commit: $GITHUB_URL"
else
    print_error "GitHub push failed"
    exit 1
fi
echo ""

# Step 6: Deploy to Railway
print_step "6/6" "Deploying to Railway..."
print_status "Checking Railway authentication..."
if railway whoami > /dev/null 2>&1; then
    print_success "Railway authenticated"
else
    print_error "Not authenticated with Railway. Please run: railway login"
    exit 1
fi

print_status "Starting Railway deployment..."
if railway up; then
    print_success "Railway deployment initiated"
else
    print_error "Railway deployment failed"
    exit 1
fi

# Final summary
echo ""
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║              ✅ DEPLOYMENT SUCCESSFUL! ✅                  ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
print_success "GitHub Commit: $COMMIT_HASH"
print_success "Message: $COMMIT_MESSAGE"
print_success "Railway deployment in progress..."
echo ""
echo "🌐 Live URLs:"
echo "   - https://heraerp.com"
echo "   - https://heraerp-production.up.railway.app"
echo ""
echo "📊 Check deployment status:"
echo "   - GitHub: $GITHUB_URL"
echo "   - Railway: railway logs"
echo ""
print_status "Deployment complete! 🎉"