#!/bin/bash

# HERA Git Hooks Setup
# Automatically set up Git hooks for documentation maintenance

echo "🔧 Setting up HERA Git hooks for automatic documentation..."

# Create .githooks directory if it doesn't exist
mkdir -p .githooks

# Create pre-commit hook
cat > .githooks/pre-commit << 'EOF'
#!/bin/bash

# HERA Pre-commit Hook - Documentation Analysis
echo "🔍 HERA: Analyzing changes for documentation updates..."

# Get list of changed files
CHANGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

# Check if any files need documentation updates
NEEDS_DOC_UPDATE=false

for file in $CHANGED_FILES; do
    # Check for API routes
    if [[ $file == src/app/api/*/route.ts ]]; then
        echo "📡 API route changed: $file"
        NEEDS_DOC_UPDATE=true
    fi
    
    # Check for new components
    if [[ $file == src/components/*.tsx ]] && [[ $(git diff --cached --diff-filter=A --name-only | grep "$file") ]]; then
        echo "🧩 New component added: $file"
        NEEDS_DOC_UPDATE=true
    fi
    
    # Check for new pages
    if [[ $file == src/app/*/page.tsx ]] && [[ $(git diff --cached --diff-filter=A --name-only | grep "$file") ]]; then
        echo "📄 New page added: $file"
        NEEDS_DOC_UPDATE=true
    fi
    
    # Check for database schema changes
    if [[ $file == database/*.sql ]] || [[ $file == *migration* ]]; then
        echo "🗄️ Database change detected: $file"
        NEEDS_DOC_UPDATE=true
    fi
done

# Run documentation analysis if needed
if [ "$NEEDS_DOC_UPDATE" = true ]; then
    echo "📝 Running documentation analysis..."
    
    # Create temporary file to track what needs updating
    echo "# Documentation Updates Needed" > .doc-updates-needed.md
    echo "Generated on: $(date)" >> .doc-updates-needed.md
    echo "" >> .doc-updates-needed.md
    
    # Run the auto-documentation generator
    if command -v node >/dev/null 2>&1; then
        node scripts/auto-generate-docs.js --pre-commit
        
        # Check if any documentation was generated
        if [ -d "generated-docs" ] && [ "$(ls -A generated-docs)" ]; then
            echo "📚 Documentation updates generated in generated-docs/"
            echo "⚠️  Please review and commit documentation changes"
            
            # Add documentation reminder to commit message template
            echo "" >> .doc-updates-needed.md
            echo "## Files that need documentation:" >> .doc-updates-needed.md
            for file in $CHANGED_FILES; do
                echo "- $file" >> .doc-updates-needed.md
            done
            
            echo "" >> .doc-updates-needed.md
            echo "## Generated documentation files:" >> .doc-updates-needed.md
            ls generated-docs/ | sed 's/^/- /' >> .doc-updates-needed.md
            
            # Show the documentation reminder
            cat .doc-updates-needed.md
        fi
    else
        echo "⚠️  Node.js not found. Cannot run documentation generator."
    fi
else
    echo "✅ No documentation updates needed"
fi

# Always allow commit to proceed
exit 0
EOF

# Create post-commit hook
cat > .githooks/post-commit << 'EOF'
#!/bin/bash

# HERA Post-commit Hook - Update Documentation Database
echo "📚 HERA: Updating documentation database..."

# Get the latest commit info
COMMIT_HASH=$(git rev-parse HEAD)
COMMIT_MESSAGE=$(git log -1 --pretty=%B)
CHANGED_FILES=$(git diff-tree --no-commit-id --name-only -r HEAD)

# Check if we have documentation updates to sync
if [ -f ".doc-updates-needed.md" ]; then
    echo "🔄 Syncing documentation updates to HERA database..."
    
    # Run the documentation sync script
    if command -v node >/dev/null 2>&1; then
        node scripts/sync-docs-to-hera.js --commit "$COMMIT_HASH"
    fi
    
    # Clean up temporary file
    rm -f .doc-updates-needed.md
fi

echo "✅ Post-commit documentation update complete"
exit 0
EOF

# Create prepare-commit-msg hook
cat > .githooks/prepare-commit-msg << 'EOF'
#!/bin/bash

# HERA Prepare Commit Message Hook - Add Documentation Context
COMMIT_MSG_FILE=$1
COMMIT_SOURCE=$2
SHA1=$3

# Only modify commit message for regular commits (not merges, etc.)
if [ -z "$COMMIT_SOURCE" ] || [ "$COMMIT_SOURCE" = "message" ]; then
    # Check if we have pending documentation updates
    if [ -f ".doc-updates-needed.md" ]; then
        # Add documentation context to commit message
        echo "" >> "$COMMIT_MSG_FILE"
        echo "# Documentation Updates:" >> "$COMMIT_MSG_FILE"
        echo "# - Generated documentation for changed files" >> "$COMMIT_MSG_FILE"
        echo "# - Review generated-docs/ directory" >> "$COMMIT_MSG_FILE"
        echo "# - Consider updating user guides if needed" >> "$COMMIT_MSG_FILE"
    fi
fi
EOF

# Create post-merge hook
cat > .githooks/post-merge << 'EOF'
#!/bin/bash

# HERA Post-merge Hook - Rebuild Documentation
echo "🔄 HERA: Rebuilding documentation after merge..."

# Check if any documentation-relevant files were changed in the merge
CHANGED_FILES=$(git diff-tree --no-commit-id --name-only -r HEAD HEAD~1)

DOC_REBUILD_NEEDED=false
for file in $CHANGED_FILES; do
    if [[ $file == src/app/api/* ]] || [[ $file == src/components/* ]] || [[ $file == src/app/*/page.tsx ]]; then
        DOC_REBUILD_NEEDED=true
        break
    fi
done

if [ "$DOC_REBUILD_NEEDED" = true ]; then
    echo "📝 Rebuilding documentation for merged changes..."
    
    if command -v node >/dev/null 2>&1; then
        node scripts/auto-generate-docs.js --post-merge
        
        # Auto-commit generated documentation
        if [ -d "generated-docs" ] && [ "$(ls -A generated-docs)" ]; then
            echo "📚 Auto-committing updated documentation..."
            git add generated-docs/
            git commit -m "docs: Update documentation after merge

🤖 Auto-generated documentation updates
- Updated API documentation
- Updated component documentation  
- Updated feature guides

Generated on: $(date)"
        fi
    fi
fi

echo "✅ Post-merge documentation update complete"
exit 0
EOF

# Make hooks executable
chmod +x .githooks/*

# Configure Git to use our hooks directory
git config core.hooksPath .githooks

echo "✅ Git hooks configured successfully!"
echo ""
echo "📋 Configured hooks:"
echo "  - pre-commit: Analyzes changes and generates documentation"
echo "  - post-commit: Syncs documentation to HERA database"
echo "  - prepare-commit-msg: Adds documentation context to commit messages"
echo "  - post-merge: Rebuilds documentation after merges"
echo ""
echo "🎯 Your documentation will now be automatically maintained!"
echo ""
echo "💡 To manually run documentation generation:"
echo "   node scripts/auto-generate-docs.js"
echo ""
echo "📚 To sync documentation to HERA:"  
echo "   node scripts/sync-docs-to-hera.js"