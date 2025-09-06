/**
 * HERA Factory Dashboard Main Component - Fixed Version
 */

import React, { useState } from 'react';
import { KpiCards } from './KpiCards';
import { TransactionsTable } from './TransactionsTable';
import { DependencyGraph } from './DependencyGraph';
import { useFactoryDashboard } from '@/lib/hooks/use-factory-dashboard-fixed';
import { motion } from 'framer-motion';
import { Factory, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FactoryDashboardFixed() {
  const { filters, data, actions } = useFactoryDashboard();
  const { 
    transactions, 
    modules, 
    relationships, 
    fiscalPeriods, 
    transactionLines, 
    kpis, 
    loading, 
    error 
  } = data;

  // Local state for channel filter to avoid infinite updates
  const [channelFilter, setChannelFilter] = useState(filters.channel || 'all');

  const handleChannelChange = (value: string) => {
    setChannelFilter(value);
    actions.updateFilters({ channel: value === 'all' ? undefined : value });
  };

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 dark:text-red-400">Error loading dashboard: {error.message}</p>
        <Button onClick={actions.refresh} className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                <Factory className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  HERA Universal Factory
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Pipeline Monitor • {filters.organization_id}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Channel Filter - Simple Dropdown */}
              <div className="relative">
                <select
                  value={channelFilter}
                  onChange={(e) => handleChannelChange(e.target.value)}
                  className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Channels</option>
                  <option value="beta">Beta</option>
                  <option value="stable">Stable</option>
                  <option value="LTS">LTS</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>

              {/* Date Range */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Last 30 days</span>
              </div>

              {/* Refresh */}
              <Button
                variant="outline"
                size="sm"
                onClick={actions.refresh}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* KPIs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <KpiCards kpis={kpis} />
        </motion.div>

        {/* Pipeline Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <TransactionsTable 
            transactions={transactions}
            transactionLines={transactionLines}
            onCreateWaiver={actions.createWaiver}
          />
        </motion.div>

        {/* Dependency Graph */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <DependencyGraph 
            modules={modules}
            relationships={relationships}
          />
        </motion.div>

        {/* Fiscal Period Warning */}
        {fiscalPeriods.some(p => p.metadata?.status === 'closed') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4"
          >
            <p className="text-sm text-orange-700 dark:text-orange-300">
              ⚠️ Fiscal period is closed. Module promotions to stable/LTS channels are blocked.
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}