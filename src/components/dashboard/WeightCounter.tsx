'use client';

import React from 'react';
import Link from 'next/link';
import { GlassCard } from '../ui/GlassCard';
import { DailyWeight } from '@/domain/types/DailyWeight';

interface WeightCounterProps {
  weights: DailyWeight[];
  targetWeight?: number;
}

export function WeightCounter({ weights, targetWeight }: WeightCounterProps) {
  const sortedWeights = [...weights].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const latestEntry = sortedWeights[0];
  const currentWeight = latestEntry?.weight ?? null;

  const progressPercent =
    currentWeight !== null && targetWeight
      ? Math.min(
          Math.round(
            ((currentWeight - targetWeight) / currentWeight) * 100 + 100
          ),
          100
        )
      : null;

  return (
    <GlassCard className="rounded-3xl p-6 relative group cursor-pointer transition-colors">
      <Link href="/activity?tab=weight" className="absolute inset-0 rounded-3xl" />
      <div className="relative z-10 pointer-events-none">
        <h3 className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-4">
          Weight
        </h3>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner group-hover:bg-blue-500/20 transition-colors">
            <span className="material-symbols-outlined text-3xl">monitor_weight</span>
          </div>
          <div>
            {currentWeight !== null ? (
              <>
                <p className="text-2xl font-bold text-white">
                  {currentWeight} <span className="text-sm font-medium text-on-surface-variant">kg</span>
                </p>
                {targetWeight && (
                  <p className="text-xs text-on-surface-variant font-medium">
                    Goal: {targetWeight} kg
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-on-surface-variant">No weight logged yet</p>
            )}
          </div>
        </div>

        {progressPercent !== null && (
          <div className="w-full neu-inset h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-blue-400 h-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        <div className="mt-3 text-xs text-on-surface-variant">
          {weights.length} {weights.length === 1 ? 'entry' : 'entries'} logged
        </div>
      </div>
    </GlassCard>
  );
}
