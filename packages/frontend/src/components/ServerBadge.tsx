/**
 * Server Badge Component
 * Отображает пометки на карточках серверов (NEW, TOP, WIP, HARD и т.д.)
 */

import { motion } from 'framer-motion';

type BadgeType = 'NEW' | 'TOP' | 'WIP' | 'HARD' | 'POPULAR' | 'BETA' | 'ALPHA' | string;

interface ServerBadgeProps {
  type: BadgeType;
  className?: string;
}

const badgeStyles: Record<string, { bg: string; text: string; border?: string }> = {
  NEW: {
    bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
    text: 'text-white',
  },
  TOP: {
    bg: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    text: 'text-white',
  },
  WIP: {
    bg: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    text: 'text-white',
  },
  HARD: {
    bg: 'bg-gradient-to-r from-red-600 to-red-700',
    text: 'text-white',
  },
  POPULAR: {
    bg: 'bg-gradient-to-r from-pink-500 to-rose-600',
    text: 'text-white',
  },
  BETA: {
    bg: 'bg-gradient-to-r from-purple-500 to-indigo-600',
    text: 'text-white',
  },
  ALPHA: {
    bg: 'bg-gradient-to-r from-gray-600 to-gray-700',
    text: 'text-white',
  },
};

const defaultStyle = {
  bg: 'bg-gradient-to-r from-gray-500 to-gray-600',
  text: 'text-white',
};

export default function ServerBadge({ type, className = '' }: ServerBadgeProps) {
  const style = badgeStyles[type] || defaultStyle;

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${style.bg} ${style.text} ${style.border || ''} shadow-lg ${className}`}
    >
      {type}
    </motion.span>
  );
}

