/**
 * 🌠 Stella — Contract Client (V1.3 Multi-Milestone)
 * 
 * All Soroban contract call wrappers for the Stella escrow.
 * Handles: init_escrow (with milestones), candidate_accept,
 * unlock_milestone (by ID), clawback, get_escrow.
 * 
 * Uses simulation pre-check + assembleTransaction for production-ready flow.
 */
import { 
  Contract, 
  rpc, 
  nativeToScVal, 
  scValToNative, 
  TransactionBuilder, 
  Account,
  Keypair,
  xdr,
} from '@stellar/stellar-sdk';
import { NETWORK_DETAILS, CONTRACT_ID } from './stellar';
import { getServer } from './rpc';

const networkPassphrase = NETWORK_DETAILS.networkPassphrase;

// ─── Types ───────────────────────────────────────────────────────

export type EscrowState = 'Pending' | 'Active' | 'Complete' | 'Cancelled' | 'Disputed' | 'Resolved';

export interface MilestoneData {
  id: number;
  description: string;
  amount: string; // human-readable XLM
  released: boolean;
}

export interface EscrowData {
  employer: string;
  candidate: string;
  token: string;
  milestones: MilestoneData[];
  deadline: number;
  state: EscrowState;
  arbitrator: string;
  totalLocked: string;   // sum of unreleased
  totalReleased: string; // sum of released
}

export interface MilestoneInput {
  description: string;
  amount: string; // XLM string
}

// ─── Error Map ───────────────────────────────────────────────────

const CONTRACT_ERRORS: Record<number, string> = {
  1: 'Contract has already been initialized.',
  2: 'Contract not yet initialized.',
  3: 'You are not authorized for this action.',
  4: 'Milestone amount must be greater than zero.',
  5: 'No milestone found with that ID.',
  6: 'This milestone has already been released.',
  7: 'Nothing left to clawback — escrow is finished.',
  8: 'Deadline has expired — milestones can no longer be released.',
  9: 'At least one milestone is required.',
  10: 'Escrow must be in Active state for this action.',
  11: 'Escrow must be in Pending state for this action.',
  12: 'Candidate has already accepted this escrow.',
  13: 'An active escrow already exists for this candidate.',
  14: 'No escrow found for this candidate.',
  15: 'Escrow must be in Disputed state.',
  16: 'Dispute percentage (BPS) must be between 0 and 10000.',
};

