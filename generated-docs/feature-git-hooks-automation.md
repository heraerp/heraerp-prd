# Git Hooks Automation Feature

## Overview
The Git Hooks Automation feature provides seamless integration between your development workflow and the HERA documentation system. It automatically detects code changes, generates appropriate documentation, and keeps your documentation database synchronized with every commit.

## How It Works

### Automated Triggers
The system installs several Git hooks that trigger at key points in your development workflow:

1. **Pre-commit Hook**: Analyzes staged changes and generates documentation
2. **Post-commit Hook**: Syncs generated documentation to HERA database
3. **Prepare-commit-msg Hook**: Enhances commit messages with documentation context
4. **Post-merge Hook**: Rebuilds documentation after merges

### Change Detection
The hooks intelligently detect documentation-relevant changes:

```bash
# Files that trigger documentation generation
src/app/api/*/route.ts     # New or modified API endpoints
src/components/*.tsx       # React components
src/app/*/page.tsx        # Application pages
database/*.sql            # Database schema changes
*migration*               # Database migrations
```

## Installation

### Automatic Setup
```bash
npm run docs:setup-hooks
```

This command:
- Creates `.githooks` directory with all hook scripts
- Makes hooks executable (`chmod +x`)
- Configures Git to use custom hooks directory
- Verifies installation success

### Manual Setup
```bash
# Create hooks directory
mkdir -p .githooks

# Copy hook scripts
cp scripts/git-hooks/* .githooks/

# Make executable
chmod +x .githooks/*

# Configure Git
git config core.hooksPath .githooks
```

## Hook Behaviors

### Pre-commit Hook
**Triggers**: Before each commit
**Actions**:
- Analyzes staged files for documentation needs
- Runs code analysis on changed files
- Generates preliminary documentation
- Creates `.doc-updates-needed.md` for tracking
- Always allows commit to proceed

**Example Output**:
```bash
🔍 HERA: Analyzing changes for documentation updates...
📡 API route changed: src/app/api/users/route.ts
🧩 New component added: src/components/UserCard.tsx
📝 Running documentation analysis...
📚 Documentation updates generated in generated-docs/
⚠️  Please review and commit documentation changes
```

### Post-commit Hook
**Triggers**: After successful commit
**Actions**:
- Syncs generated documentation to HERA database
- Updates documentation entities and relationships
- Records audit trail via universal transactions
- Cleans up temporary files

**Example Output**:
```bash
📚 HERA: Updating documentation database...
🔄 Syncing documentation updates to HERA database...
✅ Post-commit documentation update complete
```

### Prepare-commit-msg Hook
**Triggers**: During commit message preparation
**Actions**:
- Adds documentation context to commit messages
- Includes references to generated documentation
- Provides guidance for documentation review

**Enhanced Commit Message**:
```
feat: Add user management API endpoint

# Documentation Updates:
# - Generated documentation for changed files
# - Review generated-docs/ directory
# - Consider updating user guides if needed
```

### Post-merge Hook
**Triggers**: After Git merge operations
**Actions**:
- Detects documentation-relevant changes in merge
- Rebuilds documentation for merged changes
- Auto-commits updated documentation

**Example Output**:
```bash
🔄 HERA: Rebuilding documentation after merge...
📝 Rebuilding documentation for merged changes...
📚 Auto-committing updated documentation...
✅ Post-merge documentation update complete
```

## Configuration

### Environment Variables
```bash
# .env or .env.local
DOC_AUTO_SYNC=true              # Enable automatic sync
DOC_SKIP_HOOKS=false            # Skip hooks (for CI/CD)
DOC_VERBOSE=false               # Enable verbose logging
DOC_AI_GENERATION=true          # Enable AI-powered generation
```

### Hook Configuration
Hooks can be customized by editing files in `.githooks/`:

```bash
.githooks/
├── pre-commit              # Pre-commit analysis
├── post-commit             # Post-commit sync
├── prepare-commit-msg      # Commit message enhancement
└── post-merge              # Post-merge rebuild
```

