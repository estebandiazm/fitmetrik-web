'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import type { DailyWeight } from '@/domain/types/DailyWeight';
import { formatUTCDate, sortRecordsByDateDesc } from '@/domain/services/dailyRecords';

interface WeightRecentRecordsProps {
  weights: DailyWeight[];
}

const PAGE_SIZE = 10;

interface WeightRowProps {
  entry: DailyWeight;
}

function WeightRow({ entry }: WeightRowProps) {
  return (
    <tr className="border-b border-row-border hover:bg-row-border transition">
      <td className="px-6 py-4">
        <p className="text-text-primary font-medium">{formatUTCDate(entry.date)}</p>
      </td>
      <td className="px-6 py-4 text-right text-text-primary font-semibold">{entry.weight}</td>
      <td className="px-6 py-4 text-text-muted text-sm">{entry.notes || '—'}</td>
    </tr>
  );
}

interface LoadMoreButtonProps {
  onClick: () => void;
}

function LoadMoreButton({ onClick }: LoadMoreButtonProps) {
  return (
    <div className="p-4 text-center border-t border-row-border">
      <button onClick={onClick} className="text-primary hover:text-primary/80 font-semibold transition">
        Load More
      </button>
    </div>
  );
}

interface WeightsTableProps {
  weights: DailyWeight[];
}

function WeightsTable({ weights }: WeightsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-bg border-b border-border">
            <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase">Date</th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-text-muted uppercase">Weight (kg)</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase">Notes</th>
          </tr>
        </thead>
        <tbody>
          {weights.map((entry, index) => (
            <WeightRow key={`${String(entry.date)}-${index}`} entry={entry} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function WeightRecentRecords({ weights }: WeightRecentRecordsProps) {
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  if (weights.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-text-muted text-center">No weight records yet. Start logging!</p>
      </Card>
    );
  }

  const sortedWeights = sortRecordsByDateDesc(weights);

  return (
    <Card className="overflow-hidden">
      <WeightsTable weights={sortedWeights.slice(0, displayCount)} />
      {sortedWeights.length > displayCount && (
        <LoadMoreButton onClick={() => setDisplayCount(displayCount + PAGE_SIZE)} />
      )}
    </Card>
  );
}
