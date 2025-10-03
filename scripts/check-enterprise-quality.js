#!/usr/bin/env node

/**
 * HERA Enterprise Quality Checker
 * Ensures all components meet enterprise-grade standards
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Enterprise quality standards
const QUALITY_STANDARDS = {
  spacing: {
    required: ['p-6', 'space-y-6', 'gap-3', 'gap-4', 'gap-6'],
    forbidden: ['p-1', 'p-2', 'space-y-1', 'space-y-2'],
    message: 'Use generous spacing: p-6 for padding, space-y-6 for sections'
  },
  
  textContrast: {
    required: ['!text-gray-100', '!text-gray-400', 'style={{ color:'],
    patterns: [
      /!text-gray-100/g,
      /!text-gray-400/g,
      /style=\{\{\s*color:/g
    ],
    message: 'Use high contrast text: !text-gray-100 for primary, !text-gray-400 for secondary'
  },
  
  interactiveStates: {
    required: ['hover:', 'focus:', 'transition'],
    message: 'All interactive elements need hover and focus states with transitions'
  },
  
  roleBasedFeatures: {
    required: ['userRole', 'roleGate', 'includes(userRole)'],
    message: 'Components should include role-based functionality'
  },
  
  responsiveness: {
    required: ['sm:', 'md:', 'lg:', 'xl:'],
    message: 'Components must be responsive with breakpoint classes'
  }
};

// Colors that should have proper contrast
const CONTRAST_REQUIREMENTS = {
  badges: {
    pattern: /<Badge[^>]*className="[^"]*"/g,
    shouldHave: ['style={{ color:', '!text-'],
    message: 'Badges need explicit color styling for contrast'
  },
  
  labels: {
    pattern: /<Label[^>]*>/g,
    shouldHave: ['!text-gray', 'style={{ color:'],
    message: 'Labels need high contrast text colors'
  }
};

class EnterpriseQualityChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
  }

  checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    console.log(`\n🔍 Checking ${fileName}...`);

    // Check spacing standards
    this.checkSpacing(content, fileName);
    
    // Check text contrast
    this.checkTextContrast(content, fileName);
    
    // Check interactive states
    this.checkInteractiveStates(content, fileName);
    
    // Check role-based features
    this.checkRoleBasedFeatures(content, fileName);
    
    // Check responsiveness
    this.checkResponsiveness(content, fileName);
    
    // Check contrast compliance
    this.checkContrastCompliance(content, fileName);
  }

  checkSpacing(content, fileName) {
    const { required, forbidden, message } = QUALITY_STANDARDS.spacing;
    
    // Check for forbidden cramped spacing
    for (const forbiddenClass of forbidden) {
      if (content.includes(forbiddenClass)) {
        this.warnings.push({
          file: fileName,
          type: 'spacing',
          message: `Found cramped spacing "${forbiddenClass}". ${message}`
        });
      }
    }
    
    // Check for required generous spacing
    const hasGenerousSpacing = required.some(cls => content.includes(cls));
    if (!hasGenerousSpacing) {
      this.warnings.push({
        file: fileName,
        type: 'spacing',
        message: `Missing generous spacing classes. ${message}`
      });
    } else {
      this.passed.push(`${fileName}: ✅ Generous spacing`);
    }
  }

  checkTextContrast(content, fileName) {
    const { patterns, message } = QUALITY_STANDARDS.textContrast;
    
    const hasContrastFixes = patterns.some(pattern => pattern.test(content));
    
    if (!hasContrastFixes) {
      this.warnings.push({
        file: fileName,
        type: 'textContrast',
        message: `Missing text contrast fixes. ${message}`
      });
    } else {
      this.passed.push(`${fileName}: ✅ Text contrast`);
    }
  }

  checkInteractiveStates(content, fileName) {
    const { required, message } = QUALITY_STANDARDS.interactiveStates;
    
    const hasInteractiveStates = required.every(state => content.includes(state));
    
    if (!hasInteractiveStates) {
      this.warnings.push({
        file: fileName,
        type: 'interactiveStates',
        message: `Missing interactive states. ${message}`
      });
    } else {
      this.passed.push(`${fileName}: ✅ Interactive states`);
    }
  }

  checkRoleBasedFeatures(content, fileName) {
    const { required, message } = QUALITY_STANDARDS.roleBasedFeatures;
    
    const hasRoleFeatures = required.some(feature => content.includes(feature));
    
    if (!hasRoleFeatures) {
      this.warnings.push({
        file: fileName,
        type: 'roleBasedFeatures',
        message: `Missing role-based features. ${message}`
      });
    } else {
      this.passed.push(`${fileName}: ✅ Role-based features`);
    }
  }

  checkResponsiveness(content, fileName) {
    const { required, message } = QUALITY_STANDARDS.responsiveness;
    
    const hasResponsive = required.some(breakpoint => content.includes(breakpoint));
    
    if (!hasResponsive) {
      this.warnings.push({
        file: fileName,
        type: 'responsiveness', 
        message: `Missing responsive classes. ${message}`
      });
    } else {
      this.passed.push(`${fileName}: ✅ Responsive design`);
    }
  }

  checkContrastCompliance(content, fileName) {
    for (const [element, config] of Object.entries(CONTRAST_REQUIREMENTS)) {
      const matches = content.match(config.pattern);
      
      if (matches) {
        const hasProperContrast = config.shouldHave.some(requirement => 
          content.includes(requirement)
        );
        
        if (!hasProperContrast) {
          this.errors.push({
            file: fileName,
            type: 'contrastCompliance',
            element,
            message: config.message
          });
        } else {
          this.passed.push(`${fileName}: ✅ ${element} contrast`);
        }
      }
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('🏆 HERA ENTERPRISE QUALITY REPORT');
    console.log('='.repeat(60));

    // Summary
    const totalChecks = this.passed.length + this.warnings.length + this.errors.length;
    const successRate = ((this.passed.length / totalChecks) * 100).toFixed(1);
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`   ✅ Passed: ${this.passed.length}`);
    console.log(`   ⚠️  Warnings: ${this.warnings.length}`);
    console.log(`   ❌ Errors: ${this.errors.length}`);
    console.log(`   📈 Success Rate: ${successRate}%`);

    // Quality grade
    let grade = 'F';
    if (successRate >= 95) grade = 'A+';
    else if (successRate >= 90) grade = 'A';
    else if (successRate >= 85) grade = 'B+';
    else if (successRate >= 80) grade = 'B';
    else if (successRate >= 75) grade = 'C';
    else if (successRate >= 70) grade = 'D';

    console.log(`   🎯 Quality Grade: ${grade}`);

    // Passed checks
    if (this.passed.length > 0) {
      console.log(`\n✅ PASSING ENTERPRISE STANDARDS:`);
      this.passed.forEach(pass => console.log(`   ${pass}`));
    }

    // Warnings
    if (this.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS (Recommendations):`);
      this.warnings.forEach(warning => {
        console.log(`   📁 ${warning.file}`);
        console.log(`   🔸 ${warning.type}: ${warning.message}`);
        console.log('');
      });
    }

    // Errors
    if (this.errors.length > 0) {
      console.log(`\n❌ ERRORS (Must Fix):`);
      this.errors.forEach(error => {
        console.log(`   📁 ${error.file}`);
        console.log(`   🔸 ${error.type}: ${error.message}`);
        console.log('');
      });
    }

    // Recommendations
    console.log(`\n🎯 ENTERPRISE RECOMMENDATIONS:`);
    console.log(`   1. Use generous spacing (p-6, space-y-6) for premium feel`);
    console.log(`   2. Apply high contrast text (!text-gray-100, !text-gray-400)`);
    console.log(`   3. Add smooth hover/focus states with transitions`);
    console.log(`   4. Include role-based functionality (userRole checks)`);
    console.log(`   5. Ensure mobile responsiveness (sm:, md:, lg: classes)`);
    console.log(`   6. Force colors with style={{}} for badge contrast`);

    // Exit code
    const exitCode = this.errors.length > 0 ? 1 : 0;
    
    if (exitCode === 0) {
      console.log(`\n🏆 ENTERPRISE QUALITY ACHIEVED! 🏆`);
      console.log(`   Ready for production deployment.`);
    } else {
      console.log(`\n⚠️  QUALITY ISSUES DETECTED`);
      console.log(`   Fix errors before deploying to production.`);
    }

    return exitCode;
  }
}

// Main execution
function main() {
  const checker = new EnterpriseQualityChecker();
  
  console.log('🚀 Starting HERA Enterprise Quality Check...');
  
  // Find all React component files
  const componentFiles = glob.sync('src/**/*.{tsx,jsx}', {
    ignore: [
      'node_modules/**',
      'dist/**',
      '**/*.test.*',
      '**/*.spec.*'
    ]
  });

  console.log(`📂 Found ${componentFiles.length} component files to check`);

  // Check each file
  componentFiles.forEach(file => {
    try {
      checker.checkFile(file);
    } catch (error) {
      console.error(`❌ Error checking ${file}:`, error.message);
    }
  });

  // Generate final report
  const exitCode = checker.generateReport();
  
  process.exit(exitCode);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { EnterpriseQualityChecker, QUALITY_STANDARDS };