### Customization Options
```bash
# In pre-commit hook
SKIP_FILE_PATTERNS="*.test.ts,*.spec.ts"    # Files to ignore
MIN_CHANGES_FOR_DOC=1                       # Minimum changes to trigger
DOC_GENERATION_TIMEOUT=120                  # Timeout in seconds

# In post-commit hook
SYNC_RETRIES=3                              # Retry attempts for sync
SYNC_TIMEOUT=60                             # Sync timeout
AUTO_CLEANUP=true                           # Clean up after sync
```

## Advanced Features

### Selective Documentation
Control which changes trigger documentation:

```bash
# Skip documentation for specific commits
git commit -m "fix: typo" --no-verify

# Force documentation generation
git commit -m "feat: new feature" --verify
```

### Batch Operations
Handle multiple changes efficiently:

```bash
# Hooks detect multiple file changes
- src/app/api/users/route.ts     → API documentation
- src/components/UserList.tsx    → Component documentation  
- src/app/users/page.tsx         → User guide documentation

# Single documentation update covers all changes
```

### Integration with CI/CD
```yaml
# .github/workflows/documentation.yml
name: Documentation Update
on: [push, pull_request]

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Generate documentation
        run: npm run docs:generate
      - name: Sync to database
        run: npm run docs:sync
        env:
          DOC_SKIP_HOOKS: true
```

## Monitoring & Debugging

### Hook Execution Logs
Hooks generate logs for monitoring:

```bash
# View hook execution history
tail -f .git/hooks.log

# Debug specific hook
DEBUG=docs:* git commit -m "test commit"
```

### Health Monitoring
```bash
# Check hook installation
npm run docs:health

# Verify hook configuration
git config core.hooksPath

# Test hooks manually
.githooks/pre-commit
```

### Common Issues

**Hooks not executing:**
```bash
# Check permissions
ls -la .githooks/
chmod +x .githooks/*

# Verify Git configuration
git config core.hooksPath
```

**Documentation not syncing:**
```bash
# Check API connectivity
curl -X POST http://localhost:3000/api/v1/entities

# Verify environment variables
echo $DOC_AUTO_SYNC

# Manual sync
npm run docs:sync
```

**Performance issues:**
```bash
# Optimize hook performance
export DOC_GENERATION_TIMEOUT=60
export DOC_SKIP_LARGE_FILES=true

# Skip hooks temporarily
git commit --no-verify
```

## Benefits

### For Developers
- **Seamless Integration**: No changes to existing Git workflow
- **Automatic Documentation**: Never forget to document changes
- **Enhanced Commits**: Better commit messages with documentation context
- **Zero Maintenance**: System maintains itself automatically

### for Teams
- **Consistent Documentation**: Every change is documented
- **Audit Trail**: Complete history of documentation changes
- **Collaboration**: Shared documentation updates automatically
- **Quality Control**: Automated checks ensure documentation quality

### For Organizations
- **Compliance**: Automated audit trails for regulatory requirements
- **Knowledge Preservation**: No documentation debt accumulation
- **Onboarding**: New developers get current documentation
- **Reduced Support**: Better documentation reduces support requests

## Troubleshooting

### Hook Failures
```bash
# View hook error logs
cat .git/hooks.log

# Test individual hooks
bash -x .githooks/pre-commit

# Bypass hooks if needed
git commit --no-verify
```

### Performance Optimization
```bash
# Optimize for large repositories
export DOC_INCREMENTAL_ONLY=true
export DOC_PARALLEL_PROCESSING=true

# Skip unnecessary analysis
export DOC_SKIP_TESTS=true
export DOC_SKIP_NODE_MODULES=true
```

### Recovery Procedures
```bash
# Reinstall hooks
npm run docs:setup-hooks

# Reset hook configuration
git config --unset core.hooksPath
npm run docs:setup-hooks

# Manual documentation sync
npm run docs:generate
npm run docs:sync
```

---

*The Git Hooks Automation feature ensures your documentation is always current and complete, providing a seamless bridge between your development workflow and your documentation system.*