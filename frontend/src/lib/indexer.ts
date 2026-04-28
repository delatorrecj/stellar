/**
 * Stella — Horizon Event Indexer
 *
 * Fetches and indexes all contract activity from the Stellar Horizon API.
 * Results are cached in localStorage with a 5-minute TTL to avoid
 * hammering the RPC on every dashboard load.
 */

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID ?? 'CAZHXCM3UNLT7HJLYHFWBRWAF3PCFN5TR4QCNYDCGCQ6K3ZMU7X7ZSLH';
const CACHE_KEY = 'stella_indexer_cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─── Types ────────────────────────────────────────────────────────

export interface HorizonOperation {
  id: string;
  type: string;
  type_i: number;
  created_at: string;
  transaction_hash: string;
  source_account: string;
  from?: string;
  to?: string;
  amount?: string;
  asset_type?: string;
}

export interface HorizonEffect {
  id: string;
  type: string;
  type_i: number;
  created_at: string;
  account: string;
  amount?: string;
}

export interface IndexerStats {
  totalTransactions: number;
  uniqueWallets: Set<string>;
  totalXlmLocked: number;
  totalXlmReleased: number;
  recentOperations: HorizonOperation[];
  dailyCounts: DailyCount[];
  lastUpdated: number;
}

export interface DailyCount {
  date: string;      // YYYY-MM-DD
  count: number;
}

export interface CachedData {
  stats: SerializableStats;
  timestamp: number;
}

// Set is not JSON-serializable, so we use a plain version for caching
export interface SerializableStats {
  totalTransactions: number;
  uniqueWallets: string[];
  totalXlmLocked: number;
  totalXlmReleased: number;
  recentOperations: HorizonOperation[];
  dailyCounts: DailyCount[];
  lastUpdated: number;
}

// ─── Cache Helpers ────────────────────────────────────────────────

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
    const cached: CachedData = { stats, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch {
    // localStorage may be full — silently ignore
  }
}

// ─── Horizon Fetch Helpers ────────────────────────────────────────

async function fetchAllPages<T>(url: string, limit = 200): Promise<T[]> {
  const results: T[] = [];
  let nextUrl: string | null = `${url}&limit=${limit}&order=desc`;

  while (nextUrl && results.length < 2000) {
    const res: Response = await fetch(nextUrl);
    if (!res.ok) break;
    const data: { _embedded?: { records?: T[] }; _links?: { next?: { href?: string } } } = await res.json();
    const records: T[] = data._embedded?.records ?? [];
    results.push(...records);
    nextUrl = records.length === limit ? data._links?.next?.href ?? null : null;
  }

  return results;
}

// ─── Main Indexer ─────────────────────────────────────────────────

export async function fetchIndexerStats(forceRefresh = false): Promise<SerializableStats> {
  // Return cached data if valid and not forcing refresh
  if (!forceRefresh) {
    const cached = loadCache();
    if (cached) return cached;
  }

  // Fetch operations for the contract account
  const ops = await fetchAllPages<HorizonOperation>(
    `${HORIZON_URL}/accounts/${CONTRACT_ID}/operations?`,
    200
  );

  // Fetch effects for token transfer tracking
  const effects = await fetchAllPages<HorizonEffect>(
    `${HORIZON_URL}/accounts/${CONTRACT_ID}/effects?`,
    200
  );

  // Count unique wallets from all operations
  const uniqueWallets = new Set<string>();
  ops.forEach(op => {
    if (op.source_account) uniqueWallets.add(op.source_account);
    if (op.from) uniqueWallets.add(op.from);
    if (op.to) uniqueWallets.add(op.to);
  });
  // Remove the contract itself
  uniqueWallets.delete(CONTRACT_ID);

  // Calculate XLM locked (credits to contract) and released (debits from contract)
  let totalXlmLocked = 0;
  let totalXlmReleased = 0;

  effects.forEach(effect => {
    const amount = parseFloat(effect.amount ?? '0');
    if (isNaN(amount)) return;

    if (effect.type === 'account_credited' && effect.account === CONTRACT_ID) {
      totalXlmLocked += amount;
    }
    if (effect.type === 'account_debited' && effect.account === CONTRACT_ID) {
      totalXlmReleased += amount;
    }
  });

  // Build daily transaction counts (last 30 days)
  const dailyMap = new Map<string, number>();
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dailyMap.set(d.toISOString().slice(0, 10), 0);
  }
  ops.forEach(op => {
    const date = op.created_at.slice(0, 10);
    if (dailyMap.has(date)) {
      dailyMap.set(date, (dailyMap.get(date) ?? 0) + 1);
    }
  });
  const dailyCounts: DailyCount[] = Array.from(dailyMap.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  const stats: SerializableStats = {
    totalTransactions: ops.length,
    uniqueWallets: Array.from(uniqueWallets),
    totalXlmLocked: Math.round(totalXlmLocked * 100) / 100,
    totalXlmReleased: Math.round(totalXlmReleased * 100) / 100,
    recentOperations: ops.slice(0, 20),
    dailyCounts,
    lastUpdated: Date.now(),
  };

  saveCache(stats);
  return stats;
}

export function clearIndexerCache() {
  localStorage.removeItem(CACHE_KEY);
}
