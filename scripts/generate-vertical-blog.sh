#!/bin/bash
# HERA DNA Vertical Blog Generator
# Usage: ./scripts/generate-vertical-blog.sh <vertical>
# Example: ./scripts/generate-vertical-blog.sh salon

set -e

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if vertical argument is provided
if [ -z "$1" ]; then
  echo -e "${RED}Error: Vertical argument required${NC}"
  echo "Usage: $0 <vertical>"
  echo "Available verticals: salon, healthcare, manufacturing, retail, finance"
  exit 1
fi

VERTICAL_NAME=$1
ENV_FILE="envs/${VERTICAL_NAME}.sh"
PROMPT_FILE="prompts/hera_dna_vertical.prompt"
OUTPUT_DIR="out"
OUTPUT_FILE="${OUTPUT_DIR}/hera-${VERTICAL_NAME}-erp.md"

# Check if env file exists
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}Error: Environment file not found: $ENV_FILE${NC}"
  echo "Available verticals: salon, healthcare, manufacturing, retail, finance"
  exit 1
fi

# Check if prompt file exists
if [ ! -f "$PROMPT_FILE" ]; then
  echo -e "${RED}Error: Prompt file not found: $PROMPT_FILE${NC}"
  exit 1
fi

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   HERA DNA Vertical Blog Generator            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Load environment variables
echo -e "${YELLOW}📋 Loading environment variables...${NC}"
source "$ENV_FILE"
echo ""

# Display configuration
echo -e "${BLUE}Configuration:${NC}"
echo -e "  Vertical: ${GREEN}${VERTICAL}${NC}"
echo -e "  Slug: ${GREEN}${SLUG}${NC}"
echo -e "  Output: ${GREEN}${OUTPUT_FILE}${NC}"
echo ""

# Check if Claude CLI is available
if ! command -v claude &> /dev/null; then
  echo -e "${RED}Error: Claude CLI not found${NC}"
  echo "Please install Claude CLI: https://github.com/anthropics/anthropic-cli"
  exit 1
fi

# Generate blog content
echo -e "${YELLOW}🤖 Generating blog content with Claude...${NC}"
echo -e "${BLUE}Model: claude-3-5-sonnet-latest${NC}"
echo -e "${BLUE}Max tokens: 8000${NC}"
echo ""

# Use envsubst to substitute environment variables in the prompt
envsubst < "$PROMPT_FILE" | claude --model claude-3-5-sonnet-latest --max-tokens 8000 > "$OUTPUT_FILE"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Blog content generated successfully${NC}"
  echo -e "${GREEN}   Output: $OUTPUT_FILE${NC}"
  echo ""

  # Extract JSON-LD blocks
  echo -e "${YELLOW}📝 Extracting JSON-LD schema blocks...${NC}"

  # FAQ Schema
  FAQ_FILE="${OUTPUT_DIR}/hera-${VERTICAL_NAME}-erp-faq.html"
  awk '/===FAQ-JSON-LD-START===/{flag=1;next}/===FAQ-JSON-LD-END===/{flag=0}flag' \
    "$OUTPUT_FILE" > "$FAQ_FILE"

  if [ -s "$FAQ_FILE" ]; then
    echo -e "${GREEN}   ✓ FAQ schema: $FAQ_FILE${NC}"
  else
    echo -e "${YELLOW}   ⚠ FAQ schema not found or empty${NC}"
    rm -f "$FAQ_FILE"
  fi

  # Article Schema
  ARTICLE_FILE="${OUTPUT_DIR}/hera-${VERTICAL_NAME}-erp-article.html"
  awk '/===ARTICLE-JSON-LD-START===/{flag=1;next}/===ARTICLE-JSON-LD-END===/{flag=0}flag' \
    "$OUTPUT_FILE" > "$ARTICLE_FILE"

  if [ -s "$ARTICLE_FILE" ]; then
    echo -e "${GREEN}   ✓ Article schema: $ARTICLE_FILE${NC}"
  else
    echo -e "${YELLOW}   ⚠ Article schema not found or empty${NC}"
    rm -f "$ARTICLE_FILE"
  fi

  echo ""

  # Display statistics
  WORD_COUNT=$(wc -w < "$OUTPUT_FILE" | tr -d ' ')
  LINE_COUNT=$(wc -l < "$OUTPUT_FILE" | tr -d ' ')

  echo -e "${BLUE}📊 Content Statistics:${NC}"
  echo -e "   Words: ${GREEN}${WORD_COUNT}${NC}"
  echo -e "   Lines: ${GREEN}${LINE_COUNT}${NC}"
  echo ""

  # Next steps
  echo -e "${BLUE}📋 Next Steps:${NC}"
  echo -e "   1. Review the generated content: ${GREEN}$OUTPUT_FILE${NC}"
  echo -e "   2. Create markdown file: ${GREEN}content/blog/hera-${VERTICAL_NAME}-erp-complete-guide.md${NC}"
  echo -e "   3. Create Next.js page: ${GREEN}src/app/blog/hera-${VERTICAL_NAME}-erp-complete-guide/page.tsx${NC}"
  echo -e "   4. Add schema blocks from extracted HTML files"
  echo -e "   5. Test locally: ${GREEN}http://localhost:3000${SLUG}${NC}"
  echo ""

  echo -e "${GREEN}✨ Generation complete!${NC}"
else
  echo -e "${RED}❌ Error generating blog content${NC}"
  exit 1
fi
