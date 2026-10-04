import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { authProvider } from '@/lib/registry';
import { getCoachByAuthId } from '@/app/actions/coachActions';
import { getClientById, getDailyWeights } from '@/app/actions/clientActions';
import { CoachHeader } from '@/components/coach/CoachHeader';
import { ClientTabs, parseClientTab } from '@/components/coach/ClientTabs';
import { ClientPlanPanel } from '@/components/coach/ClientPlanPanel';
import { Card } from '@/components/ui/Card';
import { BlisterCell } from '@/components/ui/blister-cell';
import { calculateDailyAverage, calculateGoalProgressPercent } from '@/domain/services/stepsAverageService';
import { summarizeWeights } from '@/domain/services/weightAverageService';
import {
  buildWeeklyStrip,
  calculateAdherencePct,
  daysSinceLastEntry,
  getAdherenceTier,
  type AdherenceTier,
} from '@/domain/services/adherence';
import { buildPlanCards, resolveActivePlanIndex } from '@/domain/services/planView';
import TrendsChart from '@/components/activity/TrendsChart';
import RecentRecords from '@/components/activity/RecentRecords';
import StepGoalEditor from '@/components/coach/StepGoalEditor';
import WeightGoalEditor from '@/components/coach/WeightGoalEditor';
import MeasurementPointsEditor from '@/components/coach/MeasurementPointsEditor';
import WeightTrendsChart from '@/components/activity/WeightTrendsChart';
import WeightRecentRecords from '@/components/activity/WeightRecentRecords';
import { ArrowRightIcon } from '@/components/ui/icons';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

interface ClientDetailPageProps {
  params: Promise<{ clientId: string }>;
  searchParams: SearchParams;
}

const DAY_INITIALS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const ADHERENCE_CLASS: Record<AdherenceTier, string> = {
  low: 'text-danger-text',
  fair: 'text-text-muted',
  good: 'text-text-primary',
};

function lastLogLabel(days: number | undefined): string {
  if (days === undefined) return 'Sin registros todavía';
  if (days === 0) return 'Último registro: hoy';
  if (days === 1) return 'Último registro: ayer';
  return `Último registro: hace ${days} días`;
}

export default async function ClientDetailPage(props: ClientDetailPageProps) {
  const { clientId } = await props.params;
  const searchParams = await props.searchParams;
  const tab = parseClientTab(searchParams.tab);

  const session = await authProvider.getSession();
  if (!session) {
    redirect('/login');
  }

  const coach = await getCoachByAuthId(session.user.id);
  if (!coach) {
    redirect('/login?error=Coach+profile+not+found');
  }

  const client = await getClientById(clientId);
  if (!client) {
    redirect('/clients?error=Client+not+found');
  }

  // Verify the coach owns this client
  if (client.coachId !== coach.id) {
    redirect('/clients?error=Unauthorized');
  }

  const dailySteps = client.dailySteps || [];
  const stepGoal = client.stepGoal || undefined;
  const weights = await getDailyWeights(clientId);

  const weekCells = buildWeeklyStrip(weights);
  const adherencePct = calculateAdherencePct(weekCells);
  const daysSinceLastLog = daysSinceLastEntry(weights);

  const plans = client.plans ?? [];
  const activeIndex = resolveActivePlanIndex(plans.length, searchParams.planIndex);
  const activePlan = plans[activeIndex];

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <CoachHeader coachName={coach.name} coachEmail={coach.email} />

      <main className="mx-auto flex w-full max-w-[1040px] flex-col gap-6 px-6 pb-16 pt-8 sm:px-8">
        <Link
          href="/clients"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-accent-teal-text transition-colors hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-teal"
        >
          <span aria-hidden="true" className="rotate-180">
            <ArrowRightIcon size={14} />
          </span>
          Volver a clientes
        </Link>

        <header className="animate-enter flex flex-wrap items-center gap-x-6 gap-y-4 rounded-2xl border border-border bg-panel px-6 py-5">
          <div
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-locked-bg text-base font-bold text-text-muted"
          >
            {client.name.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-[160px] flex-[1_1_160px]">
            <h1 className="text-2xl font-bold text-text-primary">{client.name}</h1>
            <p className="mt-0.5 text-xs text-text-muted">
              {lastLogLabel(daysSinceLastLog)}
              {client.targetWeight ? ` · meta ${client.targetWeight} kg` : ''}
            </p>
          </div>

          <ol className="flex shrink-0 gap-1.5" aria-label="Semana actual">
            {weekCells.map((cell, index) => (
              <li key={index} className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-semibold text-text-faint" aria-hidden="true">
                  {DAY_INITIALS[index]}
                </span>
                <BlisterCell size="md" state={cell.state} ariaLabel={`Día ${index + 1} — ${cell.state}`} />
              </li>
            ))}
          </ol>

          <div className="text-right">
            <p
              className={`font-mono text-2xl font-bold ${ADHERENCE_CLASS[getAdherenceTier(adherencePct)]}`}
              aria-label={`Adherencia ${adherencePct}%`}
            >
              {adherencePct}%
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-faint">Adherencia</p>
          </div>
        </header>

        <ClientTabs active={tab} />

        {tab === 'plan' && (
          <ClientPlanPanel
            clientName={client.name}
            plans={plans.map((p) => ({ label: p.label, days: p.days }))}
            activeIndex={activeIndex}
            recommendations={activePlan?.recommendations}
            cards={activePlan ? buildPlanCards(activePlan) : []}
          />
        )}

        {tab === 'progreso' && (
          <ProgressSection
            clientId={clientId}
            dailySteps={dailySteps}
            weights={weights}
            stepGoal={stepGoal}
            targetWeight={client.targetWeight ?? undefined}
          />
        )}

        {tab === 'medidas' && (
          <Card padding="default">
            <h2 className="text-base font-semibold text-text-primary">Puntos de medición</h2>
            <p className="mb-4 mt-1 text-[13px] text-text-muted">
              Elige qué medidas corporales registrará este cliente. Desactivar un punto lo oculta de los nuevos
              registros, pero conserva su historial.
            </p>
            <MeasurementPointsEditor
              clientId={clientId}
              currentPoints={client.measurementPoints ?? []}
              existingMeasurements={client.measurements ?? []}
            />
          </Card>
        )}
      </main>
    </div>
  );
}

