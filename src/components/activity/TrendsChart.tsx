'use client';

import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card } from '@/components/ui/Card';
import { DailyStep } from '@/domain/types/DailySteps';
import { bucketByLocalDay } from '@/domain/services/chartSeries';

interface TrendsChartProps {
  steps: DailyStep[];
  stepGoal?: number;
  density?: 'compact' | 'spacious';
}

export default function TrendsChart({ steps, stepGoal, density = 'spacious' }: TrendsChartProps) {
  const [period, setPeriod] = useState<'month' | 'week'>('month');
  const isCompact = density === 'compact';
  const barRadius: [number, number, number, number] = isCompact ? [4, 4, 0, 0] : [8, 8, 0, 0];
  const tooltipRadius = isCompact ? '4px' : '8px';
  const axisFontSize = isCompact ? '0.7rem' : '0.85rem';
  const chartHeightClass = isCompact ? 'h-64' : 'h-80';

  const daysBack = period === 'week' ? 7 : 30;
  const chartData = bucketByLocalDay(steps, daysBack).map(({ label, entry }) => ({
    date: label,
    steps: entry?.steps ?? 0,
  }));

  return (
    <Card className="p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-text-primary font-semibold text-lg">Activity Trends</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 py-1 text-sm font-semibold transition ${
              period === 'week' ? 'text-text-primary underline decoration-primary decoration-2 underline-offset-4' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1 text-sm font-semibold transition ${
              period === 'month' ? 'text-text-primary underline decoration-primary decoration-2 underline-offset-4' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      <div className={`w-full ${chartHeightClass}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" stroke="var(--color-text-muted)" style={{ fontSize: axisFontSize }} />
            <YAxis stroke="var(--color-text-muted)" style={{ fontSize: axisFontSize }} />
            {stepGoal && (
              <ReferenceLine
                y={stepGoal}
                stroke="var(--color-goal-line)"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: `Goal: ${stepGoal}`,
                  position: 'right',
                  fill: 'var(--color-goal-line)',
                  fontSize: 12,
                  fontWeight: 'bold',
                }}
              />
            )}
            <Tooltip
              contentStyle={{
                background: 'var(--color-panel)',
                border: '2px solid var(--color-primary)',
                borderRadius: tooltipRadius,
                boxShadow: '0 8px 32px color-mix(in srgb, var(--color-primary) 20%, transparent)',
              }}
              labelStyle={{ color: 'var(--color-text-primary)', fontWeight: 'bold' }}
              formatter={(value) => [value ? `${value.toLocaleString()} steps` : '0 steps', 'Steps']}
              cursor={{ fill: 'color-mix(in srgb, var(--color-primary) 10%, transparent)' }}
            />
            <Bar dataKey="steps" fill="var(--color-primary)" radius={barRadius} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
