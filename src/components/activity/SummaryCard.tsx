'use client';

import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';

interface SummaryCardProps {
  dailyAverage: number;
  stepGoal?: number;
}

export default function SummaryCard({ dailyAverage, stepGoal }: SummaryCardProps) {
  const progressPercent = stepGoal ? Math.min((dailyAverage / stepGoal) * 100, 100) : null;

  return (
    <GlassCard className="p-6 mb-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-2xl">directions_run</span>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase">Daily Average</p>
          <p className="text-3xl font-bold text-white">{dailyAverage.toLocaleString()}</p>
        </div>
      </div>

      {stepGoal ? (
        <>
          <p className="text-xs text-gray-400 mb-2">
            Progress to Goal ({stepGoal.toLocaleString()})
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 neu-inset rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${progressPercent || 0}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-primary min-w-fit">
              {Math.round(progressPercent || 0)}%
            </span>
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-400 italic">
          Goal not set — contact your coach
        </p>
      )}
    </GlassCard>
  );
}
