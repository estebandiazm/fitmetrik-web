'use client';

import React, { useEffect, useState } from 'react';
import { getClients, createClient, addDietPlanToClient } from '@/app/actions/clientActions';
import { Client } from '../../domain/types/Client';
import { DietPlan } from '../../domain/types/DietPlan';

// ─── types ──────────────────────────────────────────────────────────────────

type ClientWithId = Client & { id: string };

interface SavePlanModalProps {
  open: boolean;
  onClose: () => void;
  plans: DietPlan[];
  coachId: string;
}

// ─── component ──────────────────────────────────────────────────────────────

export default function SavePlanModal({ open, onClose, plans, coachId }: SavePlanModalProps) {
  const [clients, setClients] = useState<ClientWithId[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientWithId | null>(null);
  const [newClientName, setNewClientName] = useState('');
  const [isNewClient, setIsNewClient] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingClients, setFetchingClients] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset transient state whenever the modal transitions to open.
  // Adjusting state during render (instead of in an effect) avoids a
  // cascading re-render — see https://react.dev/learn/you-might-not-need-an-effect
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) {
      setError(null);
      setSuccess(false);
      setSelectedClient(null);
      setNewClientName('');
      setIsNewClient(false);
    }
  }

  // Fetch existing clients when modal opens
  useEffect(() => {
    if (!open) return;

    (async () => {
      setFetchingClients(true);
      try {
        const data = await getClients();
        setClients(data);
        if (data.length === 0) setIsNewClient(true);
      } catch {
        // silently fail – user can still create a new client
        setClients([]);
        setIsNewClient(true);
      } finally {
        setFetchingClients(false);
      }
    })();
  }, [open]);

  const needsNewClientName = (isNewClient || !selectedClient) && !newClientName.trim();

  // Existing client id, or a freshly created one.
  const resolveTargetClientId = async (): Promise<string> => {
    if (!isNewClient && selectedClient) return selectedClient.id;
    const created = await createClient({ name: newClientName.trim(), coachId });
    return created.id;
  };

  const handleSave = async () => {
    setError(null);
    if (needsNewClientName) {
      setError('Ingresa un nombre para el nuevo cliente.');
      return;
    }

    setLoading(true);
    try {
      const targetClientId = await resolveTargetClientId();
      for (const plan of plans) await addDietPlanToClient(targetClientId, plan);
      setSuccess(true);
      setTimeout(() => onClose(), 1500);
    } catch {
      setError('Error al guardar. Verifica la conexión con la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  const canSave = isNewClient ? newClientName.trim().length > 0 : selectedClient !== null;

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="neu-card w-full max-w-sm mx-4">
        {/* Header */}
        <div className="border-b border-border px-6 py-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary">save</span>
          <h2 className="text-text-primary font-bold">Guardar en Base de Datos</h2>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {success ? (
            <div className="bg-success/10 border border-success/30 rounded-lg p-3 text-success">
              ✓ ¡Planes guardados exitosamente!
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-text-muted text-sm">
                {plans.length} plan{plans.length !== 1 ? 'es' : ''} se guardarán en el perfil del cliente.
              </p>

              {fetchingClients ? (
                <div className="flex justify-center py-6">
                  <span className="material-symbols-outlined text-tertiary text-2xl animate-spin">hourglass_empty</span>
                </div>
              ) : (
                <>
                  {!isNewClient && clients.length > 0 && (
                    <>
                      <select
                        value={selectedClient?.id ?? ''}
                        onChange={(e) => {
                          const client = clients.find((c) => c.id === e.target.value);
                          setSelectedClient(client || null);
                        }}
                        className="w-full px-4 py-2 rounded-[var(--radius-control)] border border-border bg-panel text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent-teal focus:ring-3 focus:ring-accent-teal/20"
                      >
                        <option value="">Seleccionar Cliente</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => setIsNewClient(true)}
                        className="text-xs text-text-muted hover:text-tertiary transition flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">add_circle</span> Crear nuevo cliente
                      </button>
                    </>
                  )}

                  {isNewClient && (
                    <>
                      <input
                        type="text"
                        placeholder="Nombre del Cliente"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        autoFocus
                        className="w-full px-4 py-2 rounded-[var(--radius-control)] border border-border bg-panel text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent-teal focus:ring-3 focus:ring-accent-teal/20"
                      />
                      {clients.length > 0 && (
                        <button
                          onClick={() => setIsNewClient(false)}
                          className="text-xs text-text-muted hover:text-tertiary transition"
                        >
                          ← Seleccionar cliente existente
                        </button>
                      )}
                    </>
                  )}
                </>
              )}

              {error && (
                <div className="bg-danger/10 border border-danger/30 rounded-lg p-3 text-danger text-sm">
                  ❌ {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {!success && (
          <div className="border-t border-border px-6 py-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-text-muted hover:text-text-primary transition text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave || loading}
              className="px-6 py-2 rounded-[var(--radius-control)] neu-btn-accent font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              {loading ? (
                <span className="material-symbols-outlined text-sm animate-spin">hourglass_empty</span>
              ) : (
                <span className="material-symbols-outlined text-sm">save</span>
              )}
              Guardar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
