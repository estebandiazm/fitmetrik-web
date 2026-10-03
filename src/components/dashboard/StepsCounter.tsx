'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '../ui/Card';
import { StepsIcon } from '../ui/icons';

interface StepsCounterProps {
  current?: number;
  goal?: number;
}

// Steps is the amber metric track (teal is reserved for weight) — see
// DESIGN.md "one accent per tracked metric".
export function StepsCounter({ current = 8450, goal = 10000 }: StepsCounterProps) {
  const percentage = Math.min((current / goal) * 100, 100);

  return (
    <Card padding="default" className="group relative transition-colors hover:border-border-strong">
      <Link href="/activity" className="absolute inset-0 rounded-[var(--radius-card)]" aria-label="Ver actividad" />
      <div className="pointer-events-none relative flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-text-faint">Pasos</h2>
          <span className="text-accent-amber">
            <StepsIcon size={18} />
          </span>
        </div>
        <p className="flex items-baseline gap-1.5">
          <span className="font-mono text-2xl font-bold text-text-primary">{current.toLocaleString('es')}</span>
          <span className="font-mono text-xs font-medium text-text-faint">/ {goal.toLocaleString('es')}</span>
        </p>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-locked-bg">
          <div className="h-full rounded-full bg-accent-amber transition-[width] duration-700" style={{ width: `${percentage}%` }} />
        </div>
        <p className="text-xs text-text-muted">Promedio diario</p>
      </div>
    </Card>
  );
}
