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
import { GlassCard } from '@/components/ui/GlassCard';
import type { BodyMeasurement } from '@/domain/types/BodyMeasurement';
import type { MeasurementPoint } from '@/domain/types/MeasurementPoint';

interface MeasurementTrendsChartProps {
  measurements: BodyMeasurement[];
  activePoints: MeasurementPoint[];
  /** Active points + any inactive points that have at least one measurement entry */
  selectablePoints: MeasurementPoint[];
  selectedSlug: string;
  onSelectedSlugChange: (slug: string) => void;
}

export default function MeasurementTrendsChart({
  measurements,
  activePoints,
  selectablePoints,
  selectedSlug,
  onSelectedSlugChange,
}: MeasurementTrendsChartProps) {
  const [period, setPeriod] = useState<'week' | 'month'>('month');

  const selectedPoint = selectablePoints.find((p) => p.slug === selectedSlug);
  const label = selectedPoint?.label ?? selectedSlug;

  const daysBack = period === 'week' ? 7 : 30;

  const chartData = [];
  for (let i = daysBack - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const dateStr = date.toLocaleDateString('es-AR', { month: 'short', day: 'numeric' });
    const dateISO = date.toISOString().split('T')[0];
    const entry = measurements.find((m) => {
      if (m.pointSlug !== selectedSlug) return false;
      return new Date(m.date).toISOString().split('T')[0] === dateISO;
    });

    chartData.push({ date: dateStr, value: entry?.valueCm ?? null });
  }

  if (selectablePoints.length === 0) {
    return (
      <div data-testid="measurement-trends-chart">
        <GlassCard className="p-6 mb-6">
          <p className="text-gray-400 text-center text-sm">
            Tu coach aún no configuró puntos de medición.
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div data-testid="measurement-trends-chart">
    <GlassCard className="p-6 mb-6">
      <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
        <h3 className="text-white font-semibold text-lg">Tendencias de Medidas</h3>

        <div className="flex items-center gap-3">
          {/* Point selector dropdown */}
          <select
            value={selectedSlug}
            onChange={(e) => onSelectedSlugChange(e.target.value)}
            aria-label="Seleccionar punto de medición"
            className="bg-white/10 border border-white/20 text-white text-sm rounded-full px-3 py-1 focus:outline-none focus:border-emerald-400"
          >
            {selectablePoints.map((p) => (
              <option key={p.slug} value={p.slug} className="bg-slate-800">
                {p.active ? p.label : `${p.label} (inactivo)`}
              </option>
            ))}
          </select>

          {/* Period toggle */}
          <div className="flex gap-1">
            <button
              onClick={() => setPeriod('week')}
              className={`px-3 py-1 text-sm font-semibold transition ${
                period === 'week' ? 'text-emerald-400' : 'text-gray-400 hover:text-emerald-400'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1 text-sm font-semibold transition ${
                period === 'month' ? 'text-emerald-400' : 'text-gray-400 hover:text-emerald-400'
              }`}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorMeasure" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="date"
              stroke="rgba(255,255,255,0.5)"
              style={{ fontSize: '0.75rem' }}
            />
            <YAxis
              stroke="rgba(255,255,255,0.5)"
              style={{ fontSize: '0.75rem' }}
              domain={['dataMin - 2', 'dataMax + 2']}
              unit=" cm"
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(13, 26, 51, 0.95)',
                border: '2px solid #10b981',
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(16, 185, 129, 0.2)',
              }}
              labelStyle={{ color: '#fff', fontWeight: 'bold' }}
              formatter={(value) =>
                value != null ? [`${value} cm`, label] : ['Sin datos', label]
              }
              cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorMeasure)"
              dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#064e3b' }}
              activeDot={{ r: 6, fill: '#10b981', stroke: '#6ee7b7', strokeWidth: 2 }}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
    </div>
  );
}
