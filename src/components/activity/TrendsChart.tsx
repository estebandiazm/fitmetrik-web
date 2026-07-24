'use client';

import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { GlassCard } from '@/components/ui/GlassCard';
import { DailyStep } from '../../domain/types/DailySteps';

interface TrendsChartProps {
  steps: DailyStep[];
  stepGoal?: number;
}

export default function TrendsChart({ steps, stepGoal }: TrendsChartProps) {
  const [period, setPeriod] = useState<'month' | 'week'>('month');

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
    <GlassCard className="p-6 mb-6">
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

      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" style={{ fontSize: '0.85rem' }} />
            <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '0.85rem' }} />
            {stepGoal && (
              <ReferenceLine
                y={stepGoal}
                stroke="#6366f1"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: `Goal: ${stepGoal}`,
                  position: 'right',
                  fill: '#6366f1',
                  fontSize: 12,
                  fontWeight: 'bold',
                }}
              />
            )}
            <Tooltip
              contentStyle={{
                background: 'rgba(13, 26, 51, 0.95)',
                border: '2px solid #2dd4bf',
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(45, 212, 191, 0.2)',
              }}
              labelStyle={{ color: '#fff', fontWeight: 'bold' }}
              formatter={(value) => [value ? `${value.toLocaleString()} steps` : '0 steps', 'Steps']}
              cursor={{ fill: 'rgba(45, 212, 191, 0.1)' }}
            />
            <Bar dataKey="steps" fill="#2dd4bf" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
