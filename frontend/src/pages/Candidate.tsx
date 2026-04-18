import React, { useEffect, useState } from 'react';
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
  const { fetchEscrow, claimMilestone, escrow, loading, error, lastTxHash, clearError } = useEscrow();
  const [claimAmount, setClaimAmount] = useState('');

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

  const handleClaim = async () => {
    if (!claimAmount) return;
    try {
      await claimMilestone(claimAmount);
      setClaimAmount('');
      fetchEscrow();
    } catch (e) {
      console.error(e);
    }
  };

  const truncatedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Fund details */}
        <div className="lg:col-span-8">
          <div className="card-stella p-6 lg:p-8">
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
                  Secured
                </span>
              )}
            </div>

            {escrow ? (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="label-section mb-1">Total Locked</p>
                    <p className="text-2xl font-extrabold text-neutral-900">
                      500.00 <span className="text-neutral-400 text-base font-semibold">XLM</span>
                    </p>
                  </div>
                  <div>
                    <p className="label-section mb-1">Remaining</p>
                    <p className="text-2xl font-extrabold text-primary-600">
                      350.00 <span className="text-primary-300 text-base font-semibold">XLM</span>
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-neutral-100">
                  <p className="label-section mb-3">Progress</p>
                  <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-primary-500 h-full rounded-full" style={{ width: '30%' }} />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs font-semibold text-neutral-400">150.00 XLM claimed</span>
                    <span className="text-xs font-semibold text-neutral-500">28 days remaining</span>
                  </div>
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

        {/* Claim sidebar */}
        <div className="lg:col-span-4">
          <div className="card-stella p-6 bg-neutral-900 text-white border-neutral-800 sticky top-6">
            <div className="flex items-center gap-2.5 mb-5">
              <Gift className="w-5 h-5 text-accent-400" />
              <h3 className="font-bold text-base">Claim Funds</h3>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Amount to claim
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full h-12 px-4 rounded-lg bg-white/5 border border-white/10
                             text-white text-lg font-bold placeholder-white/20
                             focus:outline-none focus:border-primary-400 transition-colors duration-150"
                  value={claimAmount}
                  onChange={(e) => setClaimAmount(e.target.value)}
                />
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed">
                By claiming, you confirm that the agreed work has been delivered to your employer.
              </p>

              <button
                onClick={handleClaim}
                disabled={loading || !escrow || !claimAmount}
                className="btn-primary w-full"
              >
                {loading ? 'Processing...' : 'Claim Funds'}
              </button>
            </div>
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
