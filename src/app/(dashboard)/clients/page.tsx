import Link from 'next/link';
import { redirect } from 'next/navigation';

import { authProvider } from '@/lib/registry';
import { getCoachByAuthId } from '@/app/actions/coachActions';
import { getClientsByCoachId } from '@/app/actions/clientActions';
import {
  buildWeeklyStrip,
  calculateAdherencePct,
  daysSinceLastEntry,
} from '@/domain/services/adherence';
import { CoachHeader } from '@/components/coach/CoachHeader';
import { ClientRosterTable } from '@/components/coach/ClientRosterTable';
import { PlusIcon } from '@/components/ui/icons';

export default async function ClientsPage() {
  const session = await authProvider.getSession();
  if (!session) {
    redirect('/login');
  }

  const coach = await getCoachByAuthId(session.user.id);
  if (!coach) {
    redirect('/login?error=Coach+profile+not+found');
  }

  const clients = await getClientsByCoachId(coach.id);

  // Weekly adherence strip + last-log recency — computed here (the Server
  // Component), not inside ClientRosterTable, so the client component never
  // needs its own domain/services import (AGENTS.md forbids components/
  // importing domain/services/ directly).
  const clientsWithAdherence = clients.map((client) => {
    const dailyWeights = client.dailyWeights ?? [];
    const weekCells = buildWeeklyStrip(dailyWeights);
    return {
      ...client,
      weekCells,
      adherencePct: calculateAdherencePct(weekCells),
      daysSinceLastLog: daysSinceLastEntry(dailyWeights),
    };
  });

  const withoutPlan = clients.filter((client) => client.plans.length === 0).length;

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <CoachHeader coachName={coach.name} coachEmail={coach.email} />

      <main className="mx-auto flex w-full max-w-[980px] flex-col gap-7 px-6 pb-16 pt-10 sm:px-8 sm:pt-14">
        <div className="animate-enter flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-faint">FitMetrik Coach</p>
            <h1 className="mt-1 text-[28px] font-bold text-text-primary">Mis clientes</h1>
          </div>
          <Link
            href="/clients/new"
            className="neu-btn-accent inline-flex items-center gap-2 rounded-[10px] px-5 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-teal"
          >
            <PlusIcon size={16} />
            Nuevo cliente
          </Link>
        </div>

        <p className="animate-enter -mt-3 text-[13px] text-text-muted" style={{ '--enter-delay': '60ms' } as React.CSSProperties}>
          {clients.length > 0 && (
            <span className="font-mono text-text-primary">
              {clients.length} {clients.length === 1 ? 'cliente' : 'clientes'}
              {withoutPlan > 0 ? ` · ${withoutPlan} sin plan` : ''}
            </span>
          )}
          {clients.length > 0 && ' — '}
          Ordenados por celdas vacías primero: lo que necesita atención está arriba.
        </p>

        <ClientRosterTable clients={clientsWithAdherence} />
      </main>
    </div>
  );
}
