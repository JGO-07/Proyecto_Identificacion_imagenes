import type { ImageStatus } from '../types/api.js';

const labels: Record<ImageStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'En progreso',
  completed: 'Completada',
};

interface StatusBadgeProps {
  status: ImageStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`status-badge status-${status}`}>{labels[status]}</span>;
}
