'use client';

import { Card } from '../ui/Card';

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: string;
  trend: { value: number; direction: 'up' | 'down' } | null;
}

export function MetricCard({ label, value, icon, trend }: MetricCardProps) {
  return (
    <Card padding="default">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              trend.direction === 'up' ? 'text-success bg-success/10' : 'text-error bg-error/10'
            }`}
          >
            {trend.direction === 'up' ? '▲' : '▼'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-on-surface">{value}</p>
      <p className="text-sm text-on-surface-muted mt-1">{label}</p>
    </Card>
  );
}
