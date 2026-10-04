import { Card } from '@/components/ui/Card';
import type { BodyMeasurement } from '@/domain/types/BodyMeasurement';
import type { MeasurementPoint } from '@/domain/types/MeasurementPoint';
import {
  buildMeasurementHistory,
  formatMeasurementDate,
  type MeasurementHistoryRow,
} from '@/domain/services/bodyMeasurements';

interface MeasurementHistoryProps {
  measurements: BodyMeasurement[];
  selectedSlug: string;
  /** Active points + any inactive points that have at least one measurement entry */
  selectablePoints: MeasurementPoint[];
}

interface DeltaCellProps {
  delta: number | null;
}

function DeltaCell({ delta }: DeltaCellProps) {
  if (delta === null) return <span className="text-text-faint">—</span>;
  if (delta > 0) {
    return <span className="text-danger font-medium">+{delta.toFixed(1)} ▲</span>;
  }
  if (delta < 0) {
    return <span className="text-success font-medium">{delta.toFixed(1)} ▼</span>;
  }
  return <span className="text-text-muted">0.0</span>;
}

interface HistoryRowProps {
  row: MeasurementHistoryRow;
  index: number;
}

function HistoryRow({ row: { entry, delta }, index }: HistoryRowProps) {
  return (
    <tr
      data-testid={`measurement-history-row-${index}`}
      className="border-b border-row-border hover:bg-row-border transition"
    >
      <td className="py-2 text-text-primary">{formatMeasurementDate(entry.date)}</td>
      <td className="py-2 text-right text-text-primary font-medium">{entry.valueCm.toFixed(1)}</td>
      <td className="py-2 text-right">
        <DeltaCell delta={delta} />
      </td>
    </tr>
  );
}

interface HistoryTableProps {
  rows: MeasurementHistoryRow[];
}

function HistoryTable({ rows }: HistoryTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left text-text-muted pb-2 font-medium">Fecha</th>
            <th className="text-right text-text-muted pb-2 font-medium">Medida (cm)</th>
            <th className="text-right text-text-muted pb-2 font-medium">Cambio</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <HistoryRow key={`${row.entry.pointSlug}-${String(row.entry.date)}-${index}`} row={row} index={index} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MeasurementHistory({
  measurements,
  selectedSlug,
  selectablePoints,
}: MeasurementHistoryProps) {
  const rows = buildMeasurementHistory(measurements, selectedSlug);
  const label = selectablePoints.find((p) => p.slug === selectedSlug)?.label ?? selectedSlug;

  return (
    <div data-testid="measurement-history">
      <Card className="p-6">
        <h3 className="text-text-primary font-semibold text-base mb-3">Historial — {label}</h3>
        {rows.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-4">Sin registros todavía.</p>
        ) : (
          <HistoryTable rows={rows} />
        )}
      </Card>
    </div>
  );
}
