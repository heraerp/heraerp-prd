#!/usr/bin/env bash
set -euo pipefail

# HERA Claude Autopilot - Learn from Successful Operations
# This script analyzes successful test runs and updates the knowledge base

KNOWLEDGE_BASE=".claude/learning/knowledge-base.json"
SUCCESS_LOG="${1:-test-success.log}"
LEARNING_DIR=".claude/learning"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎓 Learning from successful operations...${NC}"

# Ensure learning directory exists
mkdir -p "$LEARNING_DIR"

# Check if we have a success log or recent successful commit
if [[ -f "$SUCCESS_LOG" ]]; then
    SUCCESS_INFO=$(cat "$SUCCESS_LOG")
elif git log --oneline -1 | grep -E "(fix|heal|resolve)" >/dev/null 2>&1; then
    # Learn from recent fix commits
    COMMIT_MSG=$(git log --format="%s" -1)
    CHANGED_FILES=$(git diff-tree --no-commit-id --name-only -r HEAD)
    SUCCESS_INFO="Recent successful fix: $COMMIT_MSG. Files changed: $CHANGED_FILES"
else
    echo "No success information to learn from"
    exit 0
fi

echo -e "${GREEN}📚 Success information found:${NC}"
echo "$SUCCESS_INFO"

# Analyze the successful operation and update knowledge base
node -e "
const fs = require('fs');
const path = require('path');

// Load knowledge base
let kb = {};
try {
    kb = JSON.parse(fs.readFileSync('$KNOWLEDGE_BASE', 'utf8'));
} catch (e) {
    kb = { entries: { common_patterns: {} }, metrics: {} };
}

if (!kb.entries) kb.entries = {};
if (!kb.entries.common_patterns) kb.entries.common_patterns = {};
if (!kb.entries.successful_fixes) kb.entries.successful_fixes = [];
if (!kb.metrics) kb.metrics = {};

const successInfo = \`$SUCCESS_INFO\`;

// Extract patterns from successful operations
const patterns = {
    typescript_fix: /typescript|import|module/i,
    api_v2_migration: /api.*v2|rpc.*replace/i,
    actor_stamping: /actor|stamp|audit/i,
    smart_code_fix: /smart.*code|pattern|regex/i,
    gl_balance: /gl|balance|dr.*cr/i
};

for (const [patternName, regex] of Object.entries(patterns)) {
    if (regex.test(successInfo)) {
        if (kb.entries.common_patterns[patternName]) {
            // Update success rate for existing pattern
            const current = kb.entries.common_patterns[patternName];
            const newSuccessRate = (current.success_rate * current.frequency + 1) / (current.frequency + 1);
            current.success_rate = Math.min(newSuccessRate, 1.0);
            console.log(\`Updated success rate for \${patternName}: \${(current.success_rate * 100).toFixed(1)}%\`);
        }
    }
}

// Add to successful fixes log
kb.entries.successful_fixes.push({
    timestamp: new Date().toISOString(),
    description: successInfo.substring(0, 200),
    commit_hash: process.env.GITHUB_SHA || 'local',
    learned_patterns: Object.keys(patterns).filter(p => patterns[p].test(successInfo))
});

// Keep only last 50 successful fixes
if (kb.entries.successful_fixes.length > 50) {
    kb.entries.successful_fixes = kb.entries.successful_fixes.slice(-50);
}

// Update global metrics
kb.metrics.successful_operations = (kb.metrics.successful_operations || 0) + 1;
kb.metrics.last_success_learning = new Date().toISOString();

// Calculate overall success rate
const totalFixes = kb.metrics.total_fixes_applied || 0;
const successfulOps = kb.metrics.successful_operations || 0;
if (totalFixes > 0) {
    kb.metrics.overall_success_rate = successfulOps / totalFixes;
}

// Save updated knowledge base
fs.writeFileSync('$KNOWLEDGE_BASE', JSON.stringify(kb, null, 2));
console.log('Knowledge base updated with success learning');
console.log(\`Total successful operations: \${successfulOps}\`);
console.log(\`Overall success rate: \${((kb.metrics.overall_success_rate || 0) * 100).toFixed(1)}%\`);
"

echo -e "${GREEN}✅ Success learning completed!${NC}"