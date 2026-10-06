import { redirect } from 'next/navigation';
import { getClientById, getClientByAuthId } from '@/app/actions/clientActions';
import { getCoachByAuthId } from '@/app/actions/coachActions';
import { authProvider } from '@/lib/registry';
import Viewer from '@/components/viewer/Viewer';
import ClientProvider from '@/context/ClientContext';
import { selectPlansByIndex } from '@/domain/services/planSelection';

interface ViewerPageProps {
  searchParams: Promise<{ clientId?: string; planIndex?: string }>;
}

// Database-loaded plan (fetched on the server) when `clientId` is present;
// otherwise the legacy flow from Creator, which reads ClientContext.
export default async function ViewerPage({ searchParams }: ViewerPageProps) {
  const { clientId, planIndex } = await searchParams;
  if (!clientId) {
    return (
      <ClientProvider>
        <Viewer />
      </ClientProvider>
    );
  }
  return <DatabasePlanViewer clientId={clientId} planIndex={planIndex} />;
}

interface DatabasePlanViewerProps {
  clientId: string;
  planIndex?: string;
}

async function DatabasePlanViewer({ clientId, planIndex }: DatabasePlanViewerProps) {
  // Middleware only checks that a session exists; ownership is verified here.
  const session = await authProvider.getSession();
  if (!session) {
    redirect('/login');
  }

  let client: Awaited<ReturnType<typeof getClientById>>;
  try {
    client = await getClientById(clientId);
  } catch {
    return <p className="m-4 text-danger-text">Error al cargar el plan.</p>;
  }
  if (!client) {
    return <p className="m-4 text-danger-text">Cliente no encontrado.</p>;
  }

  // Allowed: the client themself, or the coach who owns this client.
  let authorized = client.authId === session.user.id;
  if (!authorized) {
    try {
      const [coach, self] = await Promise.all([
        getCoachByAuthId(session.user.id),
        getClientByAuthId(session.user.id),
      ]);
      authorized = (!!coach && client.coachId === coach.id) || (!!self && self.id === client.id);
    } catch {
      authorized = false;
    }
  }
  if (!authorized) {
    // Same message as a missing client so ids cannot be probed.
    return <p className="m-4 text-danger-text">Cliente no encontrado.</p>;
  }

  return (
    <Viewer
      overridePlans={selectPlansByIndex(client.plans, planIndex)}
      overrideClientName={client.name ?? undefined}
    />
  );
}
