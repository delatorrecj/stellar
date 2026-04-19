import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, RotateCcw, ShieldCheck, Wallet, Trash2, Check, Clock, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEscrow } from '../hooks/useEscrow';
import { useStellar } from '../hooks/useStellar';
import { useOnboarding } from '../hooks/useOnboarding';
import { TransactionToast } from '../components/TransactionToast';
import type { MilestoneInput } from '../lib/contract';

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
  const { address } = useStellar();
  const { role } = useOnboarding();
  const {
    createEscrow, clawbackEscrow, releaseMilestone, fetchEscrow,
    loading, isTxPending, error, lastTxHash, clearError, escrow
  } = useEscrow();

  // Init form state
  const [candidate, setCandidate] = useState('');
  const [durationDays, setDurationDays] = useState('30');
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { description: 'Background Check', amount: '' },
    { description: 'Day 1 Onboarding', amount: '' },
  ]);

  // Manage panel
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

  // ─── Milestone Builder ─────────────────────────────────────────

  const addMilestone = () => {
    setMilestones([...milestones, { description: '', amount: '' }]);
  };

  const removeMilestone = (i: number) => {
    if (milestones.length <= 1) return;
    setMilestones(milestones.filter((_, idx) => idx !== i));
  };

  const updateMilestone = (i: number, field: keyof MilestoneInput, value: string) => {
    const updated = [...milestones];
    updated[i] = { ...updated[i], [field]: value };
    setMilestones(updated);
  };

  const totalXlm = milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);

  // ─── Handlers ──────────────────────────────────────────────────

  const handleSearch = async () => {
    if (!searchTarget) return;
    saveCandidate(searchTarget);
    await fetchEscrow(searchTarget);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEscrow(candidate, milestones, Number(durationDays));
      setCandidate('');
      setMilestones([
        { description: 'Background Check', amount: '' },
        { description: 'Day 1 Onboarding', amount: '' },
      ]);
      setDurationDays('30');
      setSearchTarget(candidate);
      saveCandidate(candidate);
      await fetchEscrow(candidate);
    } catch (err) {
      console.error(err);
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

  const truncatedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  // ─── State Badge ───────────────────────────────────────────────

  const StateBadge = ({ state }: { state: string }) => {
    const configs: Record<string, { bg: string; dot: string; label: string }> = {
      Pending: { bg: 'bg-amber-50 text-amber-700', dot: 'bg-amber-400', label: 'Pending Acceptance' },
      Active: { bg: 'bg-primary-50 text-primary-700', dot: 'bg-primary-500', label: 'Active' },
      Complete: { bg: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500', label: 'Complete ✓' },
      Cancelled: { bg: 'bg-neutral-100 text-neutral-500', dot: 'bg-neutral-400', label: 'Cancelled' },
      Disputed: { bg: 'bg-fuchsia-50 text-fuchsia-700', dot: 'bg-fuchsia-500', label: 'In Dispute' },
      Resolved: { bg: 'bg-indigo-50 text-indigo-700', dot: 'bg-indigo-500', label: 'Resolved (Finalized)' },
    };
    const c = configs[state] || configs.Pending;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${c.bg} text-xs font-bold rounded-full`}>
        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
        {c.label}
      </span>
    );
  };

  // ─── Deadline Display ──────────────────────────────────────────

  const DeadlineInfo = ({ deadline }: { deadline: number }) => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = Math.max(0, Math.ceil((deadline - now) / 86400));
    const expired = now > deadline;
    return (
      <div className={`flex items-center gap-1.5 text-xs font-semibold ${expired ? 'text-red-500' : 'text-neutral-500'}`}>
        <Clock size={12} />
        {expired ? 'Deadline expired' : `${remaining} day${remaining !== 1 ? 's' : ''} remaining`}
      </div>
    );
  };

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
        {/* ─── Lock Funds Form ────────────────────────────────────── */}
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
                type="text" placeholder="G..."
                className="input-field font-mono" value={candidate}
                onChange={(e) => setCandidate(e.target.value)} required
              />
            </div>

            {/* Milestone Builder */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <label className="label-section">Milestones</label>
                <button type="button" onClick={addMilestone}
                  className="text-xs text-primary-600 font-semibold hover:text-primary-700 transition-colors flex items-center gap-1"
                >
                  <PlusCircle size={12} /> Add
                </button>
              </div>
              {milestones.map((m, i) => (
                <div key={i} className="flex gap-2 items-start bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                  <div className="flex-1 flex flex-col gap-2">
                    <input
                      type="text" placeholder={`Milestone ${i + 1} description`}
                      className="input-field bg-white text-sm" value={m.description}
                      onChange={(e) => updateMilestone(i, 'description', e.target.value)} required
                    />
                    <input
                      type="number" step="0.0000001" placeholder="Amount (XLM)" min="0.0000001"
                      className="input-field bg-white text-sm" value={m.amount}
                      onChange={(e) => updateMilestone(i, 'amount', e.target.value)} required
                    />
                  </div>
                  {milestones.length > 1 && (
                    <button type="button" onClick={() => removeMilestone(i)}
                      className="p-2 text-neutral-400 hover:text-red-500 transition-colors" aria-label="Remove milestone"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Total + Duration */}
            <div className="flex gap-4">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="label-section">Total</label>
                <div className="input-field bg-neutral-50 text-neutral-800 font-extrabold cursor-default">
                  {totalXlm.toFixed(2)} <span className="text-neutral-400 text-sm font-semibold">XLM</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="label-section">Duration (Days)</label>
                <input type="number" min="1" placeholder="30"
                  className="input-field" value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)} required
                />
              </div>
            </div>

            <button type="submit" disabled={isTxPending || loading} className="btn-primary mt-2">
              {isTxPending ? 'Signing...' : loading ? 'Processing...' : 'Lock Onboarding Funds'}
            </button>
          </form>
        </div>

        {/* ─── Manage Panel ───────────────────────────────────────── */}
        <div className="card-stella p-6 lg:p-8 bg-neutral-50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-white rounded-xl border border-neutral-200 flex items-center justify-center">
              <Search size={18} className="text-neutral-600" />
            </div>
            <h2 className="text-lg font-bold text-neutral-900">Manage Locked Funds</h2>
          </div>

          {/* Search bar */}
          <div className="flex gap-2 mb-6">
            <input
              type="text" placeholder="Candidate wallet address"
              className="input-field bg-white font-mono" value={searchTarget}
              onChange={(e) => setSearchTarget(e.target.value)}
            />
            <button onClick={handleSearch} className="btn-secondary px-4 shrink-0" aria-label="Search">
              <Search size={18} />
            </button>
          </div>

          {escrow ? (
            <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col gap-5">
              {/* Header row */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="label-section mb-1">Status</p>
                  <StateBadge state={escrow.state} />
                </div>
                <ShieldCheck size={18} className="text-primary-500" />
              </div>

              {/* Deadline info */}
              <DeadlineInfo deadline={escrow.deadline} />

              {/* Milestone List */}
              <div>
                <p className="label-section mb-3">Milestones ({escrow.milestones.filter(m => m.released).length}/{escrow.milestones.length})</p>
                <div className="flex flex-col gap-2">
                  {escrow.milestones.map((m) => (
                    <div key={m.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                      m.released ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-neutral-100'
                    }`}>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                          m.released ? 'bg-emerald-500 text-white' : 'bg-neutral-200 text-neutral-500'
                        }`}>
                          {m.released ? <Check size={10} /> : m.id + 1}
                        </span>
                        <span className="text-sm font-semibold text-neutral-800 truncate">{m.description}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-sm font-bold ${m.released ? 'text-emerald-600' : 'text-neutral-900'}`}>
                          {m.amount} XLM
                        </span>
                        {!m.released && escrow.state === 'Active' && (
                          <button
                            onClick={() => handleRelease(m.id)}
                            disabled={isTxPending}
                            className="btn-primary text-xs px-3 py-1"
                          >
                            {isTxPending ? '...' : 'Release'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${escrow.milestones.length > 0 ? (escrow.milestones.filter(m => m.released).length / escrow.milestones.length) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs font-semibold text-neutral-400">{escrow.totalReleased} XLM released</span>
                  <span className="text-xs font-semibold text-neutral-500">{escrow.totalLocked} XLM locked</span>
                </div>
              </div>

              {/* Clawback — only for Pending / Active */}
              {(escrow.state === 'Pending' || escrow.state === 'Active') && (
                <>
                  <div className="border-t border-neutral-200" />
                  {escrow.state === 'Pending' && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-700">Waiting for candidate to accept. You can clawback all funds.</p>
                    </div>
                  )}
                  <button onClick={handleClawback} disabled={isTxPending || loading} className="btn-danger w-full text-xs">
                    <RotateCcw size={14} />
                    {escrow.state === 'Pending' ? 'Cancel & Return All Funds' : 'Return Unclaimed Funds'}
                  </button>
                </>
              )}

              {/* Complete state summary */}
              {escrow.state === 'Complete' && (
                <div className="text-center py-2">
                  <p className="text-xs font-semibold text-emerald-600">✓ All milestones released. Escrow complete.</p>
                </div>
              )}

              {/* Disputed state summary */}
              {escrow.state === 'Disputed' && (
                <div className="bg-fuchsia-50 p-4 rounded-xl border border-fuchsia-100 text-center">
                  <p className="text-xs font-bold text-fuchsia-900 mb-1">Contract in Arbitration</p>
                  <p className="text-[10px] text-fuchsia-700 leading-relaxed">
                    A dispute was raised by the candidate. Funds are locked until the platform arbitrator 
                    finalizes the distribution based on contributions.
                  </p>
                </div>
              )}

              {/* Resolved state summary */}
              {escrow.state === 'Resolved' && (
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-center">
                  <p className="text-xs font-bold text-indigo-900 mb-1">Arbitration Finalized</p>
                  <p className="text-[10px] text-indigo-700">
                    The platform arbitrator has resolved this dispute. 
                    <strong> {escrow.totalReleased} XLM</strong> was the final total released.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-10">
              <Wallet size={36} className="text-neutral-300 mb-3" />
              <p className="text-sm font-semibold text-neutral-400 mb-6">
                Search for a candidate to manage their locked funds
              </p>
              
              {recentCandidates.length > 0 && (
                <div className="w-full text-left">
                  <p className="text-xs font-bold text-neutral-400 uppercase mb-2">Recent</p>
                  <div className="flex flex-col gap-2">
                    {recentCandidates.map((recentKey) => (
                      <button
                        key={recentKey}
                        onClick={() => {
                          setSearchTarget(recentKey);
                          fetchEscrow(recentKey);
                        }}
                        className="text-left p-3 rounded-lg border border-neutral-100 hover:border-primary-200 hover:bg-primary-50 transition-colors"
                      >
                        <p className="text-sm font-bold text-neutral-900 mb-0.5">Candidate</p>
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

      {lastTxHash && (
        <TransactionToast
          type={error ? 'error' : 'success'}
          message={error || 'Transaction confirmed ⭐'}
          txHash={lastTxHash}
          onClose={clearError}
        />
      )}
    </div>
  );
};
