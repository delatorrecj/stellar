/**
 * 🌠 Stella — RPC & Horizon Node Management
 */
import { rpc, Horizon } from '@stellar/stellar-sdk';

const SOROBAN_RPC_NODES = [
  'https://soroban-testnet.stellar.org',
];

const HORIZON_NODES = [
  'https://horizon-testnet.stellar.org',
];

let cachedSoroban: rpc.Server | null = null;
let cachedHorizon: Horizon.Server | null = null;
let lastHealthCheck = 0;
const HEALTH_TTL = 30_000;

/**
 * Returns a healthy Soroban RPC server.
 */
export const getServer = async (): Promise<rpc.Server> => {
  if (cachedSoroban && Date.now() - lastHealthCheck < HEALTH_TTL) {
    return cachedSoroban;
  }

  for (const url of SOROBAN_RPC_NODES) {
    try {
      const s = new rpc.Server(url);
      await s.getLatestLedger();
      cachedSoroban = s;
      lastHealthCheck = Date.now();
      return s;
    } catch {
      continue;
    }
  }
  throw new Error('Soroban RPC nodes unavailable.');
};

/**
 * Returns a healthy Horizon server for balance lookups.
 */
export const getHorizonServer = async (): Promise<Horizon.Server> => {
  if (cachedHorizon) return cachedHorizon;
  
  for (const url of HORIZON_NODES) {
    try {
      const s = new Horizon.Server(url);
      cachedHorizon = s;
      return s;
    } catch {
      continue;
    }
  }
  throw new Error('Horizon nodes unavailable.');
};
