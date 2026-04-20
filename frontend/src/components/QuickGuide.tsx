import React, { useState, useEffect } from 'react';
import { Info, X, ShieldCheck, Milestone, HandCoins } from 'lucide-react';

interface QuickGuideProps {
  role: 'employer' | 'candidate';
  address: string;
}

export const QuickGuide: React.FC<QuickGuideProps> = ({ role, address }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!address) return;
    
    const storageKey = `stella_guide_seen_${role}_${address}`;
    const hasSeenGuide = localStorage.getItem(storageKey);
    
    if (!hasSeenGuide) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [address, role]);

  const handleDismiss = () => {
    if (!address) return;
    const storageKey = `stella_guide_seen_${role}_${address}`;
    localStorage.setItem(storageKey, 'true');
    setIsVisible(false);
  };

  if (!isVisible || !address) return null;

  return (
    <div className="bg-primary-50 border border-primary-100 rounded-xl p-5 mb-6 shadow-sm relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none">
        <ShieldCheck size={120} />
      </div>

      <div className="flex items-start gap-4 relative z-10">
        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
          <Info size={20} className="text-primary-600" />
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-extrabold text-primary-900 tracking-tight">
              Welcome to Stella, {role === 'employer' ? 'Employer' : 'Candidate'}!
            </h3>
            <button 
              onClick={handleDismiss}
              className="text-primary-400 hover:text-primary-700 transition-colors p-1"
              aria-label="Dismiss guide"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="text-xs text-primary-800 leading-relaxed space-y-3 mb-4 max-w-2xl">
            {role === 'employer' ? (
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <ShieldCheck size={14} className="text-primary-500 mt-0.5 shrink-0" />
                  <span><strong>Lock Funds:</strong> Enter a candidate's address, add milestones, and lock onboarding funds securely into the smart contract.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Milestone size={14} className="text-primary-500 mt-0.5 shrink-0" />
                  <span><strong>Release & Track:</strong> Once the candidate accepts the escrow, you can release payments individually as they complete each milestone.</span>
                </li>
                <li className="flex items-start gap-2">
                  <HandCoins size={14} className="text-primary-500 mt-0.5 shrink-0" />
                  <span><strong>Clawback:</strong> If things don't work out, you can safely clawback any unreleased funds remaining in the contract.</span>
                </li>
              </ul>
            ) : (
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <ShieldCheck size={14} className="text-primary-500 mt-0.5 shrink-0" />
                  <span><strong>Wait for Escrow:</strong> Your employer will create an escrow and lock funds. Once created, review the terms carefully.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Milestone size={14} className="text-primary-500 mt-0.5 shrink-0" />
                  <span><strong>Accept & Start:</strong> Accept the escrow to activate tracking. Your employer will release funds exactly as you achieve your milestones.</span>
                </li>
                <li className="flex items-start gap-2">
                  <HandCoins size={14} className="text-primary-500 mt-0.5 shrink-0" />
                  <span><strong>Guaranteed Payouts:</strong> Released funds go straight your wallet. If an employer misses a deadline, you can raise a formal dispute!</span>
                </li>
              </ul>
            )}
          </div>
          
          <button 
            onClick={handleDismiss}
            className="text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-all shadow-sm"
          >
            Got it, let's go!
          </button>
        </div>
      </div>
    </div>
  );
};
