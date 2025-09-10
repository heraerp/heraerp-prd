#!/bin/bash
set -e

if [ "$1" == "build" ]; then
    echo "🚀 Starting Railway build process..."
    
    # Export dummy environment variables for build
    export NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://dummy.supabase.co}"
    export NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-dummy-anon-key}"
    export SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-dummy-service-key}"
    
    # Set Node options for memory
    export NODE_OPTIONS="--max-old-space-size=4096"
    
    # Skip environment validation
    export SKIP_ENV_VALIDATION=true
    
    echo "📦 Installing dependencies..."
    npm ci --legacy-peer-deps
    
    echo "🔧 Generating types (allowing failures)..."
    npm run schema:types || echo "Schema types generation failed, continuing..."
    
    echo "🧹 Clearing cache..."
    node scripts/clear-browser-cache.js || echo "Cache clearing failed, continuing..."
    
    echo "📝 Injecting build version..."
    node scripts/inject-build-version.js || echo "Version injection failed, continuing..."
    
    echo "🏗️ Building Next.js application..."
    npx next build
    
    echo "✅ Checking if build succeeded..."
    if [ -d ".next" ]; then
        echo "✅ Build directory found!"
        echo "📁 .next directory structure:"
        ls -la .next/
        
        # Create a build marker file
        echo "$(date)" > .next/BUILD_COMPLETE
        echo "✅ Created build marker file"
    else
        echo "❌ Build directory not found!"
        exit 1
    fi
    
    echo "✅ Railway build completed successfully!"
    
elif [ "$1" == "start" ]; then
    echo "🚀 Starting HERA ERP production server..."
    
    # Wait a moment for filesystem to sync
    sleep 2
    
    # Check current directory
    echo "📁 Current working directory: $(pwd)"
    echo "📁 Directory contents:"
    ls -la
    
    # Check if .next directory exists
    if [ ! -d ".next" ]; then
        echo "❌ ERROR: .next directory not found in current directory!"
        
        # Try to find it
        echo "🔍 Searching for .next directory..."
        find . -name ".next" -type d 2>/dev/null | head -10
        
        # Check if we need to change directory
        if [ -d "/app/.next" ]; then
            echo "📁 Found .next in /app directory"
            cd /app
        elif [ -d "/opt/app/.next" ]; then
            echo "📁 Found .next in /opt/app directory"
            cd /opt/app
        fi
    fi
    
    # Final check
    if [ -d ".next" ]; then
        echo "✅ Found .next directory at: $(pwd)"
        echo "📁 .next contents:"
        ls -la .next/
        
        # Check for build marker
        if [ -f ".next/BUILD_COMPLETE" ]; then
            echo "✅ Build marker found: $(cat .next/BUILD_COMPLETE)"
        else
            echo "⚠️  Build marker not found, but .next exists"
        fi
        
        # Start the production server
        echo "🌐 Starting Next.js production server..."
        exec npm run start
    else
        echo "❌ FATAL: Could not locate .next directory anywhere!"
        exit 1
    fi
else
    echo "Usage: $0 [build|start]"
    exit 1
fi