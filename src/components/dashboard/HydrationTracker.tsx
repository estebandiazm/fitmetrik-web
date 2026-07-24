import React from 'react';
import { GlassCard } from '../ui/GlassCard';

interface HydrationTrackerProps {
  current?: number;
  goal?: number;
}

export function HydrationTracker({ current = 3.5, goal = 3.5 }: HydrationTrackerProps) {
  return (
    <GlassCard className="rounded-3xl p-6">
      <h3 className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-4">Hydration Goal</h3>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-secondary shadow-inner">
          <span className="material-symbols-outlined text-3xl">water_drop</span>
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{current}L</p>
          <p className="text-xs text-on-surface-variant font-medium">Daily Target</p>
        </div>
      </div>
    </GlassCard>
  );
}
