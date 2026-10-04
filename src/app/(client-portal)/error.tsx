'use client';

import { RouteError, type RouteErrorProps } from '@/components/ui/route-error';

export default function ClientPortalError(props: RouteErrorProps) {
  return <RouteError {...props} />;
}
