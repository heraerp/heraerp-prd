/**
 * KPI calculation functions for Factory Dashboard
 */

import type { UniversalTransaction, UniversalTransactionLine, FiscalPeriod } from '../types/factory';

export function leadTimeDays(txns: UniversalTransaction[]): number {
  if (!txns || txns.length === 0) return 0;

  // Find paired PLAN and RELEASE transactions for same module
  const moduleGroups = new Map<string, UniversalTransaction[]>();
  
  txns.forEach(txn => {
    const moduleCode = txn.smart_code;
    if (!moduleGroups.has(moduleCode)) {
      moduleGroups.set(moduleCode, []);
    }
    moduleGroups.get(moduleCode)!.push(txn);
  });

  let totalLeadTime = 0;
  let completedPipelines = 0;

  moduleGroups.forEach((moduleTxns) => {
    const planTxn = moduleTxns.find(t => t.transaction_type === 'FACTORY.PLAN');
    const releaseTxn = moduleTxns.find(t => t.transaction_type === 'FACTORY.RELEASE');

    if (planTxn && releaseTxn) {
      const planDate = new Date(planTxn.transaction_date);
      const releaseDate = new Date(releaseTxn.transaction_date);
      const leadTime = (releaseDate.getTime() - planDate.getTime()) / (1000 * 60 * 60 * 24);
      totalLeadTime += leadTime;
      completedPipelines++;
    }
  });

  return completedPipelines > 0 ? Math.round(totalLeadTime / completedPipelines * 10) / 10 : 0;
}

export function coverageAvg(lines: UniversalTransactionLine[]): number {
  if (!lines || lines.length === 0) return 0;

  const coverageLines = lines.filter(line => 
    line.line_type === 'STEP.UNIT' || 
    line.line_type === 'STEP.E2E' || 
    line.line_type === 'STEP.INTEGRATION'
  );

  if (coverageLines.length === 0) return 0;

  const totalCoverage = coverageLines.reduce((sum, line) => {
    const coverage = line.metadata?.coverage || line.line_data?.coverage;
    return sum + (typeof coverage === 'number' ? coverage : 0);
  }, 0);

  return Math.round((totalCoverage / coverageLines.length) * 1000) / 10; // Return as percentage
}

export function guardrailPassRate(lines: UniversalTransactionLine[]): number {
  if (!lines || lines.length === 0) return 100;

  const guardrailLines = lines.filter(line => 
    line.line_type?.startsWith('STEP.COMPLIANCE') || 
    line.line_type === 'STEP.SECURITY' ||
    line.line_type === 'STEP.CONTRACT'
  );

  if (guardrailLines.length === 0) return 100;

  const passedLines = guardrailLines.filter(line => {
    const status = line.metadata?.status || line.line_data?.status;
    return status === 'PASSED' || status === 'WAIVED';
  });

  return Math.round((passedLines.length / guardrailLines.length) * 1000) / 10;
}

export function auditReady(lines: UniversalTransactionLine[]): boolean {
  if (!lines || lines.length === 0) return false;

  // Check for SBOM and attestation artifacts within last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const hasRecentSBOM = lines.some(line => {
    const artifacts = line.metadata?.artifacts || line.line_data?.artifacts;
    const createdAt = new Date(line.created_at || '');
    return artifacts?.sbom && createdAt > thirtyDaysAgo;
  });

  const hasRecentAttestation = lines.some(line => {
    const lineType = line.line_type;
    const createdAt = new Date(line.created_at || '');
    return lineType === 'STEP.ATTESTATION' && createdAt > thirtyDaysAgo;
  });

  return hasRecentSBOM && hasRecentAttestation;
}

export function fiscalAligned(periods: FiscalPeriod[]): boolean {
  if (!periods || periods.length === 0) return true; // No fiscal periods means no constraints

  // Check if there's an open or current fiscal period
  const hasOpenPeriod = periods.some(period => 
    period.metadata?.status === 'open' || 
    period.metadata?.status === 'current'
  );

  return hasOpenPeriod;
}

export function calculateModuleKPIs(
  moduleTxns: UniversalTransaction[],
  moduleLines: UniversalTransactionLine[],
  fiscalPeriods: FiscalPeriod[]
): KPISet {
  return {
    leadTimeDays: leadTimeDays(moduleTxns),
    coverageAvg: coverageAvg(moduleLines),
    guardrailPassRate: guardrailPassRate(moduleLines),
    auditReady: auditReady(moduleLines),
    fiscalAligned: fiscalAligned(fiscalPeriods)
  };
}