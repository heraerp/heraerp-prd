#!/usr/bin/env ts-node

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// Helper to pick random element
function pick<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper to format date
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0] || '';
}

// Helper to ensure directory exists
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Define types
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

// Load data
const citiesPath = path.join(__dirname, "../data/cities.json");
const topicsPath = path.join(__dirname, "../data/topics.json");

if (!fs.existsSync(citiesPath) || !fs.existsSync(topicsPath)) {
  console.error("❌ Data files not found. Please ensure cities.json and topics.json exist in the data directory.");
  process.exit(1);
}

const cities: City[] = JSON.parse(fs.readFileSync(citiesPath, "utf8"));
const topics: Topic[] = JSON.parse(fs.readFileSync(topicsPath, "utf8"));

// Pick random city and topic
const city = pick(cities);
const topic = pick(topics);

if (!city || !topic) {
  console.error("❌ Failed to pick random city or topic");
  process.exit(1);
}

console.log(`📍 Generating blog for: ${city.city}, ${city.country}`);
console.log(`📚 Topic: ${topic.pillar}`);

// Step 1: Generate content brief using ideation prompt
const ideationCmd = [
  "claude", "prompt",
  "-p", path.join(__dirname, "../prompts/ideation.md"),
  "--var", `city=${city.city}`,
  "--var", `region=${city.region}`,
  "--var", `country=${city.country}`,
  "--var", `landmarks=${JSON.stringify(city.landmarks)}`,
  "--var", `pillar=${topic.pillar}`,
  "--var", `angle=${topic.angle.replace('[CITY]', city.city)}`,
  "--var", `benefits=${JSON.stringify(topic.benefits)}`,
  "--json"
].join(" ");

console.log("🧠 Generating content brief...");
let brief: any;
try {
  const briefOutput = execSync(ideationCmd, { stdio: ["ignore", "pipe", "inherit"] }).toString();
  brief = JSON.parse(briefOutput);
} catch (error) {
  console.error("❌ Failed to generate content brief:", error);
  process.exit(1);
}

if (!brief) {
  console.error("❌ Brief is empty");
  process.exit(1);
}

// Step 2: Generate article using the brief
const articleCmd = [
  "claude", "prompt",
  "-p", path.join(__dirname, "../prompts/article.md"),
  "--var", `city=${city.city}`,
  "--var", `region=${city.region}`,
  "--var", `country=${city.country}`,
  "--var", `brief=${JSON.stringify(brief)}`,
  "--var", `h2_outline=${JSON.stringify(brief.h2_outline)}`,
  "--var", `meta_keywords=${JSON.stringify(brief.meta_keywords)}`,
  "--var", `faq=${JSON.stringify(brief.faq)}`,
  "--var", `local_stats=${JSON.stringify(brief.local_stats)}`,
  "--var", `trust_signals=${JSON.stringify(brief.trust_signals)}`
].join(" ");

console.log("✍️  Generating article...");
let articleOutput;
try {
  articleOutput = execSync(articleCmd, { stdio: ["ignore", "pipe", "inherit"] }).toString();
} catch (error) {
  console.error("❌ Failed to generate article:", error);
  process.exit(1);
}

// Parse the output - find JSON block and markdown content
const lines = articleOutput.split('\n');
let jsonEndIndex = -1;
let inJson = false;
let jsonLines = [];

// Find the JSON metadata block
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line.startsWith('{') || inJson) {
    inJson = true;
    jsonLines.push(lines[i]);
    if (line.endsWith('}')) {
      jsonEndIndex = i;
      break;
    }
  }
}

if (jsonEndIndex === -1) {
  console.error("❌ Could not parse article metadata");
  process.exit(1);
}

// Parse metadata
let metadata;
try {
  metadata = JSON.parse(jsonLines.join('\n'));
} catch (error) {
  console.error("❌ Invalid JSON metadata:", error);
  process.exit(1);
}

// Extract markdown content (everything after the JSON block)
const markdownContent = lines.slice(jsonEndIndex + 2).join('\n').trim();

// Generate slug and filename
const date = formatDate(new Date());
const slug = metadata.slug || 
  `${topic.pillar}-${city.city}-${date}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// Create output directory
const outDir = path.join(__dirname, "../../generated/blog-posts");
ensureDir(outDir);

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

// Create front matter in proper YAML format
const frontMatter = [
  "---",
  `title: "${metadata.meta_title}"`,
  `description: "${metadata.meta_description}"`,
  `excerpt: "${metadata.excerpt}"`,
  `date: "${date}"`,
  `city: "${city.city}"`,
  `region: "${city.region}"`,
  `country: "${city.country}"`,
  `pillar: "${topic.pillar}"`,
  `keywords:`,
  toYamlArray(metadata.meta_keywords),
  `faq:`,
  toYamlFaq(metadata.faq),
  `cta_variants:`,
  toYamlArray(metadata.cta_variants),
  `trust_signals:`,
  toYamlArray(metadata.trust_signals),
  `local_stats:`,
  `  business_count: "${metadata.local_stats.business_count}"`,
  `  growth_rate: "${metadata.local_stats.growth_rate}"`,
  `  pain_points:`,
  metadata.local_stats.pain_points ? toYamlArray(metadata.local_stats.pain_points).split('\n').map(line => '  ' + line).join('\n') : '',
  `  opportunities:`,
  metadata.local_stats.opportunities ? toYamlArray(metadata.local_stats.opportunities).split('\n').map(line => '  ' + line).join('\n') : '',
  `hero_subtitle: "${metadata.hero_subtitle}"`,
  `generatedAt: "${new Date().toISOString()}"`,
  `published: true`,
  "---",
  ""
].join("\n");

// Save the file
const filename = `${date}-${slug}.mdx`;
const filepath = path.join(outDir, filename);
fs.writeFileSync(filepath, frontMatter + markdownContent, "utf8");

console.log(`✅ Blog post saved: ${filename}`);
console.log(`📂 Location: ${filepath}`);

// Optional: Generate social media snippets
const socialDir = path.join(__dirname, "../../generated/social-snippets");
ensureDir(socialDir);

const socialSnippet = {
  twitter: `${metadata.excerpt} Learn more: https://heraerp.com/blog/${slug}`,
  linkedin: `${metadata.hero_subtitle}\n\n${metadata.excerpt}\n\nRead the full article: https://heraerp.com/blog/${slug}`,
  meta: metadata
};

fs.writeFileSync(
  path.join(socialDir, `${date}-${slug}.json`),
  JSON.stringify(socialSnippet, null, 2),
  "utf8"
);

console.log(`📱 Social snippets saved`);
console.log("\n🎉 Blog generation complete!");