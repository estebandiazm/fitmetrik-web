import { Modal } from '../../src/components/ui/Modal';
import { Button } from '../../src/components/ui/Button';

export function Default() {
  return (
    <Modal open onClose={() => {}} title="Log today's weight">
      <p className="text-sm text-on-surface-muted">
        Enter your weight to keep your progress chart up to date.
      </p>
    </Modal>
  );
}

export function WithFooter() {
  return (
    <Modal
      open
      onClose={() => {}}
      title="Delete this client?"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="surface" size="sm">
            Cancel
          </Button>
          <Button variant="accent" size="sm">
            Delete
          </Button>
        </div>
      }
    >
      <p className="text-sm text-on-surface-muted">
        This removes the client and all of their logged measurements. This can't be undone.
      </p>
    </Modal>
  );
}
