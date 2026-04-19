/**
 * Initialize V1.3 Stella Contract on Testnet
 * 
 * Usage: node init_contract.mjs
 * 
 * This script uses the Stellar SDK to call initialize() on the 
 * deployed V1.3 contract. It simulates, signs with the admin key,
 * and submits the transaction directly.
 */
import { 
  Contract, 
  Keypair, 
  nativeToScVal, 
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import { Server } from '@stellar/stellar-sdk/rpc';
import * as fs from 'fs';
import * as path from 'path';

const CONTRACT_ID = 'CDDSTZ5N5DWYKUSFXRANFQDKNXO2VUZJYTUVF3JX6NUBQ27I2H4DQPBN';
const ADMIN_PUBLIC = 'GABTUX53227CZQJSRKS6UMT2VWUZCLX27AGCDLHRS7VYJJB4DBIMHKIU';
const XLM_SAC = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2OOTUJ2F';
const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

async function main() {
  // Read the admin secret key from stellar CLI config
  const stellarConfigDir = path.join(process.env.HOME || process.env.USERPROFILE || '', '.config', 'stellar', 'identity', 'my-key');
  const secretKeyPath = path.join(stellarConfigDir, 'secret');
  
  let secretKey;
  try {
    secretKey = fs.readFileSync(secretKeyPath, 'utf-8').trim();
    console.log('✅ Found admin secret key');
  } catch {
    console.error('❌ Could not read secret key from', secretKeyPath);
    console.error('   Make sure you have a stellar identity "my-key" configured.');
    process.exit(1);
  }

  const keypair = Keypair.fromSecret(secretKey);
  const server = new Server(RPC_URL);
  const contract = new Contract(CONTRACT_ID);
  
  console.log('📋 Contract:', CONTRACT_ID);
  console.log('👤 Admin:', ADMIN_PUBLIC);
  console.log('💰 Token (XLM SAC):', XLM_SAC);

  // Build transaction
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

  // Simulate
  console.log('\n🔄 Simulating transaction...');
  const simResult = await server.simulateTransaction(tx);
  
  if ('error' in simResult) {
    console.error('❌ Simulation failed:', simResult.error);
    process.exit(1);
  }

  console.log('✅ Simulation succeeded');

  // Assemble and sign
  const { assembleTransaction } = await import('@stellar/stellar-sdk/rpc');
  const assembled = assembleTransaction(tx, simResult).build();
  assembled.sign(keypair);

  // Submit
  console.log('🌎 Submitting transaction...');
  const sendResult = await server.sendTransaction(assembled);
  console.log('📤 Status:', sendResult.status, '| Hash:', sendResult.hash);

  if (sendResult.status === 'ERROR') {
    console.error('❌ Submit failed');
    process.exit(1);
  }

  // Poll for confirmation
  console.log('⏳ Waiting for confirmation...');
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const result = await server.getTransaction(sendResult.hash);
    
    if (result.status === 'SUCCESS') {
      console.log('\n✅ Contract initialized successfully!');
      console.log('🔗 https://stellar.expert/explorer/testnet/tx/' + sendResult.hash);
      return;
    }
    if (result.status === 'FAILED') {
      console.error('\n❌ Transaction failed on-chain');
      process.exit(1);
    }
    process.stdout.write('.');
  }

  console.log('\n⚠️  Transaction submitted but confirmation timed out. Hash:', sendResult.hash);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
