import React from 'react';
import { 
  DraftBadge, 
  LockedBadge, 
  ReleasedBadge, 
  ClawedBackBadge 
} from './StatusBadge';
import { 
  Building2, 
  User, 
  Calendar, 
  DollarSign, 
  ArrowRightCircle,
  ShieldCheck
} from 'lucide-react';

export type EscrowStatus = 'DRAFT' | 'LOCKED' | 'RELEASED' | 'CLAWED_BACK';

export interface EscrowCardProps {
  escrow: {
    id: string;
    title: string;
    employer: string;
    candidate: string;
    amount: string;
    status: EscrowStatus;
    createdAt: string;
  };
  onAction?: (id: string) => void;
  actionLabel?: string;
}

export const EscrowCard: React.FC<EscrowCardProps> = ({ escrow, onAction, actionLabel }) => {
  const renderBadge = () => {
    switch (escrow.status) {
      case 'DRAFT': return <DraftBadge />;
      case 'LOCKED': return <LockedBadge />;
      case 'RELEASED': return <ReleasedBadge />;
      case 'CLAWED_BACK': return <ClawedBackBadge />;
      default: return null;
    }
  };

  const truncate = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  return (
    <div className="bg-white rounded-3xl border border-neutral-100 p-6 shadow-sm hover:shadow-xl transition-all group">
      <div className="flex justify-between items-start mb-6">
        <div className="bg-primary-50 p-3 rounded-2xl text-primary-600 group-hover:bg-primary-500 group-hover:text-white transition-colors">
          <ShieldCheck className="w-6 h-6" />
        </div>
        {renderBadge()}
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-bold text-neutral-900 group-hover:text-primary-600 transition-colors">
          {escrow.title}
        </h3>
        <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
          <Calendar className="w-3 h-3" /> Created {escrow.createdAt}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100/50">
          <div className="flex items-center gap-2 text-neutral-400 mb-1">
            <Building2 className="w-3 h-3" />
            <span className="text-xs font-bold uppercase tracking-wider">Employer</span>
          </div>
          <p className="text-sm font-mono font-bold text-neutral-700">{truncate(escrow.employer)}</p>
        </div>
        <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100/50">
          <div className="flex items-center gap-2 text-neutral-400 mb-1">
            <User className="w-3 h-3" />
            <span className="text-xs font-bold uppercase tracking-wider">Candidate</span>
          </div>
          <p className="text-sm font-mono font-bold text-neutral-700">{truncate(escrow.candidate)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-neutral-50">
        <div>
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest block mb-1">Amount Locked</span>
          <div className="flex items-center gap-1 text-2xl font-black text-neutral-900">
            <DollarSign className="w-5 h-5 text-success" />
            {escrow.amount} <span className="text-xs font-bold text-neutral-400">XLM</span>
          </div>
        </div>

        {onAction && actionLabel && (
          <button 
            onClick={() => onAction(escrow.id)}
            className="flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-primary-500 transition-all shadow-lg shadow-neutral-900/10"
          >
            {actionLabel}
            <ArrowRightCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
