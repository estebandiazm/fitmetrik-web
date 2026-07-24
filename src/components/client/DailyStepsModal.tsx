'use client';

import React, { useState } from 'react';
import { addDailyStep } from '../../app/actions/clientActions';

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
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [steps, setSteps] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      setError('Date cannot be in the future');
      return;
    }

    const stepsNum = parseInt(steps, 10);
    if (isNaN(stepsNum) || stepsNum < 0 || stepsNum > 100000) {
      setError('Steps must be between 0 and 100,000');
      return;
    }

    setLoading(true);

    try {
      await addDailyStep(clientId, selectedDate, stepsNum, notes || undefined);
      setSuccess(true);
      setTimeout(() => {
        setDate(new Date().toISOString().split('T')[0]);
        setSteps('');
        setNotes('');
        setSuccess(false);
        onClose();
        onSuccess?.();
      }, 1500);
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
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-2xl w-full max-w-sm mx-4">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-white font-bold text-lg">Log Steps</h2>
        </div>

        <div className="p-6">
          {success ? (
            <div className="bg-green-500/10 border border-green-500/30 text-green-300 rounded-lg p-3">
              Steps recorded successfully!
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-full neu-inset border border-transparent text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Steps</label>
                <input
                  type="number"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  placeholder="0"
                  min="0"
                  max="100000"
                  className="w-full px-4 py-2 rounded-full neu-inset border border-transparent text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Morning run"
                  rows={2}
                  className="w-full px-4 py-2 rounded-2xl neu-inset border border-transparent text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {!success && (
          <div className="p-6 border-t border-white/5 flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="px-4 py-2 rounded-full neu-btn-accent font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
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
