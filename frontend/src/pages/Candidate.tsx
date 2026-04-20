import React, { useEffect, useState } from 'react';
import { Target, Check, Clock, Shield, CheckCircle2, AlertTriangle, Gavel, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEscrow } from '../hooks/useEscrow';
import { useStellar } from '../hooks/useStellar';
import { useOnboarding } from '../hooks/useOnboarding';
import { TransactionToast } from '../components/TransactionToast';
import ActivityLedger from '../components/ActivityLedger';

export const Candidate: React.FC = () => {
  const navigate = useNavigate();
  const { address } = useStellar();
  const { role } = useOnboarding();
  const { fetchLatestCandidateEscrow, fetchEscrow, employerAddress, escrow, candidateAccept, raiseDispute, isTxPending, error, lastTxHash, clearError, loading } = useEscrow();

  useEffect(() => {
    if (role !== 'candidate' || !address) navigate('/');
  }, [role, address, navigate]);

  useEffect(() => {
    if (!address) return;
    fetchLatestCandidateEscrow();
  }, [address, fetchLatestCandidateEscrow]);

  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  useEffect(() => {
    const interval = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(interval);
  }, []);

  const deadlineRemaining = escrow ? Math.max(0, escrow.deadline - now) : 0;
  const daysLeft = Math.floor(deadlineRemaining / 86400);
  const hoursLeft = Math.floor((deadlineRemaining % 86400) / 3600);
  const minutesLeft = Math.floor((deadlineRemaining % 3600) / 60);
  const deadlineExpired = escrow ? now > escrow.deadline : false;

  const releasedCount = escrow?.milestones.filter(m => m.released).length ?? 0;
  const totalCount = escrow?.milestones.length ?? 0;
  const progressPercent = totalCount > 0 ? Math.round((releasedCount / totalCount) * 100) : 0;

  const handleAccept = async () => {
    try {
      await candidateAccept(employerAddress);
    } catch (err) {
      console.error(err);
    }
  };

  const StateBadge = ({ state }: { state: string }) => {
    const configs: Record<string, { bg: string; dot: string; label: string }> = {
      Pending: { bg: 'bg-amber-50 text-amber-700', dot: 'bg-amber-400', label: 'Awaiting Your Acceptance' },
      Active: { bg: 'bg-primary-50 text-primary-700', dot: 'bg-primary-500', label: 'Active — In Progress' },
      Complete: { bg: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500', label: 'Complete ✓' },
      Cancelled: { bg: 'bg-neutral-100 text-neutral-500', dot: 'bg-neutral-400', label: 'Cancelled by Employer' },
      Disputed: { bg: 'bg-fuchsia-50 text-fuchsia-700', dot: 'bg-fuchsia-500', label: 'In Dispute — Pending Arbitrator' },
      Resolved: { bg: 'bg-indigo-50 text-indigo-700', dot: 'bg-indigo-500', label: 'Resolved' },
    };
    const c = configs[state] || configs.Pending;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${c.bg} text-xs font-bold rounded-full`}>
        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
        {c.label}
      </span>
    );
  };

  if (!escrow) {
    return (
      <div className="flex flex-col gap-8">
        <header>
          <p className="text-xs font-semibold text-accent-600 mb-1">Welcome back</p>
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight mb-1">Candidate Workspace</h1>
            </div>
            <button 
              onClick={() => fetchEscrow(employerAddress)} 
              disabled={loading || !employerAddress}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-neutral-500 hover:text-primary-600 hover:bg-white rounded-lg border border-transparent hover:border-neutral-200 transition-all"
            >
              <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </header>
        <div className="grid grid-cols-1 gap-6">
          <div className="card-stella p-6 lg:p-8 border-accent-100">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-accent-50 rounded-xl flex items-center justify-center">
                  <Target size={18} className="text-accent-600" />
                </div>
                <h2 className="text-lg font-bold text-neutral-900">Your Escrow</h2>
              </div>
            </div>
            <div className="py-16 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4 border border-neutral-100">
                {loading ? <RotateCcw size={24} className="text-primary-400 animate-spin" /> : <Shield size={24} className="text-neutral-300" />}
              </div>
              <p className="text-sm font-semibold text-neutral-400 mb-6 max-w-xs">
                {loading ? 'Scanning the blockchain for your escrow contract...' : 'You do not have any active escrows. Waiting for your employer to create one.'}
              </p>

              <div className="mt-8 pt-6 border-t border-neutral-100 w-full flex flex-col items-center">
                <p className="text-xs text-neutral-400 mb-2">Escrow still not reflecting or having issues?</p>
                <button 
                  onClick={() => window.location.href = `mailto:support@stella-escrow.com?subject=Missing%20Escrow&body=My%20candidate%20address:%20${address}%0A%0AHello,%20I%20cannot%20find%20my%20onboarding%20escrow.`}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-xs font-semibold rounded-lg transition-all flex items-center gap-2"
                >
                  Submit a Support Ticket
                </button>
              </div>
            </div>
            <div className="mt-8">
              <ActivityLedger address={address} />
            </div>
          </div>
        </div>
        {(error || lastTxHash) && (
          <TransactionToast
            type={error ? 'error' : 'success'}
            message={error || 'Transaction confirmed ⭐'}
            txHash={lastTxHash ?? undefined}
            onClose={clearError}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-xs font-semibold text-accent-600 mb-1">Welcome back</p>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight mb-1">Candidate Workspace</h1>
          </div>
          <button 
            onClick={() => fetchEscrow(employerAddress)} 
            disabled={loading || !employerAddress}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-neutral-500 hover:text-primary-600 hover:bg-white rounded-lg border border-transparent hover:border-neutral-200 transition-all"
          >
            <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </header>
      <div className="grid grid-cols-1 gap-6">
        <div className="card-stella p-6 lg:p-8 border-accent-100">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-accent-50 rounded-xl flex items-center justify-center">
                <Target size={18} className="text-accent-600" />
              </div>
              <h2 className="text-lg font-bold text-neutral-900">Your Escrow</h2>
            </div>
            <StateBadge state={escrow.state} />
          </div>
          <div className="flex flex-col gap-6">
            {escrow.state === 'Pending' && (
              <div className="bg-amber-50 p-6 rounded-xl border border-amber-100">
                <div className="flex items-start gap-3 mb-4">
                  <Shield size={20} className="text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-800 mb-1">Escrow Awaiting Your Acceptance</p>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Your employer has locked funds in an on-chain escrow for your onboarding milestones. 
                      Review the milestones below and accept to begin the work period.
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
                <button
                  onClick={handleAccept}
                  disabled={isTxPending}
                  className="btn-primary w-full"
                >
                  {isTxPending ? 'Signing...' : 'Accept Escrow & Begin Onboarding'}
                </button>
              </div>
            )}
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
                    <p className="label-section mb-1">Released to You</p>
                    <p className="text-2xl font-extrabold text-primary-600">
                      {escrow.totalReleased} <span className="text-primary-300 text-base font-semibold">XLM</span>
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
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                            m.released ? 'bg-emerald-500 text-white' : 'bg-neutral-200 text-neutral-500'
                            }`}>
                            {m.released ? <Check size={10} /> : m.id + 1}
                          </span>
                          <span className="text-sm font-semibold text-neutral-800">{m.description}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${m.released ? 'text-emerald-600' : 'text-neutral-900'}`}>
                            {m.amount} XLM
                          </span>
                          {m.released && (
                            <span className="text-xs text-emerald-500 font-semibold">Paid ✓</span>
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
                {deadlineExpired && (
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
                      onClick={() => raiseDispute(employerAddress)}
                      disabled={isTxPending}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all shadow-sm shadow-fuchsia-200"
                    >
                      <Gavel size={16} />
                      {isTxPending ? 'Raising Dispute...' : 'Raise Formal Dispute'}
                    </button>
                  </div>
                )}
              </div>
            )}
            {escrow.state === 'Complete' && (
              <div className="text-center py-8">
                <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
                <p className="text-lg font-extrabold text-neutral-900 mb-1">All Milestones Complete!</p>
                <p className="text-sm text-neutral-500 mb-4">
                  You've received <strong className="text-emerald-600">{escrow.totalReleased} XLM</strong> across {totalCount} milestones.
                </p>
                <div className="flex flex-col gap-2 max-w-sm mx-auto">
                  {escrow.milestones.map((m) => (
                    <div key={m.id} className="flex justify-between p-2 bg-emerald-50 rounded-lg text-sm border border-emerald-100">
                      <span className="text-emerald-800 font-medium">{m.description}</span>
                      <span className="text-emerald-700 font-bold">{m.amount} XLM ✓</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {escrow.state === 'Disputed' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-fuchsia-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                  <AlertTriangle size={32} className="text-fuchsia-600" />
                </div>
                <p className="text-lg font-extrabold text-neutral-900 mb-1">Escrow in Dispute</p>
                <p className="text-sm text-neutral-500 mb-6 max-w-sm mx-auto">
                  A formal dispute has been raised. The platform arbitrator is currently reviewing the milestones and contributions. 
                  Unreleased funds (<strong className="text-neutral-900">{(Number(escrow.totalLocked) - Number(escrow.totalReleased)).toFixed(1)} XLM</strong>) are held by the contract.
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
            {escrow.state === 'Cancelled' && (
              <div className="text-center py-8">
                <p className="text-sm font-semibold text-neutral-400">
                  This escrow was cancelled by the employer. No further actions available.
                </p>
                {escrow.milestones.some(m => m.released) && (
                  <p className="text-xs text-neutral-400 mt-2">
                      You received <strong>{escrow.totalReleased} XLM</strong> before cancellation.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {(error || lastTxHash) && (
        <TransactionToast
          type={error ? 'error' : 'success'}
          message={error || 'Transaction confirmed ⭐'}
          txHash={lastTxHash ?? undefined}
          onClose={clearError}
        />      )}
    </div>
  );
};
