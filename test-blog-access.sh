#!/bin/bash

echo "🧪 Testing HERA Blog System..."
echo "==============================="

# Test blog listing page
echo -n "Testing /blog listing page... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/blog)
if [ "$STATUS" = "200" ]; then
    echo "✅ OK (Status: $STATUS)"
else
    echo "❌ Failed (Status: $STATUS)"
fi

# Test individual blog post
echo -n "Testing individual blog post... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/blog/finance-automation-bristol-businesses)
if [ "$STATUS" = "200" ]; then
    echo "✅ OK (Status: $STATUS)"
else
    echo "❌ Failed (Status: $STATUS)"
fi

# Test thank you page
echo -n "Testing /thank-you page... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/thank-you)
if [ "$STATUS" = "200" ]; then
    echo "✅ OK (Status: $STATUS)"
else
    echo "❌ Failed (Status: $STATUS)"
fi

# Test guide download
echo -n "Testing guide download endpoint... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/guides/smb-growth-guide)
if [ "$STATUS" = "200" ]; then
    echo "✅ OK (Status: $STATUS)"
else
    echo "❌ Failed (Status: $STATUS)"
fi

echo ""
echo "🎯 Blog System URLs:"
echo "- Blog Listing: http://localhost:3001/blog"
echo "- Sample Post: http://localhost:3001/blog/finance-automation-bristol-businesses"
echo "- Thank You: http://localhost:3001/thank-you"
echo ""
echo "📝 To generate more posts: npm run blog:generate"