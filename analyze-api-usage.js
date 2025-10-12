#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 HERA API Usage Analysis Tool');
console.log('================================\n');

// Define API categories
const apiCategories = {
  v1: [],
  v2: [],
  v3: [],
  universal: [],
  salon: [],
  admin: [],
  deprecated: []
};

// Get all API routes
function getAllApiRoutes() {
  try {
    const output = execSync('find src/app/api -name "route.ts" | sort', { encoding: 'utf-8' });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error finding API routes:', error.message);
    return [];
  }
}

// Categorize API routes
function categorizeRoutes(routes) {
  routes.forEach(route => {
    const routePath = route.replace('src/app/api/', '').replace('/route.ts', '');
    
    if (routePath.startsWith('v1/')) {
      apiCategories.V1.push(route);
    } else if (routePath.startsWith('v2/')) {
      apiCategories.v2.push(route);
    } else if (routePath.startsWith('v3/')) {
      apiCategories.v3.push(route);
    } else if (routePath.startsWith('universal/')) {
      apiCategories.universal.push(route);
    } else if (routePath.startsWith('salon/')) {
      apiCategories.salon.push(route);
    } else if (routePath.startsWith('admin/')) {
      apiCategories.admin.push(route);
    } else {
      apiCategories.deprecated.push(route);
    }
  });
}

// Check if an API is used in the codebase
function checkApiUsage(apiPath) {
  const endpoint = apiPath.replace('src/app/api', '/api').replace('/route.ts', '');
  
  try {
    // Search in TypeScript/React files
    const result = execSync(`find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "${endpoint}" 2>/dev/null || true`, { encoding: 'utf-8' });
    const files = result.trim().split('\n').filter(Boolean);
    
    return {
      used: files.length > 0,
      files: files,
      count: files.length
    };
  } catch (error) {
    return { used: false, files: [], count: 0 };
  }
}

// Analyze API routes
function analyzeApiRoutes() {
  const routes = getAllApiRoutes();
  console.log(`📊 Found ${routes.length} API routes\n`);
  
  categorizeRoutes(routes);
  
  const analysis = {
    total: routes.length,
    categories: {},
    unused: [],
    deprecated: [],
    recommendations: []
  };
  
  // Analyze each category
  Object.entries(apiCategories).forEach(([category, routes]) => {
    console.log(`\n🔍 Analyzing ${category.toUpperCase()} APIs (${routes.length} routes):`);
    
    const categoryAnalysis = {
      total: routes.length,
      used: 0,
      unused: [],
      usageDetails: []
    };
    
    routes.forEach(route => {
      const usage = checkApiUsage(route);
      const endpoint = route.replace('src/app/api', '/api').replace('/route.ts', '');
      
      if (usage.used) {
        categoryAnalysis.used++;
        categoryAnalysis.usageDetails.push({
          endpoint,
          route,
          files: usage.files,
          count: usage.count
        });
        console.log(`  ✅ ${endpoint} (used in ${usage.count} files)`);
      } else {
        categoryAnalysis.unused.push({ endpoint, route });
        analysis.unused.push({ endpoint, route, category });
        console.log(`  ❌ ${endpoint} (UNUSED)`);
      }
    });
    
    analysis.categories[category] = categoryAnalysis;
    console.log(`  📈 Usage: ${categoryAnalysis.used}/${categoryAnalysis.total} (${Math.round(categoryAnalysis.used/categoryAnalysis.total*100)}%)`);
  });
  
  return analysis;
}

// Generate recommendations
function generateRecommendations(analysis) {
  const recommendations = [];
  
  // V1 API recommendations
  if (analysis.categories.V1.unused.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      action: 'REMOVE_V1_UNUSED',
      description: `Remove ${analysis.categories.V1.unused.length} unused V1 APIs - they should be migrated to V2`,
      routes: analysis.categories.V1.unused
    });
  }
  
  // Universal API recommendations
  if (analysis.categories.universal.unused.length > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      action: 'REMOVE_UNIVERSAL_UNUSED',
      description: `Remove ${analysis.categories.universal.unused.length} unused universal APIs - redundant with V2`,
      routes: analysis.categories.universal.unused
    });
  }
  
  // Deprecated APIs
  if (analysis.categories.deprecated.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      action: 'REMOVE_DEPRECATED',
      description: `Remove ${analysis.categories.deprecated.length} deprecated APIs without version prefix`,
      routes: analysis.categories.deprecated.map(route => ({ 
        route, 
        endpoint: route.replace('src/app/api', '/api').replace('/route.ts', '') 
      }))
    });
  }
  
  // Admin APIs
  if (analysis.categories.admin.unused.length > 0) {
    recommendations.push({
      priority: 'LOW',
      action: 'REVIEW_ADMIN_UNUSED',
      description: `Review ${analysis.categories.admin.unused.length} unused admin APIs - may be dev tools`,
      routes: analysis.categories.admin.unused
    });
  }
  
  return recommendations;
}

// Generate cleanup script
function generateCleanupScript(recommendations) {
  let script = `#!/bin/bash\n\n# HERA API Cleanup Script - Generated Analysis\n# WARNING: Review each deletion carefully before running!\n\necho "🧹 Starting HERA API Cleanup..."\n\n`;
  
  recommendations.forEach(rec => {
    script += `\n# ${rec.action}: ${rec.description}\n`;
    script += `echo "📋 ${rec.description}"\n`;
    
    if (rec.priority === 'HIGH') {
      script += `# SAFE TO DELETE - High Priority\n`;
      rec.routes.forEach(item => {
        script += `rm -f "${item.route}"\n`;
      });
    } else {
      script += `# REVIEW REQUIRED - ${rec.priority} Priority\n`;
      rec.routes.forEach(item => {
        script += `# rm -f "${item.route}"  # Review: ${item.endpoint}\n`;
      });
    }
  });
  
  script += `\necho "✅ API cleanup complete!"\n`;
  return script;
}

// Main execution
async function main() {
  try {
    const analysis = analyzeApiRoutes();
    const recommendations = generateRecommendations(analysis);
    
    console.log('\n📋 ANALYSIS SUMMARY:');
    console.log('==================');
    console.log(`Total APIs: ${analysis.total}`);
    console.log(`Unused APIs: ${analysis.unused.length}`);
    console.log(`Cleanup Opportunities: ${recommendations.length}`);
    
    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('==================');
    recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. [${rec.priority}] ${rec.description}`);
    });
    
    // Generate cleanup script
    const cleanupScript = generateCleanupScript(recommendations);
    fs.writeFileSync('cleanup-apis.sh', cleanupScript);
    console.log('\n📜 Generated cleanup-apis.sh script');
    
    // Generate detailed report
    const report = {
      analysis,
      recommendations,
      timestamp: new Date().toISOString()
    };
    fs.writeFileSync('api-analysis-report.json', JSON.stringify(report, null, 2));
    console.log('📊 Generated api-analysis-report.json');
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Review the generated cleanup-apis.sh script');
    console.log('2. Test that unused APIs are truly unused');
    console.log('3. Run the cleanup script to remove safe deletions');
    console.log('4. Manually review medium/low priority items');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  }
}

main();