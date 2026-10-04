import { Badge } from '../../src/components/ui/Badge';

export function Neutral() {
  return <Badge tone="neutral">Draft</Badge>;
}

export function Success() {
  return <Badge tone="success">Active</Badge>;
}

export function Error() {
  return <Badge tone="error">No Plan</Badge>;
}
