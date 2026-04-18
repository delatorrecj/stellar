import React, { useEffect } from 'react';
import { Target, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEscrow } from '../hooks/useEscrow';
import { useStellar } from '../hooks/useStellar';
import { useOnboarding } from '../hooks/useOnboarding';
import { TransactionToast } from '../components/TransactionToast';

/**
 * Candidate Workspace — only accessible after onboarding as candidate
 */
export const Candidate: React.FC = () => {
  const navigate = useNavigate();
  const { address } = useStellar();
  const { role } = useOnboarding();
  const { fetchEscrow, escrow, error, lastTxHash, clearError } = useEscrow();

  // Guard: must be onboarded as candidate
  useEffect(() => {
    if (role !== 'candidate' || !address) {
      navigate('/');
    }
  }, [role, address, navigate]);

  // Auto-fetch on mount
  useEffect(() => {
    if (address) {
      fetchEscrow();
    }
  }, [address, fetchEscrow]);

  const handleClaim = async () => {}; // No longer needed
  const truncatedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  const total = escrow ? Number(escrow.total_amount) / 10_000_000 : 0;
  const unlocked = escrow ? Number(escrow.unlocked_amount) / 10_000_000 : 0;
  const remaining = total - unlocked;
  const progressPercent = total > 0 ? (unlocked / total) * 100 : 0;
  const deadlineDays = escrow ? Math.max(0, Math.ceil((Number(escrow.deadline) - Date.now() / 1000) / 86400)) : 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome header */}
      <header>
        <p className="text-xs font-semibold text-accent-600 mb-1">Welcome back</p>
        <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight mb-1">
          Candidate Workspace
        </h1>
        <p className="text-sm text-neutral-400 font-mono">{truncatedAddress}</p>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {/* Fund details */}
        <div>
          <div className="card-stella p-6 lg:p-8 border-accent-100">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-accent-50 rounded-xl flex items-center justify-center">
                  <Target size={18} className="text-accent-600" />
                </div>
                <h2 className="text-lg font-bold text-neutral-900">Your Locked Funds</h2>
              </div>
              {escrow && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-bold rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  Secured & Trustless
                </span>
              )}
            </div>

            {escrow ? (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="label-section mb-1">Total Locked</p>
                    <p className="text-2xl font-extrabold text-neutral-900">
                      {total.toFixed(2)} <span className="text-neutral-400 text-base font-semibold">XLM</span>
                    </p>
                  </div>
                  <div>
                    <p className="label-section mb-1">Remaining to Release</p>
                    <p className="text-2xl font-extrabold text-primary-600">
                      {remaining.toFixed(2)} <span className="text-primary-300 text-base font-semibold">XLM</span>
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-neutral-100">
                  <p className="label-section mb-3">Escrow Progress</p>
                  <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-primary-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs font-semibold text-neutral-400">{unlocked.toFixed(2)} XLM released</span>
                    <span className="text-xs font-semibold text-neutral-500">{deadlineDays} days secured</span>
                  </div>
                </div>
                
                <div className="mt-2 bg-neutral-50 p-4 rounded-lg flex gap-3 items-start border border-neutral-100">
                  <Gift className="w-5 h-5 text-accent-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    This dashboard provides cryptographically verifiable proof that your employer has locked these funds. Once you complete your milestones, your employer will trigger the release of funds directly to your wallet. If they do not, they cannot claw it back until the deadline expires.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="text-sm font-semibold text-neutral-400">
                  No onboarding funds yet. Ask your employer to set up Stella for your onboarding.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {lastTxHash && (
        <TransactionToast
          type={error ? 'error' : 'success'}
          message={error || 'Funds are on their way to you ⭐'}
          txHash={lastTxHash}
          onClose={clearError}
        />
      )}
    </div>
  );
};
