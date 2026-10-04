'use client';

import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/select';
import type { BodyMeasurement } from '@/domain/types/BodyMeasurement';
import type { MeasurementPoint } from '@/domain/types/MeasurementPoint';
import { buildMeasurementSeries } from '@/domain/services/bodyMeasurements';

interface MeasurementTrendsChartProps {
  measurements: BodyMeasurement[];
  /** Active points + any inactive points that have at least one measurement entry */
  selectablePoints: MeasurementPoint[];
  selectedSlug: string;
  onSelectedSlugChange: (slug: string) => void;
  density?: 'compact' | 'spacious';
}

export default function MeasurementTrendsChart({
  measurements,
  selectablePoints,
  selectedSlug,
  onSelectedSlugChange,
  density = 'spacious',
}: MeasurementTrendsChartProps) {
  const [period, setPeriod] = useState<'week' | 'month'>('month');
  const isCompact = density === 'compact';
  const tooltipRadius = isCompact ? '4px' : '8px';
  const axisFontSize = isCompact ? '0.7rem' : '0.85rem';
  const chartHeightClass = isCompact ? 'h-64' : 'h-80';

  const selectedPoint = selectablePoints.find((p) => p.slug === selectedSlug);
  const label = selectedPoint?.label ?? selectedSlug;

  const daysBack = period === 'week' ? 7 : 30;

  const chartData = buildMeasurementSeries(measurements, selectedSlug, daysBack);

  if (selectablePoints.length === 0) {
    return (
      <div data-testid="measurement-trends-chart">
        <Card className="p-6 mb-6">
          <p className="text-text-muted text-center text-sm">
            Tu coach aún no configuró puntos de medición.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div data-testid="measurement-trends-chart">
    <Card className="p-6 mb-6">
      <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
        <h3 className="text-text-primary font-semibold text-lg">Tendencias de Medidas</h3>

        <div className="flex items-center gap-3">
          {/* Point selector dropdown */}
          <Select
            value={selectedSlug}
            onChange={(e) => onSelectedSlugChange(e.target.value)}
            aria-label="Seleccionar punto de medición"
            controlSize="sm"
          >
            {selectablePoints.map((p) => (
              <option key={p.slug} value={p.slug} className="bg-panel text-text-primary">
                {p.active ? p.label : `${p.label} (inactivo)`}
              </option>
            ))}
          </Select>

          {/* Period toggle */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setPeriod('week')}
              className={`px-3 py-1 text-sm font-semibold transition ${
                period === 'week' ? 'text-text-primary underline decoration-accent-teal decoration-2 underline-offset-4' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Semana
            </button>
            <button
              type="button"
              onClick={() => setPeriod('month')}
              className={`px-3 py-1 text-sm font-semibold transition ${
                period === 'month' ? 'text-text-primary underline decoration-accent-teal decoration-2 underline-offset-4' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Mes
            </button>
          </div>
        </div>
      </div>

      <div className={`w-full ${chartHeightClass}`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorMeasure" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="date"
              stroke="var(--color-text-muted)"
              style={{ fontSize: axisFontSize }}
            />
            <YAxis
              stroke="var(--color-text-muted)"
              style={{ fontSize: axisFontSize }}
              domain={['dataMin - 2', 'dataMax + 2']}
              unit=" cm"
            />
            <Tooltip
              contentStyle={{
                background: 'var(--color-panel)',
                border: '2px solid var(--color-primary)',
                borderRadius: tooltipRadius,
                boxShadow: '0 8px 32px color-mix(in srgb, var(--color-primary) 20%, transparent)',
              }}
              labelStyle={{ color: 'var(--color-text-primary)', fontWeight: 'bold' }}
              formatter={(value) =>
                value != null ? [`${value} cm`, label] : ['Sin datos', label]
              }
              cursor={{ fill: 'color-mix(in srgb, var(--color-primary) 10%, transparent)' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--color-primary)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorMeasure)"
              dot={{ fill: 'var(--color-primary)', r: 4, strokeWidth: 2, stroke: 'var(--color-measurement-accent-dark)' }}
              activeDot={{ r: 6, fill: 'var(--color-primary)', stroke: 'var(--color-measurement-accent-light)', strokeWidth: 2 }}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
    </div>
  );
}
