#!/bin/bash

# HERA Test Structure Cleanup Script
# This script helps clean up and organize the test structure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧹 HERA Test Structure Cleanup${NC}"
echo "================================"

# Function to count files
count_files() {
    local pattern=$1
    find . -name "$pattern" 2>/dev/null | wc -l | tr -d ' '
}

# Check for tests in wrong locations
echo -e "\n${YELLOW}Checking for tests in non-standard locations...${NC}"

# Tests in src directory
SRC_TESTS=$(find src -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.test.js" 2>/dev/null | wc -l | tr -d ' ')
if [ "$SRC_TESTS" -gt 0 ]; then
    echo -e "${RED}Found $SRC_TESTS test files in src/ directory${NC}"
    find src -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.test.js" | head -10
else
    echo -e "${GREEN}✓ No test files in src/ directory${NC}"
fi

# Check for __tests__ directories
TEST_DIRS=$(find src -type d -name "__tests__" 2>/dev/null | wc -l | tr -d ' ')
if [ "$TEST_DIRS" -gt 0 ]; then
    echo -e "${RED}Found $TEST_DIRS __tests__ directories in src/${NC}"
    find src -type d -name "__tests__" | head -10
else
    echo -e "${GREEN}✓ No __tests__ directories in src/${NC}"
fi

# Check E2E test naming
echo -e "\n${YELLOW}Checking E2E test naming conventions...${NC}"
OLD_E2E=$(find tests/e2e -name "*.spec.ts" ! -name "*.e2e.spec.ts" 2>/dev/null | wc -l | tr -d ' ')
if [ "$OLD_E2E" -gt 0 ]; then
    echo -e "${RED}Found $OLD_E2E E2E tests with old naming (*.spec.ts)${NC}"
    echo "Should be renamed to *.e2e.spec.ts"
else
    echo -e "${GREEN}✓ All E2E tests follow naming convention${NC}"
fi

# Check for duplicate configs
echo -e "\n${YELLOW}Checking for duplicate test configurations...${NC}"
PLAYWRIGHT_CONFIGS=$(find . -name "playwright*.config.ts" ! -path "./node_modules/*" 2>/dev/null | wc -l | tr -d ' ')
if [ "$PLAYWRIGHT_CONFIGS" -gt 1 ]; then
    echo -e "${RED}Found multiple Playwright configs:${NC}"
    find . -name "playwright*.config.ts" ! -path "./node_modules/*"
else
    echo -e "${GREEN}✓ Single Playwright configuration${NC}"
fi

# Check for legacy tests
echo -e "\n${YELLOW}Checking legacy tests...${NC}"
if [ -d "tests/legacy" ]; then
    LEGACY_COUNT=$(find tests/legacy -name "*.test.*" -o -name "*.spec.*" 2>/dev/null | wc -l | tr -d ' ')
    echo -e "${YELLOW}Found $LEGACY_COUNT tests in legacy directory${NC}"
fi

# Summary
echo -e "\n${BLUE}Test Structure Summary${NC}"
echo "====================="
echo "Unit tests: $(count_files "*.test.ts" | grep -E "tests/unit")"
echo "API tests: $(find tests/api -name "*.api.test.ts" 2>/dev/null | wc -l | tr -d ' ')"
echo "E2E tests: $(find tests/e2e -name "*.e2e.spec.ts" -o -name "*.spec.ts" 2>/dev/null | wc -l | tr -d ' ')"
echo "Integration tests: $(find tests/integration -name "*.integration.test.ts" 2>/dev/null | wc -l | tr -d ' ')"

# Provide cleanup options
echo -e "\n${YELLOW}Cleanup Actions Available:${NC}"
echo "1. Move tests from src/ to tests/"
echo "2. Rename E2E tests to *.e2e.spec.ts"
echo "3. Remove empty __tests__ directories"
echo "4. Archive generated tests"
echo "5. Remove duplicate configs"

# Interactive mode
if [ "$1" != "--check-only" ]; then
    echo -e "\n${YELLOW}Run with --check-only to skip interactive mode${NC}"
    read -p "Perform cleanup actions? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Remove empty __tests__ directories
        echo -e "${BLUE}Removing empty __tests__ directories...${NC}"
        find src -type d -name "__tests__" -empty -delete 2>/dev/null || true
        
        # Archive old generated tests
        if [ -d "tests/generated" ]; then
            echo -e "${BLUE}Archiving generated tests...${NC}"
            mkdir -p tests/legacy
            mv tests/generated tests/legacy/ 2>/dev/null || true
        fi
        
        echo -e "${GREEN}✓ Cleanup completed${NC}"
    fi
fi

echo -e "\n${BLUE}Next steps:${NC}"
echo "- Review tests/MIGRATION-GUIDE.md for migration instructions"
echo "- Update CI/CD pipelines to use new test structure"
echo "- Remove legacy tests after verification"