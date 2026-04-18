import { 
  Contract, 
  rpc, 
  nativeToScVal, 
  scValToNative, 
  TransactionBuilder, 
  Account,
  Keypair
} from '@stellar/stellar-sdk';
import { NETWORK_DETAILS, CONTRACT_ID } from './stellar';

const server = new rpc.Server(NETWORK_DETAILS.rpcUrl);
const networkPassphrase = NETWORK_DETAILS.networkPassphrase;

/**
 * Stella Contract Utility
 */
export const StellaClient = {
  /**
   * Fetches escrow details for a specific candidate
   */
  async getEscrow(candidateAddress: string) {
    if (!CONTRACT_ID) throw new Error('Contract ID not configured');

    const contract = new Contract(CONTRACT_ID);
    const result = await server.simulateTransaction(
      new TransactionBuilder(
        new Account(Keypair.random().publicKey(), '0'), // Proper Account object for simulation
        { fee: '100', networkPassphrase }
      )
      .addOperation(
        contract.call('get_escrow', nativeToScVal(candidateAddress, { type: 'address' }))
      )
      .setTimeout(30)
      .build()
    );

    if (rpc.Api.isSimulationSuccess(result)) {
       return scValToNative(result.result!.retval);
    }
    
    // If not found or error
    return null;
  },

  /**
   * Prepares an init_escrow transaction
   */
  async createEscrowTx(employer: string, candidate: string, amount: string, deadlineDays: number) {
    if (!CONTRACT_ID) throw new Error('Contract ID not configured');
    
    // Calculate deadline as Unix timestamp (seconds)
    const deadline = Math.floor(Date.now() / 1000) + (deadlineDays * 24 * 60 * 60);
    
    // Amount in Stroops (10^7 for XLM SAC)
    const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 10_000_000));

    const contract = new Contract(CONTRACT_ID);
    const txBuilder = await getBuilder(employer);
    
    const tx = txBuilder
      .addOperation(
        contract.call(
          'init_escrow', 
          nativeToScVal(employer, { type: 'address' }),
          nativeToScVal(candidate, { type: 'address' }),
          nativeToScVal(amountBigInt, { type: 'i128' }),
          nativeToScVal(BigInt(deadline), { type: 'u64' })
        )
      )
      .build();

    return tx;
  },

  /**
   * Prepares an unlock_milestone transaction
   */
  async unlockMilestoneTx(candidate: string, amount: string) {
    if (!CONTRACT_ID) throw new Error('Contract ID not configured');

    const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 10_000_000));
    const contract = new Contract(CONTRACT_ID);
    const txBuilder = await getBuilder(candidate);
    
    const tx = txBuilder
      .addOperation(
        contract.call(
          'unlock_milestone', 
          nativeToScVal(candidate, { type: 'address' }),
          nativeToScVal(amountBigInt, { type: 'i128' })
        )
      )
      .build();

    return tx;
  },

  /**
   * Prepares a clawback transaction
   */
  async clawbackTx(employer: string, candidate: string) {
    if (!CONTRACT_ID) throw new Error('Contract ID not configured');

    const contract = new Contract(CONTRACT_ID);
    const txBuilder = await getBuilder(employer);

    const tx = txBuilder
      .addOperation(
        contract.call('clawback', nativeToScVal(candidate, { type: 'address' }))
      )
      .build();

    return tx;
  }
};

/**
 * Helper to get a TransactionBuilder with updated sequence number
 */
async function getBuilder(source: string) {
  const account = await server.getAccount(source);
  return new TransactionBuilder(account, {
    fee: '1000', // Standard fee for Soroban operations
    networkPassphrase
  }).setTimeout(180);
}
