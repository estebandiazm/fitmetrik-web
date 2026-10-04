import { Card } from '@/components/ui/Card';

// Route-level loading state shared by the route groups' `loading.tsx` files.

export interface RouteLoadingProps {
  label?: string;
}

export function RouteLoading({ label = 'Cargando...' }: RouteLoadingProps) {
  return (
    <div className="p-6">
      <Card className="mx-auto max-w-md p-6">
        <p role="status" aria-live="polite" className="text-sm text-text-muted motion-safe:animate-pulse">
          {label}
        </p>
      </Card>
    </div>
  );
}
