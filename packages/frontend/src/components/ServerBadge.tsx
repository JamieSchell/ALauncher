/**
 * Server Badge Component
 * Отображает пометки на карточках серверов (NEW, TOP, WIP, HARD и т.д.)
 */

type BadgeType = 'NEW' | 'TOP' | 'WIP' | 'HARD' | 'POPULAR' | 'BETA' | 'ALPHA' | string;

interface ServerBadgeProps {
  type: BadgeType;
  className?: string;
}

const badgeStyles: Record<string, { background: string; color: string; border?: string }> = {
  NEW: {
    background: 'linear-gradient(to right, rgb(34, 197, 94), rgb(16, 185, 129))',
    color: 'white',
  },
  TOP: {
    background: 'linear-gradient(to right, rgb(234, 179, 8), rgb(249, 115, 22))',
    color: 'white',
  },
  WIP: {
    background: 'linear-gradient(to right, rgb(59, 130, 246), rgb(6, 182, 212))',
    color: 'white',
  },
  HARD: {
    background: 'linear-gradient(to right, rgb(220, 38, 38), rgb(185, 28, 28))',
    color: 'white',
  },
  POPULAR: {
    background: 'linear-gradient(to right, rgb(236, 72, 153), rgb(225, 29, 72))',
    color: 'white',
  },
  BETA: {
    background: 'linear-gradient(to right, rgb(168, 85, 247), rgb(79, 70, 229))',
    color: 'white',
  },
  ALPHA: {
    background: 'linear-gradient(to right, rgb(107, 114, 128), rgb(75, 85, 99))',
    color: 'white',
  },
};

const defaultStyle = {
  background: 'linear-gradient(to right, rgb(107, 114, 128), rgb(75, 85, 99))',
  color: 'white',
};

export default function ServerBadge({ type, className = '' }: ServerBadgeProps) {
  const style = badgeStyles[type] || defaultStyle;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 'bold',
        background: style.background,
        color: style.color,
        border: style.border || 'none',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      }}
      className={className}
    >
      {type}
    </span>
  );
}
