#!/bin/bash
# ========================================
# HERA Transaction Query v1 - Test Runner
# ========================================

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo "========================================"
echo "HERA Transaction Query v1 - Test Runner"
echo "========================================"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ ERROR: DATABASE_URL environment variable not set${NC}"
    echo ""
    echo "Please set it first:"
    echo "  export DATABASE_URL='postgresql://...'"
    echo ""
    exit 1
fi

# Get organization UUID
if [ -z "$1" ]; then
    echo -e "${YELLOW}⚠️  No organization UUID provided${NC}"
    echo ""
    echo "Available organizations:"
    psql "$DATABASE_URL" -c "SELECT id, organization_name FROM core_organizations LIMIT 10;" 2>/dev/null || echo "Could not fetch organizations"
    echo ""
    echo "Usage: $0 <organization-uuid>"
    echo "Example: $0 12345678-1234-1234-1234-123456789012"
    echo ""
    exit 1
fi

ORG_ID="$1"

echo -e "${GREEN}✓${NC} Using organization: $ORG_ID"
echo -e "${GREEN}✓${NC} Database: ${DATABASE_URL%%@*}@***"
echo ""

# Create temporary test file with org UUID replaced
TEMP_TEST_FILE=$(mktemp)
cp "$(dirname "$0")/test-hera-txn-query-v1.sql" "$TEMP_TEST_FILE"
sed -i "s/YOUR-ORG-UUID/$ORG_ID/g" "$TEMP_TEST_FILE"

echo "Running tests..."
echo ""

# Run the tests
if psql "$DATABASE_URL" -f "$TEMP_TEST_FILE"; then
    echo ""
    echo -e "${GREEN}========================================"
    echo -e "✅ TEST SUITE COMPLETED SUCCESSFULLY"
    echo -e "========================================${NC}"
    echo ""
    RESULT=0
else
    echo ""
    echo -e "${RED}========================================"
    echo -e "❌ TEST SUITE FAILED"
    echo -e "========================================${NC}"
    echo ""
    echo "Check the output above for error details"
    echo ""
    RESULT=1
fi

# Cleanup
rm -f "$TEMP_TEST_FILE"

exit $RESULT
