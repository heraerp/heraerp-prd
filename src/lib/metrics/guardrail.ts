/**
 * Guardrail evaluation and summarization
 */

import type { UniversalTransactionLine, GuardrailResult } from '../types/factory';

export type Severity = 'error' | 'warn' | 'info';

export function summarize(lines: UniversalTransactionLine[]): GuardrailResult[] {
  const results: GuardrailResult[] = [];

  lines.forEach(line => {
    // Check compliance lines
    if (line.line_type?.startsWith('STEP.COMPLIANCE') || line.line_type === 'STEP.SECURITY') {
      const status = line.metadata?.status || line.line_data?.status;
      const violations = line.metadata?.violations || line.line_data?.violations || [];
      
      if (status === 'FAILED' || status === 'BLOCKED') {
        violations.forEach((violation: any) => {
          results.push({
            severity: 'error',
            message: violation.message || `${line.line_type} failed`,
            policy: violation.policy || line.line_type,
            canWaive: violation.waivable !== false
          });
        });
      } else if (status === 'WARNING') {
        results.push({
          severity: 'warn',
          message: `${line.line_type} has warnings`,
          policy: line.line_type,
          canWaive: true
        });
      }
    }

    // Check test coverage thresholds
    if (line.line_type === 'STEP.UNIT' || line.line_type === 'STEP.E2E') {
      const coverage = line.metadata?.coverage || line.line_data?.coverage || 0;
      const threshold = line.metadata?.threshold || 0.8;
      
      if (coverage < threshold) {
        results.push({
          severity: coverage < threshold * 0.8 ? 'error' : 'warn',
          message: `Coverage ${(coverage * 100).toFixed(1)}% below threshold ${(threshold * 100)}%`,
          policy: 'COVERAGE_THRESHOLD',
          canWaive: coverage >= threshold * 0.7
        });
      }
    }

    // Check security vulnerabilities
    if (line.line_type === 'STEP.SECURITY') {
      const vulns = line.metadata?.vulnerabilities || line.line_data?.vulnerabilities || {};
      
      if (vulns.critical > 0) {
        results.push({
          severity: 'error',
          message: `${vulns.critical} critical security vulnerabilities detected`,
          policy: 'SECURITY_CRITICAL',
          canWaive: false
        });
      } else if (vulns.high > 0) {
        results.push({
          severity: 'warn',
          message: `${vulns.high} high security vulnerabilities detected`,
          policy: 'SECURITY_HIGH',
          canWaive: true
        });
      }
    }
  });

  // Check for waivers
  const waiverLines = lines.filter(l => l.line_type === 'WAIVER');
  waiverLines.forEach(waiver => {
    const waivedPolicy = waiver.metadata?.policy || waiver.line_data?.policy;
    const waiverReason = waiver.metadata?.reason || waiver.line_data?.reason;
    
    // Mark waived violations
    results.forEach(result => {
      if (result.policy === waivedPolicy) {
        result.severity = 'info';
        result.message += ` (Waived: ${waiverReason})`;
      }
    });
  });

  return results;
}

export function getOverallSeverity(results: GuardrailResult[]): Severity | 'ok' {
  if (results.length === 0) return 'ok';
  
  const hasError = results.some(r => r.severity === 'error');
  if (hasError) return 'error';
  
  const hasWarn = results.some(r => r.severity === 'warn');
  if (hasWarn) return 'warn';
  
  const hasInfo = results.some(r => r.severity === 'info');
  if (hasInfo) return 'info';
  
  return 'ok';
}

export function canPromoteToChannel(
  channel: 'beta' | 'stable' | 'LTS',
  guardrailResults: GuardrailResult[]
): { allowed: boolean; blockers: string[] } {
  const blockers: string[] = [];

  // Channel-specific requirements
  const requirements = {
    beta: {
      allowErrors: false,
      allowWarnings: true
    },
    stable: {
      allowErrors: false,
      allowWarnings: false
    },
    LTS: {
      allowErrors: false,
      allowWarnings: false,
      requireAudit: true
    }
  };

  const req = requirements[channel];
  
  guardrailResults.forEach(result => {
    if (result.severity === 'error' && !req.allowErrors) {
      blockers.push(result.message);
    }
    if (result.severity === 'warn' && !req.allowWarnings) {
      blockers.push(result.message);
    }
  });

  return {
    allowed: blockers.length === 0,
    blockers
  };
}