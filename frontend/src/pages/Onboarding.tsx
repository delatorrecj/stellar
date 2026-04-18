import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, ArrowLeft, ExternalLink, CheckCircle2, Star, AlertCircle } from 'lucide-react';
import { useOnboarding } from '../hooks/useOnboarding';
import { useStellar } from '../hooks/useStellar';

/**
 * Onboarding — Guided wallet connection
 * 
 * UX: Wallet connect is part of the task, not a sidebar button.
 * Shows role-specific context so the user knows WHY they're connecting.
 */
export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { role, reset } = useOnboarding();
  const { address, connect, loading, error } = useStellar();
  const [connectAttempted, setConnectAttempted] = useState(false);

  // If no role selected, go back to landing
  React.useEffect(() => {
    if (!role) {
      navigate('/');
    }
  }, [role, navigate]);

  // Auto-navigate once wallet is connected
  React.useEffect(() => {
    if (address && role) {
      const timer = setTimeout(() => navigate(`/${role}`), 800);
      return () => clearTimeout(timer);
    }
  }, [address, role, navigate]);

  const handleConnect = async () => {
    setConnectAttempted(true);
    await connect();
  };

  const handleBack = () => {
    reset();
    navigate('/');
  };

  const roleContext = {
    employer: {
      title: 'Lock onboarding funds for your new hire',
      description: 'You\'ll deposit XLM into a secure smart contract. Your new hire can only claim funds as they complete milestones. You can recover remaining funds at any time.',
      accent: 'primary' as const,
    },
    candidate: {
      title: 'View and claim your onboarding funds',
      description: 'Your employer has locked funds for your onboarding. Connect your wallet to see how much is available and claim it as you complete each step.',
      accent: 'accent' as const,
    },
  };

  const ctx = role ? roleContext[role] : roleContext.employer;

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      {/* Back button */}
      <div className="w-full max-w-md mb-8">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-neutral-400 hover:text-neutral-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Change role
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-1 rounded-full bg-primary-500" />
          <div className={`flex-1 h-1 rounded-full ${address ? 'bg-primary-500' : 'bg-neutral-200'}`} />
        </div>

        {/* Context card */}
        <div className="card-stella p-6 lg:p-8 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-accent-500 fill-accent-500" />
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              {role === 'employer' ? 'Employer Setup' : 'Candidate Setup'}
            </span>
          </div>

          <h1 className="text-xl font-extrabold text-neutral-900 tracking-tight mb-3">
            {ctx.title}
          </h1>
          <p className="text-sm text-neutral-500 leading-relaxed">
            {ctx.description}
          </p>
        </div>

        {/* Wallet connect card */}
        <div className="card-stella p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Connect your wallet</h2>
              <p className="text-xs text-neutral-400">Freighter — secure Stellar wallet</p>
            </div>
          </div>

          {address ? (
            /* Connected state */
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 p-3 bg-primary-50 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-primary-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-primary-700">Connected</p>
                  <p className="text-xs font-mono text-primary-500 truncate">{address}</p>
                </div>
              </div>
              <p className="text-xs text-neutral-400 text-center">Redirecting to your workspace...</p>
            </div>
          ) : (
            /* Not connected */
            <div className="flex flex-col gap-4">
              <button
                onClick={handleConnect}
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5" />
                    Connect Freighter Wallet
                  </>
                )}
              </button>

              {/* Error state */}
              {error && connectAttempted && (
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-error">{error}</p>
                    {error.includes('not found') && (
                      <a
                        href="https://www.freighter.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary-600 flex items-center gap-1 mt-1 no-underline hover:underline"
                      >
                        Install Freighter <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Help text */}
              <div className="text-center">
                <p className="text-xs text-neutral-400 mb-1">Don't have Freighter yet?</p>
                <a
                  href="https://www.freighter.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-primary-600 flex items-center gap-1 justify-center no-underline hover:underline"
                >
                  Install from freighter.app <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
