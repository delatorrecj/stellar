import React from 'react';
import type { EscrowState } from '../lib/contract';

/**
 * 🌠 Stella — Status Badge (V2.0)
 * 
 * State-aware status indicator with semantic colors.
 */

interface StatusBadgeProps {
  status: EscrowState;
}

const statusConfig: Record<EscrowState, { label: string; classes: string }> = {
  Pending: {
    label: 'Pending Acceptance',
    classes: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  },
  Active: {
    label: 'Funds Locked / Active',
    classes: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  },
  Complete: {
    label: 'Completed',
    classes: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  },
  Cancelled: {
    label: 'Cancelled / Refunded',
    classes: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  },
  Disputed: {
    label: 'In Dispute',
    classes: 'bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20',
  },
  Resolved: {
    label: 'Resolved by Arbitrator',
    classes: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status] || statusConfig.Pending;

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${config.classes}`}>
      {config.label}
    </span>
  );
};

export const DraftBadge = () => <StatusBadge status="Pending" />;
export const LockedBadge = () => <StatusBadge status="Active" />;
export const ReleasedBadge = () => <StatusBadge status="Complete" />;
export const ClawedBackBadge = () => <StatusBadge status="Cancelled" />;
