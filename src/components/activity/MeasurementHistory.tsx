'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import type { BodyMeasurement } from '@/domain/types/BodyMeasurement';
import type { MeasurementPoint } from '@/domain/types/MeasurementPoint';

interface MeasurementHistoryProps {
  measurements: BodyMeasurement[];
  selectedSlug: string;
  /** Active points + any inactive points that have at least one measurement entry */
  selectablePoints: MeasurementPoint[];
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function DeltaCell({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-gray-500">—</span>;
  if (delta > 0) {
    return <span className="text-rose-400 font-medium">+{delta.toFixed(1)} ▲</span>;
  }
  if (delta < 0) {
    return <span className="text-emerald-400 font-medium">{delta.toFixed(1)} ▼</span>;
  }
  return <span className="text-gray-400">0.0</span>;
}

export default function MeasurementHistory({
  measurements,
  selectedSlug,
  selectablePoints,
}: MeasurementHistoryProps) {
  const forPoint = measurements
    .filter((m) => m.pointSlug === selectedSlug)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const selectedPoint = selectablePoints.find((p) => p.slug === selectedSlug);
  const label = selectedPoint?.label ?? selectedSlug;

  if (forPoint.length === 0) {
    return (
      <div data-testid="measurement-history">
        <GlassCard className="p-6">
          <h3 className="text-white font-semibold text-base mb-3">
            Historial — {label}
          </h3>
          <p className="text-gray-400 text-sm text-center py-4">Sin registros todavía.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div data-testid="measurement-history">
    <GlassCard className="p-6">
      <h3 className="text-white font-semibold text-base mb-3">Historial — {label}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-gray-400 pb-2 font-medium">Fecha</th>
              <th className="text-right text-gray-400 pb-2 font-medium">Medida (cm)</th>
              <th className="text-right text-gray-400 pb-2 font-medium">Cambio</th>
            </tr>
          </thead>
          <tbody>
            {forPoint.map((entry, index) => {
              const prev = forPoint[index + 1];
              const delta = prev != null ? entry.valueCm - prev.valueCm : null;
              return (
                <tr
                  key={`${entry.pointSlug}-${String(entry.date)}-${index}`}
                  data-testid={`measurement-history-row-${index}`}
                  className="border-b border-white/5 hover:bg-white/5 transition"
                >
                  <td className="py-2 text-white">{formatDate(entry.date)}</td>
                  <td className="py-2 text-right text-white font-medium">
                    {entry.valueCm.toFixed(1)}
                  </td>
                  <td className="py-2 text-right">
                    <DeltaCell delta={delta} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </GlassCard>
    </div>
  );
}
