'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { getClientById } from '../../actions/clientActions';
import { Client } from '../../../domain/types/Client';
import { DietPlan } from '../../../domain/types/DietPlan';
import Viewer from '../../../components/viewer/Viewer';
import ClientProvider from '../../../context/ClientContext';

// ─── Inner component that reads search params ────────────────────────────────

type ClientWithId = Client & { id: string };

function ViewerContent() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');
  const planIndex = searchParams.get('planIndex');

  const [dbPlans, setDbPlans] = useState<DietPlan[] | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!clientId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) return;

    (async () => {
      try {
        const client: ClientWithId | null = await getClientById(clientId);
        if (!client) {
          setError('Cliente no encontrado.');
          return;
        }
        setClientName(client.name);

        if (planIndex !== null) {
          const idx = parseInt(planIndex, 10);
          if (!isNaN(idx) && idx >= 0 && idx < client.plans.length) {
            setDbPlans([client.plans[idx]]);
          } else {
            setDbPlans(client.plans);
          }
        } else {
          setDbPlans(client.plans);
        }
      } catch {
        setError('Error al cargar el plan.');
      } finally {
        setLoading(false);
      }
    })();
  }, [clientId, planIndex]);

  // ── Database-loaded plan ──
  if (clientId) {
    if (loading) {
      return <p className="m-4 text-white">Cargando plan...</p>;
    }
    if (error) {
      return <p className="m-4 text-red-400">{error}</p>;
    }
    if (dbPlans) {
      return (
        <Viewer
          overridePlans={dbPlans}
          overrideClientName={clientName ?? undefined}
        />
      );
    }
    return null;
  }

  // ── Fallback: use ClientContext (legacy flow from Creator) ──
  return (
    <ClientProvider>
      <Viewer />
    </ClientProvider>
  );
}

// ─── Page wrapper with Suspense for useSearchParams ──────────────────────────

export default function ViewerPage() {
  return (
    <Suspense fallback={<p className="m-4 text-white">Cargando...</p>}>
      <ViewerContent />
    </Suspense>
  );
}