/**
 * Players Chart Component
 * Красивый график для отображения статистики игроков онлайн
 *
 * Оптимизирован для производительности:
 * - Мемоизация вычислений
 * - Адаптивный дизайн
 *
 * @module components/PlayersChart
 */

import { useMemo } from 'react';

interface PlayersChartProps {
  online: number;
  max: number;
  className?: string;
}

export default function PlayersChart({ online, max, className = '' }: PlayersChartProps) {
  // Мемоизируем вычисления для оптимизации производительности
  const { percentage, radius, circumference, offset } = useMemo(() => {
    const pct = max > 0 ? (online / max) * 100 : 0;
    const r = 60;
    const circ = 2 * Math.PI * r;
    const off = circ - (pct / 100) * circ;
    return {
      percentage: pct,
      radius: r,
      circumference: circ,
      offset: off,
    };
  }, [online, max]);

  return (
    <div className={className} style={{ position: 'relative' }}>
      {/* Circular Progress */}
      <div style={{ position: 'relative', width: '128px', height: '128px', margin: '0 auto' }}>
        <svg style={{ transform: 'rotate(-90deg)', width: '128px', height: '128px' }}>
          {/* Background circle */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="url(#gradient)"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center text */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>{online}</div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>of {max}</div>
        </div>
      </div>

      {/* Stats below */}
      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>Players Online</div>
        <div style={{ fontSize: '18px', fontWeight: 600, color: 'white' }}>
          {percentage.toFixed(0)}% Capacity
        </div>
      </div>
    </div>
  );
}
