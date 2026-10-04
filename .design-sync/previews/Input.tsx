import { Input } from '../../src/components/ui/Input';

export function Default() {
  return <Input placeholder="Search clients..." />;
}

export function WithValue() {
  return <Input defaultValue="180" type="number" />;
}

export function Disabled() {
  return <Input placeholder="Not editable" disabled />;
}
