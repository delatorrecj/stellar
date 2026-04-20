import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import * as freighter from '@stellar/freighter-api';

interface StellarContextType {
  address: string | null;
  balance: string | null;
  isSyncing: boolean;
  network: string | null;
  connect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const StellarContext = createContext<StellarContextType | undefined>(undefined);

export type { ReactNode };

export const StellarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [network, setNetwork] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async (addr: string) => {
    setIsSyncing(true);
    try {
      const { getHorizonServer } = await import('../lib/rpc');
      const server = await getHorizonServer();
      const account = await server.loadAccount(addr);
      const nativeBalance = account.balances.find((b: any) => b.asset_type === 'native');
      if (nativeBalance) {
        setBalance(nativeBalance.balance);
      }
    } catch (e) {
      console.error('Failed to fetch balance:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const connect = async () => {
    setLoading(true);
    setError(null);
    try {
      const { isConnected } = await freighter.isConnected();
      if (!isConnected) {
        throw new Error('Freighter wallet not found. Please install it.');
      }

      const result = await freighter.requestAccess();
      if (result.error) {
          throw new Error(result.error);
      }
      
      const net = await freighter.getNetwork();
      const networkName = typeof net === 'string' ? net : (net as any)?.network || 'UNKNOWN';
      const upperNet = networkName.toUpperCase();
      setNetwork(upperNet);
      
      if (upperNet !== 'TESTNET') {
        throw new Error('Please switch Freighter to the TESTNET network');
      }
      
      setAddress(result.address);
      if (result.address) fetchBalance(result.address);
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const refreshBalance = async () => {
    if (address) await fetchBalance(address);
  };

  useEffect(() => {
    const checkConnection = async () => {
       const { isConnected } = await freighter.isConnected();
       if (isConnected) {
           try {
               const result = await freighter.getAddress();
               if (result.address) {
                 const net = await freighter.getNetwork();
                 const networkName = typeof net === 'string' ? net : (net as any)?.network || 'UNKNOWN';
                 const upperNet = networkName.toUpperCase();
                 setNetwork(upperNet);
                 
                 if (upperNet !== 'TESTNET') {
                   throw new Error('Please switch Freighter to the TESTNET network');
                 }
                 
                 setAddress(result.address);
                 fetchBalance(result.address);
               }
           } catch (e: any) {
               setError(e.message || 'Failed to connect');
           }
       }
    };
    checkConnection();
  }, []);

  return (
    <StellarContext.Provider value={{ address, balance, isSyncing, network, connect, refreshBalance, loading, error }}>
      {children}
    </StellarContext.Provider>
  );
};

export const useStellar = () => {
  const context = useContext(StellarContext);
  if (context === undefined) {
    throw new Error('useStellar must be used within a StellarProvider');
  }
  return context;
};
