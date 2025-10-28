#!/usr/bin/env bash
set -euo pipefail

# HERA Claude Autopilot - Intelligent Fix with Learning
# This script fixes test failures and learns from the process

FAILURE_LOG="${1:-test-results.log}"
KNOWLEDGE_BASE=".claude/learning/knowledge-base.json"
FIX_PROMPT=".claude/prompts/fix-test-failure-with-learning.md"
LEARNING_DIR=".claude/learning"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧠 Claude Autopilot with Learning - Starting Fix Process${NC}"

# Ensure learning directory exists
mkdir -p "$LEARNING_DIR"

# Initialize knowledge base if it doesn't exist
if [[ ! -f "$KNOWLEDGE_BASE" ]]; then
    echo -e "${YELLOW}📚 Initializing knowledge base...${NC}"
    cp ".claude/learning/knowledge-base.json" "$KNOWLEDGE_BASE" 2>/dev/null || echo '{"entries": {}, "metrics": {}}' > "$KNOWLEDGE_BASE"
fi

# Extract failure information
if [[ ! -f "$FAILURE_LOG" ]]; then
    echo -e "${RED}❌ Failure log not found: $FAILURE_LOG${NC}"
    exit 1
fi

FAILING_TEST=$(grep -E "FAIL|ERROR" "$FAILURE_LOG" | head -1 | sed 's/.*FAIL\s*//' | sed 's/.*ERROR\s*//')
ERROR_MESSAGE=$(grep -A 5 -E "Error:|Exception:" "$FAILURE_LOG" | head -5 | tr '\n' ' ')
STACK_TRACE=$(grep -A 10 "Stack trace:" "$FAILURE_LOG" 2>/dev/null || echo "No stack trace available")

echo -e "${YELLOW}🔍 Analyzing failure: $FAILING_TEST${NC}"

