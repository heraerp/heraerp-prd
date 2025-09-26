# HERA Blog Automation Setup Guide

## 🚀 Overview

The HERA Blog Automation system generates SEO-optimized, localized content for UK businesses. It creates city-specific blog posts that drive organic traffic and convert visitors into demo bookings and guide downloads.

## 📋 Prerequisites

- Node.js 18+ and npm
- Claude CLI (optional, for AI generation)
- GitHub account (for automation)

## 🛠️ Installation

1. **Dependencies are already installed** via package.json:
   - `gray-matter`: Parses MDX frontmatter
   - `next-mdx-remote`: Renders MDX content

2. **Environment Setup** (optional for AI generation):
   ```bash
   export ANTHROPIC_API_KEY=your_key_here
   ```

## 📁 Project Structure

```
/data/
  cities.json           # 20 UK cities with landmarks
  topics.json          # 15 business topics/pillars
  
/prompts/
  ideation.md          # Claude prompt for title generation
  article.md           # Claude prompt for full article
  
/scripts/
  generate_daily_post.ts    # Main generation script
  generate_test_post.ts     # Test post generator
  run-blog-automation.sh    # Runner script
  
/generated/blog-posts/      # Generated MDX files
  
/src/
  /app/blog/               # Blog pages
    page.tsx               # Blog listing
    [slug]/page.tsx        # Individual posts
  /lib/posts.ts            # Blog utilities
  /components/             # Blog components
    CTA.tsx, LeadForm.tsx, FAQ.tsx, etc.
    
/.github/workflows/
  daily-content.yml        # GitHub Actions automation
```

## 🎯 Usage

### Generate Test Posts (No API Key Required)
```bash
./scripts/run-blog-automation.sh
# or
npm run blog:generate
```

### Generate AI Posts (Requires Claude API Key)
```bash
export ANTHROPIC_API_KEY=your_key_here
./scripts/run-blog-automation.sh 3  # Generate 3 posts
```

### Manual Generation
```bash
npx tsx scripts/generate_test_post.ts        # Single test post
npx tsx scripts/generate_daily_post.ts       # AI generation
```

## 🌐 Accessing the Blog

1. Start development server:
   ```bash
   npm run dev
   ```

2. Visit:
   - Blog listing: http://localhost:3000/blog
   - Example post: http://localhost:3000/blog/finance-automation-bristol-businesses

## 🎨 Features

### SEO Optimization
- City-specific content with local landmarks
- JSON-LD structured data (Article, FAQ, Local Business)
- Meta tags optimized for each location
- Keyword targeting for "[City] + [Business Need]"

### Conversion Elements
- Sticky CTA bar with demo booking
- Free SMB guide download
- Trust signals (500+ customers, ratings)
- Local business statistics
- FAQ section addressing objections

### Content Strategy
- 15 business pillars (Finance, Operations, HR, etc.)
- 20 UK cities (London, Manchester, Bristol, etc.)
- Business-first language (no technical jargon)
- Problem → Solution → Benefits structure

## 🤖 GitHub Actions Automation

1. **Push to GitHub**
2. **Add Secret**: `ANTHROPIC_API_KEY` in repository settings
3. **Enable Actions**: The workflow runs daily at 9 AM UTC

### Workflow Configuration
```yaml
# .github/workflows/daily-content.yml
env:
  POST_COUNT: 3  # Adjust posts per day (1, 3, 5, or 10)
```

## 📊 Content Generation Logic

1. **City Selection**: Weighted by business density
2. **Topic Selection**: Rotates through 15 pillars
3. **Title Generation**: Uses Claude for SEO-optimized titles
4. **Article Creation**: 
   - 1,500-2,500 words
   - 8-10 sections with anchors
   - Local relevance throughout
   - Multiple CTAs

## 🎯 Lead Capture Flow

1. **Free Guide CTA** → `/guides/smb-growth-guide` → Download
2. **Demo CTA** → External booking link
3. **Newsletter Signup** → Email capture
4. **Thank You Page** → `/thank-you` with next steps

## 📈 Performance Tips

- Generate 3-5 posts daily for consistent growth
- Monitor `/blog` page load times
- Use Vercel Analytics for traffic insights
- A/B test CTA variants
- Track conversion rates per city/topic

## 🔧 Customization

### Add New Cities
Edit `/data/cities.json`:
```json
{
  "city": "Newcastle",
  "region": "North East",
  "country": "UK",
  "landmarks": ["Angel of the North", "Quayside", "St James' Park"]
}
```

### Add New Topics
Edit `/data/topics.json`:
```json
{
  "pillar": "Sustainability & ESG",
  "angle": "Track your carbon footprint in [CITY]",
  "benefits": ["ESG reporting", "Carbon tracking", "Sustainability goals"]
}
```

## 🚀 Next Steps

1. **Set API Key**: `export ANTHROPIC_API_KEY=...`
2. **Generate Content**: `./scripts/run-blog-automation.sh 5`
3. **Create Guide PDF**: Add to `/public/guides/smb-growth-guide.pdf`
4. **Connect CRM**: Update `/src/app/api/leads/route.ts`
5. **Deploy**: Push to Vercel/production

## 📞 Support

- Documentation: This file
- Blog System: `/src/lib/posts.ts`
- Generation: `/scripts/generate_daily_post.ts`
- Components: `/src/components/`

---

**Ready to automate your content marketing?** Start with `npm run blog:generate`! 🚀