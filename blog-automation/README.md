# 🚀 HERA ERP SEO Blog Automation System

A modern, scalable B2B content marketing system that generates localized, SEO-optimized blog posts daily using Claude AI. Built for HERA ERP to drive organic traffic and lead generation.

## 📊 Key Features

- **🤖 AI-Powered Content**: Claude CLI generates unique, locally-relevant B2B content
- **📍 20+ UK Cities**: Pre-configured for major UK business hubs
- **📈 15+ Business Topics**: Finance, operations, growth, compliance, and more
- **🎯 Conversion Optimized**: Dual CTAs, lead magnets, social proof
- **⚡ Daily Automation**: GitHub Actions generates fresh content automatically
- **🔍 SEO Excellence**: Schema.org, meta tags, keywords, local intent
- **📱 Mobile First**: Responsive design, fast loading, great UX

## 🛠️ Technology Stack

- **Content Generation**: Claude CLI + TypeScript
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Automation**: GitHub Actions
- **Lead Capture**: API routes + CRM integration ready
- **SEO**: JSON-LD, meta tags, sitemap generation

## 📋 Prerequisites

1. **Claude CLI** installed globally:
   ```bash
   npm install -g @anthropic-ai/cli
   ```

2. **Anthropic API Key**: Get from [console.anthropic.com](https://console.anthropic.com)

3. **Node.js 18+** and **npm/yarn**

4. **TypeScript** and **ts-node** for scripts:
   ```bash
   npm install -g typescript ts-node
   ```

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone [your-repo-url]
cd blog-automation

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
```

### 2. Generate Your First Post

```bash
# Make script executable
chmod +x scripts/generate_daily_post.ts

# Generate a blog post
./scripts/generate_daily_post.ts
```

This will create a new blog post in `generated/blog-posts/`.

### 3. Run Development Server

```bash
# Start Next.js
npm run dev

# Visit http://localhost:3000/blog/[generated-slug]
```

## 📁 Project Structure

```
blog-automation/
├── data/
│   ├── cities.json         # 20+ UK cities with landmarks
│   └── topics.json         # 15+ business topics with benefits
├── prompts/
│   ├── ideation.md        # Content brief generation
│   └── article.md         # Article writing prompt
├── scripts/
│   └── generate_daily_post.ts  # Main generation script
├── app/                   # Next.js App Router
│   ├── blog/
│   │   └── [slug]/       # Dynamic blog pages
│   ├── free-guide/       # Lead magnet landing
│   ├── book-a-meeting/   # Booking page
│   └── api/
│       └── leads/        # Lead capture endpoint
├── components/           # React components
│   ├── CTA.tsx          # Sticky call-to-action
│   ├── LeadForm.tsx     # Lead capture form
│   └── ...
└── generated/           # Output directory
    ├── blog-posts/     # Generated MDX files
    └── social-snippets/ # Social media content
```

## 🔧 Configuration

### Cities & Topics

Add more cities to `data/cities.json`:
```json
{
  "city": "Norwich",
  "region": "East",
  "country": "UK",
  "landmarks": ["Norwich Cathedral", "Castle", "The Lanes"]
}
```

Add business topics to `data/topics.json`:
```json
{
  "pillar": "Security & Compliance",
  "angle": "GDPR compliance made simple for [CITY] businesses",
  "benefits": ["Automated compliance", "Data protection", "Audit trails"]
}
```

### Claude Prompts

Modify prompts in `prompts/` directory to adjust:
- Content length (currently 1200-1500 words)
- Writing style and tone
- SEO keyword density
- CTA placement

## 🤖 GitHub Actions Automation

The system runs daily via GitHub Actions:

### Setup

1. Add `ANTHROPIC_API_KEY` to GitHub Secrets:
   - Go to Settings → Secrets → Actions
   - Add `ANTHROPIC_API_KEY` with your key

2. Enable GitHub Actions:
   - Go to Actions tab
   - Enable workflows

3. The workflow runs daily at 6:21 AM UTC

### Manual Trigger

Generate multiple posts manually:
```yaml
# Via GitHub UI: Actions → Daily SEO Blog Generation → Run workflow
# Select number of posts: 1, 3, 5, or 10
```

## 📈 Scaling Guide

### 1. **Content Volume**
- **Current**: 1 post/day = 365 posts/year
- **Scale to**: 3-5 posts/day for aggressive growth
- **Limit**: Stay under 100 posts/day to avoid thin content

### 2. **Geographic Expansion**
- **UK**: 50+ cities available
- **International**: Add US, EU, APAC cities
- **Localization**: Adjust currency, regulations, business culture

### 3. **Topic Expansion**
```javascript
// Industry-specific topics
const industryTopics = {
  "Retail": ["Inventory", "POS", "Customer loyalty"],
  "Healthcare": ["Patient records", "Billing", "Compliance"],
  "Manufacturing": ["Supply chain", "Quality", "Production"],
  "Services": ["Scheduling", "Invoicing", "Client management"]
};
```

### 4. **Multi-language Support**
```javascript
// Add to prompts
"--var", `language=${targetLanguage}`,
"--var", `locale=${targetLocale}`
```

### 5. **Performance Optimization**

**Content Delivery**:
- Use Next.js ISR for fresh content
- CDN for static assets
- Image optimization

**Generation**:
- Batch processing for multiple posts
- Parallel city/topic combinations
- Queue system for large volumes

## 🎯 Lead Generation Integration

### CRM Options

The system is pre-configured for common CRMs:

**HubSpot**:
```typescript
// In app/api/leads/route.ts
const hubspotResponse = await fetch("https://api.hubapi.com/contacts/v1/contact", {
  headers: { "Authorization": `Bearer ${process.env.HUBSPOT_API_KEY}` },
  // ... see file for full implementation
});
```

**Mailchimp**:
```typescript
const mailchimpResponse = await fetch(
  `https://us1.api.mailchimp.com/3.0/lists/${process.env.MAILCHIMP_LIST_ID}/members`,
  // ... configuration
);
```

**Supabase** (HERA native):
```typescript
const { data, error } = await supabase
  .from("leads")
  .insert([leadData]);
```

### Email Automation

Set up drip campaigns:
1. Immediate: Free guide delivery
2. Day 3: Case study
3. Day 7: Demo invitation
4. Day 14: Special offer

## 📊 Analytics & Monitoring

### Key Metrics

Track these KPIs:

| Metric | Target | Measurement |
|--------|--------|-------------|
| Organic Traffic | +50% MoM | GA4 |
| Lead Conversion | 3-5% | Form submissions |
| Content Velocity | 30 posts/month | GitHub commits |
| Keyword Rankings | Top 10 | SEMrush |
| Engagement | 3+ min dwell | GA4 |

### Tools Integration

```javascript
// Google Analytics
gtag('event', 'lead_capture', {
  'form_id': formId,
  'content_city': city,
  'content_topic': topic
});

// Conversion tracking
fbq('track', 'Lead', {
  content_name: 'SMB Guide',
  content_category: topic
});
```

## 🚦 Quality Control

### Pre-publish Checklist

- [ ] Fact-check local statistics
- [ ] Verify business benefit claims  
- [ ] Check keyword density (2-3%)
- [ ] Test all CTAs and links
- [ ] Mobile preview
- [ ] Schema markup validation

### Content Governance

```yaml
# .github/CODEOWNERS
/generated/blog-posts/ @content-team @seo-lead

# Require review for blog posts
/generated/**/*.mdx
```

## 🐛 Troubleshooting

### Common Issues

**1. Claude CLI errors**:
```bash
# Check API key
echo $ANTHROPIC_API_KEY

# Test Claude CLI
claude prompt -p "test" --text "Hello"
```

**2. Generation failures**:
```bash
# Check logs
cat logs/generation-*.log

# Validate JSON data
node -e "console.log(require('./data/cities.json'))"
```

**3. Build errors**:
```bash
# Clear cache
rm -rf .next generated/

# Reinstall deps
npm clean-install
```

## 🔒 Security Best Practices

1. **API Keys**: Never commit keys, use GitHub Secrets
2. **Lead Data**: Encrypt PII, GDPR compliance
3. **Content Moderation**: Review AI output before publishing
4. **Rate Limiting**: Implement on lead capture endpoint
5. **Input Validation**: Sanitize all form inputs

## 📚 Advanced Features

### A/B Testing CTAs

```typescript
const ctaVariants = {
  A: "Book Your Free Demo",
  B: "Get Instant Access",
  C: "Start Free Trial"
};
```

### Dynamic Personalization

```typescript
// Geo-targeting
const userCity = await getUserCity(request);
const relevantPosts = getPostsByCity(userCity);
```

### Content Repurposing

Generate multiple formats:
- Blog post → Email newsletter
- Blog post → Social media series  
- Blog post → Sales enablement docs
- Blog post → Video scripts

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-topic`
3. Add cities/topics to JSON files
4. Test generation locally
5. Submit PR with examples

## 📞 Support & Questions

- **Documentation**: See `/docs` folder
- **Issues**: GitHub Issues
- **Email**: support@heraerp.com
- **Slack**: #content-automation

## 📄 License

MIT License - see LICENSE file

---

Built with ❤️ by HERA ERP Team | Powered by Claude AI