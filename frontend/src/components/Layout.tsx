import React from 'react';
import { 
  LogOut,
  ArrowLeft,
  Menu,
  X
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
  const { address } = useStellar();
  const { role, reset } = useOnboarding();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const truncatedAddress = address ? `${address.slice(0, 4)}...${address.slice(-4)}` : null;

  const handleSwitchRole = () => {
    reset();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  // ── Pre-onboarding: Landing Page (Full bleed) ──
  if (location.pathname === '/') {
    return (
      <div className="antialiased text-neutral-600 bg-neutral-50 min-h-screen">
        <header className="absolute top-0 left-0 right-0 z-50 h-20 flex items-center justify-between px-6 lg:px-12">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <img src="/S.svg" className="w-8 h-8" alt="Stella" />
            <span className="text-xl font-bold tracking-tight text-neutral-900">Stella</span>
          </Link>
          <div className="flex items-center gap-4">
            <a href="#cta-section" onClick={(e) => { e.preventDefault(); document.getElementById('cta-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-sm font-semibold text-neutral-600 hover:text-primary-600 transition-colors">
              Sign Up
            </a>
          </div>
        </header>
        <main>
          {children}
        </main>
      </div>
    );
  }

  // ── Pre-onboarding: Onboarding Flow (Minimal chrome) ──
  if (location.pathname === '/onboarding') {
    return (
      <div className="min-h-screen bg-neutral-50 antialiased text-neutral-600">
        <header className="h-16 flex items-center justify-center px-5">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <img src="/S.svg" className="w-6 h-6" alt="Stella" />
            <span className="text-lg font-bold tracking-tight text-neutral-900">Stella</span>
          </Link>
        </header>
        <main className="px-4 pb-12">
          {children}
        </main>
      </div>
    );
  }

  // ── Post-onboarding: Workspace chrome ──
  return (
    <div className="flex h-screen bg-neutral-50 antialiased text-neutral-600 overflow-hidden">
      {/* Sidebar — Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-neutral-200 p-5 z-50">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 px-2 mb-8 no-underline">
          <img src="/S.svg" className="w-6 h-6" alt="Stella" />
          <span className="text-lg font-bold tracking-tight text-neutral-900">Stella</span>
        </Link>

        {/* Role badge */}
        <div className="px-3 py-2 bg-primary-50 rounded-xl mb-6">
          <p className="text-xs font-bold text-primary-600 uppercase tracking-wider">
            {role === 'employer' ? '👥 Employer Mode' : '✓ Candidate Mode'}
          </p>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Sidebar footer */}
        <div className="flex flex-col gap-3 pt-4 border-t border-neutral-100">
          {/* Network */}
          <div className="flex items-center gap-2 px-2">
            <span className="w-2 h-2 rounded-full bg-success shrink-0" />
            <span className="text-xs font-semibold text-neutral-400">Stellar Testnet</span>
          </div>

          {/* Connected wallet */}
          {truncatedAddress && (
            <div className="px-2">
              <p className="text-xs text-neutral-400 mb-0.5">Connected</p>
              <p className="text-sm font-mono font-semibold text-neutral-700">{truncatedAddress}</p>
            </div>
          )}

          {/* Switch role */}
          <button
            onClick={handleSwitchRole}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Switch Role
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-5 z-40 shrink-0">
          {/* Mobile: logo + role */}
          <div className="lg:hidden flex items-center gap-2">
            <img src="/S.svg" className="w-6 h-6" alt="Stella" />
            <span className="text-sm font-bold tracking-tight text-neutral-900">Stella</span>
            <span className="text-xs font-semibold text-primary-500 ml-1">
              {role === 'employer' ? 'Employer' : 'Candidate'}
            </span>
          </div>

          {/* Desktop: network + wallet */}
          <div className="hidden lg:flex items-center gap-2 text-neutral-400">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            <span className="text-xs font-semibold">Stellar Testnet</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Desktop: wallet address */}
            {truncatedAddress && (
              <span className="hidden lg:inline text-xs font-mono text-neutral-500 bg-neutral-50 px-3 py-1.5 rounded-lg">
                {truncatedAddress}
              </span>
            )}

            {/* Mobile menu trigger */}
            <button
              className="lg:hidden p-2 -mr-2 text-neutral-700 hover:bg-neutral-50 rounded-lg"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
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
            <div className="px-3 py-2 bg-primary-50 rounded-xl mb-6">
              <p className="text-xs font-bold text-primary-600 uppercase tracking-wider">
                {role === 'employer' ? '👥 Employer Mode' : '✓ Candidate Mode'}
              </p>
            </div>

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
