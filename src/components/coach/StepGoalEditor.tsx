'use client';

import React, { useState } from 'react';
import { setStepGoal } from '@/app/actions/clientActions';
import { parseStepGoal } from '@/domain/services/activityInputs';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

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
      setError(err instanceof Error ? err.message : 'No se pudo guardar la meta');
    } finally {
      setLoading(false);
    }
  };

  const canSave = !loading && goal.trim() !== '';

  return (
    <div className="flex gap-3 items-start">
      <div className="flex-1">
        <Input
          type="number"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="ej. 10000"
          min="1"
          className="w-full"
        />
        {error && (
          <div className="mt-2 text-sm bg-danger/10 border border-danger/30 text-danger-text rounded-lg p-2">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-2 text-sm bg-success/10 border border-success/30 text-success-text rounded-lg p-2">
            ¡Meta guardada!
          </div>
        )}
      </div>
      <Button onClick={handleSave} disabled={!canSave} className="mt-1">
        {loading ? 'Guardando…' : 'Guardar'}
      </Button>
    </div>
  );
}
