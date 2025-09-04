#!/usr/bin/env ts-node

/**
 * HERA DNA Linter
 * Enforces sacred principles at the code level
 */

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

const CONFIG = require('../hera.dna.json');

interface LintViolation {
  file: string;
  line: number;
  column: number;
  rule: string;
  message: string;
  severity: 'error' | 'warning';
}

class DNALinter {
  private violations: LintViolation[] = [];

  async lintProject(projectRoot: string): Promise<LintViolation[]> {
    console.log('🧬 HERA DNA Linter starting...');
    
    // Find all TypeScript files
    const files = glob.sync('**/*.{ts,tsx}', {
      cwd: projectRoot,
      ignore: ['node_modules/**', 'dist/**', '.next/**']
    });

    for (const file of files) {
      await this.lintFile(path.join(projectRoot, file));
    }

    return this.violations;
  }

  private async lintFile(filePath: string): Promise<void> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // Check compile-time gates
    CONFIG.dna.gates.compile.rules.forEach((rule: any) => {
      const regex = new RegExp(rule.pattern, 'gm');
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        const line = content.substring(0, match.index).split('\n').length;
        const column = match.index - content.lastIndexOf('\n', match.index) - 1;
        
        this.violations.push({
          file: filePath,
          line,
          column,
          rule: rule.name,
          message: rule.description,
          severity: rule.severity
        });
      }
    });

    // Check for direct database access
    this.checkDirectDatabaseAccess(filePath, lines);
    
    // Check for status columns
    this.checkStatusColumns(filePath, lines);
    
    // Check for smart code usage
    this.checkSmartCodeUsage(filePath, lines);
    
    // Check for organization ID
    this.checkOrganizationId(filePath, lines);
  }

  private checkDirectDatabaseAccess(file: string, lines: string[]): void {
    lines.forEach((line, index) => {
      // Check for Supabase client usage
      if (line.includes('supabase.from(') || line.includes('supabase.rpc(')) {
        this.violations.push({
          file,
          line: index + 1,
          column: 0,
          rule: 'no-direct-db-access',
          message: 'Direct database access detected. Use HERA DNA SDK instead.',
          severity: 'error'
        });
      }

      // Check for raw SQL
      if (line.match(/\.(sql|raw)\(/)) {
        this.violations.push({
          file,
          line: index + 1,
          column: 0,
          rule: 'no-raw-sql',
          message: 'Raw SQL query detected. Use HERA DNA SDK instead.',
          severity: 'error'
        });
      }
    });
  }

  private checkStatusColumns(file: string, lines: string[]): void {
    lines.forEach((line, index) => {
      // Check for status field definitions
      if (line.match(/status\s*[:=]\s*['"]/) && !line.includes('workflow_status')) {
        this.violations.push({
          file,
          line: index + 1,
          column: 0,
          rule: 'no-status-columns',
          message: 'Status column detected. Use relationships for status workflows.',
          severity: 'error'
        });
      }
    });
  }

  private checkSmartCodeUsage(file: string, lines: string[]): void {
    lines.forEach((line, index) => {
      // Check for entity/transaction creation without smart codes
      if (line.match(/create(Entity|Transaction)/) && !lines.slice(index - 5, index + 5).some(l => l.includes('smart_code'))) {
        this.violations.push({
          file,
          line: index + 1,
          column: 0,
          rule: 'require-smart-codes',
          message: 'Entity/Transaction creation without smart code detected.',
          severity: 'error'
        });
      }
    });
  }

  private checkOrganizationId(file: string, lines: string[]): void {
    lines.forEach((line, index) => {
      // Check for queries without organization_id
      if (line.match(/\.where\(/) && !lines.slice(index - 2, index + 2).some(l => l.includes('organization_id'))) {
        this.violations.push({
          file,
          line: index + 1,
          column: 0,
          rule: 'require-org-isolation',
          message: 'Query without organization_id filter detected.',
          severity: 'error'
        });
      }
    });
  }

  printReport(): void {
    if (this.violations.length === 0) {
      console.log('✅ No DNA violations found!');
      return;
    }

    console.log(`\n❌ Found ${this.violations.length} DNA violations:\n`);

    const byFile = this.violations.reduce((acc, violation) => {
      if (!acc[violation.file]) {
        acc[violation.file] = [];
      }
      acc[violation.file].push(violation);
      return acc;
    }, {} as Record<string, LintViolation[]>);

    Object.entries(byFile).forEach(([file, violations]) => {
      console.log(`📄 ${file}`);
      violations.forEach(v => {
        const icon = v.severity === 'error' ? '🔴' : '⚠️';
        console.log(`  ${icon} Line ${v.line}: ${v.message} (${v.rule})`);
      });
      console.log('');
    });

    const errorCount = this.violations.filter(v => v.severity === 'error').length;
    if (errorCount > 0) {
      console.log(`\n💀 ${errorCount} errors must be fixed before proceeding.`);
      process.exit(1);
    }
  }
}

// Run the linter
const linter = new DNALinter();
const projectRoot = path.join(__dirname, '..', '..', '..');

linter.lintProject(projectRoot).then(() => {
  linter.printReport();
}).catch(error => {
  console.error('Linter failed:', error);
  process.exit(1);
});