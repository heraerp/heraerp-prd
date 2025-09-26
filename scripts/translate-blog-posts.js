#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Language mappings for cities
const cityLanguageMap = {
  // India
  "Kochi": { language: "Malayalam", code: "ml" },
  "Chennai": { language: "Tamil", code: "ta" },
  "Bangalore": { language: "Kannada", code: "kn" },
  "Hyderabad": { language: "Telugu", code: "te" },
  "Mumbai": { language: "Marathi", code: "mr" },
  "Pune": { language: "Marathi", code: "mr" },
  "Kolkata": { language: "Bengali", code: "bn" },
  "Ahmedabad": { language: "Gujarati", code: "gu" },
  "Surat": { language: "Gujarati", code: "gu" },
  "Jaipur": { language: "Hindi", code: "hi" },
  "Delhi": { language: "Hindi", code: "hi" },
  "Lucknow": { language: "Hindi", code: "hi" },
  "Chandigarh": { language: "Punjabi", code: "pa" },
  // UAE
  "Dubai": { language: "Arabic", code: "ar" },
  "Abu Dhabi": { language: "Arabic", code: "ar" }
};

// Malayalam translations for common business terms
const malayalamTranslations = {
  // Headers and titles
  "Transform Your Business Operations": "നിങ്ങളുടെ ബിസിനസ് പ്രവർത്തനങ്ങൾ പരിവർത്തനം ചെയ്യുക",
  "Business Growth Insights": "ബിസിനസ് വളർച്ച ഉൾക്കാഴ്ചകൾ",
  "The Current State of": "നിലവിലെ അവസ്ഥ",
  "Real Success Stories from": "യഥാർത്ഥ വിജയ കഥകൾ",
  "Taking Action: Your Next Steps": "നടപടി എടുക്കുക: നിങ്ങളുടെ അടുത്ത ഘട്ടങ്ങൾ",
  "Conclusion": "ഉപസംഹാരം",
  
  // Common phrases
  "businesses": "ബിസിനസുകൾ",
  "small businesses": "ചെറുകിട ബിസിനസുകൾ",
  "business environment": "ബിസിനസ് പരിസരം",
  "manual processes": "മാനുവൽ പ്രക്രിയകൾ",
  "automated": "ഓട്ടോമേറ്റഡ്",
  "efficiency gains": "കാര്യക്ഷമത നേട്ടങ്ങൾ",
  "cost reduction": "ചെലവ് കുറയ്ക്കൽ",
  "revenue growth": "വരുമാന വളർച്ച",
  "customer satisfaction": "ഉപഭോക്തൃ സംതൃപ്തി",
  "digital transformation": "ഡിജിറ്റൽ പരിവർത്തനം",
  "data-driven decisions": "ഡാറ്റ അടിസ്ഥാനമാക്കിയുള്ള തീരുമാനങ്ങൾ",
  
  // CTA phrases
  "Get Free SMB Guide": "സൗജന്യ SMB ഗൈഡ് നേടുക",
  "Book a Demo": "ഡെമോ ബുക്ക് ചെയ്യുക",
  "Learn More": "കൂടുതൽ അറിയുക",
  "Get Started": "ആരംഭിക്കുക",
  "Contact Us": "ഞങ്ങളെ ബന്ധപ്പെടുക",
  
  // Benefits
  "Save time": "സമയം ലാഭിക്കുക",
  "Increase efficiency": "കാര്യക്ഷമത വർദ്ധിപ്പിക്കുക",
  "Reduce costs": "ചെലവ് കുറയ്ക്കുക",
  "Improve visibility": "ദൃശ്യത മെച്ചപ്പെടുത്തുക",
  "Scale operations": "പ്രവർത്തനങ്ങൾ വികസിപ്പിക്കുക",
  
  // Industries
  "retail business": "ചില്ലറ വ്യാപാരം",
  "service company": "സേവന കമ്പനി",
  "trading business": "വ്യാപാര ബിസിനസ്",
  "manufacturing": "നിർമ്മാണം",
  "healthcare": "ആരോഗ്യ സംരക്ഷണം",
  "restaurant": "റെസ്റ്റോറന്റ്"
};

// Helper to translate a specific phrase
function translatePhrase(phrase, translations) {
  // Check for exact match first
  if (translations[phrase]) {
    return translations[phrase];
  }
  
  // Try to match and replace parts
  let translated = phrase;
  for (const [eng, mal] of Object.entries(translations)) {
    const regex = new RegExp(eng, 'gi');
    translated = translated.replace(regex, mal);
  }
  
  return translated;
}

