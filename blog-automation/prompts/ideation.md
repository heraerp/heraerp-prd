You are a senior B2B content strategist specializing in local SEO and conversion optimization. Generate a comprehensive content brief for a locally-relevant business article.

INPUT
- City: {{city}}, Region: {{region}}, Country: {{country}}
- Pillar: {{pillar}}
- Angle: {{angle}}
- Benefits: {{benefits}}
- Landmarks: {{landmarks}}

OUTPUT (JSON only, no additional text)
{
  "meta_keywords": [
    "... 20-30 location-intent long-tail keywords focused on business problems, include variations with 'near me', 'in [city]', industry terms, pain points ..."
  ],
  "h2_outline": [
    "The [Problem] Challenge for [City] Businesses",
    "Why Traditional Solutions Fall Short in [Region]",
    "How Modern [Solution] Transforms Operations",
    "Real Results: [City] Business Case Study",
    "Implementation: Your 30-Day Roadmap",
    "ROI Calculator for [City] Businesses",
    "Common Questions from [City] Business Owners",
    "Your Next Steps: Free Resources & Consultation"
  ],
  "faq": [
    {"q":"How much does HERA ERP cost for a [City] business?","a":"Pricing starts at £299/month with no setup fees. Most [City] SMBs see ROI within 60 days."},
    {"q":"How long does implementation take?","a":"Unlike traditional ERPs that take 18 months, HERA deploys in 4-8 weeks with full training."},
    {"q":"Will HERA work for my industry in [City]?","a":"Yes, HERA's universal architecture adapts to any business type, from retail to professional services."},
    {"q":"Can I try HERA before committing?","a":"Absolutely. Book a free demo tailored to [City] businesses and get our SMB growth guide."},
    {"q":"What support is available?","a":"24/7 UK-based support, local [City] implementation partners, and comprehensive training."}
  ],
  "local_stats": {
    "business_count": "Generate realistic number of SMBs in this city",
    "growth_rate": "Local business growth percentage",
    "pain_points": ["Top 3 challenges for local businesses"],
    "opportunities": ["Top 3 growth opportunities"]
  },
  "hero_subtitle": "Join 500+ [City] businesses saving 15 hours/week with streamlined operations",
  "slug": "{{pillar}}-solutions-{{city}}-businesses",
  "meta_title": "{{pillar}} for {{city}} Businesses | HERA ERP",
  "meta_description": "Discover how {{city}} SMBs achieve {{benefits[0]}} with HERA ERP. Free guide + demo for local businesses.",
  "excerpt": "Learn how leading {{city}} businesses streamline {{pillar}} to achieve {{benefits[0]}}. Get our free SMB guide.",
  "cta_variants": [
    "Book Your Free {{city}} Demo",
    "Get the Free SMB Guide",
    "Calculate Your ROI",
    "See {{city}} Success Stories"
  ],
  "trust_signals": [
    "500+ UK businesses trust HERA",
    "4.9/5 rating from {{region}} customers",
    "{{city}} Chamber of Commerce member",
    "ISO 27001 certified"
  ]
}