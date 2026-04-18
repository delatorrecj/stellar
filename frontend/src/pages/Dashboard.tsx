import React, { useRef } from 'react';
import { Users, UserCheck, Star, ArrowRight, ShieldCheck, Banknote, Briefcase, ChevronRight, Lock, Target, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../hooks/useOnboarding';
import { useStellar } from '../hooks/useStellar';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { setRole, role } = useOnboarding();
  const { address } = useStellar();
  const ctaRef = useRef<HTMLDivElement>(null);

  const handleRoleSelect = (selectedRole: 'employer' | 'candidate') => {
    setRole(selectedRole);
    if (address) {
      navigate(`/${selectedRole}`);
    } else {
      navigate('/onboarding');
    }
  };

  // If already onboarded + connected, redirect to workspace
  React.useEffect(() => {
    if (role && address) {
      navigate(`/${role}`);
    }
  }, [role, address, navigate]);

  const scrollToCTA = () => {
    ctaRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="w-full bg-neutral-50 min-h-screen">
      {/* 
        ========================================
        1. HERO SECTION
        ========================================
      */}
      <section className="relative px-6 py-20 lg:py-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-100/40 rounded-full blur-3xl -z-10 animate-pulse pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent-100/30 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center mt-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-sm font-semibold mb-6 border border-primary-100 shadow-sm">
            <img src="/S.svg" className="w-4 h-4" alt="Stella" />
            <span>Built on Soroban Smart Contracts</span>
          </div>
          
          <h1 className="font-display text-5xl lg:text-7xl font-extrabold text-neutral-900 leading-[1.1] tracking-tight mb-8">
            The end of the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-600">Day Zero</span> poverty trap.
          </h1>
          
          <p className="text-lg lg:text-xl text-neutral-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            A programmable pre-employment escrow protecting employers from candidate drop-off, while giving graduates the liquidity they need for Day 1.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={scrollToCTA}
              className="btn-primary flex items-center justify-center gap-2 px-8 py-3.5 text-base w-full sm:w-auto"
            >
              Get Started
              <ChevronRight className="w-5 h-5" />
            </button>
            <a 
              href="https://stellar.org" 
              target="_blank" 
              rel="noreferrer"
              className="btn-secondary flex items-center justify-center gap-2 px-8 py-3.5 text-base w-full sm:w-auto border-neutral-200"
            >
              Learn about Stellar
            </a>
          </div>
        </div>
      </section>

      {/* 
        ========================================
        2. THE PROBLEM SECTION
        ========================================
      */}
      <section className="px-6 py-20 bg-white border-y border-neutral-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl lg:text-4xl font-extrabold text-neutral-900 mb-4">
              The hiring gap is broken.
            </h2>
            <p className="text-neutral-500 max-w-2xl mx-auto">
              Fresh graduates want to work, but pre-employment costs (medical, clearances, transport) create an insurmountable blocker.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-neutral-50 border border-neutral-100">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-bold text-neutral-900 mb-3">The Candidate Crisis</h3>
              <p className="text-neutral-600 text-sm leading-relaxed mb-6">
                Fresh graduates in the Philippines accept job offers and then ghost before Day 1 — not from disinterest, but from a liquidity crisis. Pre-employment requirements can cost ₱3,000–₱5,000.
              </p>
              <ul className="space-y-3">
                <li className="flex gap-2 text-sm text-neutral-500 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2" /> No savings to pay for Medical / NBI
                </li>
                <li className="flex gap-2 text-sm text-neutral-500 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2" /> Predatory loans add extreme stress
                </li>
              </ul>
            </div>

            <div className="p-8 rounded-3xl bg-neutral-50 border border-neutral-100">
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-bold text-neutral-900 mb-3">The Employer Burn</h3>
              <p className="text-neutral-600 text-sm leading-relaxed mb-6">
                Employers spend thousands sourcing a candidate, only to lose them at the finish line over a ₱500 exam. In the BPO sector, this drop-off rate costs millions of pesos annually.
              </p>
              <ul className="space-y-3">
                <li className="flex gap-2 text-sm text-neutral-500 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2" /> Unsecured cash advances are often stolen
                </li>
                <li className="flex gap-2 text-sm text-neutral-500 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2" /> Wasted recruitment time & onboarding delays
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 
        ========================================
        3. THE SOLUTION / VALUE PROPOSITION
        ========================================
      */}
      <section className="px-6 py-24 bg-neutral-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-600/10 rounded-full blur-[100px] pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
        
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            <div>
              <h2 className="font-display text-3xl lg:text-4xl font-extrabold mb-6">
                Programmable trust. <br/>
                <span className="text-accent-400">Zero intermediaries.</span>
              </h2>
              <p className="text-neutral-400 text-lg leading-relaxed mb-8">
                Stella uses a milestone-based escrow. Employers lock funds into a Soroban smart contract. 
                Funds release in stages as the candidate completes verified milestones. 
                If the candidate ghosts, the employer claws back the remaining funds instantly.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center border border-primary-500/30">
                    <Lock className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Fund Protection</h4>
                    <p className="text-neutral-400 text-sm">Escrow ensures money is only spent when candidates complete milestones.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent-500/20 flex items-center justify-center border border-accent-500/30">
                    <Target className="w-5 h-5 text-accent-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Guaranteed Liquidity</h4>
                    <p className="text-neutral-400 text-sm">Candidates receive exact amounts needed to clear their pre-employment hurdles.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Abstract representation of the flow */}
            <div className="bg-neutral-800/50 border border-neutral-700 rounded-3xl p-6 lg:p-8 relative">
              <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 to-transparent rounded-3xl" />
              
              <div className="relative z-10 flex flex-col gap-4">
                <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-4 flex items-center justify-between shadow-2xl">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-primary-400" />
                    <div>
                      <div className="text-xs text-neutral-400 font-semibold mb-0.5">Employer Locks</div>
                      <div className="font-mono text-sm tracking-widest text-white">500.00 XLM</div>
                    </div>
                  </div>
                  <Lock className="w-4 h-4 text-neutral-500" />
                </div>
                
                <div className="flex justify-center -my-2 z-20">
                  <div className="w-0.5 h-8 bg-neutral-700/50 rounded-full" />
                </div>

                <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-4 flex items-center justify-between shadow-2xl ml-8">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-accent-400" />
                    <div>
                      <div className="text-xs text-neutral-400 font-semibold mb-0.5">Milestone 1: Medical Exam</div>
                      <div className="font-mono text-sm tracking-widest text-white">100.00 XLM</div>
                    </div>
                  </div>
                  <div className="text-xs font-bold px-2 py-1 bg-green-500/20 text-green-400 rounded-md">UNLOCKED</div>
                </div>

                <div className="flex justify-center -my-2 z-20">
                  <div className="w-0.5 h-8 bg-neutral-700/50 rounded-full" />
                </div>

                <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-4 flex items-center justify-between shadow-2xl ml-8 opacity-50 grayscale">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-neutral-400" />
                    <div>
                      <div className="text-xs text-neutral-400 font-semibold mb-0.5">Milestone 2: NBI Clearance</div>
                      <div className="font-mono text-sm tracking-widest text-white">150.00 XLM</div>
                    </div>
                  </div>
                  <div className="text-xs font-bold px-2 py-1 bg-neutral-800 text-neutral-500 rounded-md">LOCKED</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 
        ========================================
        4. CTA / ONBOARDING INTEGRATION
        ========================================
      */}
      <section ref={ctaRef} className="px-6 py-24 bg-primary-50 relative overflow-hidden">
        {/* Subtle pattern background - using dots directly in css */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#1e1e1e 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-extrabold text-neutral-900 mb-4">
              Enter the dApp
            </h2>
            <p className="text-neutral-500 font-semibold">
              Select your role below to begin. Stella requires the Freighter wallet extension.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-12">
            <button
              onClick={() => handleRoleSelect('employer')}
              className="group card-stella p-8 text-left cursor-pointer hover:shadow-xl hover:border-primary-300 transition-all duration-300 transform hover:-translate-y-1 bg-white"
            >
              <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary-500 group-hover:shadow-[0_0_20px_rgba(26,101,224,0.3)] transition-all duration-300">
                <Users className="w-7 h-7 text-primary-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="font-display text-xl font-bold text-neutral-900 mb-2">I'm hiring someone</h3>
              <p className="text-sm text-neutral-600 leading-relaxed mb-6">
                Lock onboarding funds for your new hire securely on-chain. Prevent drop-offs and recover unused funds.
              </p>
              <span className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 group-hover:gap-3 transition-all duration-300">
                Launch Employer Portal <ArrowRight className="w-4 h-4" />
              </span>
            </button>

            <button
              onClick={() => handleRoleSelect('candidate')}
              className="group card-stella p-8 text-left cursor-pointer hover:shadow-xl hover:border-accent-300 transition-all duration-300 transform hover:-translate-y-1 bg-white"
            >
              <div className="w-14 h-14 bg-accent-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-accent-500 group-hover:shadow-[0_0_20px_rgba(230,173,26,0.3)] transition-all duration-300">
                <UserCheck className="w-7 h-7 text-accent-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="font-display text-xl font-bold text-neutral-900 mb-2">I'm starting a new job</h3>
              <p className="text-sm text-neutral-600 leading-relaxed mb-6">
                See the funds your employer locked for you. Submit proof of completion and claim your milestone payments.
              </p>
              <span className="flex items-center gap-1.5 text-sm font-semibold text-accent-600 group-hover:gap-3 transition-all duration-300">
                Launch Candidate Portal <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 text-center bg-white border-t border-neutral-100">
        <p className="text-sm font-semibold text-neutral-400 flex items-center justify-center gap-2">
          <img src="/S.svg" className="w-4 h-4 opacity-50 grayscale" alt="Stella" /> 
          Stella Escrow Protocol • Built for the Stellar Bootcamp
        </p>
      </footer>
    </div>
  );
};
