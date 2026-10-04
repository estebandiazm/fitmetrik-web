// Hand-written bundle entry for design-sync (fitmetrik-web has no built dist/
// and this app's src/ is not itself a standalone package — it's a Next.js
// app with Server Actions, Mongoose, and Supabase server clients mixed in).
//
// design-sync's synth-entry fallback (no cfg.entry set) would re-export
// EVERY .tsx/.jsx file under src/ as the bundle entry, which would try to
// bundle route pages, Server Actions, and domain/infrastructure code into a
// browser IIFE — guaranteed to break. This file pins the bundle to exactly
// the components scoped for this sync (see .design-sync/NOTES.md).
//
// Referenced via cfg.entry in .design-sync/config.json. Resolved relative to
// the process cwd (repo root) by design-sync's --entry handling.

export { Alert } from '../src/components/ui/Alert';
export { Badge } from '../src/components/ui/Badge';
export { Button } from '../src/components/ui/Button';
export { Card } from '../src/components/ui/Card';
export { Input } from '../src/components/ui/Input';
export { Modal } from '../src/components/ui/Modal';
export { StatusPill } from '../src/components/ui/StatusPill';
export { Table, TableHead, TableRow, TableCell } from '../src/components/ui/Table';
export { MetricCard } from '../src/components/coach/MetricCard';
export { default as SummaryCard } from '../src/components/activity/SummaryCard';
export { default as PlanCard } from '../src/components/creator/PlanCard';
export { TablePagination } from '../src/components/coach/TablePagination';
