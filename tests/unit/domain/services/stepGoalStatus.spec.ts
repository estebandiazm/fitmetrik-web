import { describe, it, expect } from 'vitest';
import { getStepGoalStatus, STEP_GOAL_STATUS } from '@/domain/services/stepGoalStatus';

describe('getStepGoalStatus', () => {
  it('returns null when there is no step goal', () => {
    expect(getStepGoalStatus(5000)).toBeNull();
    expect(getStepGoalStatus(5000, undefined)).toBeNull();
  });

  it('returns null when the step goal is 0', () => {
    expect(getStepGoalStatus(5000, 0)).toBeNull();
  });

  it('returns goal-met when steps reach the goal', () => {
    expect(getStepGoalStatus(10000, 10000)).toBe(STEP_GOAL_STATUS.GOAL_MET);
    expect(getStepGoalStatus(12000, 10000)).toBe(STEP_GOAL_STATUS.GOAL_MET);
  });

  it('returns good when steps are at least 75% of the goal', () => {
    expect(getStepGoalStatus(7500, 10000)).toBe(STEP_GOAL_STATUS.GOOD);
    expect(getStepGoalStatus(9999, 10000)).toBe(STEP_GOAL_STATUS.GOOD);
  });

  it('returns low below 75% of the goal', () => {
    expect(getStepGoalStatus(7499, 10000)).toBe(STEP_GOAL_STATUS.LOW);
    expect(getStepGoalStatus(0, 10000)).toBe(STEP_GOAL_STATUS.LOW);
  });

  it('exposes semantic status values', () => {
    expect(STEP_GOAL_STATUS).toEqual({ GOAL_MET: 'goal-met', GOOD: 'good', LOW: 'low' });
  });
});
