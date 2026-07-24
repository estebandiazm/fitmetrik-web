'use client';

import React, { useState } from 'react';
import { addDailyWeight } from '../../app/actions/clientActions';

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
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState('');
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

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum < 0.1 || weightNum > 500) {
      setError('Weight must be between 0.1 and 500 kg');
      return;
    }

    setLoading(true);

    try {
      await addDailyWeight(clientId, selectedDate, weightNum, notes || undefined);
      setSuccess(true);
      setTimeout(() => {
        setDate(new Date().toISOString().split('T')[0]);
        setWeight('');
        setNotes('');
        setSuccess(false);
        onClose();
        onSuccess?.();
      }, 1500);
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
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-2xl w-full max-w-sm mx-4">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-white font-bold text-lg">Log Weight</h2>
        </div>

        <div className="p-6">
          {success ? (
            <div className="bg-green-500/10 border border-green-500/30 text-green-300 rounded-lg p-3">
              Weight recorded successfully!
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 rounded-full neu-inset border border-transparent text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Weight (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="80.5"
                  step="0.1"
                  min="0.1"
                  max="500"
                  className="w-full px-4 py-2 rounded-full neu-inset border border-transparent text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., After breakfast"
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
              {loading && (
                <span className="material-symbols-outlined text-base animate-spin">
                  progress_activity
                </span>
              )}
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
