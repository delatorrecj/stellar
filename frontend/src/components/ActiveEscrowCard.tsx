import React from 'react';
import { 
  Check, 
  Clock, 
  AlertTriangle, 
  Gavel, 
  CheckCircle2, 
  Shield, 
  ShieldCheck, 
  Copy 
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import type { EscrowState } from '../lib/contract';

export interface Milestone {
  id: number;
  description: string;
  amount: string;
  released: boolean;
}

export interface EscrowData {
  employer: string;
  candidate: string;
  state: EscrowState;
  totalLocked: string;
  totalReleased: string;
  deadline: number;
  milestones: Milestone[];
}

interface ActiveEscrowCardProps {
  escrow: EscrowData;
  role: 'employer' | 'candidate';
  isTxPending: boolean;
  onAccept?: () => void;
  onReleaseMilestone?: (milestoneId: number) => void;
  onRaiseDispute?: () => void;
  onClawback?: () => void;
}

export const ActiveEscrowCard: React.FC<ActiveEscrowCardProps> = ({
  escrow,
  role,
  isTxPending,
  onAccept,
  onReleaseMilestone,
  onRaiseDispute,
  onClawback
}) => {
  const [linkCopied, setLinkCopied] = React.useState(false);

  // Time calculations
  const now = Math.floor(Date.now() / 1000);
  const timeLeft = escrow.deadline > now ? escrow.deadline - now : 0;
  const daysLeft = Math.floor(timeLeft / 86400);
  const hoursLeft = Math.floor((timeLeft % 86400) / 3600);
  const minutesLeft = Math.floor((timeLeft % 3600) / 60);
  const deadlineExpired = timeLeft === 0 && escrow.deadline > 0;

  // Stats
  const totalCount = escrow.milestones.length;
  const releasedCount = escrow.milestones.filter(m => m.released).length;
  const progressPercent = totalCount > 0 ? (releasedCount / totalCount) * 100 : 0;

  const handleCopyInvite = async () => {
    const link = `${window.location.origin}/candidate?employer=${escrow.employer}`;
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header section explicitly for Employer Role to grab link */}
      {role === 'employer' && (
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="label-section mb-1">Status</p>
            <StatusBadge status={escrow.state} />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyInvite}
              className="flex justify-center items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-lg text-xs font-bold transition-all border border-primary-100"
              title="Copy Invite Link for Candidate"
            >
              <Copy size={12} />
              {linkCopied ? 'Copied!' : 'Invite Link'}
            </button>
            <ShieldCheck size={18} className="text-primary-500 hidden sm:block" />
          </div>
        </div>
      )}

      {/* ─── PENDING STATE ─── */}
      {escrow.state === 'Pending' && (
        <div className="bg-amber-50 p-6 rounded-xl border border-amber-100">
          <div className="flex items-start gap-3 mb-4">
            <Shield size={20} className="text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800 mb-1">
                {role === 'candidate' ? 'Escrow Awaiting Your Acceptance' : 'Awaiting Candidate Acceptance'}
              </p>
              <p className="text-xs text-amber-700 leading-relaxed">
                {role === 'candidate' 
                  ? 'Your employer has locked funds for your onboarding. Review the milestones below and accept to begin.'
                  : 'Funds are securely locked. Waiting for the candidate to accept the escrow agreement.'}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 mb-4">
            {escrow.milestones.map((m) => (
              <div key={m.id} className="flex justify-between items-center p-2 bg-white rounded-lg border border-amber-100">
                <span className="text-sm text-neutral-700 font-medium">{m.description}</span>
                <span className="text-sm font-bold text-neutral-900">{m.amount} XLM</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mb-4 text-xs text-amber-700 font-semibold">
            <span>Total: <strong className="text-amber-900">{escrow.totalLocked} XLM</strong></span>
            <span>{daysLeft}d {hoursLeft}h deadline</span>
          </div>

          {role === 'candidate' && onAccept && (
            <button onClick={onAccept} disabled={isTxPending} className="btn-primary w-full">
              {isTxPending ? 'Signing...' : 'Accept Escrow & Begin Onboarding'}
            </button>
          )}

          {role === 'employer' && onClawback && (
            <button onClick={onClawback} disabled={isTxPending} className="mt-2 w-full py-2 text-xs font-bold text-amber-700 bg-amber-100 rounded-lg hover:bg-amber-200 transition-colors">
              {isTxPending ? 'Processing...' : 'Cancel & Clawback Funds'}
            </button>
          )}
        </div>
      )}

      {/* ─── ACTIVE STATE ─── */}
      {escrow.state === 'Active' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="label-section mb-1">Total Locked</p>
              <p className="text-2xl font-extrabold text-neutral-900">
                {escrow.totalLocked} <span className="text-neutral-400 text-base font-semibold">XLM</span>
              </p>
            </div>
            <div>
              <p className="label-section mb-1">Released</p>
              <p className={`text-2xl font-extrabold ${role === 'candidate' ? 'text-primary-600' : 'text-emerald-600'}`}>
                {escrow.totalReleased} <span className={`text-base font-semibold ${role === 'candidate' ? 'text-primary-300' : 'text-emerald-300'}`}>XLM</span>
              </p>
            </div>
          </div>
          <div>
            <p className="label-section mb-3">Milestones ({releasedCount}/{totalCount})</p>
            <div className="flex flex-col gap-2">
              {escrow.milestones.map((m) => (
                <div key={m.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                  m.released ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-neutral-100'
                }`}>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      m.released ? 'bg-emerald-500 text-white' : 'bg-neutral-200 text-neutral-500'
                    }`}>
                      {m.released ? <Check size={10} /> : m.id + 1}
                    </span>
                    <span className="text-sm font-semibold text-neutral-800 truncate" title={m.description}>{m.description}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <span className={`text-sm font-bold ${m.released ? 'text-emerald-600' : 'text-neutral-900'}`}>
                      {m.amount} XLM
                    </span>
                    {m.released && role === 'candidate' && (
                      <span className="text-xs text-emerald-500 font-semibold hidden sm:inline">Paid ✓</span>
                    )}
                    {!m.released && role === 'employer' && escrow.state === 'Active' && onReleaseMilestone && (
                      <button
                        onClick={() => onReleaseMilestone(m.id)}
                        disabled={isTxPending}
                        className="btn-primary text-xs px-3 py-1"
                      >
                        Release
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t border-neutral-100">
            <p className="label-section mb-3">Progress</p>
            <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden">
              <div className="bg-primary-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs font-semibold text-neutral-400">{escrow.totalReleased} XLM released</span>
              <div className={`flex items-center gap-1 text-xs font-semibold ${deadlineExpired ? 'text-red-500' : 'text-neutral-500'}`}>
                <Clock size={10} />
                {deadlineExpired ? 'Deadline expired' : `${daysLeft}d ${hoursLeft}h ${minutesLeft}m`}
              </div>
            </div>
          </div>

          {deadlineExpired && role === 'candidate' && onRaiseDispute && (
            <div className="mt-4 p-4 border border-fuchsia-100 bg-fuchsia-50/50 rounded-xl">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-fuchsia-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-fuchsia-900 mb-1">Contract Deadline Expired</p>
                  <p className="text-xs text-fuchsia-700 leading-relaxed">
                    The deadline for this escrow has passed. If there are unreleased funds for work you've performed, 
                    you can raise a formal dispute to involve the platform arbitrator.
                  </p>
                </div>
              </div>
              <button 
                onClick={onRaiseDispute}
                disabled={isTxPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all shadow-sm shadow-fuchsia-200"
              >
                <Gavel size={16} />
                {isTxPending ? 'Raising Dispute...' : 'Raise Formal Dispute'}
              </button>
            </div>
          )}
          {deadlineExpired && role === 'employer' && onClawback && (
            <div className="mt-4 p-4 border border-amber-100 bg-amber-50 rounded-xl">
              <div className="flex items-start gap-3 mb-4">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-900 mb-1">Deadline Expired</p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    The deadline has passed. If the candidate failed to deliver, you can clawback the remaining unreleased funds.
                  </p>
                </div>
              </div>
              <button 
                onClick={onClawback}
                disabled={isTxPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all"
              >
                {isTxPending ? 'Clawing back...' : 'Clawback Unreleased Funds'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── COMPLETE STATE ─── */}
      {escrow.state === 'Complete' && (
        <div className="text-center py-8">
          <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
          <p className="text-lg font-extrabold text-neutral-900 mb-1">All Milestones Complete!</p>
          <p className="text-sm text-neutral-500 mb-4">
            {role === 'candidate' ? "You've received" : "You've paid out"} <strong className="text-emerald-600">{escrow.totalReleased} XLM</strong> across {totalCount} milestones.
          </p>
          <div className="flex flex-col gap-2 max-w-sm mx-auto">
            {escrow.milestones.map((m) => (
              <div key={m.id} className="flex justify-between p-2 bg-emerald-50 rounded-lg text-sm border border-emerald-100">
                <span className="text-emerald-800 font-medium truncate">{m.description}</span>
                <span className="text-emerald-700 font-bold shrink-0 ml-2">{m.amount} XLM ✓</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── DISPUTED STATE ─── */}
      {escrow.state === 'Disputed' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-fuchsia-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
            <AlertTriangle size={32} className="text-fuchsia-600" />
          </div>
          <p className="text-lg font-extrabold text-neutral-900 mb-1">Escrow in Dispute</p>
          <p className="text-sm text-neutral-500 mb-6 max-w-sm mx-auto">
            A formal dispute has been raised. The platform arbitrator is currently reviewing the milestones and contributions. 
            Unreleased funds (<strong className="text-neutral-900">{(Number(escrow.totalLocked) - Number(escrow.totalReleased)).toFixed(1)} XLM</strong>) are held securely by the contract.
          </p>
          <div className="flex flex-col gap-2 max-w-sm mx-auto bg-fuchsia-50 p-4 rounded-xl border border-fuchsia-100">
            <div className="flex justify-between items-center text-xs text-fuchsia-700 font-bold uppercase tracking-wider">
              <span>Status</span>
              <span>Review in Progress</span>
            </div>
            <div className="w-full bg-fuchsia-200 h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-fuchsia-500 h-full w-2/3 animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* ─── RESOLVED STATE ─── */}
      {escrow.state === 'Resolved' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
            <Gavel size={32} className="text-indigo-600" />
          </div>
          <p className="text-lg font-extrabold text-neutral-900 mb-1">Dispute Resolved</p>
          <p className="text-sm text-neutral-500 mb-4 max-w-sm mx-auto">
            The platform arbitrator has finalized the distribution of the remaining funds.
            The contract is now closed.
          </p>
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 max-w-sm mx-auto">
            <p className="text-xs font-bold text-neutral-400 uppercase mb-2">Final Distribution</p>
            <div className="flex justify-between text-sm font-bold text-neutral-700">
              <span>Total Distributed</span>
              <span>{escrow.totalReleased} XLM</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── CANCELLED STATE ─── */}
      {escrow.state === 'Cancelled' && (
        <div className="text-center py-8">
          <p className="text-sm font-semibold text-neutral-400">
            This escrow was cancelled by the employer. No further actions available.
          </p>
          {escrow.milestones.some(m => m.released) && (
            <p className="text-xs text-neutral-400 mt-2">
                {role === 'candidate' ? 'You received' : 'You paid out'} <strong>{escrow.totalReleased} XLM</strong> before cancellation.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
