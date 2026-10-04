'use client';

import React, { useState } from 'react';
import { addDailyStep } from '@/app/actions/clientActions';
import { parseDailyStepInput } from '@/domain/services/activityInputs';
import { toLocalISODate } from '@/domain/services/localDates';

interface DailyStepsModalProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  onSuccess?: () => void;
}

export default function DailyStepsModal({
  open,
  onClose,
  clientId,
  onSuccess,
}: DailyStepsModalProps) {
  const [date, setDate] = useState(toLocalISODate());
  const [steps, setSteps] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetAndClose = () => {
    setDate(toLocalISODate());
    setSteps('');
    setNotes('');
    setSuccess(false);
    onClose();
    onSuccess?.();
  };

  const handleSubmit = async () => {
    setError(null);

    const parsed = parseDailyStepInput(date, steps);
    if (!parsed.ok) {
      setError(parsed.reason);
      return;
    }

    setLoading(true);

    try {
      await addDailyStep(clientId, parsed.date, parsed.steps, notes || undefined);
      setSuccess(true);
      setTimeout(resetAndClose, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving step data');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = !loading && steps.trim() !== '';

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="neu-card w-full max-w-sm mx-4">
        <div className="p-6 border-b border-border">
          <h2 className="text-text-primary font-bold text-lg">Log Steps</h2>
        </div>

        <div className="p-6">
          {success ? (
            <div className="bg-success/10 border border-success/30 text-success rounded-lg p-3">
              Steps recorded successfully!
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-2">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-[var(--radius-control)] border border-border bg-panel text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent-teal focus:ring-3 focus:ring-accent-teal/20"
                />
              </div>

              <div>
                <label className="block text-sm text-text-muted mb-2">Steps</label>
                <input
                  type="number"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  placeholder="0"
                  min="0"
                  max="100000"
                  className="w-full px-4 py-2 rounded-[var(--radius-control)] border border-border bg-panel text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent-teal focus:ring-3 focus:ring-accent-teal/20"
                />
              </div>

              <div>
                <label className="block text-sm text-text-muted mb-2">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Morning run"
                  rows={2}
                  className="w-full px-4 py-2 rounded-[var(--radius-control)] border border-border bg-panel text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent-teal focus:ring-3 focus:ring-accent-teal/20 resize-none"
                />
              </div>

              {error && (
                <div className="bg-danger/10 border border-danger/30 text-danger rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {!success && (
          <div className="p-6 border-t border-border flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-text-muted hover:text-text-primary transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="px-4 py-2 rounded-[var(--radius-control)] neu-btn-accent font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              {loading && <span className="animate-spin">⏳</span>}
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
