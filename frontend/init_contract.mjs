/**
 * Initialize V1.3 Stella Contract on Testnet
 * 
 * Usage: node init_contract.mjs
 * Run from: frontend/ directory
 */
import { 
  Contract, 
  Keypair, 
  nativeToScVal, 
  TransactionBuilder,
  Address,
} from '@stellar/stellar-sdk';
import { Server, assembleTransaction } from '@stellar/stellar-sdk/rpc';
import * as fs from 'fs';
import * as path from 'path';

const CONTRACT_ID = 'CDDSTZ5N5DWYKUSFXRANFQDKNXO2VUZJYTUVF3JX6NUBQ27I2H4DQPBN';
const ADMIN_PUBLIC = 'GABTUX53227CZQJSRKS6UMT2VWUZCLX27AGCDLHRS7VYJJB4DBIMHKIU';
const XLM_SAC = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

async function main() {
  // Read seed phrase from stellar CLI TOML config
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  const tomlPath = path.join(homeDir, '.config', 'stellar', 'identity', 'my-key.toml');
  
  let tomlContent;
  try {
    tomlContent = fs.readFileSync(tomlPath, 'utf-8');
  } catch {
    console.error('❌ Could not read', tomlPath);
    process.exit(1);
  }

  const seedMatch = tomlContent.match(/seed_phrase\s*=\s*"([^"]+)"/);
  if (!seedMatch) {
    console.error('❌ No seed_phrase found in TOML');
    process.exit(1);
  }

  // Derive keypair from seed phrase (BIP39 → Stellar uses a simpler derivation for CLI)
  // The stellar CLI uses Keypair.fromRawEd25519Seed, but from a mnemonic we can use the SDK
  // Let's use a direct approach — get the secret key from the CLI
  console.log('✅ Found seed phrase');
  console.log('📋 Contract:', CONTRACT_ID);
  console.log('👤 Admin:', ADMIN_PUBLIC);
  console.log('💰 Token (XLM SAC):', XLM_SAC);

  // Use stellar CLI to get the secret key
  const { execSync } = await import('child_process');
  let secretKey;
  try {
    secretKey = execSync('stellar keys show my-key', { encoding: 'utf-8' }).trim();
    console.log('✅ Got secret key from stellar CLI');
  } catch {
    console.error('❌ Could not get secret key from stellar CLI');
    process.exit(1);
  }

  const keypair = Keypair.fromSecret(secretKey);
  const server = new Server(RPC_URL);
  const contract = new Contract(CONTRACT_ID);

  const account = await server.getAccount(ADMIN_PUBLIC);
  const tx = new TransactionBuilder(account, {
    fee: '1000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        'initialize',
        new Address(ADMIN_PUBLIC).toScVal(),
        new Address(XLM_SAC).toScVal()
      )
    )
    .setTimeout(180)
    .build();

  console.log('\n🔄 Simulating...');
  const simResult = await server.simulateTransaction(tx);
  
  if ('error' in simResult) {
    console.error('❌ Simulation failed:', simResult.error);
    process.exit(1);
  }

  console.log('✅ Simulation OK');

  const assembled = assembleTransaction(tx, simResult).build();
  assembled.sign(keypair);

  console.log('🌎 Submitting...');
  const sendResult = await server.sendTransaction(assembled);
  console.log('📤 Status:', sendResult.status, '| Hash:', sendResult.hash);

  if (sendResult.status === 'ERROR') {
    console.error('❌ Submit failed');
    process.exit(1);
  }

  console.log('⏳ Waiting for confirmation...');
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const result = await server.getTransaction(sendResult.hash);
    
    if (result.status === 'SUCCESS') {
      console.log('\n✅ Contract initialized!');
      console.log('🔗 https://stellar.expert/explorer/testnet/tx/' + sendResult.hash);
      return;
    }
    if (result.status === 'FAILED') {
      console.error('\n❌ Failed on-chain');
      process.exit(1);
    }
    process.stdout.write('.');
  }

  console.log('\n⚠️  Confirmation timeout. Hash:', sendResult.hash);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
