import React from 'react';

/**
 * Escrow Status Types
 */
export type EscrowStatus = 'DRAFT' | 'LOCKED' | 'RELEASED' | 'CLAWED_BACK';

interface StatusBadgeProps {
  status: EscrowStatus;
}

const statusConfig: Record<EscrowStatus, { label: string; classes: string }> = {
  DRAFT: {
    label: 'Initialization',
    classes: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  },
  LOCKED: {
    label: 'Funds Locked',
    classes: 'bg-primary-50 text-primary-600 border-primary-200',
  },
  RELEASED: {
    label: 'Completed',
    classes: 'bg-success/10 text-success border-success/20',
  },
  CLAWED_BACK: {
    label: 'Recovered',
    classes: 'bg-error/10 text-error border-error/20',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status];

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${config.classes}`}>
      {config.label}
    </span>
  );
};

// Aliases for retro-compatibility with EscrowCard logic
export const DraftBadge = () => <StatusBadge status="DRAFT" />;
export const LockedBadge = () => <StatusBadge status="LOCKED" />;
export const ReleasedBadge = () => <StatusBadge status="RELEASED" />;
export const ClawedBackBadge = () => <StatusBadge status="CLAWED_BACK" />;
