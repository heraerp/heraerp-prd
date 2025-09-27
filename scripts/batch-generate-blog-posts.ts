#!/usr/bin/env ts-node

import fs from "fs";
import path from "path";

// Helper to pick random element
function pick<T>(arr: T[]): T { 
  return arr[Math.floor(Math.random() * arr.length)]!; 
}

// Helper to format date
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]!;
}

// Helper to ensure directory exists
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Load data
const citiesPath = path.join(__dirname, "../data/cities.json");
const topicsPath = path.join(__dirname, "../data/topics.json");

interface City {
  city: string;
  region: string;
  country: string;
  landmarks: string[];
}

interface Topic {
  pillar: string;
  angle: string;
  benefits: string[];
}

const cities: City[] = JSON.parse(fs.readFileSync(citiesPath, "utf8"));
const topics: Topic[] = JSON.parse(fs.readFileSync(topicsPath, "utf8"));

// Generate content for a city/topic combination
function generateBlogPost(city: City, topic: Topic, date: Date) {
  const cityName = city.city;
  const topicTitle = topic.angle.replace('[CITY]', cityName);
  
  // Generate slug
  const slug = `${topic.pillar}-${cityName}-businesses`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  
  // Generate metadata
  const metadata = {
    title: `${topicTitle} - Transform Your Business Operations`,
    description: `Discover how ${cityName} businesses are ${topic.benefits[0].toLowerCase()}. Get practical insights and proven strategies for ${topic.pillar.toLowerCase()}.`,
    excerpt: `Leading ${cityName} businesses are transforming their operations with modern ${topic.pillar.toLowerCase()} strategies. Learn how to ${topic.benefits[0].toLowerCase()} and join the growing number of successful SMBs in ${city.region}.`,
    city: cityName,
    region: city.region,
    country: city.country,
    pillar: topic.pillar,
    keywords: [
      `${cityName} ${topic.pillar}`,
      `${cityName} business software`,
      `${topic.pillar} ${cityName}`,
      `SMB ${topic.pillar} ${cityName}`,
      `${cityName} business automation`,
      `ERP ${cityName}`
    ],
    hero_subtitle: `Join 500+ ${cityName} businesses already transforming their operations with smart ${topic.pillar.toLowerCase()} solutions.`
  };

  // Generate content sections
  const content = `
import CTA from "@/components/CTA";
import FAQ from "@/components/FAQ";
import NewsletterSignup from "@/components/NewsletterSignup";
import RelatedPosts from "@/components/RelatedPosts";

# ${topicTitle}

In today's competitive ${cityName} business environment, ${topic.pillar.toLowerCase()} has become a critical differentiator. Whether you're running a restaurant near ${city.landmarks[0]}, managing a retail shop in the city centre, or operating a service business across ${city.region}, the right approach to ${topic.pillar.toLowerCase()} can transform your operations.

## The Current State of ${topic.pillar} in ${cityName}

${cityName} businesses face unique challenges when it comes to ${topic.pillar.toLowerCase()}. With ${Math.floor(Math.random() * 5000 + 10000)} SMBs operating across the city, competition is fierce and margins are tight. Recent studies show that businesses in ${city.region} spend an average of ${Math.floor(Math.random() * 20 + 15)} hours per week on administrative tasks that could be automated.

### Key Challenges Facing ${cityName} Businesses:
- Manual processes consuming valuable time
- Disconnected systems creating data silos  
- Limited visibility into real-time performance
- Difficulty scaling operations efficiently
- Compliance and reporting complexities

<CTA />

## How Modern ${topic.pillar} Solutions Transform Operations

Smart ${cityName} business owners are discovering that modern ${topic.pillar.toLowerCase()} solutions can deliver immediate and measurable benefits:

### ${topic.benefits[0]}
By implementing automated ${topic.pillar.toLowerCase()} systems, ${cityName} businesses typically see ${topic.benefits[0].toLowerCase()} within the first 90 days. This isn't just about technology – it's about freeing up time to focus on what matters most: growing your business and serving your customers.

### ${topic.benefits[1]}
Modern solutions provide ${topic.benefits[1].toLowerCase()}, giving you the insights needed to make data-driven decisions. ${cityName} business owners report that having ${topic.benefits[1].toLowerCase()} has transformed how they operate day-to-day.

### ${topic.benefits[2]}
Perhaps most importantly, these solutions enable ${topic.benefits[2].toLowerCase()}, positioning your business for sustainable growth in the competitive ${city.region} market.

## Real Success Stories from ${city.region}

**Case Study: Local Retail Chain**
A ${cityName}-based retail business with locations across ${city.region} implemented modern ${topic.pillar.toLowerCase()} solutions and saw:
- ${Math.floor(Math.random() * 40 + 40)}% reduction in administrative time
- ${Math.floor(Math.random() * 30 + 20)}% improvement in cash flow visibility
- ${Math.floor(Math.random() * 25 + 15)}% increase in customer satisfaction

**Service Business Transformation**
A professional services firm near ${city.landmarks[1]} modernized their ${topic.pillar.toLowerCase()} approach and achieved:
- Complete elimination of manual data entry
- Real-time visibility across all operations
- Ability to scale from ${Math.floor(Math.random() * 5 + 3)} to ${Math.floor(Math.random() * 10 + 15)} team members seamlessly

<NewsletterSignup />

## Implementing ${topic.pillar} Best Practices in Your ${cityName} Business

### Step 1: Assess Your Current State
Start by evaluating your existing ${topic.pillar.toLowerCase()} processes. Where are the bottlenecks? What tasks consume the most time? Understanding your baseline is crucial for measuring improvement.

### Step 2: Define Clear Objectives
What specific outcomes do you want to achieve? Whether it's ${topic.benefits[0].toLowerCase()}, ${topic.benefits[1].toLowerCase()}, or ${topic.benefits[2].toLowerCase()}, having clear goals will guide your implementation.

### Step 3: Choose the Right Solution
Not all ${topic.pillar.toLowerCase()} solutions are created equal. Look for platforms that:
- Understand the unique needs of ${cityName} businesses
- Offer local support and expertise
- Provide industry-specific features
- Scale with your growth ambitions

### Step 4: Plan Your Implementation
Successful ${topic.pillar.toLowerCase()} transformation doesn't happen overnight. Create a phased approach that minimizes disruption while maximizing quick wins.

## The Future of ${topic.pillar} in ${cityName}

As ${cityName} continues to grow as a business hub in ${city.region}, the gap between digitally-enabled businesses and those relying on manual processes will only widen. Forward-thinking business owners are investing in ${topic.pillar.toLowerCase()} not just for today's efficiency gains, but to position themselves for tomorrow's opportunities.

### Emerging Trends to Watch:
- AI-powered ${topic.pillar.toLowerCase()} automation
- Mobile-first business management
- Real-time analytics and insights
- Integrated ecosystem approaches

## Taking Action: Your Next Steps

The best time to modernize your ${topic.pillar.toLowerCase()} approach was yesterday. The second-best time is now. ${cityName} businesses that act today will have a significant competitive advantage in the months and years ahead.

### Immediate Actions You Can Take:
1. **Audit your current processes** - Identify the biggest time-wasters
2. **Calculate your ROI potential** - Understand the financial impact
3. **Explore modern solutions** - See what's possible with today's technology
4. **Connect with local experts** - Learn from other ${cityName} success stories

<RelatedPosts currentCity="${cityName}" currentPillar="${topic.pillar}" />

## Conclusion

${topic.pillar} transformation is no longer optional for ${cityName} businesses that want to thrive. With the right approach and tools, you can ${topic.benefits[0].toLowerCase()}, ${topic.benefits[1].toLowerCase()}, and ${topic.benefits[2].toLowerCase()}.

The question isn't whether to modernize your ${topic.pillar.toLowerCase()} – it's how quickly you can start reaping the benefits that your competitors may already be enjoying.

<FAQ />
`;

  // Generate FAQ data
  const faqData = [
    {
      q: `What ${topic.pillar.toLowerCase()} solutions work best for ${cityName} small businesses?`,
      a: `The best solutions for ${cityName} SMBs are cloud-based platforms that offer local support, understand UK compliance requirements, and can scale with your growth. Look for solutions with proven success in ${city.region}.`
    },
    {
      q: `How much does ${topic.pillar.toLowerCase()} software typically cost in ${cityName}?`,
      a: `Costs vary based on business size and needs, but modern cloud solutions typically range from £50-500 per month. The ROI usually covers this cost within 2-3 months through efficiency gains alone.`
    },
    {
      q: `How long does it take to implement new ${topic.pillar.toLowerCase()} systems?`,
      a: `Most ${cityName} businesses can be up and running within 2-4 weeks. Phased implementations allow you to start seeing benefits immediately while gradually expanding usage.`
    },
    {
      q: `Can ${topic.pillar.toLowerCase()} software integrate with my existing tools?`,
      a: `Yes, modern solutions are designed to integrate with popular business tools. Whether you're using accounting software, CRM systems, or industry-specific applications, integration is typically straightforward.`
    },
    {
      q: `What support is available for ${cityName} businesses?`,
      a: `Look for providers offering local support teams who understand the ${city.region} business environment, UK regulations, and can provide both online and on-site assistance when needed.`
    }
  ];

  // Generate local stats
  const localStats = {
    business_count: `${Math.floor(Math.random() * 5000 + 10000)} SMBs`,
    growth_rate: `${Math.floor(Math.random() * 5 + 12)}% annually`,
    pain_points: [
      "Manual processes consuming 15-20 hours weekly",
      "Limited visibility into business performance",
      "Difficulty scaling operations efficiently"
    ],
    opportunities: [
      `Growing ${topic.pillar.toLowerCase()} adoption in ${city.region}`,
      "Government incentives for digital transformation",
      "Increasing demand for automated solutions"
    ]
  };

  // Generate trust signals
  const trustSignals = [
    `Trusted by ${Math.floor(Math.random() * 200 + 300)}+ ${cityName} businesses`,
    `${Math.floor(Math.random() * 10 + 15)} years serving ${city.region} SMBs`,
    `Local team based in ${cityName}`,
    `${Math.floor(Math.random() * 3 + 4.5).toFixed(1)}/5 average customer rating`,
    `Featured in ${city.region} Business Magazine`
  ];

  // Generate CTA variants
  const ctaVariants = [
    `See how ${cityName} businesses save ${Math.floor(Math.random() * 10 + 10)} hours per week`,
    `Get your free ${topic.pillar.toLowerCase()} assessment`,
    `Join ${Math.floor(Math.random() * 200 + 300)}+ successful ${cityName} businesses`,
    `Transform your ${topic.pillar.toLowerCase()} in 30 days`,
    `Book your free ${cityName} business consultation`
  ];

  return {
    slug,
    metadata: {
      ...metadata,
      meta_title: metadata.title,
      meta_description: metadata.description,
      meta_keywords: metadata.keywords,
      faq: faqData,
      cta_variants: ctaVariants,
      trust_signals: trustSignals,
      local_stats: localStats,
      date: formatDate(date)
    },
    content
  };
}

