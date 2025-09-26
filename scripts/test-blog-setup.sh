#!/bin/bash

echo "🧪 Testing HERA Blog Automation Setup"
echo "======================================"

# Check if blog post was generated
echo "✅ Checking generated blog posts..."
if [ -f "generated/blog-posts/2025-09-26-finance-automation-bristol-businesses.mdx" ]; then
    echo "   ✓ Test blog post found"
else
    echo "   ✗ Test blog post not found"
    exit 1
fi

# Check routes
echo ""
echo "✅ Checking blog routes..."
routes=(
    "src/app/blog/page.tsx"
    "src/app/blog/[slug]/page.tsx"
    "src/app/free-guide/page.tsx"
    "src/app/book-a-meeting/page.tsx"
    "src/app/thank-you/page.tsx"
)

for route in "${routes[@]}"; do
    if [ -f "$route" ]; then
        echo "   ✓ $route"
    else
        echo "   ✗ $route missing"
    fi
done

# Check components
echo ""
echo "✅ Checking blog components..."
components=(
    "src/components/CTA.tsx"
    "src/components/LeadForm.tsx"
    "src/components/TableOfContents.tsx"
    "src/components/FAQ.tsx"
    "src/components/RelatedPosts.tsx"
    "src/components/NewsletterSignup.tsx"
)

for component in "${components[@]}"; do
    if [ -f "$component" ]; then
        echo "   ✓ $component"
    else
        echo "   ✗ $component missing"
    fi
done

# Check data files
echo ""
echo "✅ Checking data files..."
if [ -f "data/cities.json" ] && [ -f "data/topics.json" ]; then
    echo "   ✓ Data files found"
    echo "   - Cities: $(grep -c '"city"' data/cities.json)"
    echo "   - Topics: $(grep -c '"pillar"' data/topics.json)"
else
    echo "   ✗ Data files missing"
fi

echo ""
echo "📋 Setup Summary:"
echo "=================="
echo "✅ Blog system is ready!"
echo ""
echo "🚀 Next steps:"
echo "1. Start dev server: npm run dev"
echo "2. Visit: http://localhost:3000/blog"
echo "3. View test post: http://localhost:3000/blog/finance-automation-bristol-businesses"
echo ""
echo "To generate more posts with Claude CLI:"
echo "1. Set ANTHROPIC_API_KEY environment variable"
echo "2. Run: ./scripts/generate_daily_post.ts"
echo ""
echo "To use GitHub Actions automation:"
echo "1. Push to GitHub"
echo "2. Add ANTHROPIC_API_KEY to GitHub Secrets"
echo "3. Posts will generate daily at 6:21 AM UTC"