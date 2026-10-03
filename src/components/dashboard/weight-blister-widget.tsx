'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { BlisterCell } from '@/components/ui/blister-cell';
import DailyWeightModal from '@/components/client/DailyWeightModal';
import { DailyWeight } from '@/domain/types/DailyWeight';

// Structurally matches `domain/services/adherence`'s `WeekCell` without
// importing it — components may only depend on `domain/types/`, so the
// Server Component page computes the actual weekly strip (via
// `buildWeeklyStrip`/`countPopped`/`findEntryForDate`) and hands the result
// down as plain props. This also means this client component never calls
// `new Date()` itself, so there's no server/client clock or timezone skew
// to worry about across the RSC boundary.
type WeightBlisterCellState = 'popped' | 'missed' | 'pending' | 'locked';
interface WeightBlisterCell {
  date: Date;
  state: WeightBlisterCellState;
}

interface WeightBlisterWidgetProps {
  clientId: string;
  cells: WeightBlisterCell[];
  count: number;
  todayEntry?: DailyWeight;
  targetWeight?: number;
}

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export function WeightBlisterWidget({
  clientId,
  cells,
  count,
  todayEntry,
  targetWeight,
}: WeightBlisterWidgetProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isLoggedToday = todayEntry !== undefined;

  // Dashboard renders a demo/mock experience when the signed-in user has no
  // real client record yet (`clientId` empty) — the hero stays visually
  // "pending" but non-interactive, since there's nothing real to persist.
  const canLog = clientId !== '';

  const handleHeroClick = () => {
    if (!canLog || isLoggedToday) return;
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <Card className="rounded-3xl p-6 flex flex-col items-center gap-4 text-center">
      <h3 className="self-start text-text-muted text-xs font-bold uppercase tracking-widest">
        Peso
      </h3>

      <BlisterCell
        size="lg"
        state={isLoggedToday ? 'popped' : 'pending'}
        onClick={canLog && !isLoggedToday ? handleHeroClick : undefined}
        ariaLabel={isLoggedToday ? 'Peso de hoy ya registrado' : 'Registrar peso de hoy'}
      />

      <div>
        <p className="text-sm font-semibold text-text-primary">
          {isLoggedToday ? 'Peso de hoy' : 'Toca para loguear'}
        </p>
        <p className="text-xs text-text-muted font-mono mt-1">
          {todayEntry
            ? `${todayEntry.weight} kg`
            : targetWeight
              ? `Meta: ${targetWeight} kg`
              : 'Sin registro aún'}
        </p>
      </div>

      <div className="flex items-end gap-2">
        {cells.map((cell, index) => (
          // Fixed-length (7), fixed-order week grid — index is a stable key.
          <div key={index} className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-semibold text-text-faint uppercase">
              {DAY_LABELS[index]}
            </span>
            <BlisterCell
              size="md"
              state={cell.state}
              ariaLabel={`${DAY_LABELS[index]} — ${cell.state}`}
            />
          </div>
        ))}
      </div>

      <p className="font-mono text-2xl font-bold text-text-primary mt-1">
        {count}/7 <span className="text-xs font-sans font-medium text-text-muted">esta semana</span>
      </p>

      <DailyWeightModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clientId={clientId}
        onSuccess={handleSuccess}
      />
    </Card>
  );
}
