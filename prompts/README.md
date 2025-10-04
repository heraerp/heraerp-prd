# HERA DNA Vertical Blog Generation System

**Quick Reference Guide for Generating SEO-Optimized Blog Posts**

---

## 🚀 Quick Start

### Generate Single Vertical

```bash
# Salon blog
./scripts/generate-vertical-blog.sh salon

# Healthcare blog
./scripts/generate-vertical-blog.sh healthcare

# Manufacturing blog
./scripts/generate-vertical-blog.sh manufacturing

# Retail blog
./scripts/generate-vertical-blog.sh retail

# Finance blog
./scripts/generate-vertical-blog.sh finance
```

### Generate All Verticals (Batch)

```bash
./scripts/generate-all-blogs.sh
```

---

## 📋 Available Verticals

| Vertical | Command | Output File |
|----------|---------|-------------|
| **Salon & Spa** | `salon` | `out/hera-salon-erp.md` |
| **Healthcare** | `healthcare` | `out/hera-healthcare-erp.md` |
| **Manufacturing** | `manufacturing` | `out/hera-manufacturing-erp.md` |
| **Retail** | `retail` | `out/hera-retail-erp.md` |
| **Finance** | `finance` | `out/hera-finance-erp.md` |

---

## 📁 Generated Files

Each generation creates:

1. **Markdown Blog**: `out/hera-[vertical]-erp.md` (4,000-6,000 words)
2. **FAQ Schema**: `out/hera-[vertical]-erp-faq.html` (JSON-LD)
3. **Article Schema**: `out/hera-[vertical]-erp-article.html` (JSON-LD)

---

## 🔧 Prerequisites

### 1. Install Claude CLI

```bash
npm install -g @anthropic-ai/claude-cli
```

### 2. Install envsubst (gettext)

```bash
# macOS
brew install gettext

# Ubuntu/Debian
sudo apt-get install gettext
```

### 3. Set API Key

```bash
export ANTHROPIC_API_KEY="your-api-key"
```

---

## 📝 Environment Variables

Each vertical has configuration in `envs/[vertical].sh`:

- `VERTICAL` - Industry name
- `AUDIENCE` - Target audience
- `PAINS` - Pain points (semicolon-separated)
- `COMPARATORS` - Competitor products
- `PRIMARY_KEYWORDS` - Main SEO keywords
- `SECONDARY_KEYWORDS` - Supporting keywords
- `SLUG` - URL path
- `CANONICAL_URL` - Full URL
- `CTA_DEMO_URL` - Demo link
- `CTA_GUIDE_URL` - Resource guide link

---

## 🔄 Publishing Workflow

### 1. Generate Content

```bash
./scripts/generate-vertical-blog.sh salon
```

### 2. Review Output

```bash
less out/hera-salon-erp.md
wc -w out/hera-salon-erp.md  # Check word count
```

### 3. Create Markdown File

```bash
cp out/hera-salon-erp.md content/blog/hera-salon-erp-complete-guide.md
```

### 4. Create Next.js Page

```bash
mkdir -p src/app/blog/hera-salon-erp-complete-guide
# Create page.tsx with schema from extracted HTML files
```

### 5. Test Locally

```bash
npm run dev
open http://localhost:3000/blog/hera-salon-erp-complete-guide
```

### 6. Validate Schema

Visit: https://search.google.com/test/rich-results

### 7. Deploy

```bash
git add content/blog/hera-salon-erp-complete-guide.md
git add src/app/blog/hera-salon-erp-complete-guide/
git commit -m "feat: Add HERA Salon ERP blog post"
git push
```

---

## 📖 Documentation

- **Complete Guide**: `/docs/dna/HERA-DNA-VERTICAL-BLOG-SYSTEM.md`
- **SEO Pattern**: `/docs/dna/HERA-DNA-SEO-BLOG-PATTERN.md`
- **Example Posts**:
  - Jewellery: `/blog/ai-erp-jewellery-business-complete-guide`
  - CivicFlow: `/blog/civicflow-government-crm-complete-guide`

---

## 🆘 Troubleshooting

### Claude CLI not found

```bash
npm install -g @anthropic-ai/claude-cli
```

### envsubst not found

```bash
# macOS
brew install gettext
```

### Empty schema blocks

1. Check generated file for markers: `===FAQ-JSON-LD-START===`
2. Manually extract if needed
3. Regenerate if persistent

### Variable not substituted

```bash
# Verify variables are exported
echo $VERTICAL

# Re-source environment file
source envs/salon.sh
```

---

## ✨ Features

- ✅ **4,000-6,000 word** comprehensive blog posts
- ✅ **SEO-optimized** with primary/secondary keywords
- ✅ **Structured data** (FAQ + Article JSON-LD)
- ✅ **13-section framework** for consistency
- ✅ **Realistic timelines** (1-week, 2-week, 4-week)
- ✅ **Competitor analysis** (neutral context)
- ✅ **Case studies** with metrics
- ✅ **Featured snippet** targeting (FAQs)

---

## 🎯 Success Metrics

| Metric | Target |
|--------|--------|
| Word Count | 4,000-6,000 |
| Organic Traffic | 500+/month (3-6 months) |
| Keyword Rankings | Top 10 |
| Featured Snippets | 2-3 FAQs |
| Conversion Rate | 2-5% |

---

## 🔗 Quick Links

- **Generate Script**: `scripts/generate-vertical-blog.sh`
- **Batch Script**: `scripts/generate-all-blogs.sh`
- **Master Prompt**: `prompts/hera_dna_vertical.prompt`
- **Environment Configs**: `envs/*.sh`
- **Output Directory**: `out/`

---

## 📧 Support

- **Issues**: https://github.com/heraerp/heraerp-prd/issues
- **Docs**: https://docs.heraerp.com
- **Email**: dev@heraerp.com

---

**Happy Blogging! 🚀**
