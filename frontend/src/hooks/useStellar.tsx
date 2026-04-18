import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import * as freighter from '@stellar/freighter-api';

interface StellarContextType {
  address: string | null;
  connect: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const StellarContext = createContext<StellarContextType | undefined>(undefined);

export type { ReactNode };

export const StellarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setAddress(result.address);
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkConnection = async () => {
       const { isConnected } = await freighter.isConnected();
       if (isConnected) {
           try {
               const result = await freighter.getAddress();
               if (result.address) setAddress(result.address);
           } catch (e) {
               // ignore auto-connect failures
           }
       }
    };
    checkConnection();
  }, []);

  return (
    <StellarContext.Provider value={{ address, connect, loading, error }}>
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
