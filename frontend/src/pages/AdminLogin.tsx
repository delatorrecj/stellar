import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin';
import { Shield, Eye, EyeOff, Lock, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAdmin();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Small delay to prevent brute-force and give feedback feel
    await new Promise(r => setTimeout(r, 600));

    const success = login(password);
    if (success) {
      navigate('/admin/metrics', { replace: true });
    } else {
      setError('Invalid credentials. Access denied.');
      setPassword('');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #1A65E0 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="w-full max-w-sm relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500 mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 font-display">Admin Access</h1>
          <p className="text-sm text-neutral-500 mt-1">Stella Metrics Dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Password field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="label-section">
                Admin Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter admin password"
                  className="input-field pl-10 pr-10"
                  autoComplete="current-password"
                  autoFocus
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!password || isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Verifying…
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Access Dashboard
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-neutral-400 mt-6">
          This page is not indexed. Access is restricted.
        </p>
      </div>
    </div>
  );
}
