import { Alert } from '../../src/components/ui/Alert';

export function Error() {
  return <Alert type="error" message="Couldn't save your changes. Please try again." />;
}

export function Success() {
  return <Alert type="success" message="Measurement logged successfully." />;
}

export function Info() {
  return <Alert type="info" message="Your coach will review this plan before it goes live." />;
}
