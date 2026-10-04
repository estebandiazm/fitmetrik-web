// Classifies a day's step count against the coach-assigned step goal.

export const STEP_GOAL_STATUS = {
  GOAL_MET: "goal-met",
  GOOD: "good",
  LOW: "low",
} as const;

export type StepGoalStatus = (typeof STEP_GOAL_STATUS)[keyof typeof STEP_GOAL_STATUS];

// A day counts as "good" from 75% of the goal upwards.
const GOOD_THRESHOLD_RATIO = 0.75;

// Returns null when no goal is assigned (undefined or 0).
export function getStepGoalStatus(steps: number, stepGoal?: number): StepGoalStatus | null {
  if (!stepGoal) return null;
  if (steps >= stepGoal) return STEP_GOAL_STATUS.GOAL_MET;
  if (steps >= stepGoal * GOOD_THRESHOLD_RATIO) return STEP_GOAL_STATUS.GOOD;
  return STEP_GOAL_STATUS.LOW;
}
