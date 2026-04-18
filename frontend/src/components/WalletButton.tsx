import React from 'react';
import { Wallet, LogOut } from 'lucide-react';

export interface WalletButtonProps {
  address?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  isConnecting?: boolean;
}

/**
 * Wallet connect/disconnect button — BRAND.md §6
 * 48px min-height, radius-md, sentence case labels
 */
export const WalletButton: React.FC<WalletButtonProps> = ({
  address,
  onConnect,
  onDisconnect,
  isConnecting = false,
}) => {
  if (isConnecting) {
    return (
      <button disabled className="btn-secondary w-full">
        <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
        Connecting...
      </button>
    );
  }

  if (address) {
    const truncated = `${address.slice(0, 4)}...${address.slice(-4)}`;
    
    return (
      <button 
        onClick={onDisconnect}
        className="btn-secondary w-full group"
        title="Disconnect wallet"
      >
        <Wallet className="w-4 h-4 text-primary-500" />
        <span className="font-mono text-sm">{truncated}</span>
        <LogOut className="w-4 h-4 text-neutral-400 group-hover:text-error transition-colors duration-150" />
      </button>
    );
  }

  return (
    <button onClick={onConnect} className="btn-primary w-full">
      <Wallet className="w-5 h-5" />
      Connect Wallet
    </button>
  );
};
