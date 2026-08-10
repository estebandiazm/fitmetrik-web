'use client';

import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card } from '@/components/ui/Card';
import { DailyStep } from '../../domain/types/DailySteps';

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

  const cutoffDate = new Date();
  const daysBack = period === 'week' ? 7 : 30;
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  const filteredSteps = steps.filter((step) => new Date(step.date) >= cutoffDate);

  const chartData = [];
  for (let i = daysBack - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dateISODate = date.toISOString().split('T')[0];
    const stepEntry = filteredSteps.find((s) => {
      const sISODate = new Date(s.date).toISOString().split('T')[0];
      return sISODate === dateISODate;
    });

    chartData.push({
      date: dateStr,
      steps: stepEntry?.steps ?? 0,
    });
  }

  return (
    <Card className="p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-semibold text-lg">Activity Trends</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 py-1 text-sm font-semibold transition ${
              period === 'week'
                ? 'text-primary'
                : 'text-gray-400 hover:text-primary'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1 text-sm font-semibold transition ${
              period === 'month'
                ? 'text-primary'
                : 'text-gray-400 hover:text-primary'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      <div className={`w-full ${chartHeightClass}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" style={{ fontSize: axisFontSize }} />
            <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: axisFontSize }} />
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
                background: 'rgba(13, 26, 51, 0.95)',
                border: '2px solid var(--color-primary)',
                borderRadius: tooltipRadius,
                boxShadow: '0 8px 32px color-mix(in srgb, var(--color-primary) 20%, transparent)',
              }}
              labelStyle={{ color: '#fff', fontWeight: 'bold' }}
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
