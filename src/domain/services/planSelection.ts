// Plan selection for the plan viewer's `planIndex` search param.

// The plan at `planIndexRaw` when it is a valid index, otherwise every plan.
export function selectPlansByIndex<T>(plans: T[], planIndexRaw: string | null | undefined): T[] {
  if (planIndexRaw == null) return plans;
  const index = parseInt(planIndexRaw, 10);
  if (isNaN(index) || index < 0 || index >= plans.length) return plans;
  return [plans[index]];
}
