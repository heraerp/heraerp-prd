#!/bin/bash

# HERA Blog Automation Runner
# This script generates daily blog posts using Claude CLI

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 HERA Blog Automation System${NC}"
echo "================================"

# Check if Claude CLI is available
if ! command -v claude &> /dev/null; then
    echo -e "${RED}❌ Claude CLI not found!${NC}"
    echo "Please install Claude CLI first: https://docs.anthropic.com/claude-cli"
    exit 1
fi

# Check if API key is set
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  Warning: ANTHROPIC_API_KEY not set${NC}"
    echo "Running in test mode with mock generation..."
    echo ""
    echo "To enable AI generation:"
    echo "export ANTHROPIC_API_KEY=your_key_here"
    echo ""
    
    # Run test generator instead
    echo -e "${GREEN}Running test post generator...${NC}"
    npx tsx scripts/generate_test_post.ts
    exit 0
fi

# Get post count from argument or default to 1
POST_COUNT=${1:-1}

echo -e "${GREEN}📝 Generating ${POST_COUNT} blog post(s)...${NC}"

# Run the main generation script
npx tsx scripts/generate_daily_post.ts --count=$POST_COUNT

echo -e "${GREEN}✅ Blog automation complete!${NC}"
echo ""
echo "Next steps:"
echo "1. View generated posts at: generated/blog-posts/"
echo "2. Access blog at: http://localhost:3000/blog"
echo "3. Push to GitHub for daily automation"