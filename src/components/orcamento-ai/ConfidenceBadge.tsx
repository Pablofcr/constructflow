'use client';

interface ConfidenceBadgeProps {
  confidence: number; // 0-1
}

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const pct = Math.round(confidence * 100);

  let color: string;
  let bg: string;

  if (pct >= 80) {
    color = 'text-green-700';
    bg = 'bg-green-100';
  } else if (pct >= 50) {
    color = 'text-yellow-700';
    bg = 'bg-yellow-100';
  } else {
    color = 'text-red-700';
    bg = 'bg-red-100';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color} ${bg}`}>
      {pct}%
    </span>
  );
}
