/**
 * 🌠 Stella - Stellar Network Configuration
 */

export const NETWORK_DETAILS = {
  network: import.meta.env.VITE_STELLAR_NETWORK || 'testnet',
  rpcUrl: import.meta.env.VITE_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
};

export const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID;

if (!CONTRACT_ID) {
  console.warn('⚠️ Stella: VITE_CONTRACT_ID is not defined in .env');
}
