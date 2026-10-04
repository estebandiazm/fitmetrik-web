import Link from 'next/link';
import { PlanSectionCard } from '@/components/dashboard/PlanSectionCard';
import { PlanSwitcher } from '@/components/dashboard/PlanSwitcher';
import { PlusIcon } from '@/components/ui/icons';
import type { PlanCardData } from '@/domain/services/planView';

interface ClientPlanPanelProps {
  clientName: string;
  plans: { label?: string; days?: string }[];
  activeIndex: number;
  recommendations?: string;
  cards: PlanCardData[];
}

/** Read-only view of the plan a client is following, for the coach. */
export function ClientPlanPanel({ clientName, plans, activeIndex, recommendations, cards }: ClientPlanPanelProps) {
  if (plans.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-panel px-6 py-12 text-center">
        <p className="text-[15px] font-semibold text-text-primary">{clientName} aún no tiene un plan</p>
        <p className="mx-auto mt-1 max-w-sm text-[13px] text-text-muted">
          Crea un plan y guárdalo en su perfil para que lo vea en su portal.
        </p>
        <Link
          href="/creator"
          className="neu-btn-accent mt-5 inline-flex items-center gap-2 rounded-[10px] px-5 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-teal"
        >
          <PlusIcon size={16} />
          Crear plan
        </Link>
      </div>
    );
  }

  const active = plans[activeIndex];

  return (
    <section aria-labelledby="plan-activo" className="flex flex-col gap-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-faint">Plan vigente</p>
          <h2 id="plan-activo" className="mt-1 text-xl font-bold text-text-primary">
            {active.label || 'Plan personalizado'}
          </h2>
          {active.days && <p className="mt-1 text-[13px] text-text-muted">{active.days}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <PlanSwitcher plans={plans} activeIndex={activeIndex} />
          <Link
            href="/creator"
            className="neu-btn inline-flex items-center gap-2 rounded-[10px] px-4 py-2.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-teal"
          >
            Editar en Planes
          </Link>
        </div>
      </div>

      {recommendations && (
        <div className="rounded-[var(--radius-card)] border border-border bg-panel px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-faint">Recomendaciones</p>
          <p className="mt-1 whitespace-pre-line text-[13px] text-text-primary">{recommendations}</p>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        {cards.map((card) => (
          <PlanSectionCard key={card.title} {...card} defaultExpanded />
        ))}
      </div>
    </section>
  );
}
