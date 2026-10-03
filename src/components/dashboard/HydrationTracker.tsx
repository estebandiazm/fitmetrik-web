import React from 'react';
import { Card } from '../ui/Card';

interface HydrationTrackerProps {
  current?: number;
}

export function HydrationTracker({ current = 3.5 }: HydrationTrackerProps) {
  return (
    <Card className="rounded-3xl p-6">
      <h3 className="text-text-muted text-xs font-bold uppercase tracking-widest mb-4">Hydration Goal</h3>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-secondary shadow-inner">
          <span className="material-symbols-outlined text-3xl">water_drop</span>
        </div>
        <div>
          <p className="text-2xl font-bold text-text-primary">{current}L</p>
          <p className="text-xs text-text-muted font-medium">Daily Target</p>
        </div>
      </div>
    </Card>
  );
}
