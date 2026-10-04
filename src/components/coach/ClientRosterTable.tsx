'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Client } from '@/domain/types/Client';
import {
  getAdherenceTier,
  sortByAdherence,
  type AdherenceTier,
  type WeekCell,
  type WeekCellState,
} from '@/domain/services/adherence';
import { TablePagination } from './TablePagination';
import { StatusPill } from '@/components/ui/StatusPill';
import { BlisterCell } from '@/components/ui/blister-cell';
import { ArrowRightIcon } from '@/components/ui/icons';

const PAGE_SIZE = 10;

// The Server Component page (`(dashboard)/clients/page.tsx`) computes each
// client's weekly strip, adherence % and days since the last log.
interface ClientRosterTableProps {
  clients: (Client & {
    id: string;
    weekCells: WeekCell[];
    adherencePct: number;
    daysSinceLastLog?: number;
  })[];
}

const DAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const STATE_LABEL_ES: Record<WeekCellState, string> = {
  popped: 'registrado',
  missed: 'saltado',
  pending: 'pendiente',
  locked: 'bloqueado',
};

const ADHERENCE_CLASS: Record<AdherenceTier, string> = {
  low: 'text-danger-text',
  fair: 'text-text-faint',
  good: 'text-text-primary',
};

function lastLogLabel(days: number | undefined): string {
  if (days === undefined) return 'Sin registros todavía';
  if (days === 0) return 'Último registro: hoy';
  if (days === 1) return 'Último registro: ayer';
  return `Último registro: hace ${days} días`;
}

/**
 * The coach roster — one row per client with their week's blister strip,
 * sorted most-empty-first so whoever needs attention sits at the top.
 */
export function ClientRosterTable({ clients }: ClientRosterTableProps) {
  const [page, setPage] = useState(0);

  const sorted = sortByAdherence(clients);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  if (clients.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-panel px-6 py-12 text-center">
        <p className="text-[15px] font-semibold text-text-primary">Aún no tenés clientes</p>
        <p className="mt-1 text-[13px] text-text-muted">Invitá a tu primer cliente para empezar a ver su blíster.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-panel">
      <ul aria-label="Clientes">
        {paginated.map((client, rowIndex) => (
          <li
            key={client.id}
            data-testid="client-row"
            className="animate-enter flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-row-border px-6 py-5 last:border-b-0"
            style={{ '--enter-delay': `${Math.min(rowIndex, 8) * 40}ms` } as React.CSSProperties}
          >
            <div
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-locked-bg text-sm font-bold text-text-muted"
            >
              {client.name.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-[140px] flex-[1_1_140px]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[15px] font-semibold text-text-primary">{client.name}</span>
                {client.plans.length === 0 && <StatusPill hasPlan={false} />}
              </div>
              <p className="mt-px text-xs text-text-faint">
                {lastLogLabel(client.daysSinceLastLog)}
                {client.targetWeight ? ` · meta ${client.targetWeight} kg` : ''}
              </p>
            </div>

            <ol className="flex shrink-0 gap-1" aria-label={`Semana de ${client.name}`}>
              {client.weekCells.map((cell, index) => (
                // Fixed-length (7), fixed-order week grid — index is a
                // stable key (same convention as WeightBlisterWidget).
                <li key={index}>
                  <BlisterCell
                    size="sm"
                    state={cell.state}
                    ariaLabel={`${DAY_LABELS[index]} — ${STATE_LABEL_ES[cell.state]}`}
                  />
                </li>
              ))}
            </ol>

            <p
              className={`w-11 shrink-0 text-right font-mono text-[15px] font-bold ${ADHERENCE_CLASS[getAdherenceTier(client.adherencePct)]}`}
              aria-label={`Adherencia ${client.adherencePct}%`}
            >
              {client.adherencePct}%
            </p>

            {/* Row action, isolated by distance + a divider from the row's
                primary content (same placement as the artboard). */}
            <div className="ml-1 shrink-0 border-l border-row-border pl-5">
              <Link
                href={`/clients/${client.id}`}
                aria-label={`Ver a ${client.name}`}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-text-faint transition-colors hover:bg-locked-bg hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent-teal"
              >
                <ArrowRightIcon size={16} />
              </Link>
            </div>
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <div className="border-t border-row-border px-6 py-3">
          <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
