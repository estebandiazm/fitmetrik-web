import { RouteLoading } from '@/components/ui/route-loading';

// The viewer fetches the client's plans on the server; keeps its own copy.
export default function Loading() {
  return <RouteLoading label="Cargando plan..." />;
}
