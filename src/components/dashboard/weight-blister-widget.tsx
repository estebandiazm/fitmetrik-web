'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { BlisterCell } from '@/components/ui/blister-cell';
import DailyWeightModal from '@/components/client/DailyWeightModal';
import { DailyWeight } from '@/domain/types/DailyWeight';

// Structurally matches `domain/services/adherence`'s `WeekCell` without
// importing it — components may only depend on `domain/types/`, so the
// Server Component page computes the actual weekly strip (via
// `buildWeeklyStrip`/`countPopped`/`findEntryForDate`) and hands the result
// down as plain props.
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

const STATE_LABEL_ES: Record<WeightBlisterCellState, string> = {
  popped: 'registrado',
  missed: 'saltado',
  pending: 'pendiente',
  locked: 'bloqueado',
};

const subscribeNoop = () => () => {};

/**
 * "Miércoles 2 de octubre" in the viewer's own clock and timezone. Read via
 * `useSyncExternalStore` with an empty server snapshot so SSR never bakes in
 * the server's date (wrong for anyone west of UTC late in the evening) and
 * hydration never mismatches — the label fills in on the client.
 */
function useTodayLabel(): string {
  return useSyncExternalStore(
    subscribeNoop,
    () => {
      const label = new Date().toLocaleDateString('es', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
      const withoutComma = label.replace(',', '');
      return withoutComma.charAt(0).toUpperCase() + withoutComma.slice(1);
    },
    () => '',
  );
}

function enterDelay(ms: number): React.CSSProperties {
  return { '--enter-delay': `${ms}ms` } as React.CSSProperties;
}

/**
 * The client's "Hoy" hero — the "Cliente — Hoy" artboard: today's dose cell
 * as the single focal action, then the week's blister strip and its X/7
 * count in tabular mono.
 */
export function WeightBlisterWidget({
  clientId,
  cells,
  count,
  todayEntry,
  targetWeight,
}: WeightBlisterWidgetProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const todayLabel = useTodayLabel();

  const isLoggedToday = todayEntry !== undefined;

  // Dashboard renders a demo/mock experience when the signed-in user has no
  // real client record yet (`clientId` empty) — the hero stays visually
  // "pending" but non-interactive, since there's nothing real to persist.
  const canLog = clientId !== '';

  const statusText = isLoggedToday
    ? `Registrado · ${todayEntry.weight} kg`
    : targetWeight
      ? `Pendiente · meta ${targetWeight} kg`
      : 'Pendiente';

  return (
    <section
      aria-label="Hoy"
      className="flex flex-col gap-8 md:rounded-2xl md:border md:border-border md:bg-panel md:p-8"
    >
      <header className="animate-enter flex flex-col gap-0.5">
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-text-faint">Hoy</p>
        <h1 className="min-h-7 text-xl font-semibold text-text-primary">
          {todayLabel}
        </h1>
      </header>

      <div className="animate-enter flex flex-col items-center gap-3.5" style={enterDelay(80)}>
        <BlisterCell
          size="lg"
          state={isLoggedToday ? 'popped' : 'pending'}
          onClick={canLog && !isLoggedToday ? () => setIsModalOpen(true) : undefined}
          ariaLabel={isLoggedToday ? 'Peso de hoy ya registrado' : 'Registrar peso de hoy'}
          className="hover:scale-[1.02] active:scale-[0.98] transition-transform"
          pendingContent={
            <span className="flex flex-col items-center gap-1">
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-border-strong)"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
              </svg>
              <span className="text-xs font-medium text-text-faint">
                {canLog ? 'Toca para loguear' : 'Sin registro'}
              </span>
            </span>
          }
        />
        <div className="text-center">
          <p className="font-mono text-[15px] font-semibold text-text-primary">Peso de hoy</p>
          <p className="mt-0.5 text-[13px] text-text-muted">{statusText}</p>
        </div>
      </div>

      <div className="animate-enter flex flex-col gap-2.5" style={enterDelay(160)}>
        <ol className="flex justify-between gap-1.5" aria-label="Registro de peso de esta semana">
          {cells.map((cell, index) => (
            // Fixed-length (7), fixed-order week grid — index is a stable key.
            <li key={index} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-[11px] font-semibold tracking-[0.04em] text-text-faint" aria-hidden="true">
                {DAY_LABELS[index]}
              </span>
              <BlisterCell
                size="md"
                state={cell.state}
                ariaLabel={`${DAY_LABELS[index]} — ${STATE_LABEL_ES[cell.state]}`}
              />
            </li>
          ))}
        </ol>
        <p className="flex items-baseline gap-1.5 pt-0.5">
          <span className="font-mono text-[28px] font-bold text-text-primary">{count}</span>
          <span className="font-mono text-base font-medium text-text-faint">/7 esta semana</span>
        </p>
      </div>

      <DailyWeightModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clientId={clientId}
        onSuccess={() => router.refresh()}
      />
    </section>
  );
}
