import { Button } from '../../src/components/ui/Button';

export function Accent() {
  return <Button variant="accent">Save Plan</Button>;
}

export function Surface() {
  return <Button variant="surface">Cancel</Button>;
}

export function Ghost() {
  return <Button variant="ghost">Dismiss</Button>;
}

export function Small() {
  return (
    <Button variant="accent" size="sm">
      Add
    </Button>
  );
}

export function Disabled() {
  return (
    <Button variant="accent" disabled>
      Save Plan
    </Button>
  );
}
