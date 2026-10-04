import { getClientById } from '@/app/actions/clientActions';
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
  let client: Awaited<ReturnType<typeof getClientById>>;
  try {
    client = await getClientById(clientId);
  } catch {
    return <p className="m-4 text-danger-text">Error al cargar el plan.</p>;
  }
  if (!client) {
    return <p className="m-4 text-danger-text">Cliente no encontrado.</p>;
  }
  return (
    <Viewer
      overridePlans={selectPlansByIndex(client.plans, planIndex)}
      overrideClientName={client.name ?? undefined}
    />
  );
}
