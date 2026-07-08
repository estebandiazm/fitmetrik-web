'use client';

import { useState, useEffect } from 'react';
import { setMeasurementPoints } from '../../app/actions/clientActions';
import { MEASUREMENT_POINTS_CATALOG } from '../../domain/services/bodyMeasurements';
import type { MeasurementPoint } from '../../domain/types/MeasurementPoint';
import type { BodyMeasurement } from '../../domain/types/BodyMeasurement';

interface MeasurementPointsEditorProps {
  clientId: string;
  currentPoints: MeasurementPoint[];
  existingMeasurements?: BodyMeasurement[];
  onSaved?: () => void;
}

function mergeWithCatalog(currentPoints: MeasurementPoint[]): MeasurementPoint[] {
  const storedBySlug = new Map(currentPoints.map((p) => [p.slug, p]));
  return MEASUREMENT_POINTS_CATALOG.map((catalogEntry) => {
    const stored = storedBySlug.get(catalogEntry.slug);
    return stored ?? { ...catalogEntry, active: false };
  });
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

  useEffect(() => {
    setPoints(mergeWithCatalog(currentPoints));
  }, [currentPoints]);

  function countEntriesForPoint(slug: string): number {
    return existingMeasurements.filter((m) => m.pointSlug === slug).length;
  }

  function handleToggle(slug: string) {
    const point = points.find((p) => p.slug === slug);
    if (!point) return;

    if (point.active) {
      const entryCount = countEntriesForPoint(slug);
      if (entryCount > 0) {
        setPendingDeactivateSlug(slug);
        return;
      }
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
      setError(err instanceof Error ? err.message : 'Error saving measurement points');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div data-testid="measurement-points-editor" className="space-y-4">
      <div className="space-y-2">
        {points.map((point) => {
          const entryCount = countEntriesForPoint(point.slug);
          return (
            <div key={point.slug} className="flex flex-col gap-1">
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5 border border-white/10">
                <span className="text-sm text-white">{point.label}</span>
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
                  <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                </label>
              </div>

              {pendingDeactivateSlug === point.slug && (
                <div className="px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm">
                  <p>
                    Tenés {entryCount} registro{entryCount !== 1 ? 's' : ''} para este punto. Se va a
                    ocultar pero los datos no se eliminan. ¿Continuar?
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => applyToggle(point.slug)}
                      className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-200 hover:bg-yellow-500/30 text-xs font-medium transition"
                    >
                      Sí, desactivar
                    </button>
                    <button
                      onClick={() => setPendingDeactivateSlug(null)}
                      className="px-3 py-1 rounded-full bg-white/10 text-gray-300 hover:bg-white/20 text-xs font-medium transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="text-sm bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg p-3">
          {error}
        </div>
      )}

      {success && (
        <div className="text-sm bg-green-500/10 border border-green-500/30 text-green-300 rounded-lg p-3">
          Puntos de medición guardados.
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={loading}
        className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold hover:from-pink-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? '⏳' : 'Save'}
      </button>
    </div>
  );
}
