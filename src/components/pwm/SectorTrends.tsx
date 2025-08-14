'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface SectorTrendsProps {
  organizationId: string;
}

export function SectorTrends({ organizationId }: SectorTrendsProps) {
  // Mock sector data
  const sectors = [
    { name: 'Technology', value: 35, change: 8.5, momentum: 'strong' },
    { name: 'Healthcare', value: 20, change: 3.2, momentum: 'moderate' },
    { name: 'Finance', value: 15, change: -2.1, momentum: 'weak' },
    { name: 'Energy', value: 12, change: 5.7, momentum: 'strong' },
    { name: 'Real Estate', value: 10, change: 1.8, momentum: 'moderate' },
    { name: 'Consumer', value: 8, change: -0.5, momentum: 'neutral' },
  ];

  const getMomentumColor = (momentum: string) => {
    switch (momentum) {
      case 'strong':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'moderate':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'weak':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg p-4 shadow-xl">
          <p className="font-semibold text-white mb-2">{data.name}</p>
          <p className="text-sm text-slate-400">
            Allocation: <span className="text-white font-medium">{data.value}%</span>
          </p>
          <p className="text-sm text-slate-400">
            Performance: 
            <span className={data.change >= 0 ? "text-emerald-400" : "text-red-400"}>
              {' '}{data.change >= 0 ? '+' : ''}{data.change}%
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6 bg-slate-900/50 backdrop-blur-sm border-slate-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
          <BarChart3 className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Sector Performance</h3>
          <p className="text-sm text-slate-400">Industry allocation and trends</p>
        </div>
      </div>

      {/* Sector Chart */}
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sectors} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis 
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={{ stroke: '#334155' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {sectors.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.change >= 0 ? '#10b981' : '#ef4444'}
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sector Details */}
      <div className="space-y-3">
        {sectors.map((sector) => (
          <div 
            key={sector.name}
            className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/50"
          >
            <div className="flex items-center gap-3">
              <div className={sector.change >= 0 
                ? "p-1 rounded bg-emerald-500/20" 
                : "p-1 rounded bg-red-500/20"
              }>
                {sector.change >= 0 
                  ? <TrendingUp className="h-4 w-4 text-emerald-400" />
                  : <TrendingDown className="h-4 w-4 text-red-400" />
                }
              </div>
              <div>
                <p className="font-medium text-white">{sector.name}</p>
                <p className="text-xs text-slate-400">{sector.value}% of portfolio</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline"
                className={getMomentumColor(sector.momentum)}
              >
                {sector.momentum}
              </Badge>
              <span className={sector.change >= 0 
                ? "text-sm font-medium text-emerald-400" 
                : "text-sm font-medium text-red-400"
              }>
                {sector.change >= 0 ? '+' : ''}{sector.change}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}