/**
 * 🌠 Stella — RPC Fallback with Health Check
 * 
 * Tries multiple RPC nodes and returns the first healthy one.
 * Prevents single-point-of-failure for testnet outages.
 */
import { rpc } from '@stellar/stellar-sdk';

const RPC_NODES = [
  'https://soroban-testnet.stellar.org',
  'https://horizon-testnet.stellar.org',
];

let cachedServer: rpc.Server | null = null;
let lastHealthCheck = 0;
const HEALTH_TTL = 30_000; // Re-check every 30 seconds

/**
 * Returns a healthy RPC server. Caches for 30s to avoid spamming health checks.
 */
export const getServer = async (): Promise<rpc.Server> => {
  if (cachedServer && Date.now() - lastHealthCheck < HEALTH_TTL) {
    return cachedServer;
  }

  for (const url of RPC_NODES) {
    try {
      const s = new rpc.Server(url);
      await s.getLatestLedger(); // health check
      cachedServer = s;
      lastHealthCheck = Date.now();
      return s;
    } catch {
      continue;
    }
  }

  throw new Error('All RPC nodes unavailable. Please try again later.');
};
