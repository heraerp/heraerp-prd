#!/bin/bash

# ================================================================================
# HERA Smart Code Bulk Fix Script
# Fixes all uppercase .V versions to lowercase .v across the codebase
# ================================================================================

set -e

echo "🔍 HERA Smart Code Bulk Fix"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Find all files with uppercase smart code versions
echo "📋 Finding files with uppercase smart code versions..."
FILES=$(find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec grep -l "\.V[0-9]" {} \; 2>/dev/null || true)

if [ -z "$FILES" ]; then
  echo -e "${GREEN}✅ No files found with uppercase smart code versions!${NC}"
  exit 0
fi

FILE_COUNT=$(echo "$FILES" | wc -l)
echo -e "${YELLOW}Found $FILE_COUNT files with uppercase versions${NC}"
echo ""

# Backup directory
BACKUP_DIR=".smart-code-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "💾 Creating backup in $BACKUP_DIR"
echo ""

# Fix counter
FIXED_COUNT=0

# Process each file
for file in $FILES; do
  echo "🔧 Processing: $file"

  # Create backup
  cp "$file" "$BACKUP_DIR/$(basename $file).backup"

  # Count occurrences before fix
  BEFORE=$(grep -o "\.V[0-9]" "$file" | wc -l || echo 0)

  # Fix uppercase .V to lowercase .v
  # This handles .V1, .V2, .V3, etc.
  sed -i.tmp 's/\.V\([0-9]\+\)/\.v\1/g' "$file"
  rm "$file.tmp" 2>/dev/null || true

  # Count occurrences after fix
  AFTER=$(grep -o "\.V[0-9]" "$file" | wc -l || echo 0)

  FIXED=$((BEFORE - AFTER))
  if [ $FIXED -gt 0 ]; then
    echo -e "${GREEN}  ✓ Fixed $FIXED occurrence(s)${NC}"
    FIXED_COUNT=$((FIXED_COUNT + FIXED))
  else
    echo -e "${YELLOW}  ⚠ No changes needed${NC}"
  fi
done

echo ""
echo "=============================="
echo -e "${GREEN}✅ Bulk fix complete!${NC}"
echo "Files processed: $FILE_COUNT"
echo "Total fixes: $FIXED_COUNT"
echo "Backup location: $BACKUP_DIR"
echo ""
echo "Next steps:"
echo "1. Run: npm run lint"
echo "2. Run: npm run typecheck"
echo "3. Test affected pages"
echo "4. Review changes: git diff"
echo "5. Commit: git add . && git commit -m 'fix: normalize smart code versions to lowercase'"
echo ""
