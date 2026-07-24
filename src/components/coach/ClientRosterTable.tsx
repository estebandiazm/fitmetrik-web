'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Client } from '@/domain/types/Client';
import { TablePagination } from './TablePagination';

const PAGE_SIZE = 10;

interface ClientRosterTableProps {
  clients: (Client & { id: string; updatedAt: Date })[];
}

type SortKey = 'name' | 'lastUpdate';

function getPlanStatus(client: Client & { id: string }): {
  label: string;
  color: string;
} {
  if (client.plans.length === 0) {
    return { label: 'No Plan', color: 'text-red-400 bg-red-400/10' };
  }
  return { label: 'Active', color: 'text-green-400 bg-green-400/10' };
}

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
    if (!active) return <span className="text-[#475569] ml-1">↕</span>;
    return <span className="text-[#2dd4bf] ml-1">{direction === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#1e293b]">
        <h2 className="text-base font-semibold text-white">Active Client Roster</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[#64748b] text-xs uppercase tracking-wider border-b border-[#1e293b]">
              <th className="px-5 py-3 text-left font-medium cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('name')}>
                Client
                <SortIndicator active={sortKey === 'name'} direction={sortDir} />
              </th>
              <th className="px-5 py-3 text-left font-medium">Goal</th>
              <th className="px-5 py-3 text-left font-medium">Weight Progress</th>
              <th className="px-5 py-3 text-left font-medium">Plan Status</th>
              <th className="px-5 py-3 text-left font-medium cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('lastUpdate')}>
                Last Update
                <SortIndicator active={sortKey === 'lastUpdate'} direction={sortDir} />
              </th>
              <th className="px-5 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-[#475569]">
                  No clients yet. Invite your first client to get started.
                </td>
              </tr>
            )}
            {paginated.map((client) => {
              const status = getPlanStatus(client);
              return (
                <tr
                  key={client.id}
                  className="border-b border-[#1e293b] hover:bg-[#1e293b]/40 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#2dd4bf]/20 flex items-center justify-center text-[#2dd4bf] font-semibold text-xs">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-white">{client.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[#94a3b8]">
                    {client.targetWeight ? `${client.targetWeight} kg` : '—'}
                  </td>
                  <td className="px-5 py-4 text-[#94a3b8]">—</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[#94a3b8] text-xs">
                    {formatDate(client.updatedAt)}
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/clients/${client.id}`}
                      className="text-[#2dd4bf] hover:text-[#5eead4] text-xs font-medium transition-colors"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-[#1e293b]">
          <TablePagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
