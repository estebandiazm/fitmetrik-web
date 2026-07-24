'use client';

import React, { useEffect, useState } from 'react';
import { getClients, createClient, addDietPlanToClient } from '../../app/actions/clientActions';
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

  // Fetch existing clients when modal opens
  useEffect(() => {
    if (!open) return;
    setError(null);
    setSuccess(false);
    setSelectedClient(null);
    setNewClientName('');
    setIsNewClient(false);

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

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      let targetClientId: string;

      if (isNewClient || !selectedClient) {
        if (!newClientName.trim()) {
          setError('Ingresa un nombre para el nuevo cliente.');
          setLoading(false);
          return;
        }
        const created = await createClient({
          name: newClientName.trim(),
          coachId,
        });
        targetClientId = created.id;
      } else {
        targetClientId = selectedClient.id;
      }

      // Push each plan to the client
      for (const plan of plans) {
        await addDietPlanToClient(targetClientId, plan);
      }

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
      <div className="bg-gradient-to-b from-[#0d1a33] to-[#14285a] border border-white/10 rounded-2xl w-full max-w-sm mx-4">
        {/* Header */}
        <div className="border-b border-white/10 px-6 py-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary">save</span>
          <h2 className="text-white font-bold">Guardar en Base de Datos</h2>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {success ? (
            <div className="bg-green-500/12 border border-green-500/25 rounded-lg p-3 text-green-400">
              ✓ ¡Planes guardados exitosamente!
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-white/60 text-sm">
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
                        className="w-full px-4 py-2 rounded-full neu-inset border border-transparent text-white focus:border-tertiary focus:outline-none"
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
                        className="text-xs text-white/60 hover:text-tertiary transition flex items-center gap-1"
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
                        className="w-full px-4 py-2 rounded-full neu-inset border border-transparent text-white placeholder-gray-400 focus:border-tertiary focus:outline-none"
                      />
                      {clients.length > 0 && (
                        <button
                          onClick={() => setIsNewClient(false)}
                          className="text-xs text-white/60 hover:text-tertiary transition"
                        >
                          ← Seleccionar cliente existente
                        </button>
                      )}
                    </>
                  )}
                </>
              )}

              {error && (
                <div className="bg-red-500/12 border border-red-500/25 rounded-lg p-3 text-red-400 text-sm">
                  ❌ {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {!success && (
          <div className="border-t border-white/10 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-white/50 hover:text-white/70 transition text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave || loading}
              className="px-6 py-2 rounded-full neu-btn-accent font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2"
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
