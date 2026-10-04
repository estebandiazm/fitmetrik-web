'use client';

import { useState } from 'react';
import { setTargetWeight } from '@/app/actions/clientActions';
import { parseTargetWeight } from '@/domain/services/activityInputs';

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

    const parsed = parseTargetWeight(target);
    if (!parsed.ok) {
      setError(parsed.reason);
      return;
    }

    setLoading(true);

    try {
      await setTargetWeight(clientId, parsed.value);
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
          className="w-full px-4 py-2 rounded-[var(--radius-control)] border border-border bg-panel text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent-teal focus:ring-3 focus:ring-accent-teal/20"
        />
        {error && (
          <div className="mt-2 text-sm bg-danger/10 border border-danger/30 text-danger rounded-lg p-2">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-2 text-sm bg-success/10 border border-success/30 text-success rounded-lg p-2">
            Target weight saved!
          </div>
        )}
      </div>
      <span className="py-2 text-text-muted text-sm">kg</span>
      <button
        onClick={handleSave}
        disabled={!canSave}
        className="px-4 py-2 mt-1 rounded-[var(--radius-control)] neu-btn-accent font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? '⏳' : 'Save'}
      </button>
    </div>
  );
}
