'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { Brain, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PredictiveAnalyticsProps {
  organizationId: string;
}

export function PredictiveAnalytics({ organizationId }: PredictiveAnalyticsProps) {
  // Generate predicted wealth trajectory
  const generatePrediction = () => {
    const months = 24;
    const currentWealth = 100000000; // $100M
    const data = [];
    
    // Historical data (past 12 months)
    for (let i = -12; i <= 0; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      const value = currentWealth * (1 + (i * 0.008)); // 0.8% monthly growth
      data.push({
        date: date.toISOString(),
        actual: value,
        predicted: null,
        optimistic: null,
        conservative: null,
        isHistorical: true
      });
    }
    
    // Future predictions
    for (let i = 1; i <= months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      const baseGrowth = 0.01; // 1% monthly
      const predicted = currentWealth * Math.pow(1 + baseGrowth, i);
      const optimistic = currentWealth * Math.pow(1 + baseGrowth * 1.5, i);
      const conservative = currentWealth * Math.pow(1 + baseGrowth * 0.5, i);
      
      data.push({
        date: date.toISOString(),
        actual: null,
        predicted,
        optimistic,
        conservative,
        isHistorical: false
      });
    }
    
    return data;
  };

  const predictionData = generatePrediction();
  const lastPrediction = predictionData[predictionData.length - 1];
  const projectedGrowth = lastPrediction.predicted! - 100000000;
  const projectedReturn = (projectedGrowth / 100000000) * 100;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: 'compact',
      compactDisplay: 'short'
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString([], { 
      month: 'short', 
      year: '2-digit' 
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload[0]) {
      const isHistorical = payload[0].payload.isHistorical;
      return (
        <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg p-4 shadow-xl">
          <p className="text-sm text-slate-400 mb-2">
            {formatDate(label)} • {isHistorical ? 'Historical' : 'Predicted'}
          </p>
          {payload.map((entry: any, index: number) => (
            entry.value && (
              <p key={index} className="text-sm">
                <span className="text-slate-400">{entry.name}:</span>
                <span className="ml-2 font-medium text-white">
                  {formatCurrency(entry.value)}
                </span>
              </p>
            )
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6 bg-slate-900/50 backdrop-blur-sm border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
            <Brain className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Wealth Trajectory</h3>
            <p className="text-sm text-slate-400">AI-powered 24-month projection</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
          95% confidence
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span className="text-xs text-slate-400">24 Month Target</span>
          </div>
          <p className="text-lg font-bold text-white">
            {formatCurrency(lastPrediction.predicted!)}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-slate-400">Projected Growth</span>
          </div>
          <p className="text-lg font-bold text-emerald-400">
            +{projectedReturn.toFixed(1)}%
          </p>
        </div>
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-slate-400">Expected Gain</span>
          </div>
          <p className="text-lg font-bold text-blue-400">
            +{formatCurrency(projectedGrowth)}
          </p>
        </div>
      </div>

      {/* Prediction Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={predictionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorOptimistic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorConservative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: '#334155' }}
            />
            
            <YAxis 
              tickFormatter={(v) => formatCurrency(v)}
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: '#334155' }}
              width={80}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {/* Historical line */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="Historical"
            />
            
            {/* Prediction areas */}
            <Area
              type="monotone"
              dataKey="optimistic"
              stroke="#10b981"
              strokeWidth={1}
              fillOpacity={1}
              fill="url(#colorOptimistic)"
              strokeDasharray="3 3"
              name="Optimistic"
            />
            
            <Area
              type="monotone"
              dataKey="predicted"
              stroke="#8b5cf6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPredicted)"
              name="Expected"
            />
            
            <Area
              type="monotone"
              dataKey="conservative"
              stroke="#f59e0b"
              strokeWidth={1}
              fillOpacity={1}
              fill="url(#colorConservative)"
              strokeDasharray="3 3"
              name="Conservative"
            />
            
            {/* Current position marker */}
            <ReferenceDot
              x={predictionData[12].date}
              y={100000000}
              r={6}
              fill="#3b82f6"
              stroke="#fff"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Scenario Analysis */}
      <div className="mt-6 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
        <h4 className="text-sm font-medium text-white mb-3">Scenario Analysis</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Bull Market (15% annual)</span>
            <span className="text-emerald-400 font-medium">
              {formatCurrency(lastPrediction.optimistic!)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Base Case (12% annual)</span>
            <span className="text-purple-400 font-medium">
              {formatCurrency(lastPrediction.predicted!)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Bear Market (6% annual)</span>
            <span className="text-yellow-400 font-medium">
              {formatCurrency(lastPrediction.conservative!)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}