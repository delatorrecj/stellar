/**
 * Stella — Soroban RPC Event Indexer v2
 *
 * Uses the Soroban RPC `getEvents` method to index contract activity.
 * The previous version used Horizon /accounts/{C…}/operations which returns
 * empty results for Soroban contract IDs — they are not classic accounts.
 *
 * Events are available for the last ~17,280 ledgers (≈24 h on testnet).
 */

import { xdr, scValToNative } from '@stellar/stellar-sdk';

const SOROBAN_RPC =
  import.meta.env.VITE_SOROBAN_RPC_URL ?? 'https://soroban-testnet.stellar.org';
const CONTRACT_ID =
  import.meta.env.VITE_CONTRACT_ID ??
  'CAZHXCM3UNLT7HJLYHFWBRWAF3PCFN5TR4QCNYDCGCQ6K3ZMU7X7ZSLH';
const CACHE_KEY = 'stella_indexer_v2_cache';
const CACHE_TTL_MS = 5 * 60 * 1000;
const RETENTION_LEDGERS = 17_000; // conservative ~24 h

// ─── Public types ─────────────────────────────────────────────────

export interface ContractEvent {
  id: string;
  txHash: string;
  createdAt: string; // ISO
  eventType: string; // e.g. "escrow_created"
  source_account: string;
  type: string;      // alias for eventType (Metrics page compat)
  transaction_hash: string; // alias for txHash
}

export interface DailyCount {
  date: string;
  count: number;
}

export interface SerializableStats {
  totalTransactions: number;
  uniqueWallets: string[];
  totalXlmLocked: number;
  totalXlmReleased: number;
  recentOperations: ContractEvent[];
  dailyCounts: DailyCount[];
  lastUpdated: number;
}

// ─── Cache ────────────────────────────────────────────────────────

interface CachedData {
  stats: SerializableStats;
  timestamp: number;
}

function loadCache(): SerializableStats | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedData = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) return null;
    return cached.stats;
  } catch {
    return null;
  }
}

function saveCache(stats: SerializableStats) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ stats, timestamp: Date.now() }));
  } catch {
    // ignore quota errors
  }
}

// ─── Soroban RPC helpers ──────────────────────────────────────────

async function rpcCall<T>(method: string, params?: unknown): Promise<T> {
  const res = await fetch(SOROBAN_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(`RPC ${method}: ${json.error.message}`);
  return json.result as T;
}

interface LatestLedgerResult {
  sequence: number;
}

interface RpcEvent {
  id: string;
  type: string;
  ledger: number;
  ledgerClosedAt: string;
  contractId: string;
  txHash: string;
  topic: string[];
  value: string | { xdr: string };
}

interface GetEventsResult {
  events: RpcEvent[];
  latestLedger: number;
  cursor?: string;
}

// ─── XDR decode helpers ───────────────────────────────────────────

function decodeScVal(base64: string): unknown {
  try {
    const scVal = xdr.ScVal.fromXDR(base64, 'base64');
    return scValToNative(scVal);
  } catch {
    return null;
  }
}

/** Returns the first topic as a human-readable event name */
function eventName(topics: string[]): string {
  if (!topics.length) return 'contract_call';
  const name = decodeScVal(topics[0]);
  if (typeof name === 'string') return name;
  return 'contract_call';
}

/** Returns all address-like strings from the topics (employer, candidate…) */
function extractAddresses(topics: string[]): string[] {
  return topics
    .slice(1)
    .map(t => decodeScVal(t))
    .filter((v): v is string => typeof v === 'string' && v.length > 20);
}

// ─── Main indexer ─────────────────────────────────────────────────

async function fetchAllEvents(): Promise<RpcEvent[]> {
  // 1. Get current ledger
  const { sequence } = await rpcCall<LatestLedgerResult>('getLatestLedger');
  const startLedger = Math.max(1, sequence - RETENTION_LEDGERS);

  const allEvents: RpcEvent[] = [];
  let cursor: string | undefined;

  // Paginate until no more events
  for (let page = 0; page < 50; page++) {
    const result = await rpcCall<GetEventsResult>('getEvents', {
      startLedger,
      filters: [{ type: 'contract', contractIds: [CONTRACT_ID] }],
      pagination: { limit: 200, ...(cursor ? { cursor } : {}) },
    });

    allEvents.push(...result.events);

    if (!result.cursor || result.events.length < 200) break;
    cursor = result.cursor;
  }

  return allEvents;
}

export async function fetchIndexerStats(
  forceRefresh = false,
): Promise<SerializableStats> {
  if (!forceRefresh) {
    const cached = loadCache();
    if (cached) return cached;
  }

  const events = await fetchAllEvents();

  // Build unique wallets from address topics
  const walletSet = new Set<string>();
  events.forEach(ev => {
    extractAddresses(ev.topic).forEach(a => walletSet.add(a));
  });
  walletSet.delete(CONTRACT_ID);

  // XLM locked / released — inferred from event type
  let totalXlmLocked = 0;
  let totalXlmReleased = 0;
  events.forEach(ev => {
    const name = eventName(ev.topic);
    // value is always the amount in stroops for fund-moving events
    if (name === 'escrow_created' || name === 'init_escrow') {
      const raw = typeof ev.value === 'string' ? ev.value : ev.value?.xdr ?? '';
      const decoded = decodeScVal(raw);
      if (typeof decoded === 'bigint') {
        totalXlmLocked += Number(decoded) / 1e7;
      }
    }
    if (name === 'milestone_released' || name === 'clawback') {
      const raw = typeof ev.value === 'string' ? ev.value : ev.value?.xdr ?? '';
      const decoded = decodeScVal(raw);
      if (typeof decoded === 'bigint') {
        totalXlmReleased += Number(decoded) / 1e7;
      }
    }
  });

  // Daily counts (last 30 days)
  const dailyMap = new Map<string, number>();
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dailyMap.set(d.toISOString().slice(0, 10), 0);
  }
  events.forEach(ev => {
    const date = ev.ledgerClosedAt.slice(0, 10);
    if (dailyMap.has(date)) {
      dailyMap.set(date, (dailyMap.get(date) ?? 0) + 1);
    }
  });

  // Map to the shape Metrics.tsx expects
  const recentOperations: ContractEvent[] = events
    .slice(0, 20)
    .map(ev => ({
      id: ev.id,
      txHash: ev.txHash,
      transaction_hash: ev.txHash,
      createdAt: ev.ledgerClosedAt,
      eventType: eventName(ev.topic),
      type: eventName(ev.topic),
      source_account: extractAddresses(ev.topic)[0] ?? CONTRACT_ID,
    }));

  const stats: SerializableStats = {
    totalTransactions: events.length,
    uniqueWallets: Array.from(walletSet),
    totalXlmLocked: Math.round(totalXlmLocked * 100) / 100,
    totalXlmReleased: Math.round(totalXlmReleased * 100) / 100,
    recentOperations,
    dailyCounts: Array.from(dailyMap.entries()).map(([date, count]) => ({
      date,
      count,
    })),
    lastUpdated: Date.now(),
  };

  saveCache(stats);
  return stats;
}

export function clearIndexerCache() {
  localStorage.removeItem(CACHE_KEY);
}
