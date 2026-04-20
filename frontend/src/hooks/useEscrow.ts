/**
 * 🌠 Stella — useEscrow Hook (V1.4 Composite-Key)
 * 
 * Production-ready hook for all escrow operations:
 * - createEscrow (with milestones)
 * - candidateAccept
 * - releaseMilestone (by ID)
 * - clawbackEscrow
 * - auto-fetch & polling
 * - isTxPending guard (prevents double-submit)
 * - on-chain confirmation via getTransaction polling
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import * as freighter from '@stellar/freighter-api';
import { 
  StellaClient, 
  parseContractError, 
  type EscrowData, 
  type MilestoneInput 
} from '../lib/contract';
import { getServer } from '../lib/rpc';
import { useStellar } from './useStellar';
import { NETWORK_DETAILS } from '../lib/stellar';

const DEFAULT_ARBITRATOR = 'GABTUX53227CZQJSRKS6UMT2VWUZCLX27AGCDLHRS7VYJJB4DBIMHKIU';

const POLL_INTERVAL = 10_000; // 10 seconds

interface UseEscrowReturn {
  escrow: EscrowData | null;
  loading: boolean;
  isTxPending: boolean;
  error: string | null;
  lastTxHash: string | null;
  employerAddress: string;
  createEscrow: (candidate: string, milestones: MilestoneInput[], durationDays: number) => Promise<void>;
  candidateAccept: (employer: string) => Promise<void>;
  releaseMilestone: (candidate: string, milestoneId: number) => Promise<void>;
  clawbackEscrow: (candidate: string) => Promise<void>;
  raiseDispute: (employer: string) => Promise<void>;
  resolveDispute: (employer: string, candidate: string, candidateBps: number) => Promise<void>;
  fetchEscrow: (employer: string, candidate?: string) => Promise<EscrowData | null>;
  fetchLatestCandidateEscrow: () => Promise<EscrowData | null>;
  clearError: () => void;
}

/**
 * Shared transaction handler for V1.4
 */
async function handleStellarTransaction(
  address: string,
  txBuilder: () => Promise<any>,
  refreshBalance: () => Promise<void>,
  onHash?: (hash: string) => void
) {
  const assembled = await txBuilder();
  const txXdr = assembled.toXDR();

  // 1. Sign
  const signResult = await freighter.signTransaction(txXdr, {
    networkPassphrase: NETWORK_DETAILS.networkPassphrase,
    address,
  });

  if (typeof signResult === 'object' && 'error' in signResult && signResult.error) {
    throw new Error('Transaction cancelled.');
  }

  const signedXdr = typeof signResult === 'string' ? signResult : signResult.signedTxXdr;
  
  // 2. Submit
  const server = await getServer();
  const { Transaction } = await import('@stellar/stellar-sdk');
  const txEnvelope = new Transaction(signedXdr, NETWORK_DETAILS.networkPassphrase);
  const sendResponse = await server.sendTransaction(txEnvelope);

  if (sendResponse.status === 'ERROR') {
    throw new Error('Transaction submission failed.');
  }

  if (onHash) onHash(sendResponse.hash);

  // 3. Immediate Sync (Start spinning)
  refreshBalance(); 

  // 4. Poll for confirmation
  let confirmed = false;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const result = await server.getTransaction(sendResponse.hash);
    if (result.status === 'SUCCESS') {
      confirmed = true;
      break;
    }
    if (result.status === 'FAILED') throw new Error('Transaction failed on-chain.');
  }

  if (!confirmed) throw new Error('Transaction confirmation timed out.');

  // 5. Final Sync
  await refreshBalance();
}

