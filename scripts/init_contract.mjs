/**
 * Initialize V1.4 Stella Contract on Testnet
 * 
 * Usage: node init_contract.mjs
 */
import { 
  Contract, 
  Keypair, 
  nativeToScVal, 
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import { Server } from '@stellar/stellar-sdk/rpc';

const CONTRACT_ID = process.env.CONTRACT_ID || 'CAZHXCM3UNLT7HJLYHFWBRWAF3PCFN5TR4QCNYDCGCQ6K3ZMU7X7ZSLH';
const ADMIN_SECRET = process.env.ADMIN_SECRET;
if (!ADMIN_SECRET) {
  console.error('ERROR: Set ADMIN_SECRET environment variable before running.');
  console.error('  Usage: ADMIN_SECRET=S... node scripts/init_contract.mjs');
  process.exit(1);
}
const ADMIN_PUBLIC = process.env.ADMIN_PUBLIC || 'GABTUX53227CZQJSRKS6UMT2VWUZCLX27AGCDLHRS7VYJJB4DBIMHKIU';
const XLM_SAC = process.env.XLM_SAC || 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

async function main() {
  const keypair = Keypair.fromSecret(ADMIN_SECRET);
  const server = new Server(RPC_URL);
  const contract = new Contract(CONTRACT_ID);
  
  console.log('Contract:', CONTRACT_ID);
  console.log('Admin:', ADMIN_PUBLIC);
  console.log('Token:', XLM_SAC);

  const account = await server.getAccount(ADMIN_PUBLIC);
  const tx = new TransactionBuilder(account, {
    fee: '1000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        'initialize',
        nativeToScVal(ADMIN_PUBLIC, { type: 'address' }),
        nativeToScVal(XLM_SAC, { type: 'address' })
      )
    )
    .setTimeout(180)
    .build();

  console.log('Simulating transaction...');
  const simResult = await server.simulateTransaction(tx);
  
  if ('error' in simResult) {
    console.error('Simulation failed:', simResult.error);
    process.exit(1);
  }

  console.log('Simulation succeeded');

  const { assembleTransaction } = await import('@stellar/stellar-sdk/rpc');
  const assembled = assembleTransaction(tx, simResult).build();
  assembled.sign(keypair);

  console.log('Submitting transaction...');
  const sendResult = await server.sendTransaction(assembled);
  console.log('Status:', sendResult.status, '| Hash:', sendResult.hash);

  if (sendResult.status === 'ERROR') {
    console.error('Submit failed');
    process.exit(1);
  }

  console.log('Waiting for confirmation...');
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const result = await server.getTransaction(sendResult.hash);
    
    if (result.status === 'SUCCESS') {
      console.log('Contract initialized successfully!');
      console.log('TX:', sendResult.hash);
      return;
    }
    if (result.status === 'FAILED') {
      console.error('Transaction failed on-chain');
      process.exit(1);
    }
    process.stdout.write('.');
  }

  console.log('Confirmation timed out. Hash:', sendResult.hash);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