interface ProgressSectionProps {
  clientId: string;
  dailySteps: NonNullable<Awaited<ReturnType<typeof getClientById>>>['dailySteps'];
  weights: Awaited<ReturnType<typeof getDailyWeights>>;
  stepGoal?: number;
  targetWeight?: number;
}

function ProgressSection({ clientId, dailySteps = [], weights, stepGoal, targetWeight }: ProgressSectionProps) {
  const dailyAverage = calculateDailyAverage(dailySteps);
  const progressPercent = calculateGoalProgressPercent(dailyAverage, stepGoal);
  const weightSummary = summarizeWeights(weights);

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="peso" className="flex flex-col gap-4">
        <h2 id="peso" className="text-lg font-bold text-text-primary">Peso</h2>

        {weightSummary ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              ['Último', weightSummary.latest],
              ['Más bajo', weightSummary.lightest],
              ['Más alto', weightSummary.heaviest],
            ].map(([label, value]) => (
              <Card key={label} padding="default">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-faint">{label}</p>
                <p className="mt-1 font-mono text-2xl font-bold text-text-primary">{value} kg</p>
              </Card>
            ))}
          </div>
        ) : (
          <Card padding="default" className="text-center">
            <p className="text-sm text-text-muted">Aún no hay registros de peso.</p>
          </Card>
        )}

        {weights.length > 0 && (
          <>
            <Card padding="default">
              <h3 className="mb-4 text-base font-semibold text-text-primary">Tendencia</h3>
              <WeightTrendsChart weights={weights} density="compact" />
            </Card>
            <Card padding="default">
              <h3 className="mb-4 text-base font-semibold text-text-primary">Historial</h3>
              <WeightRecentRecords weights={weights} />
            </Card>
          </>
        )}

        <Card padding="default">
          <h3 className="mb-3 text-base font-semibold text-text-primary">Peso objetivo</h3>
          <WeightGoalEditor clientId={clientId} currentTarget={targetWeight} />
        </Card>
      </section>

      <section aria-labelledby="pasos" className="flex flex-col gap-4">
        <h2 id="pasos" className="text-lg font-bold text-text-primary">Pasos</h2>

        <Card padding="default">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-faint">Promedio diario</p>
          <p className="mt-1 font-mono text-3xl font-bold text-text-primary">{dailyAverage.toLocaleString()}</p>
          {stepGoal && progressPercent !== null && (
            <>
              <p className="mb-2 mt-4 text-xs text-text-muted">
                Progreso hacia la meta (<span className="font-mono">{stepGoal.toLocaleString()}</span>)
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="h-2 flex-1 overflow-hidden rounded-full neu-inset"
                  role="progressbar"
                  aria-valuenow={Math.round(progressPercent)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Progreso hacia la meta de pasos"
                >
                  <div
                    className="h-full rounded-full bg-accent-amber transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="min-w-fit font-mono text-sm font-semibold text-accent-amber-text">
                  {Math.round(progressPercent)}%
                </span>
              </div>
            </>
          )}
        </Card>

        {dailySteps.length > 0 ? (
          <>
            <Card padding="default">
              <h3 className="mb-4 text-base font-semibold text-text-primary">Tendencia</h3>
              <TrendsChart steps={dailySteps} density="compact" />
            </Card>
            <Card padding="default">
              <h3 className="mb-4 text-base font-semibold text-text-primary">Registros recientes</h3>
              <RecentRecords steps={dailySteps} stepGoal={stepGoal} />
            </Card>
          </>
        ) : (
          <Card padding="default" className="text-center">
            <p className="text-sm text-text-muted">Aún no hay registros de pasos.</p>
          </Card>
        )}

        <Card padding="default">
          <h3 className="mb-3 text-base font-semibold text-text-primary">Meta de pasos</h3>
          <StepGoalEditor clientId={clientId} currentGoal={stepGoal} />
        </Card>
      </section>
    </div>
  );
}
