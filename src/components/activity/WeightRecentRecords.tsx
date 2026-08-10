'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { DailyWeight } from '@/domain/types/DailyWeight';

interface WeightRecentRecordsProps {
  weights: DailyWeight[];
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

export default function WeightRecentRecords({ weights }: WeightRecentRecordsProps) {
  const [displayCount, setDisplayCount] = useState(10);

  const sortedWeights = [...weights].sort((a, b) => {
    const aISO = new Date(a.date).toISOString();
    const bISO = new Date(b.date).toISOString();
    return bISO.localeCompare(aISO);
  });
  const displayedWeights = sortedWeights.slice(0, displayCount);

  if (weights.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-gray-400 text-center">No weight records yet. Start logging!</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-white/5 border-b border-white/5">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Date</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Weight (kg)</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Notes</th>
            </tr>
          </thead>
          <tbody>
            {displayedWeights.map((entry) => (
              <tr
                key={new Date(entry.date).toISOString()}
                className="border-b border-white/5 hover:bg-white/5 transition"
              >
                <td className="px-6 py-4">
                  <p className="text-white font-medium">
                    {formatUTCDate(entry.date)}
                  </p>
                </td>
                <td className="px-6 py-4 text-right text-blue-400 font-semibold">
                  {entry.weight}
                </td>
                <td className="px-6 py-4 text-gray-400 text-sm">
                  {entry.notes || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedWeights.length > displayCount && (
        <div className="p-4 text-center border-t border-white/5">
          <button
            onClick={() => setDisplayCount(displayCount + 10)}
            className="text-blue-400 hover:text-blue-300 font-semibold transition"
          >
            Load More
          </button>
        </div>
      )}
    </Card>
  );
}
