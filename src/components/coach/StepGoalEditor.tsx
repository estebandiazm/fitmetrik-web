'use client';

import React, { useState } from 'react';
import { setStepGoal } from '../../app/actions/clientActions';

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

    const goalNum = parseInt(goal, 10);
    if (isNaN(goalNum) || goalNum <= 0) {
      setError('Goal must be a positive number');
      return;
    }

    setLoading(true);

    try {
      await setStepGoal(clientId, goalNum);
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
          className="w-full px-4 py-2 rounded-full neu-inset border border-transparent text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
        />
        {error && (
          <div className="mt-2 text-sm bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg p-2">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-2 text-sm bg-green-500/10 border border-green-500/30 text-green-300 rounded-lg p-2">
            Goal saved successfully!
          </div>
        )}
      </div>
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
