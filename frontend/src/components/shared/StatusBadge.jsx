import clsx from 'clsx';

const STATUS_STYLES = {
  pending:     'badge-yellow',
  verified:    'badge-blue',
  in_progress: 'badge-cyan',
  resolved:    'badge-green',
  rejected:    'badge-red',
  closed:      'badge-slate',
};

const PRIORITY_STYLES = {
  low:    'badge-slate',
  medium: 'badge-yellow',
  high:   'badge-red',
  urgent: 'bg-red-600/80 text-white border-red-500/50 badge',
};

export function StatusBadge({ status }) {
  return (
    <span className={clsx(STATUS_STYLES[status] || 'badge-slate')}>
      {status?.replace('_', ' ')}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  return (
    <span className={clsx(PRIORITY_STYLES[priority] || 'badge-slate')}>
      {priority}
    </span>
  );
}
