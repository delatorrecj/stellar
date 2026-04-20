import React, { useEffect, useState } from 'react';
import { Target, RotateCcw, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEscrow } from '../hooks/useEscrow';
import { useStellar } from '../hooks/useStellar';
import { useOnboarding } from '../hooks/useOnboarding';
import { TransactionToast } from '../components/TransactionToast';
import ActivityLedger from '../components/ActivityLedger';
import { ActiveEscrowCard } from '../components/ActiveEscrowCard';
import { QuickGuide } from '../components/QuickGuide';

export const Candidate: React.FC = () => {
  const navigate = useNavigate();
  const { address } = useStellar();
  const { role } = useOnboarding();
  const [manualEmployer, setManualEmployer] = useState('');
  const { fetchLatestCandidateEscrow, fetchEscrow, employerAddress, escrow, candidateAccept, raiseDispute, isTxPending, error, lastTxHash, clearError, loading } = useEscrow();

  useEffect(() => {
    if (role !== 'candidate' || !address) navigate('/');
  }, [role, address, navigate]);

  useEffect(() => {
    if (!address) return;
    fetchLatestCandidateEscrow();
  }, [address, fetchLatestCandidateEscrow]);

  const handleAccept = async () => {
    try {
      await candidateAccept(employerAddress);
    } catch (err) {
      console.error(err);
    }
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
        
        <QuickGuide role="candidate" address={address || ''} />

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
                <p className="text-sm font-bold text-neutral-700 mb-2">Can't see your escrow?</p>
                <div className="flex w-full max-w-md gap-2 mb-6">
                  <input
                    type="text"
                    placeholder="Enter Employer Address (G...)"
                    className="input-field bg-white flex-1"
                    value={manualEmployer}
                    onChange={(e) => setManualEmployer(e.target.value)}
                  />
                  <button 
                    onClick={() => {
                      if (manualEmployer) fetchEscrow(manualEmployer);
                    }}
                    disabled={loading}
                    className="btn-primary whitespace-nowrap"
                  >
                    Load Manually
                  </button>
                </div>
                
                <p className="text-xs text-neutral-400 mb-2">Still having issues?</p>
                <button 
                  onClick={() => window.location.href = `mailto:support@stella-escrow.com?subject=Missing%20Escrow&body=My%20candidate%20address:%20${address}%0A%0AHello,%20I%20cannot%20find%20my%20onboarding%20escrow.`}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-xs font-semibold rounded-lg transition-all flex items-center gap-2"
                >
                  Submit a Support Ticket
                </button>
              </div>
            </div>
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
      
      <QuickGuide role="candidate" address={address || ''} />

      <div className="grid grid-cols-1 gap-6">
        <div className="card-stella p-6 lg:p-8 border-accent-100">
          <ActiveEscrowCard 
            escrow={escrow}
            role="candidate"
            isTxPending={isTxPending}
            onAccept={handleAccept}
            onRaiseDispute={() => raiseDispute(employerAddress)}
          />
        </div>
      </div>

      {/* Activity Ledger Section */}
      <div className="card-stella p-6 lg:p-8 border-accent-100">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-lg font-bold text-neutral-900">Transaction Ledger</h2>
        </div>
        <ActivityLedger address={address} />
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
