# Test Checklist Verification Script

## Overview

The `verify-checklist.ts` script provides comprehensive verification of test coverage against the HERA Playbook System test checklist. It reads the CHECKLIST.md file, finds all test files, and generates detailed reports showing which checklist items have corresponding tests.

## Installation

From the playbooks/tests directory:

```bash
npm install
```

## Usage

### Basic Verification

```bash
npm run verify
# or directly:
./verify-checklist.ts
```

### Command Line Options

```bash
Options:
  -f, --format <format>      Output format: human or json (default: human)
  -o, --output <file>        Write output to file instead of console
  -s, --sections <sections>  Verify specific sections only (comma-separated)
  -v, --verbose              Show detailed information for each section
  -m, --show-missing         Show list of missing test files
  -u, --update-checklist     Update checklist with test execution status
  -b, --badge                Generate coverage badge
  --badge-output <file>      Write badge SVG to file
  -h, --help                 Show help message
```

### Examples

#### 1. Basic Human-Readable Report

```bash
npm run verify
```

#### 2. Verbose Report with Missing Tests

```bash
npm run verify:verbose
# or
./verify-checklist.ts -v -m
```

#### 3. Generate JSON Report

```bash
npm run verify:json
# or
./verify-checklist.ts -f json -o report.json
```

#### 4. Verify Specific Sections Only

```bash
./verify-checklist.ts -s 1,2,8 -v
```

This will only verify sections 1, 2, and 8 with verbose output.

#### 5. Update Checklist with Test Status

```bash
./verify-checklist.ts -u
```

This will:

- Mark items as checked [x] if their test files exist
- Add status comments showing test results (if available)

#### 6. CI/CD Integration

```bash
npm run verify:ci
# or
./verify-checklist.ts -f json -o coverage-report.json -b --badge-output coverage.svg
```

This generates both a JSON report and a coverage badge suitable for CI/CD pipelines.

## Output Formats

### Human-Readable Format (Default)

The default output includes:

- **Summary Statistics**: Total items, checked items, test coverage percentage
- **Coverage Bar**: Visual representation of test coverage
- **Section Breakdown**: Coverage details for each checklist section
- **Subsection Details** (with -v flag): Detailed coverage for each subsection
- **Missing Files** (with -m flag): List of test files referenced but not found
- **Recommendations**: Actionable suggestions based on coverage analysis

Example output:

```
═══════════════════════════════════════════════════════════════════
                    CHECKLIST VERIFICATION REPORT
═══════════════════════════════════════════════════════════════════

📊 SUMMARY
─────────────────────────────────────────────────────────────────
Total checklist items:     120
Items marked as done:      80 (67%)
Items with test files:     95 (79%)
Items missing tests:       25
Total test files found:    42
Timestamp:                 2024-01-15 10:30:00

Overall Coverage: ████████████████████████████████░░░░░░░░ 79%

📁 SECTION BREAKDOWN
─────────────────────────────────────────────────────────────────

1. Playbook Creation and Versioning
Coverage: ██████████████████████████████████████░░ 95%
  ├─ Total items: 20
  ├─ Checked: 18/20
  └─ With tests: 19/20
```

### JSON Format

The JSON output includes:

```json
{
  "summary": {
    "totalItems": 120,
    "checkedItems": 80,
    "itemsWithTests": 95,
    "itemsMissingTests": 25,
    "overallCoverage": 79,
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  "sections": [
    {
      "name": "1. Playbook Creation and Versioning",
      "coverage": 95,
      "totalItems": 20,
      "checkedItems": 18,
      "itemsWithTests": 19,
      "subsections": [...]
    }
  ],
  "testFiles": [
    {
      "name": "playbook-crud.test.ts",
      "exists": true,
      "testCases": 15,
      "passing": 14,
      "failing": 1,
      "pending": 0
    }
  ]
}
```

## Coverage Badge

The script can generate an SVG coverage badge suitable for README files or documentation:

```bash
./verify-checklist.ts -b --badge-output coverage.svg
```

The badge color changes based on coverage:

- 🟢 Green: 80% or higher
- 🟡 Yellow: 60-79%
- 🔴 Red: Below 60%

## Integration with Jest

The script can read Jest test results if available. To generate test results:

```bash
jest --json --outputFile=test-results.json
```

The verification script will automatically find and use these results to show pass/fail status.

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test Coverage Verification

on: [push, pull_request]

jobs:
  verify-coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd src/lib/playbooks/tests
          npm install

      - name: Run tests
        run: |
          cd src/lib/playbooks/tests
          npm run test:ci

      - name: Verify checklist coverage
        run: |
          cd src/lib/playbooks/tests
          npm run verify:ci

      - name: Upload coverage report
        uses: actions/upload-artifact@v3
        with:
          name: coverage-report
          path: |
            src/lib/playbooks/tests/coverage-report.json
            src/lib/playbooks/tests/coverage.svg

      - name: Comment PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('src/lib/playbooks/tests/coverage-report.json'));
            const coverage = report.summary.overallCoverage;
            const emoji = coverage >= 80 ? '✅' : coverage >= 60 ? '⚠️' : '❌';

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Test Checklist Coverage Report ${emoji}
              
              **Overall Coverage**: ${coverage}%
              - Total checklist items: ${report.summary.totalItems}
              - Items with tests: ${report.summary.itemsWithTests}
              - Items missing tests: ${report.summary.itemsMissingTests}
              
              See the full report in the workflow artifacts.`
            });
```

### Exit Codes

The script uses exit codes for CI/CD integration:

- `0`: Success (coverage >= 80%)
- `1`: Coverage below threshold
- `2`: Error during execution

## Best Practices

1. **Regular Verification**: Run the verification script regularly to track test coverage progress.

2. **Update Checklist**: Use the `-u` flag periodically to keep the checklist synchronized with actual test status.

3. **Focus on Critical Sections**: Priority sections like Security (8), Contract Enforcement (10), and Permissions (12) should maintain high coverage.

4. **CI Integration**: Include verification in your CI pipeline to prevent coverage regression.

5. **Badge Display**: Add the coverage badge to your README:
   ```markdown
   ![Test Coverage](./tests/coverage.svg)
   ```

## Troubleshooting

### Issue: Script can't find test files

**Solution**: Ensure you're running the script from the correct directory (`src/lib/playbooks/tests/`).

### Issue: Permission denied error

**Solution**: Make the script executable:

```bash
chmod +x verify-checklist.ts
```

### Issue: Module not found errors

**Solution**: Install dependencies:

```bash
npm install
```

## Advanced Usage

### Programmatic API

The verification script can be imported and used programmatically:

```typescript
import { ChecklistVerifier } from './verify-checklist'

const verifier = new ChecklistVerifier('./CHECKLIST.md', './tests')

const report = await verifier.verify({
  verbose: true,
  format: 'json'
})

console.log(`Coverage: ${report.overallCoverage}%`)
```

### Custom Reports

You can process the JSON output to create custom reports:

```bash
./verify-checklist.ts -f json | jq '.sections[] | select(.coverage < 80)'
```

This shows only sections with less than 80% coverage.

## Contributing

To improve the verification script:

1. Update test file references in CHECKLIST.md when adding new tests
2. Ensure test file names match those referenced in the checklist
3. Write descriptive test names that match checklist items
4. Keep the checklist organized and up-to-date

## Future Enhancements

Planned improvements:

- Integration with code coverage tools
- Historical coverage tracking
- Automated checklist generation from test files
- Integration with test execution frameworks
- Custom coverage thresholds per section