export const useEscrow = (): UseEscrowReturn => {
  const { address, refreshBalance } = useStellar();
  const [escrow, setEscrow] = useState<EscrowData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isTxPending, setIsTxPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [employerAddress, setEmployerAddress] = useState<string>('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearError = useCallback(() => {
    setError(null);
    setLastTxHash(null);
  }, []);

  // ─── Fetch Escrow ──────────────────────────────────────────────

  const fetchEscrow = useCallback(async (employer: string, candidate?: string): Promise<EscrowData | null> => {
    const targetCandidate = candidate || address;
    if (!employer || !targetCandidate) return null;

    setLoading(true);
    try {
      const data = await StellaClient.getEscrow(employer, targetCandidate);
      setEscrow(data);
      if (data) setEmployerAddress(employer);
      return data;
    } catch {
      setEscrow(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [address]);

  const fetchLatestCandidateEscrow = useCallback(async (): Promise<EscrowData | null> => {
    if (!address) return null;
    setLoading(true);
    try {
      const employers = await StellaClient.getCandidateEmployers(address);
      if (employers && employers.length > 0) {
        // Find the latest employer
        const latestEmployer = employers[employers.length - 1];
        const data = await StellaClient.getEscrow(latestEmployer, address);
        setEscrow(data);
        if (data) setEmployerAddress(latestEmployer);
        return data;
      }
      setEscrow(null);
      return null;
    } catch (err) {
      console.error("Error in fetchLatestCandidateEscrow:", err);
      setEscrow(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [address]);

  // ─── Create Escrow (Employer) ──────────────────────────────────

  const createEscrow = useCallback(async (
    candidate: string,
    milestones: MilestoneInput[],
    durationDays: number
  ) => {
    if (!address || isTxPending) return;
    setIsTxPending(true);
    setError(null);

    try {
      await handleStellarTransaction(
        address,
        () => StellaClient.createEscrowTx(address, candidate, DEFAULT_ARBITRATOR, milestones, durationDays),
        refreshBalance,
        (hash) => setLastTxHash(hash)
      );
      await fetchEscrow(address, candidate);
    } catch (err: any) {
      const msg = parseContractError(err);
      setError(msg);
      throw err;
    } finally {
      setIsTxPending(false);
    }
  }, [address, isTxPending, fetchEscrow, refreshBalance]);

  // ─── Candidate Accept ──────────────────────────────────────────

  const candidateAccept = useCallback(async (employer: string) => {
    if (!address || isTxPending) return;
    setIsTxPending(true);
    setError(null);

    try {
      await handleStellarTransaction(
        address,
        () => StellaClient.candidateAcceptTx(employer, address),
        refreshBalance,
        (hash) => setLastTxHash(hash)
      );
      await fetchEscrow(employer);
    } catch (err: any) {
      const msg = parseContractError(err);
      setError(msg);
      throw err;
    } finally {
      setIsTxPending(false);
    }
  }, [address, isTxPending, fetchEscrow, refreshBalance]);

  // ─── Release Milestone (Employer) ──────────────────────────────

  const releaseMilestone = useCallback(async (candidate: string, milestoneId: number) => {
    if (!address || isTxPending) return;
    setIsTxPending(true);
    setError(null);

    try {
      await handleStellarTransaction(
        address,
        () => StellaClient.unlockMilestoneTx(address, candidate, milestoneId),
        refreshBalance,
        (hash) => setLastTxHash(hash)
      );
      await fetchEscrow(address, candidate);
    } catch (err: any) {
      const msg = parseContractError(err);
      setError(msg);
      throw err;
    } finally {
      setIsTxPending(false);
    }
  }, [address, isTxPending, fetchEscrow, refreshBalance]);

  // ─── Clawback (Employer) ───────────────────────────────────────

  const clawbackEscrow = useCallback(async (candidate: string) => {
    if (!address || isTxPending) return;
    setIsTxPending(true);
    setError(null);

    try {
      await handleStellarTransaction(
        address,
        () => StellaClient.clawbackTx(address, candidate),
        refreshBalance,
        (hash) => setLastTxHash(hash)
      );
      await fetchEscrow(address, candidate);
    } catch (err: any) {
      const msg = parseContractError(err);
      setError(msg);
      throw err;
    } finally {
      setIsTxPending(false);
    }
  }, [address, isTxPending, fetchEscrow, refreshBalance]);

  // ─── Raise Dispute (Candidate) ─────────────────────────────────

  const raiseDispute = useCallback(async (employer: string) => {
    if (!address || isTxPending) return;
    setIsTxPending(true);
    setError(null);

    try {
      await handleStellarTransaction(
        address,
        () => StellaClient.raiseDisputeTx(employer, address),
        refreshBalance,
        (hash) => setLastTxHash(hash)
      );
      await fetchEscrow(employer);
    } catch (err: any) {
      const msg = parseContractError(err);
      setError(msg);
      throw err;
    } finally {
      setIsTxPending(false);
    }
  }, [address, isTxPending, fetchEscrow, refreshBalance]);

  // ─── Resolve Dispute (Arbitrator) ──────────────────────────────

  const resolveDispute = useCallback(async (employer: string, candidate: string, candidateBps: number) => {
    if (!address || isTxPending) return;
    setIsTxPending(true);
    setError(null);

    try {
      await handleStellarTransaction(
        address,
        () => StellaClient.resolveDisputeTx(address, employer, candidate, candidateBps),
        refreshBalance,
        (hash) => setLastTxHash(hash)
      );
      await fetchEscrow(employer, candidate);
    } catch (err: any) {
      const msg = parseContractError(err);
      setError(msg);
      throw err;
    } finally {
      setIsTxPending(false);
    }
  }, [address, isTxPending, fetchEscrow, refreshBalance]);

  // ─── Auto-Polling ──────────────────────────────────────────────
  // Poll every 10s when escrow is Pending or Active (waiting for state change)

  useEffect(() => {
    if (!address || !escrow) return;

    if (escrow.state === 'Pending' || escrow.state === 'Active' || escrow.state === 'Disputed') {
      pollRef.current = setInterval(() => {
        fetchEscrow(escrow.employer, escrow.candidate);
      }, POLL_INTERVAL);
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [address, escrow?.state, fetchEscrow]);

  return {
    escrow,
    loading,
    isTxPending,
    error,
    lastTxHash,
    employerAddress,
    createEscrow,
    candidateAccept,
    releaseMilestone,
    clawbackEscrow,
    raiseDispute,
    resolveDispute,
    fetchEscrow,
    fetchLatestCandidateEscrow,
    clearError,
  };
};
