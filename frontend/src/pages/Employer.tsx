import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, RotateCcw, ShieldCheck, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEscrow } from '../hooks/useEscrow';
import { useStellar } from '../hooks/useStellar';
import { useOnboarding } from '../hooks/useOnboarding';
import { TransactionToast } from '../components/TransactionToast';

/**
 * Employer Workspace — only accessible after onboarding as employer
 */
export const Employer: React.FC = () => {
  const navigate = useNavigate();
  const { address } = useStellar();
  const { role } = useOnboarding();
  const { createEscrow, clawbackEscrow, fetchEscrow, loading, error, lastTxHash, clearError } = useEscrow();

  const [candidate, setCandidate] = useState('');
  const [amount, setAmount] = useState('');
  const [searchTarget, setSearchTarget] = useState('');
  const [activeEscrow, setActiveEscrow] = useState<any>(null);

  // Guard: must be onboarded as employer
  useEffect(() => {
    if (role !== 'employer' || !address) {
      navigate('/');
    }
  }, [role, address, navigate]);

  const handleSearch = async () => {
    if (!searchTarget) return;
    const data = await fetchEscrow(searchTarget);
    setActiveEscrow(data);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEscrow(candidate, amount);
      setCandidate('');
      setAmount('');
      handleSearch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClawback = async () => {
    if (!activeEscrow || !searchTarget) return;
    try {
      await clawbackEscrow(searchTarget);
      handleSearch();
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (address && searchTarget) {
      handleSearch();
    }
  }, [address]);

  const truncatedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome header */}
      <header>
        <p className="text-xs font-semibold text-primary-500 mb-1">Welcome back</p>
        <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight mb-1">
          Employer Workspace
        </h1>
        <p className="text-sm text-neutral-400 font-mono">{truncatedAddress}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lock Funds form */}
        <div className="card-stella p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center">
              <PlusCircle size={18} className="text-primary-600" />
            </div>
            <h2 className="text-lg font-bold text-neutral-900">Lock Onboarding Funds</h2>
          </div>

          <form onSubmit={handleCreate} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="label-section">Candidate wallet address</label>
              <input
                type="text"
                placeholder="G..."
                className="input-field font-mono"
                value={candidate}
                onChange={(e) => setCandidate(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="label-section">Amount (XLM)</label>
              <input
                type="number"
                step="0.0000001"
                placeholder="0.00"
                className="input-field"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary mt-2">
              {loading ? 'Processing...' : 'Lock Onboarding Funds'}
            </button>
          </form>
        </div>

        {/* Manage locked funds */}
        <div className="card-stella p-6 lg:p-8 bg-neutral-50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-white rounded-xl border border-neutral-200 flex items-center justify-center">
              <Search size={18} className="text-neutral-600" />
            </div>
            <h2 className="text-lg font-bold text-neutral-900">Manage Locked Funds</h2>
          </div>

          <div className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder="Candidate wallet address"
              className="input-field bg-white font-mono"
              value={searchTarget}
              onChange={(e) => setSearchTarget(e.target.value)}
            />
            <button onClick={handleSearch} className="btn-secondary px-4 shrink-0" aria-label="Search">
              <Search size={18} />
            </button>
          </div>

          {activeEscrow ? (
            <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col gap-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="label-section mb-1">Status</p>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-bold rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                    Active
                  </span>
                </div>
                <ShieldCheck size={18} className="text-primary-500" />
              </div>

              <div>
                <p className="label-section mb-1">Amount Locked</p>
                <p className="text-amount">
                  100.00 <span className="text-neutral-400 text-base font-semibold">XLM</span>
                </p>
              </div>

              <button onClick={handleClawback} disabled={loading} className="btn-danger w-full">
                <RotateCcw size={16} />
                Return Remaining Funds
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-10">
              <Wallet size={36} className="text-neutral-300 mb-3" />
              <p className="text-sm font-semibold text-neutral-400">
                Search for a candidate to manage their locked funds
              </p>
            </div>
          )}
        </div>
      </div>

      {lastTxHash && (
        <TransactionToast
          type={error ? 'error' : 'success'}
          message={error || 'Funds locked successfully'}
          txHash={lastTxHash}
          onClose={clearError}
        />
      )}
    </div>
  );
};
