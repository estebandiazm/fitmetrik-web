'use client';

import React, { useEffect, useRef, useState } from 'react';
import { addDailyWeight } from '@/app/actions/clientActions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { parseDailyWeightInput } from '@/domain/services/activityInputs';
import { toLocalISODate } from '@/domain/services/localDates';
import { Textarea } from '@/components/ui/textarea';

interface DailyWeightModalProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  onSuccess?: () => void;
}

export default function DailyWeightModal({
  open,
  onClose,
  clientId,
  onSuccess,
}: DailyWeightModalProps) {
  const [date, setDate] = useState(() => toLocalISODate());
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  const resetAndClose = () => {
    setDate(toLocalISODate());
    setWeight('');
    setNotes('');
    setSuccess(false);
    onClose();
    onSuccess?.();
  };

  const handleSubmit = async () => {
    setError(null);

    const parsed = parseDailyWeightInput(date, weight);
    if (!parsed.ok) {
      setError(parsed.reason);
      return;
    }

    setLoading(true);

    try {
      await addDailyWeight(clientId, parsed.date, parsed.weight, notes || undefined);
      setSuccess(true);
      resetTimeoutRef.current = setTimeout(resetAndClose, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving weight data');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = !loading && weight.trim() !== '';

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="neu-card w-full max-w-sm mx-4">
        <div className="p-[var(--space-card-p)] border-b border-border">
          <h2 className="text-text-primary font-bold text-lg">Log Weight</h2>
        </div>

        <div className="p-[var(--space-card-p)]">
          {success ? (
            <div className="bg-success/10 border border-success/30 text-success-text rounded-[var(--radius-control)] p-3">
              Weight recorded successfully!
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="daily-weight-date" className="block text-sm text-text-muted mb-2">
                  Date
                </label>
                <Input
                  id="daily-weight-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={toLocalISODate()}
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="daily-weight-value" className="block text-sm text-text-muted mb-2">
                  Weight (kg)
                </label>
                <Input
                  id="daily-weight-value"
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="80.5"
                  step="0.1"
                  min="0.1"
                  max="500"
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="daily-weight-notes" className="block text-sm text-text-muted mb-2">
                  Notes (optional)
                </label>
                <Textarea
                  id="daily-weight-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., After breakfast"
                  rows={2}
                  className="w-full"
                />
              </div>

              {error && (
                <div className="bg-danger/10 border border-danger/30 text-danger-text rounded-[var(--radius-control)] p-3 text-sm">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {!success && (
          <div className="p-[var(--space-card-p)] border-t border-border flex gap-3 justify-end">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="accent"
              size="sm"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && (
                <svg
                  className="animate-spin"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="42"
                    strokeDashoffset="14"
                    opacity="0.9"
                  />
                </svg>
              )}
              Save
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
