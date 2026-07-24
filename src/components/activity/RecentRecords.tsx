'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { DailyStep } from '../../domain/types/DailySteps';

interface RecentRecordsProps {
  steps: DailyStep[];
  stepGoal?: number;
}

function formatUTCDate(dateStr: string | Date): string {
  const isoString = typeof dateStr === 'string' ? dateStr : dateStr.toISOString();
  const [year, month, day] = isoString.split('T')[0].split('-');
  const utcDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(utcDate);
}

export default function RecentRecords({ steps, stepGoal }: RecentRecordsProps) {
  const [displayCount, setDisplayCount] = useState(10);

  const sortedSteps = [...steps].sort((a, b) => {
    const aISO = new Date(a.date).toISOString();
    const bISO = new Date(b.date).toISOString();
    return bISO.localeCompare(aISO);
  });
  const displayedSteps = sortedSteps.slice(0, displayCount);

  const getStatusBadge = (stepCount: number) => {
    if (!stepGoal) return null;

    if (stepCount >= stepGoal) {
      return <span className="inline-block px-3 py-1 bg-green-500/20 text-green-300 text-xs font-semibold rounded-full">Goal Met</span>;
    } else if (stepCount >= stepGoal * 0.75) {
      return <span className="inline-block px-3 py-1 bg-yellow-500/20 text-yellow-300 text-xs font-semibold rounded-full">Good</span>;
    } else {
      return <span className="inline-block px-3 py-1 bg-red-500/20 text-red-300 text-xs font-semibold rounded-full">Low Activity</span>;
    }
  };

  if (steps.length === 0) {
    return (
      <GlassCard className="p-6">
        <p className="text-gray-400 text-center">No step records yet</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-white/5 border-b border-white/5">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Date</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Steps</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {displayedSteps.map((step) => (
              <tr
                key={new Date(step.date).toISOString()}
                className="border-b border-white/5 hover:bg-white/5 transition"
              >
                <td className="px-6 py-4">
                  <p className="text-white font-medium">
                    {formatUTCDate(step.date)}
                  </p>
                  {step.notes && (
                    <p className="text-xs text-gray-400 mt-1">{step.notes}</p>
                  )}
                </td>
                <td className="px-6 py-4 text-right text-primary font-semibold">
                  {step.steps.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-center">{getStatusBadge(step.steps)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedSteps.length > displayCount && (
        <div className="p-4 text-center border-t border-white/5">
          <button
            onClick={() => setDisplayCount(displayCount + 10)}
            className="text-primary hover:text-primary/80 font-semibold transition"
          >
            Load More
          </button>
        </div>
      )}
    </GlassCard>
  );
}
