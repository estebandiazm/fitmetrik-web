import PlanCard from '../../src/components/creator/PlanCard';

const SAMPLE_PLAN = {
  id: 'plan-1',
  label: 'High Protein',
  days: '5',
  proteins: 180,
  carbs: 220,
  fruits: 2,
  fats: 70,
  foods: [
    { name: 'Chicken Breast', grams: 200, category: 'BASE' as const },
    { name: 'Brown Rice', grams: 150, category: 'COMPLEMENT' as const },
    { name: 'Banana', grams: 120, category: 'FRUIT' as const },
  ],
};

export function Default() {
  return <PlanCard plan={SAMPLE_PLAN} index={0} onUpdate={() => {}} />;
}

export function Empty() {
  return (
    <PlanCard
      plan={{ ...SAMPLE_PLAN, id: 'plan-2', label: 'New Plan', days: '', foods: [] }}
      index={1}
      onUpdate={() => {}}
    />
  );
}
