import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, ExternalLink, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'loading';

export interface TransactionToastProps {
  type: ToastType;
  message: string;
  txHash?: string;
  onClose: () => void;
  duration?: number;
}

/**
 * Transaction feedback toast — BRAND.md §6
 * Dark bg, white text, 8s auto-dismiss, accent link color
 */
export const TransactionToast: React.FC<TransactionToastProps> = ({
  type,
  message,
  txHash,
  onClose,
  duration = 8000, // BRAND.md: 8 seconds — Kevin needs time to read
}) => {
  useEffect(() => {
    if (type !== 'loading') {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [type, onClose, duration]);

  const networkExplorer = `https://stellar.expert/explorer/testnet/tx/${txHash}`;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
      <div className="bg-neutral-900 text-white p-4 rounded-xl shadow-xl flex gap-3 items-start">
        {/* Icon */}
        <div className="mt-0.5 shrink-0">
          {type === 'success' && <CheckCircle2 className="w-5 h-5 text-success" />}
          {type === 'error' && <AlertTriangle className="w-5 h-5 text-error" />}
          {type === 'loading' && (
            <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <p className="text-sm font-semibold leading-snug">{message}</p>
          
          {txHash && (
            <a 
              href={networkExplorer} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs flex items-center gap-1 font-mono text-accent-300 hover:text-accent-200 no-underline w-fit"
            >
              View on Stellar Expert
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Close */}
        <button 
          onClick={onClose}
          className="shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4 opacity-60" />
        </button>
      </div>
    </div>
  );
};
