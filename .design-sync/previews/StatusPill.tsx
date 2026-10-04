import { StatusPill } from '../../src/components/ui/StatusPill';

export function Active() {
  return <StatusPill hasPlan={true} />;
}

export function NoPlan() {
  return <StatusPill hasPlan={false} />;
}