// Helper to convert to YAML array format
const toYamlArray = (arr: string[]): string => {
  return arr.map(item => `  - "${item}"`).join("\n");
};

// Helper to convert FAQ to YAML format
const toYamlFaq = (faq: Array<{q: string; a: string}>): string => {
  return faq.map(item => 
    `  - q: "${item.q.replace(/"/g, '\\"')}"\n    a: "${item.a.replace(/"/g, '\\"')}"`
  ).join("\n");
};

// Main generation function
async function generateMultiplePosts(count: number) {
  console.log(`🚀 Generating ${count} blog posts...`);
  
  const outDir = path.join(__dirname, "../generated/blog-posts");
  ensureDir(outDir);
  
  const generatedPosts = [];
  const baseDate = new Date();
  
  for (let i = 0; i < count; i++) {
    // Pick random city and topic
    const city = pick(cities);
    const topic = pick(topics);
    
    // Offset date by days to spread posts
    const postDate = new Date(baseDate);
    postDate.setDate(postDate.getDate() - i);
    
    console.log(`\n📝 Generating post ${i + 1}/${count}: ${city.city} - ${topic.pillar}`);
    
    const post = generateBlogPost(city, topic, postDate);
    
    // Create front matter in proper YAML format
    const frontMatter = [
      "---",
      `title: "${post.metadata.meta_title}"`,
      `description: "${post.metadata.meta_description}"`,
      `excerpt: "${post.metadata.excerpt}"`,
      `date: "${post.metadata.date}"`,
      `city: "${post.metadata.city}"`,
      `region: "${post.metadata.region}"`,
      `country: "${post.metadata.country}"`,
      `pillar: "${post.metadata.pillar}"`,
      `keywords:`,
      toYamlArray(post.metadata.meta_keywords),
      `faq:`,
      toYamlFaq(post.metadata.faq),
      `cta_variants:`,
      toYamlArray(post.metadata.cta_variants),
      `trust_signals:`,
      toYamlArray(post.metadata.trust_signals),
      `local_stats:`,
      `  business_count: "${post.metadata.local_stats.business_count}"`,
      `  growth_rate: "${post.metadata.local_stats.growth_rate}"`,
      `  pain_points:`,
      toYamlArray(post.metadata.local_stats.pain_points).split('\n').map(line => '  ' + line).join('\n'),
      `  opportunities:`,
      toYamlArray(post.metadata.local_stats.opportunities).split('\n').map(line => '  ' + line).join('\n'),
      `hero_subtitle: "${post.metadata.hero_subtitle}"`,
      `generatedAt: "${new Date().toISOString()}"`,
      `published: true`,
      "---",
      ""
    ].join("\n");
    
    // Save the file
    const filename = `${post.metadata.date}-${post.slug}.mdx`;
    const filepath = path.join(outDir, filename);
    fs.writeFileSync(filepath, frontMatter + post.content, "utf8");
    
    generatedPosts.push({
      filename,
      city: city.city,
      topic: topic.pillar,
      path: filepath
    });
    
    console.log(`✅ Saved: ${filename}`);
  }
  
  console.log("\n🎉 Blog generation complete!");
  console.log("\n📊 Summary:");
  console.log(`- Total posts generated: ${generatedPosts.length}`);
  console.log(`- Output directory: ${outDir}`);
  console.log("\n📝 Generated posts:");
  generatedPosts.forEach(post => {
    console.log(`  - ${post.city}: ${post.topic}`);
  });
}

// Check if running directly
if (require.main === module) {
  const count = parseInt(process.argv[2] || "5") || 5;
  generateMultiplePosts(count).catch(console.error);
}

export { generateMultiplePosts };