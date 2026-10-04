'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import type { DailyStep } from '@/domain/types/DailySteps';
import { formatUTCDate, sortRecordsByDateDesc } from '@/domain/services/dailyRecords';
import {
  getStepGoalStatus,
  STEP_GOAL_STATUS,
  type StepGoalStatus,
} from '@/domain/services/stepGoalStatus';

interface RecentRecordsProps {
  steps: DailyStep[];
  stepGoal?: number;
}

const PAGE_SIZE = 10;

const STATUS_BADGES: Record<StepGoalStatus, { label: string; className: string }> = {
  [STEP_GOAL_STATUS.GOAL_MET]: { label: 'Goal Met', className: 'bg-accent-teal/20 text-text-primary' },
  [STEP_GOAL_STATUS.GOOD]: { label: 'Good', className: 'bg-accent-amber/20 text-text-primary' },
  [STEP_GOAL_STATUS.LOW]: { label: 'Low Activity', className: 'bg-danger/10 text-danger-text' },
};

interface StepStatusBadgeProps {
  status: StepGoalStatus | null;
}

function StepStatusBadge({ status }: StepStatusBadgeProps) {
  if (!status) return null;
  const { label, className } = STATUS_BADGES[status];
  return (
    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${className}`}>
      {label}
    </span>
  );
}

interface StepRowProps {
  step: DailyStep;
  stepGoal?: number;
}

function StepRow({ step, stepGoal }: StepRowProps) {
  return (
    <tr className="border-b border-row-border hover:bg-row-border transition">
      <td className="px-6 py-4">
        <p className="text-text-primary font-medium">{formatUTCDate(step.date)}</p>
        {step.notes && <p className="text-xs text-text-muted mt-1">{step.notes}</p>}
      </td>
      <td className="px-6 py-4 text-right text-text-primary font-semibold">
        {step.steps.toLocaleString()}
      </td>
      <td className="px-6 py-4 text-center">
        <StepStatusBadge status={getStepGoalStatus(step.steps, stepGoal)} />
      </td>
    </tr>
  );
}

interface LoadMoreButtonProps {
  onClick: () => void;
}

function LoadMoreButton({ onClick }: LoadMoreButtonProps) {
  return (
    <div className="p-4 text-center border-t border-row-border">
      <button onClick={onClick} className="text-accent-teal-text hover:text-accent-teal-text/80 font-semibold transition">
        Load More
      </button>
    </div>
  );
}

interface StepsTableProps {
  steps: DailyStep[];
  stepGoal?: number;
}

function StepsTable({ steps, stepGoal }: StepsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-bg border-b border-border">
            <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase">Date</th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-text-muted uppercase">Steps</th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-text-muted uppercase">Status</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((step, index) => (
            <StepRow key={`${String(step.date)}-${index}`} step={step} stepGoal={stepGoal} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RecentRecords({ steps, stepGoal }: RecentRecordsProps) {
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  if (steps.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-text-muted text-center">No step records yet</p>
      </Card>
    );
  }

  const sortedSteps = sortRecordsByDateDesc(steps);

  return (
    <Card className="overflow-hidden">
      <StepsTable steps={sortedSteps.slice(0, displayCount)} stepGoal={stepGoal} />
      {sortedSteps.length > displayCount && (
        <LoadMoreButton onClick={() => setDisplayCount(displayCount + PAGE_SIZE)} />
      )}
    </Card>
  );
}
