/**
 * Pipeline Transactions Table
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronRight, 
  Factory, 
  Package, 
  TestTube, 
  Shield, 
  Rocket,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import type { UniversalTransaction, UniversalTransactionLine } from '@/lib/types/factory';
import { GuardrailBadge } from './GuardrailBadge';
import { ArtifactLinks } from './ArtifactLinks';
import { summarize, getOverallSeverity } from '@/lib/metrics/guardrail';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface TransactionsTableProps {
  transactions: UniversalTransaction[];
  transactionLines: Map<string, UniversalTransactionLine[]>;
  onCreateWaiver: (transactionId: string, policy: string, reason: string) => Promise<boolean>;
}

const stageIcons = {
  'FACTORY.PLAN': Factory,
  'FACTORY.DRAFT': Factory,
  'FACTORY.BUILD': Package,
  'FACTORY.TEST': TestTube,
  'FACTORY.COMPLY': Shield,
  'FACTORY.PACKAGE': Package,
  'FACTORY.RELEASE': Rocket,
};

const statusIcons = {
  pending: Clock,
  running: Clock,
  passed: CheckCircle,
  failed: XCircle,
  blocked: AlertTriangle,
};

export function TransactionsTable({ 
  transactions, 
  transactionLines, 
  onCreateWaiver 
}: TransactionsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [waiverDialog, setWaiverDialog] = useState<{
    open: boolean;
    transactionId: string;
    policy: string;
  }>({ open: false, transactionId: '', policy: '' });
  const [waiverReason, setWaiverReason] = useState('');

  const toggleRow = (txnId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(txnId)) {
      newExpanded.delete(txnId);
    } else {
      newExpanded.add(txnId);
    }
    setExpandedRows(newExpanded);
  };

  const handleWaiverSubmit = async () => {
    if (!waiverReason.trim()) return;
    
    const success = await onCreateWaiver(
      waiverDialog.transactionId,
      waiverDialog.policy,
      waiverReason
    );

    if (success) {
      setWaiverDialog({ open: false, transactionId: '', policy: '' });
      setWaiverReason('');
    }
  };

  // Group transactions by module
  const moduleGroups = new Map<string, UniversalTransaction[]>();
  transactions.forEach(txn => {
    const moduleCode = txn.smart_code;
    if (!moduleGroups.has(moduleCode)) {
      moduleGroups.set(moduleCode, []);
    }
    moduleGroups.get(moduleCode)!.push(txn);
  });

  return (
    <>
      <section aria-label="Pipeline Runs" className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pipeline Runs</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {transactions.length} transactions
          </span>
        </header>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Module / Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Started
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  AI Confidence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Guardrails
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Artifacts
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {transactions.map((txn) => {
                const Icon = stageIcons[txn.transaction_type] || Factory;
                const StatusIcon = statusIcons[txn.transaction_status];
                const lines = transactionLines.get(txn.id) || [];
                const guardrailResults = summarize(lines);
                const guardrailSeverity = getOverallSeverity(guardrailResults);
                const hasDetails = lines.length > 0;
                const isExpanded = expandedRows.has(txn.id);

                // Extract artifacts from lines
                const artifacts: any = {};
                lines.forEach(line => {
                  const lineArtifacts = line.metadata?.artifacts || line.line_data?.artifacts;
                  if (lineArtifacts) {
                    Object.assign(artifacts, lineArtifacts);
                  }
                });

                return (
                  <React.Fragment key={txn.id}>
                    <tr 
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${hasDetails ? 'cursor-pointer' : ''}`}
                      onClick={() => hasDetails && toggleRow(txn.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {hasDetails && (
                            <motion.div
                              animate={{ rotate: isExpanded ? 90 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            </motion.div>
                          )}
                          <Icon className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {txn.smart_code.split('.')[3]}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {txn.transaction_type}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`w-4 h-4 ${
                            txn.transaction_status === 'passed' ? 'text-green-500' :
                            txn.transaction_status === 'failed' ? 'text-red-500' :
                            txn.transaction_status === 'blocked' ? 'text-orange-500' :
                            txn.transaction_status === 'running' ? 'text-blue-500 animate-spin' :
                            'text-gray-400'
                          }`} />
                          <span className={`text-sm ${
                            txn.transaction_status === 'passed' ? 'text-green-700 dark:text-green-400' :
                            txn.transaction_status === 'failed' ? 'text-red-700 dark:text-red-400' :
                            txn.transaction_status === 'blocked' ? 'text-orange-700 dark:text-orange-400' :
                            'text-gray-700 dark:text-gray-300'
                          }`}>
                            {txn.transaction_status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(txn.transaction_date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {txn.ai_confidence && (
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${txn.ai_confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {(txn.ai_confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <GuardrailBadge level={guardrailSeverity} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ArtifactLinks artifacts={artifacts} />
                      </td>
                    </tr>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {isExpanded && hasDetails && (
                        <tr>
                          <td colSpan={6} className="px-0">
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="bg-gray-50 dark:bg-gray-900 border-y border-gray-200 dark:border-gray-700"
                            >
                              <div className="px-12 py-4 space-y-3">
                                {lines.map((line, idx) => (
                                  <div 
                                    key={line.id} 
                                    className="flex items-start justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
                                  >
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {line.line_type}
                                      </p>
                                      {line.metadata?.status && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                          Status: {line.metadata.status}
                                          {line.metadata.coverage && ` • Coverage: ${(line.metadata.coverage * 100).toFixed(1)}%`}
                                          {line.metadata.duration_ms && ` • Duration: ${line.metadata.duration_ms}ms`}
                                        </p>
                                      )}
                                      {line.metadata?.violations && line.metadata.violations.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                          {(line.metadata.violations as any[]).map((v, vIdx) => (
                                            <div key={vIdx} className="text-xs text-red-600 dark:text-red-400">
                                              • {v.message}
                                              {v.waivable !== false && (
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setWaiverDialog({
                                                      open: true,
                                                      transactionId: txn.id,
                                                      policy: v.policy
                                                    });
                                                  }}
                                                  className="ml-2 text-blue-600 dark:text-blue-400 hover:underline"
                                                >
                                                  Create waiver
                                                </button>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <div className="ml-4">
                                      <ArtifactLinks artifacts={line.metadata?.artifacts} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Waiver Dialog */}
      <Dialog open={waiverDialog.open} onOpenChange={(open) => 
        setWaiverDialog({ ...waiverDialog, open })
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Guardrail Waiver</DialogTitle>
            <DialogDescription>
              Provide a reason for waiving the {waiverDialog.policy} policy violation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Waiver Reason</Label>
              <Textarea
                id="reason"
                value={waiverReason}
                onChange={(e) => setWaiverReason(e.target.value)}
                placeholder="Explain why this violation should be waived..."
                className="mt-2"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setWaiverDialog({ open: false, transactionId: '', policy: '' })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleWaiverSubmit}
              disabled={!waiverReason.trim()}
            >
              Create Waiver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}