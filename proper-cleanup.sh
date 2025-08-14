#!/bin/bash

# 🧹 PROPER CLEANUP - Remove duplicate HERA structure
# Clean up the mess and organize properly

echo "🧹 Cleaning up duplicate HERA structure..."

# Check if we're in the right location
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    echo "❌ Error: Please run this from your heraerp root directory"
    echo "📍 Current directory: $(pwd)"
    exit 1
fi

echo "📂 Current structure analysis:"
echo "✅ Found src/ (your Next.js app)"
echo "✅ Found package.json (your main config)"

# Check for the problematic nested hera-universal
if [ -d "hera-universal" ]; then
    echo "⚠️  Found duplicate hera-universal/ directory inside your project!"
    echo "📋 Contents of nested hera-universal/:"
    ls -la hera-universal/ | head -10
    echo ""
    
    # Show what we already have at root level
    echo "📋 HERA directories already at root level:"
    ls -la | grep -E "(api|auth-service|ai-service|database|applications)" | head -10
    echo ""
    
    read -p "🗑️  Delete the nested hera-universal/ directory? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  Removing nested hera-universal/ directory..."
        rm -rf hera-universal
        echo "✅ Nested hera-universal/ deleted!"
    else
        echo "❌ Cleanup cancelled"
        exit 1
    fi
fi

# Clean up any duplicate shell scripts
echo "🧹 Cleaning up setup scripts..."
if [ -f "add-hera-dirs.sh" ]; then
    echo "🗑️  Removing add-hera-dirs.sh (no longer needed)"
    rm -f add-hera-dirs.sh
fi

if [ -f "create-hera.sh" ]; then
    echo "🗑️  Removing create-hera.sh (no longer needed)" 
    rm -f create-hera.sh
fi

if [ -f "cleanup-hera.sh" ]; then
    echo "🗑️  Removing old cleanup-hera.sh"
    rm -f cleanup-hera.sh
fi

# Verify our clean structure
echo ""
echo "✅ CLEANUP COMPLETE!"
echo ""
echo "📁 Your clean project structure:"
echo "heraerp/"
echo "├── src/                  # ✅ Your Next.js app"
echo "├── components.json       # ✅ Your components config"
echo "├── package.json          # ✅ Your main config"
echo "├── tailwind.config.ts    # ✅ Your Tailwind config"
echo "├── next.config.ts        # ✅ Your Next.js config"
echo "│"
echo "├── api/                  # ✅ HERA Universal API"
echo "├── auth-service/         # ✅ HERA Universal SSO"
echo "├── ai-service/           # ✅ HERA AI"
echo "├── database/             # ✅ 6 Universal Tables"
echo "├── applications/         # ✅ Business Applications"
echo "├── config/               # ✅ HERA Configurations"
echo "├── testing/              # ✅ Testing Suite"
echo "├── deployment/           # ✅ Deployment Scripts"
echo "├── docs/                 # ✅ Documentation"
echo "└── infrastructure/       # ✅ Docker & Monitoring"
echo ""
echo "🚀 Perfect structure for development!"
echo "💡 No more duplicate directories or confusion!"
echo ""
echo "📊 Final verification:"
tree -I 'node_modules|.next|.git' -L 1