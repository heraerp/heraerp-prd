#!/usr/bin/env node

/**
 * HERA Control Center Git Hooks Setup
 * Ensures Control Center is always used during development
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

const HOOKS_DIR = path.join(process.cwd(), '.git/hooks');

// Pre-commit hook content
const PRE_COMMIT_HOOK = `#!/bin/sh
# HERA Control Center Pre-Commit Hook
# Runs essential checks before every commit

echo "🎛️  HERA Control Center - Pre-Commit Validation"

# Run guardrail checks
node mcp-server/hera-control-center.js guardrails
if [ $? -ne 0 ]; then
    echo "❌ Guardrail violations detected! Fix before committing."
    exit 1
fi

# Run build check
node mcp-server/hera-control-center.js build-check --pre-commit
if [ $? -ne 0 ]; then
    echo "❌ Build checks failed! Fix before committing."
    exit 1
fi

echo "✅ Control Center validation passed!"
`;

// Pre-push hook content
const PRE_PUSH_HOOK = `#!/bin/sh
# HERA Control Center Pre-Push Hook
# Ensures deployment readiness before pushing

echo "🎛️  HERA Control Center - Pre-Push Validation"

# Check deployment readiness
node mcp-server/hera-control-center.js deploy-check
if [ $? -ne 0 ]; then
    echo "❌ Not ready for deployment! Run 'node mcp-server/hera-control-center.js health --detailed' for details."
    exit 1
fi

echo "✅ Deployment checks passed!"
`;

// Post-merge hook content
const POST_MERGE_HOOK = `#!/bin/sh
# HERA Control Center Post-Merge Hook
# Rebuilds indexes after merge

echo "🎛️  HERA Control Center - Post-Merge Tasks"

# Rebuild module indexes
node mcp-server/hera-control-center.js index --rebuild

# Run health check
node mcp-server/hera-control-center.js health

echo "✅ Post-merge tasks completed!"
`;

async function setupHooks() {
    try {
        // Skip in CI/production environments
        if (process.env.CI === 'true' || process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === 'production') {
            console.log('🚀 Skipping control center hook setup in CI/production environment');
            return;
        }
        // Ensure hooks directory exists
        await fs.mkdir(HOOKS_DIR, { recursive: true });
        
        // Install pre-commit hook
        const preCommitPath = path.join(HOOKS_DIR, 'pre-commit');
        await fs.writeFile(preCommitPath, PRE_COMMIT_HOOK);
        await fs.chmod(preCommitPath, '755');
        console.log('✅ Pre-commit hook installed');
        
        // Install pre-push hook
        const prePushPath = path.join(HOOKS_DIR, 'pre-push');
        await fs.writeFile(prePushPath, PRE_PUSH_HOOK);
        await fs.chmod(prePushPath, '755');
        console.log('✅ Pre-push hook installed');
        
        // Install post-merge hook
        const postMergePath = path.join(HOOKS_DIR, 'post-merge');
        await fs.writeFile(postMergePath, POST_MERGE_HOOK);
        await fs.chmod(postMergePath, '755');
        console.log('✅ Post-merge hook installed');
        
        // Add to package.json scripts
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
        
        packageJson.scripts = packageJson.scripts || {};
        packageJson.scripts['cc'] = 'node mcp-server/hera-control-center.js';
        packageJson.scripts['cc:health'] = 'node mcp-server/hera-control-center.js health';
        packageJson.scripts['cc:check'] = 'node mcp-server/hera-control-center.js control';
        packageJson.scripts['cc:deploy'] = 'node mcp-server/hera-control-center.js deploy-check';
        packageJson.scripts['postinstall'] = 'node scripts/setup-control-center-hooks.cjs || echo "Skipping control center hook setup"';
        
        await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log('✅ Package.json scripts updated');
        
        console.log('\n🎯 Control Center hooks successfully installed!');
        console.log('\nQuick commands now available:');
        console.log('  npm run cc          - Open Control Center');
        console.log('  npm run cc:health   - Check system health');
        console.log('  npm run cc:check    - Run full system check');
        console.log('  npm run cc:deploy   - Check deployment readiness');
        
    } catch (error) {
        console.error('❌ Error setting up hooks:', error);
        process.exit(1);
    }
}

// Run setup
setupHooks();