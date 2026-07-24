'use client';

import React from 'react';
import Link from 'next/link';
import { GlassCard } from '../ui/GlassCard';

interface StepsCounterProps {
  current?: number;
  goal?: number;
}

export function StepsCounter({ current = 8450, goal = 10000 }: StepsCounterProps) {
  const percentage = Math.min((current / goal) * 100, 100);

  return (
    <GlassCard className="rounded-3xl p-6 relative group cursor-pointer transition-colors">
      <Link href="/activity" className="absolute inset-0 rounded-3xl" />
      <div className="relative z-10 pointer-events-none">
        <h3 className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-4">Steps Counter</h3>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner group-hover:bg-primary/20 transition-colors">
            <span className="material-symbols-outlined text-3xl">directions_run</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{current.toLocaleString()}</p>
            <p className="text-xs text-on-surface-variant font-medium">Goal: {goal.toLocaleString()}</p>
          </div>
        </div>
        <div className="w-full neu-inset h-1.5 rounded-full mt-4 overflow-hidden">
          <div className="bg-primary h-full" style={{ width: `${percentage}%` }}></div>
        </div>
      </div>
    </GlassCard>
  );
}
