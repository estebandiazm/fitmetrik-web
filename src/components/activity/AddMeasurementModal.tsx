'use client';

import { useRef, useEffect, useState } from 'react';
import { addMeasurementEntries } from '@/app/actions/clientActions';
import { validateMeasurement } from '@/domain/services/bodyMeasurements';
import type { MeasurementPoint } from '@/domain/types/MeasurementPoint';

interface AddMeasurementModalProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  activePoints: MeasurementPoint[];
  preselectedSlug?: string;
  onSuccess?: () => void;
}

const todayISO = () => new Date().toISOString().split('T')[0];

export default function AddMeasurementModal({
  open,
  onClose,
  clientId,
  activePoints,
  preselectedSlug,
  onSuccess,
}: AddMeasurementModalProps) {
  const [date, setDate] = useState(todayISO());
  const [values, setValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const preselectedRef = useRef<HTMLInputElement | null>(null);

  // Focus preselected input when modal opens
  useEffect(() => {
    if (open && preselectedRef.current) {
      setTimeout(() => preselectedRef.current?.focus(), 50);
    }
  }, [open, preselectedSlug]);

  // Reset form when closed
  useEffect(() => {
    if (!open) {
      setDate(todayISO());
      setValues({});
      setFieldErrors({});
      setGlobalError(null);
      setSuccess(false);
    }
  }, [open]);

  function handleValueChange(slug: string, raw: string) {
    setValues((prev) => ({ ...prev, [slug]: raw }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[slug];
      return next;
    });
  }

  async function handleSubmit() {
    setGlobalError(null);

    // Date validation
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    if (selectedDate > today) {
      setGlobalError('La fecha no puede ser futura');
      return;
    }

    // Build entries from non-empty inputs
    const entries: Array<{ date: Date; pointSlug: string; valueCm: number }> = [];
    const newFieldErrors: Record<string, string> = {};

    for (const point of activePoints) {
      const raw = values[point.slug];
      if (!raw || raw.trim() === '') continue;

      const num = parseFloat(raw);
      if (isNaN(num)) {
        newFieldErrors[point.slug] = 'Ingresá un número válido';
        continue;
      }

      const validation = validateMeasurement(point, num);
      if (!validation.ok) {
        newFieldErrors[point.slug] = validation.reason;
        continue;
      }

      entries.push({ date: selectedDate, pointSlug: point.slug, valueCm: num });
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }

    if (entries.length === 0) {
      setGlobalError('Ingresá al menos un valor para guardar');
      return;
    }

    setLoading(true);
    try {
      await addMeasurementEntries(clientId, entries);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 1200);
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'Error al guardar medidas');
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        data-testid="add-measurement-modal"
        className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-2xl w-full max-w-sm max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5">
          <h2 className="text-white font-bold text-lg">Registrar Medidas</h2>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {success ? (
            <div className="bg-green-500/10 border border-green-500/30 text-green-300 rounded-lg p-3 text-sm">
              ¡Medidas guardadas!
            </div>
          ) : (
            <div className="space-y-4">
              {/* Date */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Fecha</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={todayISO()}
                  className="w-full px-4 py-2 rounded-full bg-white/8 border border-white/25 text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>

              {/* One row per active point */}
              {activePoints.map((point) => {
                const isPreselected = point.slug === preselectedSlug;
                return (
                  <div key={point.slug}>
                    <label className="block text-sm text-gray-400 mb-2">
                      {point.label}{' '}
                      <span className="text-gray-500 text-xs">
                        ({point.minCm}–{point.maxCm} cm)
                      </span>
                    </label>
                    <input
                      ref={isPreselected ? preselectedRef : undefined}
                      type="number"
                      step="0.1"
                      min={point.minCm}
                      max={point.maxCm}
                      placeholder={`ej. ${Math.round((point.minCm + point.maxCm) / 2)}`}
                      value={values[point.slug] ?? ''}
                      onChange={(e) => handleValueChange(point.slug, e.target.value)}
                      data-testid={`add-measurement-input-${point.slug}`}
                      className="w-full px-4 py-2 rounded-full bg-white/8 border border-white/25 text-white placeholder-gray-500 focus:border-emerald-400 focus:outline-none"
                    />
                    {fieldErrors[point.slug] && (
                      <p className="text-red-400 text-xs mt-1 pl-2">
                        {fieldErrors[point.slug]}
                      </p>
                    )}
                  </div>
                );
              })}

              {globalError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg p-3 text-sm">
                  {globalError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="p-6 border-t border-white/5 flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              data-testid="add-measurement-submit"
              className="px-4 py-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              {loading && (
                <span className="material-symbols-outlined text-base animate-spin">
                  progress_activity
                </span>
              )}
              Guardar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
