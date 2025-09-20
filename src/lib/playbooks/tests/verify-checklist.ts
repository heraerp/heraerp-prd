#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import minimist from 'minimist';

interface ChecklistItem {
  description: string;
  testFile: string;
  lineNumber: number;
  section: string;
  subsection: string;
  checked: boolean;
}

interface TestFile {
  path: string;
  exists: boolean;
  testCases: string[];
  passing?: number;
  failing?: number;
  pending?: number;
}

interface VerificationReport {
  totalItems: number;
  checkedItems: number;
  itemsWithTests: number;
  itemsMissingTests: number;
  testFiles: Map<string, TestFile>;
  sections: Map<string, SectionReport>;
  timestamp: string;
  overallCoverage: number;
}

interface SectionReport {
  name: string;
  totalItems: number;
  checkedItems: number;
  itemsWithTests: number;
  coverage: number;
  subsections: Map<string, SubsectionReport>;
}

interface SubsectionReport {
  name: string;
  totalItems: number;
  checkedItems: number;
  itemsWithTests: number;
  coverage: number;
  items: ChecklistItem[];
}

class ChecklistVerifier {
  private checklistPath: string;
  private baseTestPath: string;
  private checklistItems: ChecklistItem[] = [];
  private testFiles: Map<string, TestFile> = new Map();
  private sections: Map<string, SectionReport> = new Map();

  constructor(checklistPath: string, baseTestPath: string) {
    this.checklistPath = checklistPath;
    this.baseTestPath = baseTestPath;
  }

  async verify(options: VerifyOptions): Promise<VerificationReport> {
    console.log('🔍 Starting checklist verification...\n');

    // Parse checklist
    await this.parseChecklist();

    // Find all test files
    await this.findTestFiles();

    // Match checklist items with test files
    await this.matchTestsWithChecklist();

    // Generate report
    const report = this.generateReport();

    // Output results
    this.outputResults(report, options);

    // Update checklist if requested
    if (options.updateChecklist) {
      await this.updateChecklist();
    }

    return report;
  }

