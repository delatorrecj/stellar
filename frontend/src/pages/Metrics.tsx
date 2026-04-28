import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Users, TrendingUp, DollarSign,
  RefreshCw, LogOut, ExternalLink, Clock,
  CheckCircle, XCircle, AlertTriangle, BarChart2,
  Shield, Zap,
} from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { fetchIndexerStats, clearIndexerCache, type SerializableStats } from '../lib/indexer';

// ─── Stellar Expert link helper ───────────────────────────────────
const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID ?? 'CAZHXCM3UNLT7HJLYHFWBRWAF3PCFN5TR4QCNYDCGCQ6K3ZMU7X7ZSLH';
const expertUrl = (path: string) => `https://stellar.expert/explorer/testnet/${path}`;

// ─── Sub-components ───────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = false,
  href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: boolean;
  href?: string;
}) {
  const inner = (
    <div className={`card-stella ${accent ? 'border-primary-200 bg-primary-50' : ''} relative overflow-hidden`}>
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${accent ? 'bg-primary-100' : 'bg-neutral-100'}`}>
          <Icon className={`w-5 h-5 ${accent ? 'text-primary-600' : 'text-neutral-500'}`} />
        </div>
        {href && (
          <ExternalLink className="w-3.5 h-3.5 text-neutral-300 group-hover:text-primary-400 transition-colors" />
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="label-section">{label}</span>
        <span className={`text-2xl font-bold ${accent ? 'text-primary-700' : 'text-neutral-900'}`}>{value}</span>
        {sub && <span className="text-xs text-neutral-400">{sub}</span>}
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="group no-underline">
        {inner}
      </a>
    );
  }
  return inner;
}

function ActivityRow({ op }: { op: { id: string; type: string; created_at: string; transaction_hash: string; source_account: string } }) {
  const typeLabel: Record<string, { label: string; color: string }> = {
    invoke_host_function: { label: 'Contract Call', color: 'text-primary-600 bg-primary-50' },
    payment: { label: 'Payment', color: 'text-success bg-green-50' },
    create_account: { label: 'Account Created', color: 'text-accent-600 bg-accent-50' },
  };
  const info = typeLabel[op.type] ?? { label: op.type, color: 'text-neutral-500 bg-neutral-100' };
  const date = new Date(op.created_at);

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-neutral-100 last:border-0">
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${info.color} shrink-0`}>
        {info.label}
      </span>
      <span className="text-xs text-neutral-400 font-mono shrink-0">
        {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
      <a
        href={expertUrl(`tx/${op.transaction_hash}`)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-mono text-neutral-400 hover:text-primary-600 transition-colors truncate ml-auto"
        title={op.transaction_hash}
      >
        {op.transaction_hash.slice(0, 8)}…{op.transaction_hash.slice(-8)}
      </a>
    </div>
  );
}

function ActivityBar({ dailyCounts }: { dailyCounts: { date: string; count: number }[] }) {
  const max = Math.max(...dailyCounts.map(d => d.count), 1);
  // Show last 14 days
  const visible = dailyCounts.slice(-14);

  return (
    <div className="card-stella">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="label-section">Daily Transactions</span>
          <h3 className="text-base font-semibold text-neutral-800 mt-0.5">Last 14 Days</h3>
        </div>
        <BarChart2 className="w-5 h-5 text-neutral-300" />
      </div>
      <div className="flex items-end gap-1 h-24">
        {visible.map(day => {
          const height = max > 0 ? (day.count / max) * 100 : 0;
          const date = new Date(day.date + 'T00:00:00');
          const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1" title={`${label}: ${day.count} txs`}>
              <div className="w-full flex items-end justify-center" style={{ height: '80px' }}>
                <div
                  className="w-full bg-primary-400 rounded-t-sm hover:bg-primary-500 transition-colors"
                  style={{ height: `${Math.max(height, day.count > 0 ? 8 : 0)}%` }}
                />
              </div>
              {day.count > 0 && (
                <span className="text-[9px] text-neutral-400">{day.count}</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-neutral-300">{visible[0]?.date.slice(5)}</span>
        <span className="text-xs text-neutral-300">{visible[visible.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
}

// ─── Main Metrics Page ────────────────────────────────────────────

export default function Metrics() {
  const { logout } = useAdmin();
  const navigate = useNavigate();
  const [stats, setStats] = useState<SerializableStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadStats = useCallback(async (forceRefresh = false) => {
    setError('');
    if (forceRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const data = await fetchIndexerStats(forceRefresh);
      setStats(data);
    } catch (err) {
      setError('Failed to load metrics. Check network connection.');
      console.error('Metrics load error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStats(false);
  }, [loadStats]);

  const handleLogout = () => {
    logout();
    navigate('/admin', { replace: true });
  };

  const handleRefresh = () => {
    clearIndexerCache();
    loadStats(true);
  };

  const xlmLocked = stats?.totalXlmLocked ?? 0;
  const xlmReleased = stats?.totalXlmReleased ?? 0;
  const xlmInContract = Math.max(0, xlmLocked - xlmReleased);
  const lastUpdated = stats ? new Date(stats.lastUpdated) : null;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white border-b border-neutral-200 px-4 md:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-500" />
            <span className="font-semibold text-neutral-800">Stella Admin</span>
            <span className="hidden sm:inline text-neutral-400 text-sm">/ Metrics</span>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-400">
                <Clock className="w-3 h-3" />
                Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="btn-secondary h-9 px-3 text-sm"
              title="Force refresh from Horizon"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <a
              href={expertUrl(`contract/${CONTRACT_ID}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary h-9 px-3 text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Explorer</span>
            </a>
            <button onClick={handleLogout} className="btn-secondary h-9 px-3 text-sm">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">Metrics Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Live data from Stellar Testnet · Contract{' '}
            <a href={expertUrl(`contract/${CONTRACT_ID}`)} target="_blank" rel="noopener noreferrer"
               className="font-mono text-xs">
              {CONTRACT_ID.slice(0, 8)}…{CONTRACT_ID.slice(-8)}
            </a>
          </p>
        </div>

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 mb-6">
            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span className="text-sm text-red-700">{error}</span>
            <button onClick={() => loadStats(true)} className="ml-auto text-sm text-red-600 underline">Retry</button>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card-stella animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-neutral-200" />
                <div className="space-y-2">
                  <div className="h-3 w-16 bg-neutral-200 rounded" />
                  <div className="h-7 w-24 bg-neutral-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats grid */}
        {!isLoading && stats && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard
                label="Total Transactions"
                value={stats.totalTransactions.toLocaleString()}
                sub="All-time contract interactions"
                icon={Activity}
                accent
                href={expertUrl(`contract/${CONTRACT_ID}`)}
              />
              <StatCard
                label="Unique Wallets"
                value={stats.uniqueWallets.length.toLocaleString()}
                sub="Distinct participants"
                icon={Users}
              />
              <StatCard
                label="XLM Locked (Total)"
                value={`${xlmLocked.toLocaleString()} XLM`}
                sub="Cumulative escrow deposits"
                icon={DollarSign}
              />
              <StatCard
                label="XLM in Contract"
                value={`${xlmInContract.toLocaleString()} XLM`}
                sub={`${xlmReleased.toLocaleString()} XLM released`}
                icon={TrendingUp}
              />
            </div>

            {/* Charts + Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {/* Activity Bar Chart */}
              <ActivityBar dailyCounts={stats.dailyCounts} />

              {/* Summary Card */}
              <div className="card-stella">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="label-section">Contract Summary</span>
                    <h3 className="text-base font-semibold text-neutral-800 mt-0.5">Health Overview</h3>
                  </div>
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <div className="w-2 h-2 rounded-full bg-success" />
                      Contract Active
                    </div>
                    <span className="text-sm font-medium text-neutral-800">✓ Testnet</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <div className="w-2 h-2 rounded-full bg-primary-400" />
                      SDK Version
                    </div>
                    <span className="text-sm font-medium text-neutral-800">Soroban v22</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <div className="w-2 h-2 rounded-full bg-accent-500" />
                      XLM Utilization
                    </div>
                    <span className="text-sm font-medium text-neutral-800">
                      {xlmLocked > 0
                        ? `${((xlmReleased / xlmLocked) * 100).toFixed(1)}% released`
                        : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <Zap className="w-3.5 h-3.5 text-primary-500" />
                      Fee Sponsorship
                    </div>
                    <span className="text-sm font-medium text-primary-600">Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card-stella">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="label-section">Recent Activity</span>
                  <h3 className="text-base font-semibold text-neutral-800 mt-0.5">Last 20 Transactions</h3>
                </div>
                <AlertTriangle className="w-4 h-4 text-neutral-300" />
              </div>
              {stats.recentOperations.length === 0 ? (
                <p className="text-sm text-neutral-400 py-4 text-center">No transactions recorded yet.</p>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {stats.recentOperations.map(op => (
                    <ActivityRow key={op.id} op={op} />
                  ))}
                </div>
              )}
            </div>

            {/* Wallet List (collapsible — admin use) */}
            {stats.uniqueWallets.length > 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-neutral-400 hover:text-neutral-600 transition-colors select-none">
                  Show all {stats.uniqueWallets.length} unique wallets
                </summary>
                <div className="mt-3 card-stella">
                  <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
                    {stats.uniqueWallets.map((wallet, i) => (
                      <a
                        key={wallet}
                        href={expertUrl(`account/${wallet}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs font-mono text-neutral-500 hover:text-primary-600 transition-colors py-1"
                      >
                        <span className="text-neutral-300 w-4 shrink-0">{i + 1}.</span>
                        {wallet}
                        <ExternalLink className="w-3 h-3 ml-auto shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              </details>
            )}
          </>
        )}
      </main>
    </div>
  );
}
