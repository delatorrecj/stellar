import { useState, useCallback } from 'react';
import { rpc } from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';
import { StellaClient } from '../lib/contract';
import { NETWORK_DETAILS } from '../lib/stellar';
import { useStellar } from './useStellar';

const server = new rpc.Server(NETWORK_DETAILS.rpcUrl);

export const useEscrow = () => {
  const { address } = useStellar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | undefined>(undefined);
  const [escrow, setEscrow] = useState<any | null>(null);

  const fetchEscrow = useCallback(async (candidateAddress?: string) => {
    const target = candidateAddress || address;
    if (!target) return null;

    setLoading(true);
    try {
      const data = await StellaClient.getEscrow(target);
      setEscrow(data);
      return data;
    } catch (err: any) {
      console.error('Fetch error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [address]);

  const submitTx = async (txBase64: string) => {
    try {
      // Correcting signTransaction usage for Freighter API v6
      const result = await signTransaction(txBase64, {
        networkPassphrase: NETWORK_DETAILS.networkPassphrase
      });

      if (result.error) {
          throw new Error(result.error);
      }

      const signedTx = result.signedTxXdr;
      let response = await server.sendTransaction(signedTx as any);
      
      if (response.status !== 'PENDING') {
         throw new Error(`Transaction failed: ${response.status}`);
      }

      setLastTxHash(response.hash);

      // Poll for result
      let statusResponse = await server.getTransaction(response.hash);
      while (statusResponse.status === 'NOT_FOUND' || statusResponse.status === 'SUCCESS') {
           if (statusResponse.status === 'SUCCESS') break;
           await new Promise(r => setTimeout(r, 2000));
           statusResponse = await server.getTransaction(response.hash);
      }
      
      return response.hash;
    } catch (err: any) {
      console.error('Submission error:', err);
      throw err;
    }
  };

  const createEscrow = useCallback(async (candidate: string, amount: string, _title?: string) => {
    if (!address) throw new Error('Wallet not connected');
    setLoading(true);
    setError(null);
    setLastTxHash(undefined);

    try {
      const tx = await StellaClient.createEscrowTx(address, candidate, amount, 30);
      const hash = await submitTx(tx.toXDR());
      return hash;
    } catch (err: any) {
      setError(err.message || 'Failed to create escrow');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [address]);

  const releaseMilestone = useCallback(async (candidateAddress: string, amount: string) => {
    if (!address) throw new Error('Wallet not connected');
    setLoading(true);
    setError(null);
    setLastTxHash(undefined);

    try {
      const tx = await StellaClient.unlockMilestoneTx(address, candidateAddress, amount);
      const hash = await submitTx(tx.toXDR());
      return hash;
    } catch (err: any) {
      setError(err.message || 'Failed to release milestone');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [address]);

  const clawbackEscrow = useCallback(async (candidateAddress: string) => {
    if (!address) throw new Error('Wallet not connected');
    setLoading(true);
    setError(null);
    setLastTxHash(undefined);

    try {
        const tx = await StellaClient.clawbackTx(address, candidateAddress);
        const hash = await submitTx(tx.toXDR());
        return hash;
    } catch (err: any) {
        setError(err.message || 'Failed to clawback');
        throw err;
    } finally {
        setLoading(false);
    }
  }, [address]);

  return {
    createEscrow,
    releaseMilestone,
    clawbackEscrow,
    fetchEscrow,
    escrow,
    loading,
    error,
    lastTxHash,
    clearError: () => setError(null)
  };
};