  private async parseChecklist(): Promise<void> {
    const content = fs.readFileSync(this.checklistPath, 'utf-8');
    const lines = content.split('\n');

    let currentSection = '';
    let currentSubsection = '';

    lines.forEach((line, index) => {
      // Parse sections (## N. Section Name)
      if (line.match(/^## \d+\./)) {
        currentSection = line.replace(/^## /, '').trim();
        this.sections.set(currentSection, {
          name: currentSection,
          totalItems: 0,
          checkedItems: 0,
          itemsWithTests: 0,
          coverage: 0,
          subsections: new Map()
        });
      }

      // Parse subsections (### N.N Subsection Name)
      if (line.match(/^### \d+\.\d+/)) {
        currentSubsection = line.replace(/^### /, '').trim();
        const section = this.sections.get(currentSection);
        if (section) {
          section.subsections.set(currentSubsection, {
            name: currentSubsection,
            totalItems: 0,
            checkedItems: 0,
            itemsWithTests: 0,
            coverage: 0,
            items: []
          });
        }
      }

      // Parse checklist items
      const itemMatch = line.match(/^- \[([ x])\] (.+)/);
      if (itemMatch) {
        const checked = itemMatch[1] === 'x';
        const description = itemMatch[2];

        // Look for test file reference on next line
        let testFile = '';
        if (index + 1 < lines.length) {
          const testFileMatch = lines[index + 1].match(/^\s*- Test file: `(.+)`/);
          if (testFileMatch) {
            testFile = testFileMatch[1];
          }
        }

        const item: ChecklistItem = {
          description,
          testFile,
          lineNumber: index + 1,
          section: currentSection,
          subsection: currentSubsection,
          checked
        };

        this.checklistItems.push(item);

        // Update section/subsection stats
        const section = this.sections.get(currentSection);
        if (section) {
          section.totalItems++;
          if (checked) section.checkedItems++;

          const subsection = section.subsections.get(currentSubsection);
          if (subsection) {
            subsection.totalItems++;
            if (checked) subsection.checkedItems++;
            subsection.items.push(item);
          }
        }
      }
    });

    console.log(`✅ Parsed ${this.checklistItems.length} checklist items from ${Object.keys(this.sections).length} sections\n`);
  }

  private async findTestFiles(): Promise<void> {
    const testPattern = path.join(this.baseTestPath, '**/*.test.ts');
    const testFiles = await glob(testPattern);

    for (const file of testFiles) {
      const relativePath = path.relative(this.baseTestPath, file);
      const testFile: TestFile = {
        path: relativePath,
        exists: true,
        testCases: await this.extractTestCases(file)
      };

      // Try to get test results if available
      const resultsPath = file.replace('.test.ts', '.test.results.json');
      if (fs.existsSync(resultsPath)) {
        try {
          const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
          testFile.passing = results.numPassedTests || 0;
          testFile.failing = results.numFailedTests || 0;
          testFile.pending = results.numPendingTests || 0;
        } catch (e) {
          // Ignore if can't parse results
        }
      }

      this.testFiles.set(path.basename(file), testFile);
    }

    console.log(`✅ Found ${this.testFiles.size} test files\n`);
  }

  private async extractTestCases(filePath: string): Promise<string[]> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const testCases: string[] = [];

    // Extract test descriptions (it(), test(), describe())
    const patterns = [
      /(?:it|test)\s*\(\s*['"`](.+?)['"`]/g,
      /describe\s*\(\s*['"`](.+?)['"`]/g
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        testCases.push(match[1]);
      }
    }

    return testCases;
  }

  private async matchTestsWithChecklist(): Promise<void> {
    let matched = 0;

    for (const item of this.checklistItems) {
      if (item.testFile) {
        const testFile = this.testFiles.get(item.testFile);
        if (testFile) {
          matched++;

          // Update section stats
          const section = this.sections.get(item.section);
          if (section) {
            section.itemsWithTests++;
            const subsection = section.subsections.get(item.subsection);
            if (subsection) {
              subsection.itemsWithTests++;
            }
          }
        }
      }
    }

    // Calculate coverage percentages
    for (const section of this.sections.values()) {
      section.coverage = section.totalItems > 0 
        ? Math.round((section.itemsWithTests / section.totalItems) * 100) 
        : 0;

      for (const subsection of section.subsections.values()) {
        subsection.coverage = subsection.totalItems > 0 
          ? Math.round((subsection.itemsWithTests / subsection.totalItems) * 100) 
          : 0;
      }
    }

    console.log(`✅ Matched ${matched} checklist items with test files\n`);
  }

  private generateReport(): VerificationReport {
    const totalItems = this.checklistItems.length;
    const checkedItems = this.checklistItems.filter(item => item.checked).length;
    const itemsWithTests = this.checklistItems.filter(item => 
      item.testFile && this.testFiles.has(item.testFile)
    ).length;
    const itemsMissingTests = totalItems - itemsWithTests;

    const overallCoverage = totalItems > 0 
      ? Math.round((itemsWithTests / totalItems) * 100) 
      : 0;

    return {
      totalItems,
      checkedItems,
      itemsWithTests,
      itemsMissingTests,
      testFiles: this.testFiles,
      sections: this.sections,
      timestamp: new Date().toISOString(),
      overallCoverage
    };
  }

  private outputResults(report: VerificationReport, options: VerifyOptions): void {
    if (options.format === 'json') {
      // JSON output
      const jsonReport = {
        summary: {
          totalItems: report.totalItems,
          checkedItems: report.checkedItems,
          itemsWithTests: report.itemsWithTests,
          itemsMissingTests: report.itemsMissingTests,
          overallCoverage: report.overallCoverage,
          timestamp: report.timestamp
        },
        sections: Array.from(report.sections.entries()).map(([name, section]) => ({
          name,
          coverage: section.coverage,
          totalItems: section.totalItems,
          checkedItems: section.checkedItems,
          itemsWithTests: section.itemsWithTests,
          subsections: Array.from(section.subsections.entries()).map(([subName, subsection]) => ({
            name: subName,
            coverage: subsection.coverage,
            totalItems: subsection.totalItems,
            checkedItems: subsection.checkedItems,
            itemsWithTests: subsection.itemsWithTests
          }))
        })),
        testFiles: Array.from(report.testFiles.entries()).map(([name, file]) => ({
          name,
          exists: file.exists,
          testCases: file.testCases.length,
          passing: file.passing,
          failing: file.failing,
          pending: file.pending
        }))
      };

      if (options.output) {
        fs.writeFileSync(options.output, JSON.stringify(jsonReport, null, 2));
        console.log(`📄 JSON report written to ${options.output}`);
      } else {
        console.log(JSON.stringify(jsonReport, null, 2));
      }
    } else {
      // Human-readable output
      console.log('═══════════════════════════════════════════════════════════════════');
      console.log('                    CHECKLIST VERIFICATION REPORT                   ');
      console.log('═══════════════════════════════════════════════════════════════════\n');

      console.log('📊 SUMMARY');
      console.log('─────────────────────────────────────────────────────────────────');
      console.log(`Total checklist items:     ${report.totalItems}`);
      console.log(`Items marked as done:      ${report.checkedItems} (${Math.round(report.checkedItems / report.totalItems * 100)}%)`);
      console.log(`Items with test files:     ${report.itemsWithTests} (${report.overallCoverage}%)`);
      console.log(`Items missing tests:       ${report.itemsMissingTests}`);
      console.log(`Total test files found:    ${report.testFiles.size}`);
      console.log(`Timestamp:                 ${new Date(report.timestamp).toLocaleString()}\n`);

      // Coverage bar
      this.printCoverageBar('Overall Coverage', report.overallCoverage);
      console.log('\n');

      console.log('📁 SECTION BREAKDOWN');
      console.log('─────────────────────────────────────────────────────────────────');

      let sectionIndex = 0;
      for (const [sectionName, section] of report.sections) {
        sectionIndex++;
        if (options.sections && !options.sections.includes(String(sectionIndex))) {
          continue;
        }

        console.log(`\n${sectionName}`);
        this.printCoverageBar('Coverage', section.coverage);
        console.log(`  ├─ Total items: ${section.totalItems}`);
        console.log(`  ├─ Checked: ${section.checkedItems}/${section.totalItems}`);
        console.log(`  └─ With tests: ${section.itemsWithTests}/${section.totalItems}`);

        if (options.verbose) {
          for (const [subName, subsection] of section.subsections) {
            console.log(`\n    ${subName}`);
            console.log(`      ├─ Coverage: ${subsection.coverage}%`);
            console.log(`      ├─ Items: ${subsection.totalItems}`);
            console.log(`      └─ With tests: ${subsection.itemsWithTests}`);

            if (options.showMissing && subsection.itemsWithTests < subsection.totalItems) {
              console.log('      Missing tests:');
              for (const item of subsection.items) {
                if (!item.testFile || !this.testFiles.has(item.testFile)) {
                  console.log(`        ❌ ${item.description}`);
                }
              }
            }
          }
        }
      }

      console.log('\n');

      if (options.showMissing) {
        console.log('❌ MISSING TEST FILES');
        console.log('─────────────────────────────────────────────────────────────────');
        const missingFiles = new Set<string>();
        for (const item of this.checklistItems) {
          if (item.testFile && !this.testFiles.has(item.testFile)) {
            missingFiles.add(item.testFile);
          }
        }
        for (const file of missingFiles) {
          console.log(`  - ${file}`);
        }
        console.log('\n');
      }

      // Coverage badge
      if (options.badge) {
        const badge = this.generateCoverageBadge(report.overallCoverage);
        if (options.badgeOutput) {
          fs.writeFileSync(options.badgeOutput, badge);
          console.log(`🏷️  Coverage badge written to ${options.badgeOutput}`);
        } else {
          console.log('🏷️  COVERAGE BADGE (SVG)');
          console.log('─────────────────────────────────────────────────────────────────');
          console.log(badge);
        }
      }

      // Summary recommendation
      console.log('\n📋 RECOMMENDATIONS');
      console.log('─────────────────────────────────────────────────────────────────');
      if (report.overallCoverage >= 80) {
        console.log('✅ Excellent test coverage! Keep up the good work.');
      } else if (report.overallCoverage >= 60) {
        console.log('⚠️  Good progress, but more tests needed to reach 80% coverage.');
      } else {
        console.log('❌ Low test coverage. Priority should be given to writing tests.');
      }

      const criticalSections = ['8. Organization Security (RLS)', '10. Contract Enforcement', '12. Security and Permissions'];
      for (const critical of criticalSections) {
        const section = Array.from(report.sections.values()).find(s => s.name.includes(critical.split('.')[1].trim()));
        if (section && section.coverage < 80) {
          console.log(`🚨 Critical section "${critical}" has low coverage (${section.coverage}%)`);
        }
      }
    }
  }

  private printCoverageBar(label: string, percentage: number): void {
    const width = 40;
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    
    let color = '\x1b[31m'; // red
    if (percentage >= 80) color = '\x1b[32m'; // green
    else if (percentage >= 60) color = '\x1b[33m'; // yellow

    const bar = color + '█'.repeat(filled) + '\x1b[90m' + '░'.repeat(empty) + '\x1b[0m';
    console.log(`${label}: ${bar} ${percentage}%`);
  }

  private generateCoverageBadge(coverage: number): string {
    let color = '#e05d44'; // red
    if (coverage >= 80) color = '#97ca00'; // green
    else if (coverage >= 60) color = '#dfb317'; // yellow

    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="114" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="a">
    <rect width="114" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#a)">
    <path fill="#555" d="M0 0h63v20H0z"/>
    <path fill="${color}" d="M63 0h51v20H63z"/>
    <path fill="url(#b)" d="M0 0h114v20H0z"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="110">
    <text x="325" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="530">coverage</text>
    <text x="325" y="140" transform="scale(.1)" textLength="530">coverage</text>
    <text x="875" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="410">${coverage}%</text>
    <text x="875" y="140" transform="scale(.1)" textLength="410">${coverage}%</text>
  </g>
</svg>`;
  }

  private async updateChecklist(): Promise<void> {
    console.log('\n📝 Updating checklist with test status...');
    
    const content = fs.readFileSync(this.checklistPath, 'utf-8');
    const lines = content.split('\n');
    const updatedLines = [...lines];

    for (const item of this.checklistItems) {
      if (item.testFile && this.testFiles.has(item.testFile)) {
        // Update checkbox to checked if test exists
        const lineIndex = item.lineNumber - 1;
        if (lineIndex >= 0 && lineIndex < updatedLines.length) {
          updatedLines[lineIndex] = updatedLines[lineIndex].replace(/^- \[ \]/, '- [x]');
        }

        // Add test status comment
        const testFile = this.testFiles.get(item.testFile)!;
        if (testFile.passing !== undefined && testFile.failing !== undefined) {
          const status = testFile.failing === 0 ? '✅' : '❌';
          const comment = ` <!-- ${status} ${testFile.passing}/${testFile.passing + testFile.failing} passing -->`;
          
          const testLineIndex = item.lineNumber;
          if (testLineIndex >= 0 && testLineIndex < updatedLines.length) {
            updatedLines[testLineIndex] = updatedLines[testLineIndex].replace(/ <!-- .+ -->$/, '') + comment;
          }
        }
      }
    }

    fs.writeFileSync(this.checklistPath, updatedLines.join('\n'));
    console.log('✅ Checklist updated successfully');
  }
}

interface VerifyOptions {
  format?: 'human' | 'json';
  output?: string;
  sections?: string[];
  verbose?: boolean;
  showMissing?: boolean;
  updateChecklist?: boolean;
  badge?: boolean;
  badgeOutput?: string;
}

async function main() {
  const argv = minimist(process.argv.slice(2), {
    string: ['format', 'output', 'sections', 'badge-output'],
    boolean: ['verbose', 'show-missing', 'update-checklist', 'badge', 'help'],
    alias: {
      f: 'format',
      o: 'output',
      s: 'sections',
      v: 'verbose',
      m: 'show-missing',
      u: 'update-checklist',
      b: 'badge',
      h: 'help'
    },
    default: {
      format: 'human',
      verbose: false,
      'show-missing': false,
      'update-checklist': false,
      badge: false
    }
  });

  if (argv.help) {
    console.log(`
HERA Playbook Test Checklist Verifier

Usage: verify-checklist.ts [options]

Options:
  -f, --format <format>      Output format: human or json (default: human)
  -o, --output <file>        Write output to file instead of console
  -s, --sections <sections>  Verify specific sections only (comma-separated)
  -v, --verbose              Show detailed information for each section
  -m, --show-missing         Show list of missing test files
  -u, --update-checklist     Update checklist with test execution status
  -b, --badge                Generate coverage badge
  --badge-output <file>      Write badge SVG to file
  -h, --help                 Show this help message

Examples:
  # Basic verification
  ./verify-checklist.ts

  # Verbose output with missing tests
  ./verify-checklist.ts -v -m

  # Generate JSON report
  ./verify-checklist.ts -f json -o report.json

  # Verify specific sections only
  ./verify-checklist.ts -s 1,2,8 -v

  # Update checklist and generate badge
  ./verify-checklist.ts -u -b --badge-output coverage.svg

  # Run as part of CI/CD
  ./verify-checklist.ts -f json -o coverage-report.json -b --badge-output badge.svg
    `);
    process.exit(0);
  }

  const checklistPath = path.join(__dirname, 'CHECKLIST.md');
  const baseTestPath = __dirname;

  const verifier = new ChecklistVerifier(checklistPath, baseTestPath);

  const options: VerifyOptions = {
    format: argv.format as 'human' | 'json',
    output: argv.output,
    sections: argv.sections ? argv.sections.split(',').map((s: string) => s.trim()) : undefined,
    verbose: argv.verbose,
    showMissing: argv['show-missing'],
    updateChecklist: argv['update-checklist'],
    badge: argv.badge,
    badgeOutput: argv['badge-output']
  };

  try {
    const report = await verifier.verify(options);
    
    // Exit with appropriate code for CI/CD
    if (report.overallCoverage < 80) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error during verification:', error);
    process.exit(2);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

// Export for programmatic use
export { ChecklistVerifier, VerificationReport, VerifyOptions };