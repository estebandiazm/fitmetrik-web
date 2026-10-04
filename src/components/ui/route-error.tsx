'use client';

import { useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

// Route-level error state shared by the route groups' `error.tsx` files.

export interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function RouteError({ error, reset }: RouteErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="p-6">
      <Card className="mx-auto max-w-md p-6">
        <div role="alert" className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">Algo salió mal</h2>
          <p className="text-sm text-text-muted">No pudimos cargar esta página. Intentá de nuevo.</p>
          <Button variant="accent" size="sm" onClick={reset}>
            Reintentar
          </Button>
        </div>
      </Card>
    </div>
  );
}
