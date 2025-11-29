/**
 * Players Chart Component
 * Красивый график для отображения статистики игроков онлайн
 */

import { motion } from 'framer-motion';

interface PlayersChartProps {
  online: number;
  max: number;
  className?: string;
}

export default function PlayersChart({ online, max, className = '' }: PlayersChartProps) {
  const percentage = max > 0 ? (online / max) * 100 : 0;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`relative ${className}`}>
      {/* Circular Progress */}
      <div className="relative w-32 h-32 mx-auto">
        <svg className="transform -rotate-90 w-32 h-32">
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
          <motion.circle
            cx="64"
            cy="64"
            r={radius}
            stroke="url(#gradient)"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold text-white">{online}</div>
          <div className="text-xs text-gray-400">of {max}</div>
        </div>
      </div>

      {/* Stats below */}
      <div className="mt-4 text-center">
        <div className="text-sm text-gray-400 mb-1">Players Online</div>
        <div className="text-lg font-semibold text-white">
          {percentage.toFixed(0)}% Capacity
        </div>
      </div>
    </div>
  );
}

