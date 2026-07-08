'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SummaryCard from '@/components/activity/SummaryCard';
import TrendsChart from '@/components/activity/TrendsChart';
import RecentRecords from '@/components/activity/RecentRecords';
import WeightTrendsChart from '@/components/activity/WeightTrendsChart';
import WeightRecentRecords from '@/components/activity/WeightRecentRecords';
import BodyDiagram from '@/components/activity/BodyDiagram';
import MeasurementTrendsChart from '@/components/activity/MeasurementTrendsChart';
import MeasurementHistory from '@/components/activity/MeasurementHistory';
import AddMeasurementModal from '@/components/activity/AddMeasurementModal';
import DailyStepsModal from '@/components/client/DailyStepsModal';
import DailyWeightModal from '@/components/client/DailyWeightModal';
import { DailyStep } from '@/domain/types/DailySteps';
import { DailyWeight } from '@/domain/types/DailyWeight';
import type { MeasurementPoint } from '@/domain/types/MeasurementPoint';
import type { BodyMeasurement } from '@/domain/types/BodyMeasurement';

type Tab = 'steps' | 'weight' | 'measurements';

interface ActivityPageClientProps {
  clientId: string;
  clientName: string;
  dailySteps: DailyStep[];
  dailyWeights: DailyWeight[];
  stepGoal?: number;
  targetWeight?: number;
  measurementPoints?: MeasurementPoint[];
  measurements?: BodyMeasurement[];
  onRefresh?: () => void;
}

export function ActivityPageClient({
  clientId,
  clientName,
  dailySteps,
  dailyWeights,
  stepGoal,
  targetWeight,
  measurementPoints = [],
  measurements = [],
  onRefresh,
}: ActivityPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawTab = searchParams.get('tab') as Tab;
  const validTabs: Tab[] = ['steps', 'weight', 'measurements'];
  const initialTab = validTabs.includes(rawTab) ? rawTab : 'steps';

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [isStepsModalOpen, setIsStepsModalOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const activePoints = measurementPoints.filter((p) => p.active);
  // Inactive points that still have measurement entries must remain selectable (REQ-BMT-05)
  const inactivePointsWithData = measurementPoints.filter(
    (p) => !p.active && measurements.some((m) => m.pointSlug === p.slug)
  );
  const selectablePoints = [...activePoints, ...inactivePointsWithData];
  const [selectedSlug, setSelectedSlug] = useState<string>(selectablePoints[0]?.slug ?? '');
  const [preselectedSlug, setPreselectedSlug] = useState<string | undefined>(undefined);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    router.replace(`/activity?tab=${tab}`, { scroll: false });
  };

  const handleHotspotClick = (slug: string) => {
    setSelectedSlug(slug);
    setPreselectedSlug(slug);
    setIsMeasurementModalOpen(true);
  };

  const dailyAverage =
    dailySteps.length > 0
      ? Math.round(
          dailySteps.reduce((sum, step) => sum + step.steps, 0) / dailySteps.length
        )
      : 0;

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    onRefresh?.();
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Activity Tracker</h1>
          <p className="text-on-surface-variant mt-2 font-medium">
            {activeTab === 'steps'
              ? 'Monitor your daily steps and progress toward your goals'
              : 'Track your weight and progress toward your target'}
          </p>
        </div>
        <button
          onClick={() => {
            if (activeTab === 'steps') setIsStepsModalOpen(true);
            else if (activeTab === 'weight') setIsWeightModalOpen(true);
            else {
              setPreselectedSlug(undefined);
              setIsMeasurementModalOpen(true);
            }
          }}
          disabled={activeTab === 'measurements' && activePoints.length === 0}
          title={
            activeTab === 'measurements' && activePoints.length === 0
              ? 'Tu coach aún no configuró puntos de medición'
              : undefined
          }
          className="px-6 py-3 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold hover:from-pink-700 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition w-full lg:w-auto"
        >
          + Add Record
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/10">
        <button
          onClick={() => handleTabChange('steps')}
          className={`px-5 py-3 text-sm font-semibold transition border-b-2 -mb-px ${
            activeTab === 'steps'
              ? 'text-pink-400 border-pink-400'
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-base align-middle mr-1">
            directions_run
          </span>
          Steps
        </button>
        <button
          onClick={() => handleTabChange('weight')}
          className={`px-5 py-3 text-sm font-semibold transition border-b-2 -mb-px ${
            activeTab === 'weight'
              ? 'text-blue-400 border-blue-400'
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-base align-middle mr-1">
            monitor_weight
          </span>
          Weight
        </button>
        <button
          onClick={() => handleTabChange('measurements')}
          data-testid="activity-tab-measurements"
          className={`px-5 py-3 text-sm font-semibold transition border-b-2 -mb-px ${
            activeTab === 'measurements'
              ? 'text-emerald-400 border-emerald-400'
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-base align-middle mr-1">
            straighten
          </span>
          Medidas
        </button>
      </div>

      {/* Steps Tab */}
      {activeTab === 'steps' && (
        <>
          <SummaryCard dailyAverage={dailyAverage} stepGoal={stepGoal} />
          {dailySteps.length > 0 && (
            <TrendsChart steps={dailySteps} stepGoal={stepGoal} key={`chart-${refreshKey}`} />
          )}
          {dailySteps.length > 0 ? (
            <RecentRecords
              steps={dailySteps}
              stepGoal={stepGoal}
              key={`records-${refreshKey}`}
            />
          ) : (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-2xl p-6">
              <p className="text-gray-400 text-center">
                No step records yet. Start tracking by adding your first record.
              </p>
            </div>
          )}
        </>
      )}

      {/* Weight Tab */}
      {activeTab === 'weight' && (
        <>
          <WeightTrendsChart weights={dailyWeights} targetWeight={targetWeight} key={`weight-chart-${refreshKey}`} />
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Recent Records</h3>
            <WeightRecentRecords
              weights={dailyWeights}
              key={`weight-records-${refreshKey}`}
            />
          </div>
        </>
      )}

      {/* Measurements Tab */}
      {activeTab === 'measurements' && (
        <>
          {selectablePoints.length === 0 ? (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-2xl p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-gray-500 mb-3 block">
                straighten
              </span>
              <p className="text-gray-400">
                Tu coach aún no configuró puntos de medición.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BodyDiagram
                  points={measurementPoints}
                  selectedSlug={selectedSlug}
                  onSelect={handleHotspotClick}
                />
                <MeasurementTrendsChart
                  measurements={measurements}
                  activePoints={activePoints}
                  selectablePoints={selectablePoints}
                  selectedSlug={selectedSlug}
                  onSelectedSlugChange={setSelectedSlug}
                  key={`measure-chart-${refreshKey}`}
                />
              </div>
              <MeasurementHistory
                measurements={measurements}
                selectedSlug={selectedSlug}
                selectablePoints={selectablePoints}
                key={`measure-history-${refreshKey}`}
              />
            </>
          )}
        </>
      )}

      {/* Modals */}
      <DailyStepsModal
        open={isStepsModalOpen}
        onClose={() => setIsStepsModalOpen(false)}
        clientId={clientId}
        onSuccess={handleSuccess}
      />
      <DailyWeightModal
        open={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        clientId={clientId}
        onSuccess={handleSuccess}
      />
      <AddMeasurementModal
        open={isMeasurementModalOpen}
        onClose={() => {
          setIsMeasurementModalOpen(false);
          setPreselectedSlug(undefined);
        }}
        clientId={clientId}
        activePoints={activePoints}
        preselectedSlug={preselectedSlug}
        onSuccess={handleSuccess}
      />
    </>
  );
}
