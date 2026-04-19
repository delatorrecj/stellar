import React from 'react';
import { 
  LogOut,
  ArrowLeft,
  Menu,
  X,
  Gavel,
  RefreshCw
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStellar } from '../hooks/useStellar';
import { useOnboarding } from '../hooks/useOnboarding';

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Layout — Conditional chrome based on onboarding state
 * 
 * Pre-onboarding (/, /onboarding): Minimal — just logo
 * Post-onboarding (employer/candidate): Role workspace with wallet + role switch
 */
export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
    const { address, balance, isSyncing, refreshBalance, connect } = useStellar();
  const { role, reset } = useOnboarding();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const truncatedAddress = address ? `${address.slice(0, 4)}...${address.slice(-4)}` : null;
  const formattedBalance = balance ? `${Number(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XLM` : '0.00 XLM';

  const handleSwitchRole = () => {
    reset();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const handleReconnect = async () => {
    await connect();
    await refreshBalance();
  };

  // ── Workspace chrome ──
  return (
    <div className="flex h-screen bg-neutral-100 antialiased text-neutral-600 overflow-hidden">
      {/* Sidebar — Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-neutral-200 p-6 z-50">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mb-10 no-underline">
          <img src="/S.svg" className="w-7 h-7" alt="Stella" />
          <span className="text-xl font-bold tracking-tight text-neutral-900">Stella</span>
        </Link>

        {/* Balance Card (Premium) */}
        <div className="mb-8 p-4 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl shadow-lg shadow-neutral-200 relative overflow-hidden">
          {isSyncing && (
            <div className="absolute top-0 right-0 p-2">
              <RefreshCw size={12} className="text-primary-400 animate-spin" />
            </div>
          )}
          <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 mb-1">Available Balance</p>
          <p className="text-2xl font-bold text-white tracking-tight leading-none mb-1">
            {formattedBalance.split(' ')[0]}
            <span className="text-sm ml-1 text-neutral-400 font-medium">XLM</span>
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-amber-400' : 'bg-success animate-pulse'}`} />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isSyncing ? 'text-amber-400' : 'text-success'}`}>
              {isSyncing ? 'Syncing...' : 'Live Wallet'}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div className="space-y-6 flex-1">
          <div>
            <p className="px-3 text-[10px] uppercase tracking-widest font-bold text-neutral-400 mb-3">Workspace</p>
            <nav className="flex flex-col gap-1.5">
              <Link
                to={`/${role}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                  location.pathname === `/${role}`
                  ? 'bg-primary-50 text-primary-700 border-primary-100'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 border-transparent'
                }`}
              >
                <span className="text-sm font-bold truncate">
                  {role === 'employer' ? '👥 Employer Mode' : '✓ Candidate Mode'}
                </span>
              </Link>
              <Link
                to="/arbitrator"
                className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${
                  location.pathname === '/arbitrator' 
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                <Gavel size={18} />
                Arbitration Center
              </Link>
            </nav>
          </div>
        </div>

        {/* Sidebar footer */}
        <div className="pt-6 border-t border-neutral-100 space-y-4">
          {/* Connected wallet */}
          {truncatedAddress && (
            <div className="px-4 py-3 bg-neutral-50 rounded-xl border border-neutral-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 mb-1">Account</p>
                <p className="text-sm font-mono font-bold text-neutral-700">{truncatedAddress}</p>
              </div>
              <button 
                onClick={handleReconnect}
                className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-white rounded-lg transition-all"
                title="Refresh Wallet Sync"
              >
                <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
              </button>
            </div>
          )}

          {/* Network indicator */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success" />
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-tighter">Stellar Testnet</span>
            </div>
          </div>

          <button
            onClick={handleSwitchRole}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-neutral-500 hover:text-error hover:bg-error/5 rounded-xl transition-all border border-transparent hover:border-error/10"
          >
            <LogOut className="w-4 h-4" />
            Exit Workspace
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6 lg:px-8 z-40 shrink-0">
          {/* Mobile: logo + role */}
          <div className="lg:hidden flex items-center gap-3">
            <img src="/S.svg" className="w-6 h-6" alt="Stella" />
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-neutral-900 leading-none">Stella</span>
              <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wider">
                {role === 'employer' ? 'Employer' : 'Candidate'}
              </span>
            </div>
          </div>

          {/* Desktop Heading (Active Tab Name) */}
          <div className="hidden lg:block">
            <h1 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
              Dashboard / <span className="text-neutral-900">{location.pathname === '/' ? 'Home' : location.pathname.slice(1).charAt(0).toUpperCase() + location.pathname.slice(2)}</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Header Balance (Desktop) */}
            {address && (
              <div className="hidden sm:flex items-center gap-2 bg-neutral-50 px-3 py-1.5 rounded-full border border-neutral-100">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                <span className="text-xs font-bold text-neutral-700">{formattedBalance}</span>
              </div>
            )}

            {/* Mobile menu trigger */}
            <button
              className="lg:hidden p-2 -mr-2 text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 lg:p-8 pb-20">
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-neutral-900/50 z-[100] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-72 bg-white p-6 flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <img src="/S.svg" className="w-6 h-6" alt="Stella" />
                <span className="font-bold text-lg tracking-tight text-neutral-900">Stella</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu">
                <X size={20} className="text-neutral-700" />
              </button>
            </div>

            {/* Role badge */}
            <Link 
              to={`/${role}`}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-3 rounded-xl mb-6 border transition-all ${
                location.pathname === `/${role}`
                ? 'bg-primary-50 border-primary-100 text-primary-700'
                : 'bg-neutral-50 border-neutral-100 text-neutral-500'
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-wider">
                {role === 'employer' ? '👥 Employer Mode' : '✓ Candidate Mode'}
              </p>
            </Link>

            <nav className="mb-6">
              <Link
                to="/arbitrator"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 text-sm font-bold text-indigo-600 bg-indigo-50 rounded-xl"
              >
                <Gavel size={18} />
                Arbitration Center
              </Link>
            </nav>

            <div className="flex-1" />

            {/* Footer */}
            <div className="pt-4 border-t border-neutral-100 flex flex-col gap-3">
              {truncatedAddress && (
                <div>
                  <p className="text-xs text-neutral-400 mb-0.5">Connected</p>
                  <p className="text-sm font-mono font-semibold text-neutral-700">{truncatedAddress}</p>
                </div>
              )}
              <button
                onClick={handleSwitchRole}
                className="flex items-center gap-2 text-sm font-semibold text-neutral-400 hover:text-error transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Switch Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
