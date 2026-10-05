'use client';

import { useState } from 'react';
import { setMeasurementPoints } from '@/app/actions/clientActions';
import {
  countEntriesForPoint,
  mergeWithCatalog,
  needsDeactivationConfirmation,
} from '@/domain/services/bodyMeasurements';
import type { MeasurementPoint } from '@/domain/types/MeasurementPoint';
import type { BodyMeasurement } from '@/domain/types/BodyMeasurement';
import { Button } from '@/components/ui/Button';

interface MeasurementPointsEditorProps {
  clientId: string;
  currentPoints: MeasurementPoint[];
  existingMeasurements?: BodyMeasurement[];
  onSaved?: () => void;
}

export default function MeasurementPointsEditor({
  clientId,
  currentPoints,
  existingMeasurements = [],
  onSaved,
}: MeasurementPointsEditorProps) {
  const [points, setPoints] = useState<MeasurementPoint[]>(() =>
    mergeWithCatalog(currentPoints)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pendingDeactivateSlug, setPendingDeactivateSlug] = useState<string | null>(null);

  // Re-sync local editable state when the caller passes a new set of points.
  // Adjusting state during render (instead of in an effect) avoids a
  // cascading re-render — see https://react.dev/learn/you-might-not-need-an-effect
  const [prevCurrentPoints, setPrevCurrentPoints] = useState(currentPoints);
  if (prevCurrentPoints !== currentPoints) {
    setPrevCurrentPoints(currentPoints);
    setPoints(mergeWithCatalog(currentPoints));
  }

  function handleToggle(slug: string) {
    const point = points.find((p) => p.slug === slug);
    if (!point) return;

    if (needsDeactivationConfirmation(point, existingMeasurements)) {
      setPendingDeactivateSlug(slug);
      return;
    }

    applyToggle(slug);
  }

  function applyToggle(slug: string) {
    setPoints((prev) =>
      prev.map((p) => (p.slug === slug ? { ...p, active: !p.active } : p))
    );
    setPendingDeactivateSlug(null);
  }

  async function handleSave() {
    setError(null);
    setLoading(true);

    try {
      await setMeasurementPoints(clientId, points);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSaved?.();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron guardar los puntos de medición');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div data-testid="measurement-points-editor" className="space-y-4">
      <div className="space-y-2">
        {points.map((point) => {
          const entryCount = countEntriesForPoint(existingMeasurements, point.slug);
          return (
            <div key={point.slug} className="flex flex-col gap-1">
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-bg border border-border">
                <span className="text-sm text-text-primary">{point.label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    role="switch"
                    aria-checked={point.active}
                    checked={point.active}
                    onChange={() => handleToggle(point.slug)}
                    data-testid={`measurement-point-toggle-${point.slug}`}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-border-strong peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-panel after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-panel after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-teal" />
                </label>
              </div>

              {pendingDeactivateSlug === point.slug && (
                <div className="px-3 py-2 rounded-lg bg-accent-amber/10 border border-accent-amber/30 text-text-primary text-sm">
                  <p>
                    Tenés {entryCount} registro{entryCount !== 1 ? 's' : ''} para este punto. Se va a
                    ocultar pero los datos no se eliminan. ¿Continuar?
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => applyToggle(point.slug)}
                      className="px-3 py-1 rounded-[var(--radius-control)] bg-accent-amber/20 text-text-primary hover:bg-accent-amber/30 text-xs font-medium transition"
                    >
                      Sí, desactivar
                    </button>
                    <Button variant="ghost" size="sm" onClick={() => setPendingDeactivateSlug(null)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="text-sm bg-danger/10 border border-danger/30 text-danger-text rounded-lg p-3">
          {error}
        </div>
      )}

      {success && (
        <div className="text-sm bg-success/10 border border-success/30 text-success-text rounded-lg p-3">
          Puntos de medición guardados.
        </div>
      )}

      <Button onClick={handleSave} disabled={loading} className="self-start">
        {loading ? 'Guardando…' : 'Guardar'}
      </Button>
    </div>
  );
}
