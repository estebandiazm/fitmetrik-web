'use client';

/**
 * BodyDiagramSilhouette — minimalist front-view body silhouette on viewBox 0 0 100 100.
 * Uses fill="currentColor" so parent can theme via Tailwind text-* classes.
 * Hotspots from BodyDiagram are drawn on top in the same SVG coordinate system.
 */
export default function BodyDiagramSilhouette() {
  return (
    <>
      {/* Head */}
      <ellipse cx="50" cy="9" rx="7" ry="8" fill="currentColor" opacity={0.35} />

      {/* Neck */}
      <rect x="47" y="16.5" width="6" height="5" fill="currentColor" opacity={0.3} rx="1" />

      {/* Shoulders */}
      <ellipse cx="34" cy="24" rx="8" ry="4" fill="currentColor" opacity={0.25} />
      <ellipse cx="66" cy="24" rx="8" ry="4" fill="currentColor" opacity={0.25} />

      {/* Torso */}
      <path
        d="M38 21 Q31 26 30 36 L32 52 Q32 56 38 57 L62 57 Q68 56 68 52 L70 36 Q69 26 62 21 Z"
        fill="currentColor"
        opacity={0.3}
      />

      {/* Hips */}
      <path
        d="M34 55 Q32 62 34 67 L46 67 L46 57 Z"
        fill="currentColor"
        opacity={0.28}
      />
      <path
        d="M66 55 Q68 62 66 67 L54 67 L54 57 Z"
        fill="currentColor"
        opacity={0.28}
      />

      {/* Left arm (viewer's right) */}
      <path
        d="M29 22 Q22 28 21 38 Q20 44 22 50 Q24 54 27 54 Q30 54 31 50 Q32 44 31 38 Q30 28 32 22 Z"
        fill="currentColor"
        opacity={0.22}
      />

      {/* Right arm (viewer's left) */}
      <path
        d="M71 22 Q78 28 79 38 Q80 44 78 50 Q76 54 73 54 Q70 54 69 50 Q68 44 69 38 Q70 28 68 22 Z"
        fill="currentColor"
        opacity={0.22}
      />

      {/* Left forearm/hand */}
      <ellipse cx="23" cy="57" rx="4" ry="6" fill="currentColor" opacity={0.18} />
      {/* Right forearm/hand */}
      <ellipse cx="77" cy="57" rx="4" ry="6" fill="currentColor" opacity={0.18} />

      {/* Left thigh */}
      <path
        d="M37 66 Q34 70 33 78 Q32 84 35 88 Q37 91 40 91 Q43 91 44 88 Q46 84 45 78 Q44 70 46 66 Z"
        fill="currentColor"
        opacity={0.25}
      />

      {/* Right thigh */}
      <path
        d="M63 66 Q66 70 67 78 Q68 84 65 88 Q63 91 60 91 Q57 91 56 88 Q54 84 55 78 Q56 70 54 66 Z"
        fill="currentColor"
        opacity={0.25}
      />

      {/* Left calf */}
      <path
        d="M35 89 Q33 92 34 97 L38 98 L42 97 Q43 92 41 89 Z"
        fill="currentColor"
        opacity={0.2}
      />

      {/* Right calf */}
      <path
        d="M65 89 Q67 92 66 97 L62 98 L58 97 Q57 92 59 89 Z"
        fill="currentColor"
        opacity={0.2}
      />
    </>
  );
}