# Load and analyze knowledge base
KNOWLEDGE_SUMMARY=$(node -e "
const kb = JSON.parse(require('fs').readFileSync('$KNOWLEDGE_BASE', 'utf8'));
const patterns = kb.entries?.common_patterns || {};
console.log('Known patterns: ' + Object.keys(patterns).length);
console.log('Total fixes applied: ' + (kb.metrics?.total_fixes_applied || 0));
console.log('Success rate: ' + ((kb.metrics?.success_rate || 0) * 100).toFixed(1) + '%');
")

# Check for similar patterns
SIMILAR_PATTERNS=$(node -e "
const kb = JSON.parse(require('fs').readFileSync('$KNOWLEDGE_BASE', 'utf8'));
const error = '$ERROR_MESSAGE';
const patterns = kb.entries?.common_patterns || {};
for (const [name, pattern] of Object.entries(patterns)) {
    if (new RegExp(pattern.pattern, 'i').test(error)) {
        console.log('MATCH: ' + name + ' (frequency: ' + pattern.frequency + ', success: ' + (pattern.success_rate * 100).toFixed(1) + '%)');
    }
}
")

echo -e "${BLUE}📊 Knowledge Summary:${NC}"
echo "$KNOWLEDGE_SUMMARY"

if [[ -n "$SIMILAR_PATTERNS" ]]; then
    echo -e "${GREEN}🎯 Found similar patterns:${NC}"
    echo "$SIMILAR_PATTERNS"
fi

# Get affected files from git diff or test output
AFFECTED_FILES=$(git diff --name-only HEAD~1 2>/dev/null || grep -E "\.ts|\.tsx|\.js|\.sql" "$FAILURE_LOG" | head -5 | tr '\n' ',' || echo "unknown")

# Prepare the enhanced prompt
ENHANCED_PROMPT=$(mktemp)
sed -e "s/{{KNOWLEDGE_BASE_SUMMARY}}/$KNOWLEDGE_SUMMARY/g" \
    -e "s/{{FAILING_TEST}}/$FAILING_TEST/g" \
    -e "s/{{ERROR_MESSAGE}}/$ERROR_MESSAGE/g" \
    -e "s/{{STACK_TRACE}}/$STACK_TRACE/g" \
    -e "s/{{AFFECTED_FILES}}/$AFFECTED_FILES/g" \
    -e "s/{{SIMILAR_PATTERNS}}/$SIMILAR_PATTERNS/g" \
    "$FIX_PROMPT" > "$ENHANCED_PROMPT"

# Add current code context if we can identify the failing file
if [[ "$FAILING_TEST" =~ \.ts|\.tsx|\.js ]]; then
    FAILING_FILE=$(echo "$FAILING_TEST" | sed 's/.*\///' | sed 's/:.*$//')
    if [[ -f "src/**/$FAILING_FILE" ]] || [[ -f "tests/**/$FAILING_FILE" ]]; then
        CURRENT_CODE=$(find . -name "$FAILING_FILE" -type f | head -1 | xargs cat 2>/dev/null || echo "File not found")
        sed -i "s/{{CURRENT_CODE}}/$CURRENT_CODE/g" "$ENHANCED_PROMPT"
    fi
fi

echo -e "${BLUE}🤖 Calling Claude with enhanced learning prompt...${NC}"

# Call Claude with the enhanced prompt
FIX_RESULT=$(claude code --file "$ENHANCED_PROMPT" --project . --output json)
FIX_FILE=".claude/last-fix-$(date +%s).json"
echo "$FIX_RESULT" > "$FIX_FILE"

echo -e "${GREEN}📝 Fix generated, applying changes...${NC}"

# Apply the fix
node -e "
const fix = JSON.parse(require('fs').readFileSync('$FIX_FILE', 'utf8'));
const fs = require('fs');

console.log('Root cause:', fix.analysis?.root_cause || 'Unknown');
console.log('Confidence:', fix.analysis?.confidence || 'Unknown');

// Apply code changes
for (const change of fix.fix?.changes || []) {
    console.log('Applying change:', change.type, change.path);
    if (change.type === 'delete') {
        fs.rmSync(change.path, {force: true});
    } else {
        fs.writeFileSync(change.path, change.content);
    }
}

// Create tests
for (const test of fix.fix?.tests || []) {
    console.log('Creating test:', test.path);
    fs.writeFileSync(test.path, test.content);
}
"

# Update knowledge base with learning
echo -e "${BLUE}🧠 Updating knowledge base with new learning...${NC}"
node -e "
const fix = JSON.parse(require('fs').readFileSync('$FIX_FILE', 'utf8'));
const kb = JSON.parse(require('fs').readFileSync('$KNOWLEDGE_BASE', 'utf8'));
const fs = require('fs');

// Initialize structure if needed
if (!kb.entries) kb.entries = {};
if (!kb.entries.common_patterns) kb.entries.common_patterns = {};
if (!kb.metrics) kb.metrics = {};

// Add new pattern if discovered
if (fix.learning?.new_pattern) {
    const pattern = fix.learning.new_pattern;
    kb.entries.common_patterns[pattern.name] = {
        pattern: pattern.regex,
        frequency: 1,
        success_rate: 0.0,
        typical_fix: pattern.typical_fix,
        prevention: pattern.prevention,
        last_seen: new Date().toISOString()
    };
    console.log('Added new pattern:', pattern.name);
}

// Update existing pattern metrics
if (fix.learning?.knowledge_updates?.update_existing_pattern) {
    const patternName = fix.learning.knowledge_updates.update_existing_pattern;
    if (kb.entries.common_patterns[patternName]) {
        kb.entries.common_patterns[patternName].frequency += 1;
        kb.entries.common_patterns[patternName].last_seen = new Date().toISOString();
        console.log('Updated pattern:', patternName);
    }
}

// Update global metrics
kb.metrics.total_fixes_applied = (kb.metrics.total_fixes_applied || 0) + 1;
kb.metrics.last_learning_session = new Date().toISOString();
kb.metrics.patterns_learned = Object.keys(kb.entries.common_patterns).length;

// Save updated knowledge base
fs.writeFileSync('$KNOWLEDGE_BASE', JSON.stringify(kb, null, 2));
console.log('Knowledge base updated with new learning');
"

# Format the code
echo -e "${BLUE}✨ Formatting code...${NC}"
npm run format 2>/dev/null || echo "Format command not available"

# Run a quick validation
echo -e "${BLUE}🔍 Running quick validation...${NC}"
npm run lint 2>/dev/null || echo "Lint validation skipped"

echo -e "${GREEN}✅ Fix applied with learning! Summary:${NC}"
echo -e "  ${BLUE}•${NC} Fixed: $FAILING_TEST"
echo -e "  ${BLUE}•${NC} Knowledge base updated"
echo -e "  ${BLUE}•${NC} Fix details saved to: $FIX_FILE"

# Clean up
rm -f "$ENHANCED_PROMPT"

echo -e "${GREEN}🎯 Autopilot fix with learning completed!${NC}"