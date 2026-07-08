'use client';

import type { MeasurementPoint } from '@/domain/types/MeasurementPoint';
import BodyDiagramSilhouette from './BodyDiagramSilhouette';

interface BodyDiagramProps {
  points: MeasurementPoint[];
  selectedSlug?: string;
  onSelect: (slug: string) => void;
}

export default function BodyDiagram({ points, selectedSlug, onSelect }: BodyDiagramProps) {
  const activePoints = points.filter((p) => p.active);

  return (
    <div
      data-testid="body-diagram"
      className="relative w-full max-w-xs mx-auto aspect-[1/2]"
    >
      <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-white/40"
        aria-label="Body diagram"
        role="img"
      >
        <BodyDiagramSilhouette />

        {activePoints.map((point) => {
          const isSelected = point.slug === selectedSlug;
          return (
            <g key={point.slug}>
              {isSelected && (
                <circle
                  cx={point.bodyCoords.x}
                  cy={point.bodyCoords.y}
                  r="5"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1"
                  opacity={0.5}
                  className="animate-ping"
                  style={{ transformOrigin: `${point.bodyCoords.x}px ${point.bodyCoords.y}px` }}
                />
              )}
              <circle
                cx={point.bodyCoords.x}
                cy={point.bodyCoords.y}
                r="3.5"
                fill={isSelected ? '#10b981' : '#6ee7b7'}
                stroke={isSelected ? '#064e3b' : '#065f46'}
                strokeWidth="0.8"
                className="cursor-pointer transition-all"
                style={
                  isSelected
                    ? { filter: 'drop-shadow(0 0 3px rgba(16, 185, 129, 1))' }
                    : undefined
                }
                onClick={() => onSelect(point.slug)}
                role="button"
                aria-label={point.label}
                aria-pressed={isSelected}
                data-testid={`body-diagram-point-${point.slug}`}
              />
            </g>
          );
        })}
      </svg>

      {activePoints.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-400 text-xs text-center px-4">
            Sin puntos activos
          </p>
        </div>
      )}
    </div>
  );
}
