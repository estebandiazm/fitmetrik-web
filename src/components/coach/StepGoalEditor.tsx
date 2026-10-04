'use client';

import React, { useState } from 'react';
import { setStepGoal } from '@/app/actions/clientActions';
import { parseStepGoal } from '@/domain/services/activityInputs';

interface StepGoalEditorProps {
  clientId: string;
  currentGoal?: number;
  onSuccess?: () => void;
}

export default function StepGoalEditor({ clientId, currentGoal, onSuccess }: StepGoalEditorProps) {
  const [goal, setGoal] = useState(currentGoal?.toString() || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setError(null);

    const parsed = parseStepGoal(goal);
    if (!parsed.ok) {
      setError(parsed.reason);
      return;
    }

    setLoading(true);

    try {
      await setStepGoal(clientId, parsed.value);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving goal');
    } finally {
      setLoading(false);
    }
  };

  const canSave = !loading && goal.trim() !== '';

  return (
    <div className="flex gap-3 items-start">
      <div className="flex-1">
        <input
          type="number"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="e.g., 10000"
          min="1"
          className="w-full px-4 py-2 rounded-[var(--radius-control)] border border-border bg-panel text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent-teal focus:ring-3 focus:ring-accent-teal/20"
        />
        {error && (
          <div className="mt-2 text-sm bg-danger/10 border border-danger/30 text-danger rounded-lg p-2">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-2 text-sm bg-success/10 border border-success/30 text-success rounded-lg p-2">
            Goal saved successfully!
          </div>
        )}
      </div>
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
