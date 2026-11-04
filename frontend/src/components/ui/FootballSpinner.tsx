import React from 'react';

interface FootballSpinnerProps {
  variant?: 'fullscreen' | 'inline';
  label?: string;
}

const Football = ({ compact = false }: { compact?: boolean }) => (
  <div className={`pdb-loader-ball-wrap ${compact ? 'pdb-loader-ball-wrap--compact' : ''}`} aria-hidden="true">
    <span className="pdb-loader-ball-aura" />
    <span className="pdb-loader-ball-shadow" />
    <span className="pdb-loader-ball-orbit pdb-loader-ball-orbit--one" />
    <span className="pdb-loader-ball-orbit pdb-loader-ball-orbit--two" />
    <svg className="pdb-loader-ball" viewBox="0 0 120 120" role="presentation">
      <defs>
        <radialGradient id="pdbBallSurface" cx="31%" cy="24%" r="76%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="58%" stopColor="#e7edf4" />
          <stop offset="100%" stopColor="#8794a5" />
        </radialGradient>
        <radialGradient id="pdbBallShade" cx="50%" cy="45%" r="58%">
          <stop offset="58%" stopColor="#07101d" stopOpacity="0" />
          <stop offset="100%" stopColor="#030711" stopOpacity=".72" />
        </radialGradient>
        <clipPath id="pdbBallClip">
          <circle cx="60" cy="60" r="54" />
        </clipPath>
      </defs>
      <circle cx="60" cy="60" r="54" fill="url(#pdbBallSurface)" />
      <g clipPath="url(#pdbBallClip)" fill="#101827" stroke="#d9e2ec" strokeWidth="1.8" strokeLinejoin="round">
        <polygon points="60,37 74,47 69,64 51,64 46,47" />
        <polygon points="60,7 73,15 74,30 60,37 46,30 47,15" />
        <polygon points="99,31 112,40 108,57 92,61 82,47 87,33" />
        <polygon points="96,82 108,77 119,89 112,105 94,108 84,95" />
        <polygon points="60,83 75,76 88,87 84,104 68,113 54,101" />
        <polygon points="23,82 37,76 51,84 54,101 40,113 24,105" />
        <polygon points="8,40 21,31 34,36 38,52 27,64 11,58" />
        <polygon points="28,8 44,5 47,15 46,30 32,36 19,25" />
      </g>
      <circle cx="60" cy="60" r="54" fill="url(#pdbBallShade)" />
      <path d="M22 31 Q39 11 62 10" fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="3" strokeLinecap="round" />
      <circle cx="60" cy="60" r="53.5" fill="none" stroke="#fff" strokeOpacity=".55" />
    </svg>
  </div>
);

export const FootballSpinner = ({
  variant = 'inline',
  label = 'Preparando la jugada',
}: FootballSpinnerProps) => {
  if (variant === 'fullscreen') {
    return (
      <div className="pdb-loader-screen" role="status" aria-live="polite" aria-label={label}>
        <div className="pdb-loader-stadium" aria-hidden="true">
          <span className="pdb-loader-light pdb-loader-light--left" />
          <span className="pdb-loader-light pdb-loader-light--right" />
          <span className="pdb-loader-beam pdb-loader-beam--left" />
          <span className="pdb-loader-beam pdb-loader-beam--right" />
          <div className="pdb-loader-particles" aria-hidden="true">
            <i /><i /><i /><i /><i /><i /><i /><i />
          </div>
          <span className="pdb-loader-pitch-line pdb-loader-pitch-line--horizontal" />
          <span className="pdb-loader-pitch-line pdb-loader-pitch-line--circle" />
        </div>
        <div className="pdb-loader-content">
          <div className="pdb-loader-brand">
            <span className="pdb-loader-brand-mark">PDB</span>
            <span className="pdb-loader-brand-name">PICHANGAS <b>DE BARRIO</b></span>
          </div>
          <Football />
          <p className="pdb-loader-label">{label}</p>
          <div className="pdb-loader-progress" aria-hidden="true"><span /></div>
          <span className="pdb-loader-caption">FÚTBOL · AMISTAD · COMUNIDAD</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pdb-loader-inline" role="status" aria-live="polite" aria-label={label}>
      <Football compact />
      <span className="pdb-loader-inline-label">{label}</span>
      <span className="pdb-loader-inline-track" aria-hidden="true"><i /></span>
    </div>
  );
};