export const parseContractError = (error: unknown): string => {
  const msg = String(error);
  const match = msg.match(/Error\(Contract, #(\d+)\)/);
  if (match) {
    const code = parseInt(match[1]);
    return CONTRACT_ERRORS[code] ?? `Contract error #${code}`;
  }
  if (msg.includes('insufficient balance')) return 'Insufficient XLM balance in wallet.';
  if (msg.includes('timeout')) return 'Transaction timed out. Please try again.';
  if (msg.includes('User declined') || msg.includes('user_declined')) return 'Transaction cancelled. You can try again.';
  return 'Transaction failed. Check your wallet and try again.';
};

// ─── Helpers ─────────────────────────────────────────────────────

const STROOPS_PER_XLM = 10_000_000n;

function xlmToStroops(xlm: string): bigint {
  return BigInt(Math.floor(parseFloat(xlm) * 10_000_000));
}

function stroopsToXlm(stroops: bigint | number | string): string {
  const s = typeof stroops === 'bigint' ? stroops : BigInt(stroops);
  const whole = s / STROOPS_PER_XLM;
  const frac = s % STROOPS_PER_XLM;
  const fracStr = frac.toString().padStart(7, '0').replace(/0+$/, '');
  return fracStr ? `${whole}.${fracStr}` : whole.toString();
}

function parseEscrowState(raw: unknown): EscrowState {
  if (typeof raw === 'string') return raw as EscrowState;
  // Soroban returns enum as keyed object
  if (typeof raw === 'object' && raw !== null) {
    const keys = Object.keys(raw);
    if (keys.length > 0) return keys[0] as EscrowState;
  }
  return 'Pending';
}

function parseEscrowData(raw: any): EscrowData {
  const milestones: MilestoneData[] = (raw.milestones || []).map((m: any) => ({
    id: Number(m.id),
    description: String(m.description),
    amount: stroopsToXlm(m.amount),
    released: Boolean(m.released),
  }));

  let totalLocked = 0n;
  let totalReleased = 0n;
  for (const m of raw.milestones || []) {
    const amt = typeof m.amount === 'bigint' ? m.amount : BigInt(m.amount);
    if (m.released) {
      totalReleased += amt;
    } else {
      totalLocked += amt;
    }
  }

  return {
    employer: String(raw.employer),
    candidate: String(raw.candidate),
    token: String(raw.token),
    milestones,
    deadline: Number(raw.deadline),
    state: parseEscrowState(raw.state),
    arbitrator: String(raw.arbitrator),
    totalLocked: stroopsToXlm(totalLocked),
    totalReleased: stroopsToXlm(totalReleased),
  };
}

// ─── Transaction Builder Helper ──────────────────────────────────

async function getBuilder(source: string): Promise<TransactionBuilder> {
  const server = await getServer();
  const account = await server.getAccount(source);
  return new TransactionBuilder(account, {
    fee: '1000',
    networkPassphrase,
  }).setTimeout(180);
}

/**
 * Simulate a transaction before returning it.
 * This catches errors early and applies resource fees.
 */
async function simulateAndAssemble(
  tx: ReturnType<TransactionBuilder['build']>
): Promise<ReturnType<TransactionBuilder['build']>> {
  const server = await getServer();
  const simResult = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(simResult)) {
    const errorMsg = 'error' in simResult ? String(simResult.error) : 'Simulation failed';
    throw new Error(errorMsg);
  }

  if (rpc.Api.isSimulationSuccess(simResult)) {
    return rpc.assembleTransaction(tx, simResult).build();
  }

  return tx;
}

// ─── Contract Client ─────────────────────────────────────────────

export const StellaClient = {
  /**
   * Read escrow for a candidate. Returns null if not found.
   */
  async getEscrow(candidateAddress: string): Promise<EscrowData | null> {
    if (!CONTRACT_ID) throw new Error('Contract ID not configured');

    const server = await getServer();
    const contract = new Contract(CONTRACT_ID);
    const result = await server.simulateTransaction(
      new TransactionBuilder(
        new Account(Keypair.random().publicKey(), '0'),
        { fee: '100', networkPassphrase }
      )
        .addOperation(
          contract.call('get_escrow', nativeToScVal(candidateAddress, { type: 'address' }))
        )
        .setTimeout(30)
        .build()
    );

    if (rpc.Api.isSimulationSuccess(result)) {
      const raw = scValToNative(result.result!.retval);
      return parseEscrowData(raw);
    }

    return null;
  },

  /**
   * Create an escrow with milestone array.
   * Returns an assembled, simulation-checked transaction ready for signing.
   */
  async createEscrowTx(
    employer: string,
    candidate: string,
    tokenAddress: string,
    arbitrator: string,
    milestones: MilestoneInput[],
    deadlineDays: number
  ) {
    if (!CONTRACT_ID) throw new Error('Contract ID not configured');

    const deadline = Math.floor(Date.now() / 1000) + (deadlineDays * 24 * 60 * 60);

    // Build milestone ScVal array
    const milestoneVals = milestones.map((m, i) =>
      xdr.ScVal.scvMap([
        new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol('amount'), val: nativeToScVal(xlmToStroops(m.amount), { type: 'i128' }) }),
        new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol('description'), val: nativeToScVal(m.description, { type: 'string' }) }),
        new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol('id'), val: nativeToScVal(i, { type: 'u32' }) }),
        new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol('released'), val: nativeToScVal(false, { type: 'bool' }) }),
      ])
    );
    const milestonesScVal = xdr.ScVal.scvVec(milestoneVals);

    const contract = new Contract(CONTRACT_ID);
    const txBuilder = await getBuilder(employer);

    const tx = txBuilder
      .addOperation(
        contract.call(
          'init_escrow',
          nativeToScVal(employer, { type: 'address' }),
          nativeToScVal(candidate, { type: 'address' }),
          nativeToScVal(tokenAddress, { type: 'address' }),
          nativeToScVal(arbitrator, { type: 'address' }),
          milestonesScVal,
          nativeToScVal(BigInt(deadline), { type: 'u64' })
        )
      )
      .build();

    return simulateAndAssemble(tx);
  },

  /**
   * Candidate accepts an escrow. Transitions Pending → Active.
   */
  async candidateAcceptTx(candidate: string) {
    if (!CONTRACT_ID) throw new Error('Contract ID not configured');

    const contract = new Contract(CONTRACT_ID);
    const txBuilder = await getBuilder(candidate);

    const tx = txBuilder
      .addOperation(
        contract.call(
          'candidate_accept',
          nativeToScVal(candidate, { type: 'address' })
        )
      )
      .build();

    return simulateAndAssemble(tx);
  },

  /**
   * Employer releases a specific milestone by ID.
   */
  async unlockMilestoneTx(employer: string, candidate: string, milestoneId: number) {
    if (!CONTRACT_ID) throw new Error('Contract ID not configured');

    const contract = new Contract(CONTRACT_ID);
    const txBuilder = await getBuilder(employer);

    const tx = txBuilder
      .addOperation(
        contract.call(
          'unlock_milestone',
          nativeToScVal(employer, { type: 'address' }),
          nativeToScVal(candidate, { type: 'address' }),
          nativeToScVal(milestoneId, { type: 'u32' })
        )
      )
      .build();

    return simulateAndAssemble(tx);
  },

  /**
   * Employer claws back remaining unreleased funds.
   */
  async clawbackTx(employer: string, candidate: string) {
    if (!CONTRACT_ID) throw new Error('Contract ID not configured');

    const contract = new Contract(CONTRACT_ID);
    const txBuilder = await getBuilder(employer);

    const tx = txBuilder
      .addOperation(
        contract.call(
          'clawback',
          nativeToScVal(employer, { type: 'address' }),
          nativeToScVal(candidate, { type: 'address' })
        )
      )
      .build();

    return simulateAndAssemble(tx);
  },

  /**
   * Candidate raises a dispute after deadline.
   */
  async raiseDisputeTx(candidate: string) {
    if (!CONTRACT_ID) throw new Error('Contract ID not configured');

    const contract = new Contract(CONTRACT_ID);
    const txBuilder = await getBuilder(candidate);

    const tx = txBuilder
      .addOperation(
        contract.call(
          'raise_dispute',
          nativeToScVal(candidate, { type: 'address' })
        )
      )
      .build();

    return simulateAndAssemble(tx);
  },

  /**
   * Arbitrator resolves a dispute with a split.
   */
  async resolveDisputeTx(arbitrator: string, candidate: string, candidateBps: number) {
    if (!CONTRACT_ID) throw new Error('Contract ID not configured');

    const contract = new Contract(CONTRACT_ID);
    const txBuilder = await getBuilder(arbitrator);

    const tx = txBuilder
      .addOperation(
        contract.call(
          'resolve_dispute',
          nativeToScVal(arbitrator, { type: 'address' }),
          nativeToScVal(candidate, { type: 'address' }),
          nativeToScVal(candidateBps, { type: 'u32' })
        )
      )
      .build();

    return simulateAndAssemble(tx);
  },
};
