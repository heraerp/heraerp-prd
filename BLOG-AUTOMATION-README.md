# 🚀 HERA Blog Automation System

A complete SEO-optimized blog automation system integrated into HERA ERP. Generates localized, business-focused content daily using Claude AI.

## ✅ What's Installed

- **20 UK Cities** configured (Bristol, Leeds, Manchester, etc.)
- **15 Business Topics** (Finance, Operations, Growth, etc.)
- **Complete Next.js Integration** with HERA
- **Lead Generation System** (Free guide + demo booking)
- **GitHub Actions** for daily automation
- **Test Blog Post** already generated

## 🎯 Quick Start

### 1. View the Blog System
```bash
npm run dev
# Visit: http://localhost:3000/blog
# Test post: http://localhost:3000/blog/finance-automation-bristol-businesses
```

### 2. Key Pages
- `/blog` - Blog listing page
- `/blog/[slug]` - Individual blog posts
- `/free-guide` - Lead magnet landing page
- `/book-a-meeting` - Demo booking page
- `/thank-you` - Post-submission page

### 3. Generate More Posts

#### Option A: Test Posts (No API Key Needed)
```bash
npx tsx scripts/generate_test_post.ts
```

#### Option B: Real AI Posts (Requires Claude API Key)
```bash
# Set your API key
export ANTHROPIC_API_KEY="sk-ant-..."

# Generate a post
./scripts/generate_daily_post.ts
```

## 📂 File Structure

```
heraerp-prd/
├── data/
│   ├── cities.json         # 20 UK cities
│   └── topics.json         # 15 business topics
├── prompts/
│   ├── ideation.md        # Content planning prompt
│   └── article.md         # Article writing prompt
├── scripts/
│   ├── generate_daily_post.ts  # Main generator
│   └── generate_test_post.ts   # Test generator
├── generated/
│   └── blog-posts/        # Generated MDX files
└── src/
    ├── app/
    │   └── blog/          # Blog routes
    ├── components/        # Blog UI components
    └── lib/posts.ts       # Blog utilities
```

## 🤖 Daily Automation

The system includes GitHub Actions for automatic daily generation:

1. **Add API Key to GitHub**:
   - Go to Settings → Secrets → Actions
   - Add `ANTHROPIC_API_KEY`

2. **Automation Schedule**:
   - Runs daily at 6:21 AM UTC
   - Creates PR with new content
   - Can manually trigger for multiple posts

3. **Manual Trigger**:
   - Go to Actions tab
   - Select "Daily SEO Blog Generation"
   - Click "Run workflow"
   - Choose 1, 3, 5, or 10 posts

## 🎨 Customization

### Add More Cities
Edit `data/cities.json`:
```json
{
  "city": "Norwich",
  "region": "East",
  "country": "UK",
  "landmarks": ["Norwich Cathedral", "Castle"]
}
```

### Add Topics
Edit `data/topics.json`:
```json
{
  "pillar": "Security & Compliance",
  "angle": "GDPR compliance for [CITY] businesses",
  "benefits": ["Automated compliance", "Audit trails"]
}
```

### Customize Prompts
- `prompts/ideation.md` - Adjust brief generation
- `prompts/article.md` - Modify writing style

## 🔧 Lead Capture Integration

The system is ready for CRM integration:

1. **Update API Route**: Edit `/src/app/api/leads/route.ts`
2. **Add CRM Keys**: Add to `.env.local`
3. **Test Flow**: Submit form → Check CRM

### Supported CRMs
- HubSpot (example included)
- Mailchimp (example included)
- Supabase (HERA native)
- Any REST API

## 📈 Scaling

- **Current**: 1 post/day
- **Scale to**: 100+ posts/day
- **Multi-language**: Add language support
- **International**: Expand beyond UK

See `SCALING-GUIDE.md` in blog-automation folder for details.

## 🚦 Quality Control

- Local relevance (city mentions)
- Business focus (no tech jargon)
- SEO optimization (keywords, meta)
- Conversion elements (CTAs, trust signals)

## 📊 Success Metrics

Track these KPIs:
- Organic traffic growth
- Lead conversion rate (target: 3-5%)
- Cost per lead
- Keyword rankings

## 🆘 Troubleshooting

### Claude CLI Not Working
```bash
# Install globally
npm install -g @anthropic-ai/cli

# Check installation
claude --version
```

### No API Key
- Get key from: https://console.anthropic.com
- Set: `export ANTHROPIC_API_KEY="your-key"`

### Build Errors
```bash
# Clean and rebuild
rm -rf .next
npm run build
```

## 🎉 You're Ready!

The blog system is fully integrated and ready to generate traffic and leads for HERA. Start with the test post, then scale up with Claude CLI or GitHub Actions.

Happy blogging! 🚀