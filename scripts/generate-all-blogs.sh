#!/bin/bash
# HERA DNA - Generate All Vertical Blogs
# Usage: ./scripts/generate-all-blogs.sh

set -e

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

VERTICALS=("salon" "healthcare" "manufacturing" "retail" "finance")

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   HERA DNA Batch Blog Generator                ║${NC}"
echo -e "${BLUE}║   Generate all 5 vertical blog posts          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Claude CLI is available
if ! command -v claude &> /dev/null; then
  echo -e "${RED}Error: Claude CLI not found${NC}"
  echo "Please install Claude CLI: https://github.com/anthropics/anthropic-cli"
  exit 1
fi

# Check if envsubst is available
if ! command -v envsubst &> /dev/null; then
  echo -e "${RED}Error: envsubst not found${NC}"
  echo "Please install gettext package"
  exit 1
fi

TOTAL=${#VERTICALS[@]}
CURRENT=0
FAILED=()

for VERTICAL in "${VERTICALS[@]}"; do
  CURRENT=$((CURRENT + 1))

  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}📝 Generating ${VERTICAL} blog (${CURRENT}/${TOTAL})${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  if ./scripts/generate-vertical-blog.sh "$VERTICAL"; then
    echo -e "${GREEN}✅ ${VERTICAL} blog generated successfully${NC}"
  else
    echo -e "${RED}❌ ${VERTICAL} blog generation failed${NC}"
    FAILED+=("$VERTICAL")
  fi

  echo ""

  # Add delay between API calls to avoid rate limiting
  if [ $CURRENT -lt $TOTAL ]; then
    echo -e "${YELLOW}⏳ Waiting 5 seconds before next generation...${NC}"
    sleep 5
    echo ""
  fi
done

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Generation Summary                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

SUCCESSFUL=$((TOTAL - ${#FAILED[@]}))
echo -e "Total verticals: ${BLUE}${TOTAL}${NC}"
echo -e "Successful: ${GREEN}${SUCCESSFUL}${NC}"
echo -e "Failed: ${RED}${#FAILED[@]}${NC}"

if [ ${#FAILED[@]} -gt 0 ]; then
  echo ""
  echo -e "${RED}Failed verticals:${NC}"
  for VERTICAL in "${FAILED[@]}"; do
    echo -e "  - $VERTICAL"
  done
  exit 1
else
  echo ""
  echo -e "${GREEN}✨ All blogs generated successfully!${NC}"
  echo ""
  echo -e "${BLUE}📋 Next Steps:${NC}"
  echo -e "   1. Review generated content in ${GREEN}out/${NC} directory"
  echo -e "   2. Create markdown files in ${GREEN}content/blog/${NC}"
  echo -e "   3. Create Next.js pages in ${GREEN}src/app/blog/${NC}"
  echo -e "   4. Add JSON-LD schema from extracted HTML files"
  echo -e "   5. Test all pages locally"
  echo -e "   6. Commit and deploy"
  echo ""
fi