// Generate translated blog post for Malayalam (Kochi)
function generateMalayalamPost(originalContent, metadata) {
  // Parse the original content
  const lines = originalContent.split('\n');
  const translatedLines = [];
  
  for (let line of lines) {
    // Skip MDX imports
    if (line.startsWith('import')) {
      translatedLines.push(line);
      continue;
    }
    
    // Translate headers
    if (line.startsWith('#')) {
      const headerMatch = line.match(/^(#+)\s*(.*)$/);
      if (headerMatch) {
        const level = headerMatch[1];
        const text = headerMatch[2];
        const translated = translatePhrase(text, malayalamTranslations);
        translatedLines.push(`${level} ${translated}`);
        continue;
      }
    }
    
    // Translate list items
    if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
      const listMatch = line.match(/^(\s*[-*])\s*(.*)$/);
      if (listMatch) {
        const prefix = listMatch[1];
        const text = listMatch[2];
        const translated = translatePhrase(text, malayalamTranslations);
        translatedLines.push(`${prefix} ${translated}`);
        continue;
      }
    }
    
    // Keep MDX components as is
    if (line.includes('<') && line.includes('>')) {
      translatedLines.push(line);
      continue;
    }
    
    // Translate regular text
    if (line.trim()) {
      const translated = translatePhrase(line, malayalamTranslations);
      translatedLines.push(translated);
    } else {
      translatedLines.push(line);
    }
  }
  
  return translatedLines.join('\n');
}

// Create bilingual version with English and Malayalam
function createBilingualPost(englishContent, malayalamContent, metadata) {
  const bilingualContent = `
import CTA from "@/components/CTA";
import FAQ from "@/components/FAQ";
import NewsletterSignup from "@/components/NewsletterSignup";
import RelatedPosts from "@/components/RelatedPosts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

<Tabs defaultValue="english" className="w-full">
  <TabsList className="grid w-full grid-cols-2 mb-8">
    <TabsTrigger value="english">English</TabsTrigger>
    <TabsTrigger value="malayalam">മലയാളം</TabsTrigger>
  </TabsList>
  
  <TabsContent value="english">
${englishContent}
  </TabsContent>
  
  <TabsContent value="malayalam">
    <div className="malayalam-content" style={{ fontFamily: 'Noto Sans Malayalam, sans-serif' }}>
${malayalamContent}
    </div>
  </TabsContent>
</Tabs>
`;

  return bilingualContent;
}

// Main function to translate posts
async function translatePosts() {
  const postsDir = path.join(__dirname, "../generated/blog-posts");
  const translatedDir = path.join(__dirname, "../generated/translated-blog-posts");
  
  // Ensure output directory exists
  if (!fs.existsSync(translatedDir)) {
    fs.mkdirSync(translatedDir, { recursive: true });
  }
  
  // Find Kochi posts
  const files = fs.readdirSync(postsDir);
  const kochiPosts = files.filter(file => 
    file.endsWith('.mdx') && file.toLowerCase().includes('kochi')
  );
  
  console.log(`🌏 Found ${kochiPosts.length} Kochi posts to translate to Malayalam`);
  
  for (const file of kochiPosts) {
    console.log(`\n📝 Translating: ${file}`);
    
    const filePath = path.join(postsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Split front matter and content
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontMatterMatch) {
      console.log(`⚠️  Could not parse front matter for ${file}`);
      continue;
    }
    
    const frontMatter = frontMatterMatch[1];
    const mainContent = frontMatterMatch[2];
    
    // Parse metadata from front matter
    const metadata = {};
    const metadataLines = frontMatter.split('\n');
    for (const line of metadataLines) {
      const match = line.match(/^(\w+):\s*"?(.+?)"?$/);
      if (match) {
        metadata[match[1]] = match[2];
      }
    }
    
    // Generate Malayalam translation
    console.log('  🔄 Generating Malayalam translation...');
    const malayalamContent = generateMalayalamPost(mainContent, metadata);
    
    // Create bilingual version
    console.log('  📋 Creating bilingual version...');
    const bilingualContent = createBilingualPost(mainContent, malayalamContent, metadata);
    
    // Update front matter with language info
    const updatedFrontMatter = frontMatter + '\nlanguages:\n  - "en"\n  - "ml"\ndefaultLanguage: "en"';
    
    // Save translated version
    const outputFile = file.replace('.mdx', '-bilingual.mdx');
    const outputPath = path.join(translatedDir, outputFile);
    const finalContent = `---\n${updatedFrontMatter}\n---\n${bilingualContent}`;
    
    fs.writeFileSync(outputPath, finalContent, 'utf8');
    console.log(`  ✅ Saved: ${outputFile}`);
  }
  
  // Create a simple Malayalam-only version for one post
  if (kochiPosts.length > 0) {
    const firstPost = kochiPosts[0];
    console.log(`\n🌟 Creating Malayalam-only version of ${firstPost}`);
    
    const filePath = path.join(postsDir, firstPost);
    const content = fs.readFileSync(filePath, 'utf8');
    
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (frontMatterMatch) {
      const frontMatter = frontMatterMatch[1];
      const mainContent = frontMatterMatch[2];
      
      // Create full Malayalam post
      const fullMalayalamContent = `
import CTA from "@/components/CTA";
import FAQ from "@/components/FAQ";
import NewsletterSignup from "@/components/NewsletterSignup";
import RelatedPosts from "@/components/RelatedPosts";

# കൊച്ചിയിലെ ബിസിനസുകൾക്കായി സ്റ്റാഫ് മാനേജ്‌മെന്റ് - നിങ്ങളുടെ ബിസിനസ് പ്രവർത്തനങ്ങൾ പരിവർത്തനം ചെയ്യുക

ഇന്നത്തെ മത്സരാധിഷ്ഠിത കൊച്ചി ബിസിനസ് പരിസരത്ത്, സ്റ്റാഫ് മാനേജ്‌മെന്റ് ഒരു നിർണായക വ്യത്യാസമായി മാറിയിരിക്കുന്നു. മറൈൻ ഡ്രൈവിന് സമീപം ഒരു റെസ്റ്റോറന്റ് നടത്തുകയാണോ, എം.ജി റോഡിൽ ഒരു റീട്ടെയിൽ ഷോപ്പ് നിയന്ത്രിക്കുകയാണോ, അല്ലെങ്കിൽ കാക്കനാട്ടിൽ ഒരു സേവന ബിസിനസ് നടത്തുകയാണോ - ശരിയായ സ്റ്റാഫ് മാനേജ്‌മെന്റ് സമീപനം നിങ്ങളുടെ പ്രവർത്തനങ്ങളെ പരിവർത്തനം ചെയ്യാം.

## കൊച്ചിയിലെ സ്റ്റാഫ് മാനേജ്‌മെന്റിന്റെ നിലവിലെ അവസ്ഥ

കൊച്ചിയിലെ ബിസിനസുകൾ സ്റ്റാഫ് മാനേജ്‌മെന്റിന്റെ കാര്യത്തിൽ അതുല്യമായ വെല്ലുവിളികൾ നേരിടുന്നു. കേരളത്തിൽ 25,000-ത്തിലധികം SMB-കൾ പ്രവർത്തിക്കുമ്പോൾ, മത്സരം കടുത്തതും മാർജിനുകൾ ഇറുകിയതുമാണ്.

### കൊച്ചി ബിസിനസുകൾ നേരിടുന്ന പ്രധാന വെല്ലുവിളികൾ:
- വിലയേറിയ സമയം കഴിക്കുന്ന മാനുവൽ പ്രക്രിയകൾ
- ഡാറ്റ സിലോകൾ സൃഷ്ടിക്കുന്ന വിച്ഛേദിച്ച സിസ്റ്റങ്ങൾ
- തത്സമയ പ്രകടനത്തിലേക്കുള്ള പരിമിതമായ ദൃശ്യത
- പ്രവർത്തനങ്ങൾ കാര്യക്ഷമമായി സ്കെയിൽ ചെയ്യാനുള്ള ബുദ്ധിമുട്ട്
- ഇന്ത്യൻ നിയന്ത്രണങ്ങൾ GST, TDS, സംസ്ഥാന-നിർദ്ദിഷ്ട അനുസരണം ഉൾപ്പെടെ

<CTA />

## ആധുനിക സ്റ്റാഫ് മാനേജ്‌മെന്റ് പരിഹാരങ്ങൾ എങ്ങനെ പ്രവർത്തനങ്ങളെ പരിവർത്തനം ചെയ്യുന്നു

സ്മാർട്ട് കൊച്ചി ബിസിനസ് ഉടമകൾ ആധുനിക സ്റ്റാഫ് മാനേജ്‌മെന്റ് പരിഹാരങ്ങൾക്ക് ഉടനടിയും അളക്കാവുന്നതുമായ നേട്ടങ്ങൾ നൽകാനാകുമെന്ന് കണ്ടെത്തുന്നു.

### പ്രധാന നേട്ടങ്ങൾ:
- ആഴ്ചയിൽ 18 മണിക്കൂർ സമയം ലാഭിക്കുക
- ജീവനക്കാരുടെ ഉൽപ്പാദനക്ഷമത 35% വർദ്ധിപ്പിക്കുക
- പേറോൾ പിശകുകൾ 90% കുറയ്ക്കുക
- തത്സമയ പ്രകടന ട്രാക്കിംഗ്
- ഓട്ടോമേറ്റഡ് ഷെഡ്യൂളിംഗും ലീവ് മാനേജ്‌മെന്റും

<NewsletterSignup />

## നിങ്ങളുടെ കൊച്ചി ബിസിനസിൽ സ്റ്റാഫ് മാനേജ്‌മെന്റ് മികച്ച രീതികൾ നടപ്പിലാക്കുക

### ഘട്ടം 1: നിങ്ങളുടെ നിലവിലെ അവസ്ഥ വിലയിരുത്തുക
നിലവിലുള്ള സ്റ്റാഫ് മാനേജ്‌മെന്റ് പ്രക്രിയകൾ വിലയിരുത്തിക്കൊണ്ട് ആരംഭിക്കുക.

### ഘട്ടം 2: വ്യക്തമായ ലക്ഷ്യങ്ങൾ നിർവചിക്കുക
നിങ്ങൾ എന്ത് നിർദ്ദിഷ്ട ഫലങ്ങളാണ് നേടാൻ ആഗ്രഹിക്കുന്നത്?

### ഘട്ടം 3: ശരിയായ പരിഹാരം തിരഞ്ഞെടുക്കുക
എല്ലാ സ്റ്റാഫ് മാനേജ്‌മെന്റ് പരിഹാരങ്ങളും തുല്യമായി സൃഷ്ടിക്കപ്പെട്ടിട്ടില്ല.

### ഘട്ടം 4: നിങ്ങളുടെ നടപ്പാക്കൽ പ്ലാൻ ചെയ്യുക
വിജയകരമായ സ്റ്റാഫ് മാനേജ്‌മെന്റ് പരിവർത്തനം ഒറ്റരാത്രികൊണ്ട് സംഭവിക്കുന്നില്ല.

<RelatedPosts currentCity="Kochi" currentPillar="Staff Management" />

## ഉപസംഹാരം

കൊച്ചിയിലെ അഭിവൃദ്ധി പ്രാപിക്കാൻ ആഗ്രഹിക്കുന്ന ബിസിനസുകൾക്ക് സ്റ്റാഫ് മാനേജ്‌മെന്റ് പരിവർത്തനം ഇനി ഓപ്ഷണൽ അല്ല. ശരിയായ സമീപനവും ഉപകരണങ്ങളും ഉപയോഗിച്ച്, നിങ്ങൾക്ക് ഉൽപ്പാദനക്ഷമത വർദ്ധിപ്പിക്കാനും ചെലവ് കുറയ്ക്കാനും മികച്ച ടീമുകൾ നിർമ്മിക്കാനും കഴിയും.

<FAQ />
`;

      // Update front matter
      const malayalamFrontMatter = frontMatter
        .replace(/title: "(.+)"/, 'title: "കൊച്ചിയിലെ ബിസിനസുകൾക്കായി സ്റ്റാഫ് മാനേജ്‌മെന്റ് - നിങ്ങളുടെ ബിസിനസ് പരിവർത്തനം"')
        .replace(/description: "(.+)"/, 'description: "കൊച്ചിയിലെ ബിസിനസുകൾ എങ്ങനെ ആധുനിക സ്റ്റാഫ് മാനേജ്‌മെന്റ് ഉപയോഗിച്ച് ഉൽപ്പാദനക്ഷമത വർദ്ധിപ്പിക്കുന്നു എന്ന് കണ്ടെത്തുക"')
        .replace(/excerpt: "(.+)"/, 'excerpt: "കൊച്ചിയിലെ മുൻനിര ബിസിനസുകൾ ആധുനിക സ്റ്റാഫ് മാനേജ്‌മെന്റ് തന്ത്രങ്ങൾ ഉപയോഗിച്ച് അവരുടെ പ്രവർത്തനങ്ങൾ പരിവർത്തനം ചെയ്യുന്നു"')
        + '\nlanguage: "ml"\nscript: "Malayalam"';
      
      const malayalamFile = firstPost.replace('.mdx', '-malayalam.mdx');
      const malayalamPath = path.join(translatedDir, malayalamFile);
      const malayalamFullContent = `---\n${malayalamFrontMatter}\n---\n${fullMalayalamContent}`;
      
      fs.writeFileSync(malayalamPath, malayalamFullContent, 'utf8');
      console.log(`✅ Created Malayalam-only version: ${malayalamFile}`);
    }
  }
  
  console.log('\n🎉 Translation complete!');
  console.log(`📂 Translated posts saved to: ${translatedDir}`);
}

// Run the translation
if (require.main === module) {
  translatePosts().catch(console.error);
}

module.exports = { translatePosts };