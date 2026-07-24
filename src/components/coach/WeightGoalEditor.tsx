'use client';

import { useState } from 'react';
import { setTargetWeight } from '../../app/actions/clientActions';

interface WeightGoalEditorProps {
  clientId: string;
  currentTarget?: number;
  onSaved?: () => void;
}

export default function WeightGoalEditor({
  clientId,
  currentTarget,
  onSaved,
}: WeightGoalEditorProps) {
  const [target, setTarget] = useState<string>(currentTarget?.toString() || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setError(null);

    const targetNum = parseFloat(target);
    if (isNaN(targetNum) || targetNum <= 0) {
      setError('Target weight must be a positive number');
      return;
    }

    setLoading(true);

    try {
      await setTargetWeight(clientId, targetNum);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSaved?.();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving target weight');
    } finally {
      setLoading(false);
    }
  };

  const canSave = !loading && target.trim() !== '';

  return (
    <div className="flex gap-3 items-start">
      <div className="flex-1">
        <input
          type="number"
          step="0.1"
          min="0.1"
          max="500"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="e.g., 70.5"
          className="w-full px-4 py-2 rounded-full neu-inset border border-transparent text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
        />
        {error && (
          <div className="mt-2 text-sm bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg p-2">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-2 text-sm bg-green-500/10 border border-green-500/30 text-green-300 rounded-lg p-2">
            Target weight saved!
          </div>
        )}
      </div>
      <span className="py-2 text-gray-400 text-sm">kg</span>
      <button
        onClick={handleSave}
        disabled={!canSave}
        className="px-4 py-2 mt-1 rounded-full neu-btn-accent font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? '⏳' : 'Save'}
      </button>
    </div>
  );
}
