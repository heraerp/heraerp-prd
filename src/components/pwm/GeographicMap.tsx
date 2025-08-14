'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe2, MapPin, TrendingUp, TrendingDown } from 'lucide-react';

interface GeographicMapProps {
  organizationId: string;
}

interface RegionData {
  name: string;
  value: number;
  percentage: number;
  change: number;
  coordinates: { x: number; y: number };
  color: string;
}

export function GeographicMap({ organizationId }: GeographicMapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  // Mock geographic data with coordinates for map positioning
  const regions: RegionData[] = [
    { 
      name: 'North America', 
      value: 45000000, 
      percentage: 45, 
      change: 2.3,
      coordinates: { x: 20, y: 25 },
      color: '#3b82f6'
    },
    { 
      name: 'Europe', 
      value: 25000000, 
      percentage: 25, 
      change: -1.2,
      coordinates: { x: 50, y: 20 },
      color: '#10b981'
    },
    { 
      name: 'Asia Pacific', 
      value: 20000000, 
      percentage: 20, 
      change: 5.8,
      coordinates: { x: 75, y: 30 },
      color: '#f59e0b'
    },
    { 
      name: 'Emerging Markets', 
      value: 10000000, 
      percentage: 10, 
      change: 8.2,
      coordinates: { x: 15, y: 60 },
      color: '#8b5cf6'
    },
  ];

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

  return (
    <Card className="p-6 bg-slate-900/50 backdrop-blur-sm border-slate-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
          <Globe2 className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Geographic Distribution</h3>
          <p className="text-sm text-slate-400">Global investment exposure</p>
        </div>
      </div>

      {/* Interactive World Map */}
      <div className="relative h-64 md:h-80 mb-6 bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <svg 
          viewBox="0 0 100 60" 
          className="w-full h-full"
          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
        >
          {/* World map continents (simplified) */}
          <defs>
            <radialGradient id="oceanGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>
            <linearGradient id="landGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#374151" />
              <stop offset="100%" stopColor="#1f2937" />
            </linearGradient>
          </defs>
          
          {/* Ocean background */}
          <rect width="100" height="60" fill="url(#oceanGradient)" />
          
          {/* Continents (simplified shapes) */}
          {/* North America */}
          <path
            d="M10,15 Q15,10 25,12 Q30,15 28,25 Q25,30 20,28 Q12,25 10,15 Z"
            fill="url(#landGradient)"
            stroke="#4b5563"
            strokeWidth="0.2"
            className="transition-all duration-300 hover:fill-slate-600"
          />
          
          {/* South America */}
          <path
            d="M20,32 Q25,30 27,35 Q25,45 20,50 Q15,48 18,40 Q15,35 20,32 Z"
            fill="url(#landGradient)"
            stroke="#4b5563"
            strokeWidth="0.2"
            className="transition-all duration-300 hover:fill-slate-600"
          />
          
          {/* Europe */}
          <path
            d="M45,12 Q52,10 55,15 Q53,20 48,18 Q45,15 45,12 Z"
            fill="url(#landGradient)"
            stroke="#4b5563"
            strokeWidth="0.2"
            className="transition-all duration-300 hover:fill-slate-600"
          />
          
          {/* Africa */}
          <path
            d="M48,22 Q55,20 58,30 Q55,45 50,48 Q45,45 47,35 Q45,28 48,22 Z"
            fill="url(#landGradient)"
            stroke="#4b5563"
            strokeWidth="0.2"
            className="transition-all duration-300 hover:fill-slate-600"
          />
          
          {/* Asia */}
          <path
            d="M60,8 Q75,5 85,15 Q80,25 75,30 Q70,28 65,25 Q60,20 60,8 Z"
            fill="url(#landGradient)"
            stroke="#4b5563"
            strokeWidth="0.2"
            className="transition-all duration-300 hover:fill-slate-600"
          />
          
          {/* Australia */}
          <path
            d="M75,40 Q82,38 85,42 Q83,45 78,44 Q75,42 75,40 Z"
            fill="url(#landGradient)"
            stroke="#4b5563"
            strokeWidth="0.2"
            className="transition-all duration-300 hover:fill-slate-600"
          />
          
          {/* Investment markers */}
          {regions.map((region, index) => (
            <g key={region.name}>
              {/* Pulsing circle animation */}
              <circle
                cx={region.coordinates.x}
                cy={region.coordinates.y}
                r="2"
                fill={region.color}
                opacity="0.3"
                className="animate-ping"
              />
              
              {/* Main investment marker */}
              <circle
                cx={region.coordinates.x}
                cy={region.coordinates.y}
                r={Math.sqrt(region.percentage) / 2 + 1}
                fill={region.color}
                stroke="white"
                strokeWidth="0.3"
                className="cursor-pointer transition-all duration-300 hover:r-4 hover:opacity-80"
                onMouseEnter={() => setHoveredRegion(region.name)}
                onMouseLeave={() => setHoveredRegion(null)}
              />
              
              {/* Tooltip */}
              {hoveredRegion === region.name && (
                <g>
                  <rect
                    x={region.coordinates.x + 3}
                    y={region.coordinates.y - 8}
                    width="18"
                    height="12"
                    fill="rgba(0, 0, 0, 0.9)"
                    stroke={region.color}
                    strokeWidth="0.2"
                    rx="1"
                  />
                  <text
                    x={region.coordinates.x + 4}
                    y={region.coordinates.y - 5}
                    fill="white"
                    fontSize="2"
                    className="font-medium"
                  >
                    {region.name}
                  </text>
                  <text
                    x={region.coordinates.x + 4}
                    y={region.coordinates.y - 2}
                    fill={region.color}
                    fontSize="1.5"
                    className="font-bold"
                  >
                    {formatCurrency(region.value)}
                  </text>
                </g>
              )}
            </g>
          ))}
          
          {/* Connection lines between regions */}
          <defs>
            <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          
          {/* Animated connection lines */}
          <path
            d={`M${regions[0].coordinates.x},${regions[0].coordinates.y} Q40,15 ${regions[1].coordinates.x},${regions[1].coordinates.y}`}
            fill="none"
            stroke="url(#connectionGradient)"
            strokeWidth="0.5"
            strokeDasharray="2,2"
            className="animate-pulse"
          />
          <path
            d={`M${regions[1].coordinates.x},${regions[1].coordinates.y} Q65,25 ${regions[2].coordinates.x},${regions[2].coordinates.y}`}
            fill="none"
            stroke="url(#connectionGradient)"
            strokeWidth="0.5"
            strokeDasharray="2,2"
            className="animate-pulse"
          />
        </svg>
      </div>

      {/* Region Breakdown */}
      <div className="space-y-3">
        {regions.map((region) => (
          <div key={region.name} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-400" />
                <h4 className="font-medium text-white">{region.name}</h4>
              </div>
              <Badge 
                variant="outline"
                className={region.change >= 0 
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" 
                  : "bg-red-500/20 text-red-300 border-red-500/30"
                }
              >
                {region.change >= 0 ? '+' : ''}{region.change}%
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">
                {region.percentage}% • {formatCurrency(region.value)}
              </span>
              <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                  style={{ width: `${region.percentage}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}