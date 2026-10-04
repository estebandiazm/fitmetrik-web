import { Card } from '../../src/components/ui/Card';

export function Default() {
  return (
    <Card padding="default">
      <h3 className="text-lg font-bold text-on-surface mb-2">Today's Summary</h3>
      <p className="text-sm text-on-surface-muted">
        You're on track with your macros for the day.
      </p>
    </Card>
  );
}

export function NoPadding() {
  return (
    <Card padding="none">
      <div className="p-4">
        <p className="text-sm text-on-surface-muted">Custom padding applied by the caller.</p>
      </div>
    </Card>
  );
}

export function AsSection() {
  return (
    <Card as="section" padding="default">
      <h3 className="text-lg font-bold text-on-surface">Rendered as a &lt;section&gt;</h3>
    </Card>
  );
}
