import React, { useState } from 'react';
import { Gavel, Search, Scale, Target, CheckCircle2, Info, Clock } from 'lucide-react';
import { useEscrow } from '../hooks/useEscrow';
import { TransactionToast } from '../components/TransactionToast';
import { AddressInput } from '../components/AddressInput';

/**
 * ⚖️ Stella — Arbitrator Dashboard (V2.0)
 * 
 * Allows designated arbitrators to:
 * 1. Search for active disputes.
 * 2. Review milestone progress.
 * 3. Resolve disputes with a custom fund split.
 */

export const Arbitrator: React.FC = () => {
  const { fetchEscrow, escrow, resolveDispute, isTxPending, error, lastTxHash, clearError, loading } = useEscrow();
  
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateBps, setCandidateBps] = useState(5000); // Default 50/50 split

  const handleSearch = () => {
    if (candidateSearch) fetchEscrow(candidateSearch);
  };

  const handleResolve = async () => {
    if (!escrow) return;
    try {
      await resolveDispute(candidateSearch, candidateBps);
    } catch (err) {
      console.error(err);
    }
  };

  const remainingFunds = escrow ? (Number(escrow.totalLocked) - Number(escrow.totalReleased)) : 0;
  const candidateSplit = (remainingFunds * candidateBps) / 10000;
  const employerSplit = remainingFunds - candidateSplit;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header>
        <p className="text-xs font-semibold text-indigo-600 mb-1">Arbitration Center</p>
        <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight mb-1">
          Dispute Resolution Dashboard
        </h1>
        <p className="text-sm text-neutral-500 max-w-2xl">
          Search for candidate addresses to review and resolve formal disputes on the Stella network.
        </p>
      </header>

      {/* Search Section */}
      <div className="card-stella p-6 border-indigo-100 flex flex-col gap-4">
        <label className="label-section flex items-center gap-2">
          <Search size={14} />
          Lookup Candidate Escrow
        </label>
        <div className="flex gap-2">
          <div className="flex-1">
            <AddressInput
              value={candidateSearch}
              onChange={(val) => setCandidateSearch(val)}
              placeholder="Candidate Public Key (G...)"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !candidateSearch}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {escrow && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Column 1 & 2: Review */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="card-stella p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-neutral-50 rounded-xl flex items-center justify-center">
                    <Target size={18} className="text-neutral-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900">Escrow Review</h3>
                    <p className="text-xs text-neutral-400 font-mono truncate max-w-[200px]">
                      {candidateSearch}
                    </p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  escrow.state === 'Disputed' ? 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200' : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                }`}>
                  {escrow.state}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-neutral-50 p-4 rounded-xl">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Total Locked</p>
                  <p className="text-xl font-black text-neutral-900">{escrow.totalLocked} XLM</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Actually Released</p>
                  <p className="text-xl font-black text-emerald-700">{escrow.totalReleased} XLM</p>
                </div>
              </div>

              {/* Milestone Details */}
              <div className="space-y-3">
                <p className="label-section">Contract Milestones</p>
                {escrow.milestones.map((m) => (
                  <div key={m.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                    m.released ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-neutral-100'
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        m.released ? 'bg-emerald-500 text-white' : 'bg-neutral-100 text-neutral-400'
                      }`}>
                        {m.released ? '✓' : m.id + 1}
                      </div>
                      <span className="text-sm font-semibold text-neutral-700">{m.description}</span>
                    </div>
                    <span className="text-sm font-bold text-neutral-900">{m.amount} XLM</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Arbitration Info */}
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
              <Info className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-800 leading-relaxed">
                As an arbitrator, you are tasked with reviewing evidence of milestone completion. 
                If a dispute is active, use the controls to the right to split the remaining 
                <strong> {remainingFunds.toFixed(1)} XLM</strong> between the parties.
              </p>
            </div>
          </div>

          {/* Column 3: Resolution Controls */}
          <div className="flex flex-col gap-6">
            {escrow.state === 'Disputed' ? (
              <div className="card-stella p-6 border-indigo-200 bg-indigo-50/10 sticky top-6">
                <div className="flex items-center gap-2 mb-6">
                  <Scale size={20} className="text-indigo-600" />
                  <h3 className="text-lg font-bold text-neutral-900">Resolve Dispute</h3>
                </div>

                <div className="space-y-6">
                  {/* Split Preview */}
                  <div className="flex flex-col gap-2">
                    <p className="label-section flex justify-between">
                      Resolution Split
                      <span className="text-indigo-600">{(candidateBps / 100).toFixed(0)}% to Candidate</span>
                    </p>
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      step="100"
                      value={candidateBps}
                      onChange={(e) => setCandidateBps(parseInt(e.target.value))}
                      className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-neutral-400 uppercase">
                      <span>100% Employer</span>
                      <span>50/50</span>
                      <span>100% Candidate</span>
                    </div>
                  </div>

                  {/* Allocation Details */}
                  <div className="p-4 bg-white rounded-xl border border-indigo-100 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-neutral-500 font-medium">Candidate gets</span>
                      <span className="text-neutral-900 font-bold">{candidateSplit.toFixed(1)} XLM</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-neutral-500 font-medium">Employer gets</span>
                      <span className="text-neutral-900 font-bold">{employerSplit.toFixed(1)} XLM</span>
                    </div>
                    <div className="pt-2 border-t border-neutral-50 flex justify-between items-center text-xs font-bold text-indigo-600">
                      <span>Total to Distribute</span>
                      <span>{remainingFunds.toFixed(1)} XLM</span>
                    </div>
                  </div>

                  <button
                    onClick={handleResolve}
                    disabled={isTxPending}
                    className="btn-primary w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Gavel size={18} />
                    {isTxPending ? 'Executing Split...' : 'Authorize Final Distribution'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="card-stella p-8 text-center border-neutral-100 flex flex-col items-center justify-center gap-4">
                {escrow.state === 'Resolved' || escrow.state === 'Complete' ? (
                  <>
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="text-emerald-600" size={24} />
                    </div>
                    <p className="text-sm font-bold text-neutral-800">Contract Finalized</p>
                    <p className="text-xs text-neutral-400">This escrow is closed and requires no further arbitration.</p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                      <Clock className="text-amber-600" size={24} />
                    </div>
                    <p className="text-sm font-bold text-neutral-800">No Active Dispute</p>
                    <p className="text-xs text-neutral-400">Resolution controls will appear here if the candidate raises a formal dispute.</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!escrow && !loading && (
        <div className="py-20 text-center">
          <Scale size={48} className="text-neutral-200 mx-auto mb-4" />
          <p className="text-sm font-bold text-neutral-400">Enter a candidate address above to begin review</p>
        </div>
      )}

      {(error || lastTxHash) && (
        <TransactionToast
          type={error ? 'error' : 'success'}
          message={error || 'Dispute Resolved Successfully ⭐'}
          txHash={lastTxHash || undefined}
          onClose={clearError}
        />
      )}
    </div>
  );
};
