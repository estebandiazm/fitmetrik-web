'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Client } from '@/domain/types/Client';
import { TablePagination } from './TablePagination';
import { Card } from '../ui/Card';
import { Table, TableHead, TableRow, TableCell } from '../ui/Table';
import { StatusPill } from '../ui/StatusPill';
import { BlisterCell } from '../ui/blister-cell';

const PAGE_SIZE = 10;

// Structurally matches `domain/services/adherence`'s `WeekCell` without
// importing it — components may only depend on `domain/types/`, so the
// Server Component page (`(dashboard)/clients/page.tsx`) computes the actual
// weekly strip + adherence % (via `buildWeeklyStrip`/`countPopped`) and hands
// the result down as plain props. Same pattern T3 used for the client
// dashboard's `WeightBlisterWidget`.
type RosterWeekCellState = 'popped' | 'missed' | 'pending' | 'locked';
interface RosterWeekCell {
  date: Date;
  state: RosterWeekCellState;
}

interface ClientRosterTableProps {
  clients: (Client & {
    id: string;
    updatedAt: Date;
    weekCells: RosterWeekCell[];
    adherencePct: number;
  })[];
}

type SortKey = 'name' | 'lastUpdate' | 'adherence';

function formatDate(date: Date | string | undefined): string {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Thresholds are a judgment call (no exact figures in the direction
// contract): <50% reads as needing attention (danger), 50–79% is adequate but
// unremarkable (de-emphasized via the faint token), 80%+ is the full-contrast
// "going well" read.
function adherenceColorClass(pct: number): string {
  if (pct < 50) return 'text-danger';
  if (pct < 80) return 'text-text-faint';
  return 'text-text-primary';
}

function SortIndicator({ active, direction }: { active: boolean; direction?: 'asc' | 'desc' }) {
  if (!active) return <span className="text-text-faint ml-1">↕</span>;
  return <span className="text-accent-teal ml-1">{direction === 'asc' ? '↑' : '↓'}</span>;
}

export function ClientRosterTable({ clients }: ClientRosterTableProps) {
  const [page, setPage] = useState(0);
  // Default sort is adherence ascending — most-empty-first, per the direction
  // contract ("ordenados por celdas vacías primero... lo que necesita
  // atención está arriba"). `name`/`lastUpdate` stay available via their
  // column headers exactly as before.
  const [sortKey, setSortKey] = useState<SortKey>('adherence');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Sort and paginate
  const sorted = useMemo(() => {
    const copy = [...clients];
    copy.sort((a, b) => {
      if (sortKey === 'name') {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        return sortDir === 'asc' ? (aName > bName ? 1 : -1) : (aName < bName ? 1 : -1);
      }

      if (sortKey === 'adherence') {
        return sortDir === 'asc'
          ? a.adherencePct - b.adherencePct
          : b.adherencePct - a.adherencePct;
      }

      const aTime = new Date(a.updatedAt).getTime();
      const bTime = new Date(b.updatedAt).getTime();
      return sortDir === 'asc' ? (aTime > bTime ? 1 : -1) : (aTime < bTime ? 1 : -1);
    });
    return copy;
  }, [clients, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0); // Reset to first page on sort change
  };

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-base font-semibold text-text-primary">Active Client Roster</h2>
      </div>

      <Table>
        <TableHead>
          <TableRow header>
            <TableCell
              as="th"
              className="cursor-pointer hover:text-text-primary transition-colors"
              onClick={() => toggleSort('name')}
            >
              Client
              <SortIndicator active={sortKey === 'name'} direction={sortDir} />
            </TableCell>
            <TableCell as="th">Goal</TableCell>
            <TableCell as="th">Weight Progress</TableCell>
            <TableCell
              as="th"
              className="cursor-pointer hover:text-text-primary transition-colors"
              onClick={() => toggleSort('adherence')}
            >
              Adherence
              <SortIndicator active={sortKey === 'adherence'} direction={sortDir} />
            </TableCell>
            <TableCell as="th">Plan Status</TableCell>
            <TableCell
              as="th"
              className="cursor-pointer hover:text-text-primary transition-colors"
              onClick={() => toggleSort('lastUpdate')}
            >
              Last Update
              <SortIndicator active={sortKey === 'lastUpdate'} direction={sortDir} />
            </TableCell>
            <TableCell as="th">Actions</TableCell>
          </TableRow>
        </TableHead>
        <tbody>
          {paginated.length === 0 && (
            <tr>
              <TableCell colSpan={7} className="py-10 text-center text-text-muted">
                Aún no hay clientes. Invita a tu primer cliente para empezar.
              </TableCell>
            </tr>
          )}
          {paginated.map((client) => (
            <TableRow key={client.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent-teal/20 flex items-center justify-center text-accent-teal font-semibold text-xs">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-text-primary">{client.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-text-muted">
                {client.targetWeight ? `${client.targetWeight} kg` : '—'}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {client.weekCells.map((cell, index) => (
                    // Fixed-length (7), fixed-order week grid — index is a
                    // stable key (same convention as WeightBlisterWidget).
                    <BlisterCell
                      key={index}
                      size="sm"
                      state={cell.state}
                      ariaLabel={`Día ${index + 1} — ${cell.state}`}
                    />
                  ))}
                </div>
              </TableCell>
              <TableCell className={`font-mono text-sm font-semibold ${adherenceColorClass(client.adherencePct)}`}>
                {client.adherencePct}%
              </TableCell>
              <TableCell>
                <StatusPill hasPlan={client.plans.length > 0} />
              </TableCell>
              <TableCell className="text-text-muted text-xs">{formatDate(client.updatedAt)}</TableCell>
              <TableCell>
                <Link
                  href={`/clients/${client.id}`}
                  className="text-accent-teal hover:text-accent-teal/80 text-xs font-medium transition-colors"
                >
                  View →
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>

      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-border">
          <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </Card>
  );
}
