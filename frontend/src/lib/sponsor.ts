/**
 * Stella — Fee Sponsorship Module (Gasless Transactions)
 *
 * Wraps candidate transactions in a Stellar Fee Bump, allowing fresh
 * graduates to interact with the escrow contract without holding any
 * XLM for transaction fees.
 *
 * Architecture:
 *   1. Candidate builds + signs the inner transaction via Freighter
 *   2. This module wraps it in a FeeBumpTransaction signed by the sponsor
 *   3. The sponsored tx is submitted — candidate pays $0 in fees
 *
 * Security note for production:
 *   The sponsor secret key should be moved to a server-side API route
 *   (e.g., Vercel Edge Function) before mainnet launch. For testnet,
 *   storing it as a Vite env var is acceptable.
 */

import {
  Keypair,
  TransactionBuilder,
  Transaction,
  Networks,
} from '@stellar/stellar-sdk';

const NETWORK_PASSPHRASE = import.meta.env.VITE_NETWORK_PASSPHRASE ?? Networks.TESTNET;
const SPONSOR_SECRET = import.meta.env.VITE_SPONSOR_SECRET ?? '';
const MAX_FEE_STROOPS = '10000000'; // 1 XLM max fee cap for the sponsor

// Whether fee sponsorship is configured and available
export function isSponsorshipAvailable(): boolean {
  return Boolean(SPONSOR_SECRET);
}

// Get the sponsor account's public key (for display purposes)
export function getSponsorPublicKey(): string | null {
  if (!SPONSOR_SECRET) return null;
  try {
    return Keypair.fromSecret(SPONSOR_SECRET).publicKey();
  } catch {
    return null;
  }
}

/**
 * Wraps a signed inner transaction with a fee bump from the platform sponsor.
 *
 * @param signedXdr - The XDR string of the transaction signed by the user (Freighter)
 * @returns The XDR of the fee bump transaction, ready to submit
 */
export function wrapWithFeeBump(signedXdr: string): string {
  if (!SPONSOR_SECRET) {
    throw new Error('Fee sponsorship is not configured. VITE_SPONSOR_SECRET is missing.');
  }

  const sponsorKeypair = Keypair.fromSecret(SPONSOR_SECRET);

  // Parse the inner transaction signed by the user
  const innerTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE) as Transaction;

  // Build the fee bump transaction
  const feeBump = TransactionBuilder.buildFeeBumpTransaction(
    sponsorKeypair,    // Sponsor pays the fee
    MAX_FEE_STROOPS,   // Max fee the sponsor will pay (in stroops)
    innerTx,
    NETWORK_PASSPHRASE,
  );

  // Sign with sponsor key
  feeBump.sign(sponsorKeypair);

  return feeBump.toXDR();
}

/**
 * Determines if a candidate's transaction should be sponsored.
 * We sponsor if:
 *   1. Sponsorship is configured (VITE_SPONSOR_SECRET is set)
 *   2. The caller opts in (or we auto-detect low balance)
 *
 * @param candidateBalanceXlm - Candidate's current XLM balance
 * @param optIn - Explicit opt-in from the UI toggle
 */
export function shouldSponsor(
  candidateBalanceXlm: number,
  optIn = false,
): boolean {
  if (!isSponsorshipAvailable()) return false;
  // Auto-sponsor if balance < 5 XLM (not enough for fees + minimum reserve)
  if (candidateBalanceXlm < 5) return true;
  return optIn;
}
