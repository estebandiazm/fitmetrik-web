'use client';

import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { addMeasurementEntries } from '@/app/actions/clientActions';
import {
  buildMeasurementEntries,
  formatMeasurementReference,
  groupPoints,
  isFutureDate,
  isNoDataValue,
  sanitizeDecimalInput,
  stepMeasurementValue,
} from '@/domain/services/bodyMeasurements';
import { Modal } from '@/components/ui/Modal';
import type { MeasurementPoint } from '@/domain/types/MeasurementPoint';
import type { BodyMeasurement } from '@/domain/types/BodyMeasurement';

interface AddMeasurementModalProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  activePoints: MeasurementPoint[];
  preselectedSlug?: string;
  measurements?: BodyMeasurement[];
  onSuccess?: () => void;
}

const todayISO = () => new Date().toISOString().split('T')[0];

export default function AddMeasurementModal({
  open,
  onClose,
  clientId,
  activePoints,
  preselectedSlug,
  measurements = [],
  onSuccess,
}: AddMeasurementModalProps) {
  const [date, setDate] = useState(todayISO());
  const [values, setValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const groups = groupPoints(activePoints);
  const orderedSlugs = groups.flatMap((group) => group.points.map((point) => point.slug));

  // Reset the form whenever the modal transitions to closed. Adjusting state
  // during render (instead of in an effect) avoids a cascading re-render.
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (!open) {
      setDate(todayISO());
      setValues({});
      setFieldErrors({});
      setGlobalError(null);
      setSavedSlugs([]);
      setLoading(false);
    }
  }

  // Highlight + reveal the preselected tile when the modal opens.
  useEffect(() => {
    if (!open || !preselectedSlug) return;
    const el = inputRefs.current[preselectedSlug];
    if (!el) return;
    const timer = setTimeout(() => {
      el.focus();
      el.scrollIntoView({ block: 'center' });
    }, 50);
    return () => clearTimeout(timer);
  }, [open, preselectedSlug]);

  function clearFieldState(slug: string) {
    setFieldErrors((prev) => {
      if (!(slug in prev)) return prev;
      const next = { ...prev };
      delete next[slug];
      return next;
    });
    setSavedSlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : prev));
  }

  function handleValueChange(slug: string, raw: string) {
    const clean = sanitizeDecimalInput(raw);
    setValues((prev) => ({ ...prev, [slug]: clean }));
    clearFieldState(slug);
  }

  function handleStep(slug: string, delta: number) {
    setValues((prev) => ({ ...prev, [slug]: stepMeasurementValue(prev[slug] ?? '', delta) }));
    clearFieldState(slug);
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>, slug: string) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const index = orderedSlugs.indexOf(slug);
    const nextSlug = orderedSlugs[index + 1];
    if (nextSlug) inputRefs.current[nextSlug]?.focus();
    else inputRefs.current[slug]?.blur();
  }

  async function handleSubmit() {
    setGlobalError(null);

    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    if (isFutureDate(selectedDate)) {
      setGlobalError('La fecha no puede ser futura');
      return;
    }

    const { entries, fieldErrors: buildErrors } = buildMeasurementEntries(
      activePoints,
      values,
      selectedDate
    );
    setFieldErrors(buildErrors);
    const flagged = Object.keys(buildErrors).length > 0;

    if (entries.length === 0) {
      if (!flagged) setGlobalError('Ingresá al menos un valor para guardar');
      return;
    }

    setLoading(true);
    try {
      await addMeasurementEntries(clientId, entries);
      const savedNow = entries.map((entry) => entry.pointSlug);

      setValues((prev) => {
        const next = { ...prev };
        for (const slug of savedNow) delete next[slug];
        return next;
      });

      onSuccess?.();

      if (flagged) {
        setSavedSlugs(savedNow);
      } else {
        onClose();
      }
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'Error al guardar medidas');
    } finally {
      setLoading(false);
    }
  }

  const { entries: readyEntries } = buildMeasurementEntries(activePoints, values, new Date(date));
  const readyCount = readyEntries.length;

  const footer = (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-on-surface-variant tabular-nums">
        {readyCount} {readyCount === 1 ? 'medida lista' : 'medidas listas'}
      </span>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-on-surface-variant hover:text-on-surface transition"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          data-testid="add-measurement-submit"
          className="px-4 py-2 rounded-full neu-btn-accent font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
        >
          {loading && (
            <span className="material-symbols-outlined text-base animate-spin">
              progress_activity
            </span>
          )}
          Guardar
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar Medidas"
      size="lg"
      testId="add-measurement-modal"
      footer={footer}
    >
      <div className="space-y-5">
        <div>
          <label className="block text-sm text-on-surface-variant mb-2">Fecha</label>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            max={todayISO()}
            className="w-full px-4 py-2 rounded-full neu-inset border border-transparent text-on-surface [color-scheme:dark] focus:border-primary focus:outline-none"
          />
        </div>

        {globalError && (
          <div
            role="alert"
            className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg p-3 text-sm"
          >
            {globalError}
          </div>
        )}

        {groups.map((group) => (
          <div key={group.group} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              {group.group}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {group.points.map((point) => {
                const raw = values[point.slug] ?? '';
                const isZero = raw.trim() !== '' && isNoDataValue(raw);
                const error = fieldErrors[point.slug];
                const saved = savedSlugs.includes(point.slug);
                const reference = formatMeasurementReference(measurements, point.slug);
                const isPreselected = point.slug === preselectedSlug;
                const isLast = orderedSlugs[orderedSlugs.length - 1] === point.slug;

                const tileClassName = [
                  'neu-inset rounded-xl p-3 flex flex-col gap-1.5 min-w-0',
                  isPreselected ? 'ring-2 ring-primary' : '',
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <div key={point.slug} className={tileClassName}>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-medium text-on-surface-variant truncate">
                        {point.label}
                      </span>
                      {saved && (
                        <span className="material-symbols-outlined text-sm text-emerald-400">
                          check
                        </span>
                      )}
                    </div>

                    <div className="flex min-w-0 items-center gap-1 sm:gap-0.5">
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-label={`Restar 0.5 a ${point.label}`}
                        onClick={() => handleStep(point.slug, -0.5)}
                        className="shrink-0 w-6 h-6 rounded-full neu-btn text-on-surface-variant hover:text-on-surface transition leading-none"
                      >
                        −
                      </button>
                      <input
                        ref={(el) => {
                          inputRefs.current[point.slug] = el;
                        }}
                        type="text"
                        inputMode="decimal"
                        enterKeyHint={isLast ? 'done' : 'next'}
                        placeholder="—"
                        value={raw}
                        onChange={(event) => handleValueChange(point.slug, event.target.value)}
                        onKeyDown={(event) => handleInputKeyDown(event, point.slug)}
                        data-testid={`add-measurement-input-${point.slug}`}
                        className="flex-1 min-w-[4ch] bg-transparent text-center text-lg font-semibold tabular-nums text-on-surface placeholder-gray-500 focus:outline-none"
                      />
                      <span className="shrink-0 text-xs text-on-surface-variant">cm</span>
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-label={`Sumar 0.5 a ${point.label}`}
                        onClick={() => handleStep(point.slug, 0.5)}
                        className="shrink-0 w-6 h-6 rounded-full neu-btn text-on-surface-variant hover:text-on-surface transition leading-none"
                      >
                        +
                      </button>
                    </div>

                    {error ? (
                      <p className="text-red-400 text-xs">{error}</p>
                    ) : isZero ? (
                      <p className="text-on-surface-variant text-xs">no se guarda</p>
                    ) : reference ? (
                      <p className="text-on-surface-variant text-xs truncate">{reference}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
