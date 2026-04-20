import React, { useState, useEffect } from 'react';
import { Search, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ActivityLedger from '../components/ActivityLedger';
import { useEscrow } from '../hooks/useEscrow';
import { useStellar } from '../hooks/useStellar';
import { useOnboarding } from '../hooks/useOnboarding';
import { TransactionToast } from '../components/TransactionToast';
import { AddressInput } from '../components/AddressInput';
import { ActiveEscrowCard } from '../components/ActiveEscrowCard';
import { CreateEscrowForm } from '../components/CreateEscrowForm';
import { QuickGuide } from '../components/QuickGuide';
import { PlusCircle } from 'lucide-react';

/**
 * Employer Workspace — V1.3 Multi-Milestone
 * 
 * - Dynamic MilestoneBuilder (add/remove rows)
 * - State-aware views: Pending / Active / Complete / Cancelled
 * - Per-milestone release buttons
 * - Clawback control
 */
export const Employer: React.FC = () => {
  const navigate = useNavigate();
  const { address, balance, network } = useStellar();
  const { role } = useOnboarding();
  const {
    createEscrow, clawbackEscrow, releaseMilestone, fetchEscrow,
    loading, isTxPending, error, lastTxHash, clearError, escrow
  } = useEscrow();

  // Manage panel state
  const [searchTarget, setSearchTarget] = useState('');
  const [recentCandidates, setRecentCandidates] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('stella_employer_recent') || '[]');
    } catch {
      return [];
    }
  });

  const saveCandidate = (pubKey: string) => {
    if (!pubKey || pubKey.length < 50) return;
    setRecentCandidates((prev) => {
      const updated = [pubKey, ...prev.filter((k) => k !== pubKey)].slice(0, 5);
      localStorage.setItem('stella_employer_recent', JSON.stringify(updated));
      return updated;
    });
  };

  // Guard
  useEffect(() => {
    if (role !== 'employer' || !address) navigate('/');
  }, [role, address, navigate]);

  // ─── Handlers ──────────────────────────────────────────────────

  const handleSearch = async (target?: string) => {
    const query = target || searchTarget;
    if (!query || !address) return;
    saveCandidate(query);
    await fetchEscrow(address, query);
  };

  const handleCreateSuccess = async (currentCandidate: string) => {
    setSearchTarget(currentCandidate);
    saveCandidate(currentCandidate);
    if (address) {
      localStorage.setItem(`stella_employer_${currentCandidate}`, address);
      await fetchEscrow(address, currentCandidate);
    }
  };

  const handleRelease = async (milestoneId: number) => {
    if (!searchTarget) return;
    try {
      await releaseMilestone(searchTarget, milestoneId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClawback = async () => {
    if (!searchTarget) return;
    try {
      await clawbackEscrow(searchTarget);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (address && searchTarget) handleSearch();
  }, [address]);


  return (
    <div className="flex flex-col gap-8">
      {/* Welcome header */}
      <header>
        <p className="text-xs font-semibold text-primary-500 mb-1">Welcome back</p>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight mb-2">
              Employer Workspace
            </h1>
          </div>
        </div>
      </header>

      <QuickGuide role="employer" address={address || ''} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ─── Lock Funds Form ────────────────────────────────────── */}
        <div className="card-stella p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center">
              <PlusCircle size={18} className="text-primary-600" />
            </div>
            <h2 className="text-lg font-bold text-neutral-900">Lock Onboarding Funds</h2>
          </div>

          <CreateEscrowForm 
            balance={balance}
            network={network}
            isTxPending={isTxPending}
            loading={loading}
            onCreate={createEscrow}
            onSuccess={handleCreateSuccess}
          />
        </div>

        {/* ─── Manage Panel ───────────────────────────────────────── */}
        <div className="card-stella p-6 lg:p-8 bg-neutral-50 font-sans">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-white rounded-xl border border-neutral-200 flex items-center justify-center">
              <Search size={18} className="text-neutral-600" />
            </div>
            <h2 className="text-lg font-extrabold text-neutral-900">Manage Locked Funds</h2>
          </div>

          <div className="flex gap-2 mb-6 items-end">
            <div className="flex-1">
              <AddressInput
                value={searchTarget}
                onChange={(val) => setSearchTarget(val)}
                placeholder="Candidate wallet address"
              />
            </div>
            <button onClick={() => handleSearch()} className="btn-secondary h-12 px-4 shrink-0 transition-all hover:bg-neutral-100" aria-label="Search">
              <Search size={18} />
            </button>
          </div>

          {escrow ? (
            <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm transition-all hover:shadow-md">
              <ActiveEscrowCard 
                escrow={escrow}
                role="employer"
                isTxPending={isTxPending || loading}
                onReleaseMilestone={handleRelease}
                onClawback={handleClawback}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-10 bg-white/50 rounded-2xl border border-dashed border-neutral-200">
              <Wallet size={36} className="text-neutral-300 mb-3" />
              <p className="text-sm font-semibold text-neutral-400 mb-6">
                Search for a candidate to manage their locked funds
              </p>
              
              {recentCandidates.length > 0 && (
                <div className="w-full text-left px-6">
                  <p className="text-xs font-bold text-neutral-400 uppercase mb-3 tracking-wider">Recent Searches</p>
                  <div className="flex flex-col gap-2">
                    {recentCandidates.map((recentKey) => (
                      <button
                        key={recentKey}
                        onClick={() => {
                          setSearchTarget(recentKey);
                          handleSearch(recentKey);
                        }}
                        className="text-left p-3 rounded-xl border border-neutral-100 hover:border-primary-200 hover:bg-primary-50 transition-all group"
                      >
                        <p className="text-sm font-bold text-neutral-900 group-hover:text-primary-700 transition-colors">Candidate</p>
                        <p className="text-xs font-mono text-neutral-500 truncate">{recentKey}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Activity Ledger Section */}
      <div className="card-stella p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-lg font-bold text-neutral-900">Transaction Ledger</h2>
        </div>
        <ActivityLedger address={address} />
      </div>

      {(error || lastTxHash) && (
        <TransactionToast
          type={error ? 'error' : 'success'}
          message={error || 'Transaction confirmed ⭐'}
          txHash={lastTxHash || undefined}
          onClose={clearError}
        />
      )}
    </div>
  );
};
