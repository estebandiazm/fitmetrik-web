'use client';

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { DailyWeight } from '@/domain/types/DailyWeight';

interface WeightTrendsChartProps {
  weights: DailyWeight[];
  targetWeight?: number;
  density?: 'compact' | 'spacious';
}

export default function WeightTrendsChart({
  weights,
  targetWeight,
  density = 'spacious',
}: WeightTrendsChartProps) {
  const [period, setPeriod] = useState<'month' | 'week'>('month');
  const isCompact = density === 'compact';
  const tooltipRadius = isCompact ? '4px' : '8px';
  const axisFontSize = isCompact ? '0.7rem' : '0.85rem';
  const chartHeightClass = isCompact ? 'h-64' : 'h-80';

  const cutoffDate = new Date();
  const daysBack = period === 'week' ? 7 : 30;
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  // Build chart data with null for missing days (gaps, not zeros)
  const chartData = [];
  for (let i = daysBack - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dateISODate = date.toISOString().split('T')[0];
    const entry = weights.find((w) => {
      const wISODate = new Date(w.date).toISOString().split('T')[0];
      return wISODate === dateISODate;
    });

    chartData.push({
      date: dateStr,
      weight: entry?.weight ?? null,
    });
  }

  if (weights.length === 0) return null;

  return (
    <Card className="p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-semibold text-lg">Weight Trends</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 py-1 text-sm font-semibold transition ${
              period === 'week' ? 'text-blue-400' : 'text-gray-400 hover:text-blue-400'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1 text-sm font-semibold transition ${
              period === 'month' ? 'text-blue-400' : 'text-gray-400 hover:text-blue-400'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      <div className={`w-full ${chartHeightClass}`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-tertiary)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-tertiary)" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" style={{ fontSize: axisFontSize }} />
            <YAxis
              stroke="rgba(255,255,255,0.5)"
              style={{ fontSize: axisFontSize }}
              domain={['dataMin - 2', 'dataMax + 2']}
            />
            {targetWeight && (
              <ReferenceLine
                y={targetWeight}
                stroke="var(--color-primary)"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: `Target: ${targetWeight} kg`,
                  position: 'right',
                  fill: 'var(--color-primary)',
                  fontSize: 12,
                  fontWeight: 'bold',
                }}
              />
            )}
            <Tooltip
              contentStyle={{
                background: 'rgba(13, 26, 51, 0.95)',
                border: '2px solid var(--color-tertiary)',
                borderRadius: tooltipRadius,
                boxShadow: '0 8px 32px color-mix(in srgb, var(--color-tertiary) 20%, transparent)',
              }}
              labelStyle={{ color: '#fff', fontWeight: 'bold' }}
              formatter={(value) =>
                value != null ? [`${value} kg`, 'Weight'] : ['No data', 'Weight']
              }
              cursor={{ fill: 'color-mix(in srgb, var(--color-tertiary) 10%, transparent)' }}
            />
            <Area
              type="monotone"
              dataKey="weight"
              stroke="var(--color-tertiary)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorWeight)"
              dot={{
                fill: 'var(--color-tertiary)',
                r: 4,
                strokeWidth: 2,
                stroke: 'var(--color-surface-dim)',
              }}
              activeDot={{
                r: 6,
                fill: 'var(--color-tertiary)',
                stroke: 'var(--color-tertiary-light)',
                strokeWidth: 2,
              }}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
