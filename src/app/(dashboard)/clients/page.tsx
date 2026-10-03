import { redirect } from 'next/navigation';

import { authProvider } from '@/lib/registry';
import { getCoachByAuthId } from '@/app/actions/coachActions';
import { getClientsByCoachId } from '@/app/actions/clientActions';
import { buildWeeklyStrip, calculateAdherencePct } from '@/domain/services/adherence';
import { CoachHeader } from '@/components/coach/CoachHeader';
import { CoachSidebar } from '@/components/coach/CoachSidebar';
import { MetricsSection } from '@/components/coach/MetricsSection';
import { ClientRosterTable } from '@/components/coach/ClientRosterTable';

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

  // Weekly adherence strip — bucketed here (the Server Component), not inside
  // ClientRosterTable, so the client component never needs its own
  // domain/services import (AGENTS.md forbids components/ importing
  // domain/services/ directly; same pattern T3 used for the client dashboard).
  const clientsWithAdherence = clients.map((client) => {
    const weekCells = buildWeeklyStrip(client.dailyWeights ?? []);
    const adherencePct = calculateAdherencePct(weekCells);
    return { ...client, weekCells, adherencePct };
  });

  return (
    <div className="min-h-screen bg-surface-dim flex flex-col">
      <CoachHeader coachName={coach.name} coachEmail={coach.email} />

      <div className="flex flex-1">
        <CoachSidebar />

        <main className="flex-1 p-6 overflow-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-text-primary">Clientes</h1>
            <p className="text-text-muted text-sm mt-1">
              Gestioná tu cartera de clientes y seguí su progreso.
            </p>
          </div>

          <MetricsSection clients={clients} />

          <div className="mt-6">
            <ClientRosterTable clients={clientsWithAdherence} />
          </div>
        </main>
      </div>
    </div>
  );
}
