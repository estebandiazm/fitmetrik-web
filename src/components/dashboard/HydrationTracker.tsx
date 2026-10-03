import React from 'react';
import { Card } from '../ui/Card';
import { DropletIcon } from '../ui/icons';

interface HydrationTrackerProps {
  current?: number;
}

export function HydrationTracker({ current = 3.5 }: HydrationTrackerProps) {
  return (
    <Card padding="default" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-text-faint">Hidratación</h2>
        <span className="text-text-faint">
          <DropletIcon size={18} />
        </span>
      </div>
      <p className="flex items-baseline gap-1">
        <span className="font-mono text-2xl font-bold text-text-primary">{current}</span>
        <span className="font-mono text-xs font-medium text-text-faint">L</span>
      </p>
      <p className="text-xs text-text-muted">Meta diaria</p>
    </Card>
  );
}
