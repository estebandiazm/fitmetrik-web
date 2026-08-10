'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Client } from '@/domain/types/Client';
import { TablePagination } from './TablePagination';
import { Card } from '../ui/Card';
import { Table, TableHead, TableRow, TableCell } from '../ui/Table';
import { StatusPill } from '../ui/StatusPill';

const PAGE_SIZE = 10;

interface ClientRosterTableProps {
  clients: (Client & { id: string; updatedAt: Date })[];
}

type SortKey = 'name' | 'lastUpdate';

function formatDate(date: Date | string | undefined): string {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ClientRosterTable({ clients }: ClientRosterTableProps) {
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>('lastUpdate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Sort and paginate
  const sorted = useMemo(() => {
    const copy = [...clients];
    copy.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (sortKey === 'name') {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
      } else {
        aVal = new Date(a.updatedAt).getTime();
        bVal = new Date(b.updatedAt).getTime();
      }

      return sortDir === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
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

  const SortIndicator = ({ active, direction }: { active: boolean; direction?: 'asc' | 'desc' }) => {
    if (!active) return <span className="text-on-surface-muted ml-1">↕</span>;
    return <span className="text-primary ml-1">{direction === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--surface-border)]">
        <h2 className="text-base font-semibold text-on-surface">Active Client Roster</h2>
      </div>

      <Table>
        <TableHead>
          <TableRow header>
            <TableCell
              as="th"
              className="cursor-pointer hover:text-on-surface transition-colors"
              onClick={() => toggleSort('name')}
            >
              Client
              <SortIndicator active={sortKey === 'name'} direction={sortDir} />
            </TableCell>
            <TableCell as="th">Goal</TableCell>
            <TableCell as="th">Weight Progress</TableCell>
            <TableCell as="th">Plan Status</TableCell>
            <TableCell
              as="th"
              className="cursor-pointer hover:text-on-surface transition-colors"
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
              <TableCell colSpan={6} className="py-10 text-center text-on-surface-muted">
                No clients yet. Invite your first client to get started.
              </TableCell>
            </tr>
          )}
          {paginated.map((client) => (
            <TableRow key={client.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-xs">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-on-surface">{client.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-on-surface-muted">
                {client.targetWeight ? `${client.targetWeight} kg` : '—'}
              </TableCell>
              <TableCell className="text-on-surface-muted">—</TableCell>
              <TableCell>
                <StatusPill hasPlan={client.plans.length > 0} />
              </TableCell>
              <TableCell className="text-on-surface-muted text-xs">{formatDate(client.updatedAt)}</TableCell>
              <TableCell>
                <Link
                  href={`/clients/${client.id}`}
                  className="text-primary hover:text-primary/80 text-xs font-medium transition-colors"
                >
                  View →
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>

      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-[var(--surface-border)]">
          <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </Card>
  );
}
