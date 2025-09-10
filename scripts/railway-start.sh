#!/bin/bash

echo "🚀 Starting HERA ERP production server..."

# Check if .next directory exists
if [ ! -d ".next" ]; then
    echo "❌ ERROR: .next directory not found!"
    echo "📁 Current directory contents:"
    ls -la
    
    echo "🔍 Searching for .next directory..."
    find . -name ".next" -type d 2>/dev/null | head -10
    
    exit 1
fi

echo "✅ Found .next directory"
echo "📁 .next contents:"
ls -la .next/

# Start the production server
echo "🌐 Starting Next.js production server..."
exec npm run start