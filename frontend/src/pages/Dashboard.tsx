import React, { useRef } from 'react';
import { Users, UserCheck, Star, ArrowRight, ShieldCheck, Briefcase, ChevronRight, Lock, Target, AlertTriangle } from 'lucide-react';
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
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary-100/40 rounded-full blur-[100px] -z-10 animate-float pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-accent-100/30 rounded-full blur-[100px] -z-10 animate-float-delayed pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center mt-8 glass-panel p-8 lg:p-16 rounded-[3rem] relative overflow-hidden">
          {/* Faint dot pattern inside glass */}
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#1e1e1e 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md text-primary-700 text-sm font-semibold mb-8 border border-primary-200/50 shadow-sm">
              <img src="/S.svg" className="w-4 h-4" alt="Stella" />
              <span>Built on Soroban Smart Contracts</span>
            </div>
            
            <h1 className="font-display text-5xl lg:text-7xl font-extrabold text-neutral-900 leading-[1.05] tracking-tight mb-8">
              The end of the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-600">Day Zero</span> poverty trap.
            </h1>
            
            <p className="text-lg lg:text-xl text-neutral-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              A programmable pre-employment escrow protecting employers from candidate drop-off, while giving graduates the liquidity they need for Day 1.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              <button 
                onClick={scrollToCTA}
                className="btn-primary w-full sm:w-auto hover:shadow-[0_0_20px_rgba(26,101,224,0.35)] hover:-translate-y-0.5"
              >
                Get Started
                <ChevronRight className="w-5 h-5" />
              </button>
              <a 
                href="https://stellar.org" 
                target="_blank" 
                rel="noreferrer"
                className="btn-secondary w-full sm:w-auto bg-white/60 hover:bg-white border-white hover:border-neutral-200 shadow-sm hover:-translate-y-0.5"
              >
                Learn about Stellar
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 
        ========================================
        HERO QR CODE BANNER 
        ========================================
      */}
      <section className="px-6 pb-24 bg-neutral-50 relative z-20 -mt-10 lg:-mt-16">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-6">
          <div className="glass-panel p-4 rounded-3xl flex items-center gap-6 hover:-translate-y-1 hover:shadow-lg hover:border-white transition-all duration-300 w-full sm:w-auto hover:scale-[1.02]">
            <div className="flex flex-col gap-1.5 items-end text-right pl-2">
              <span className="text-[10px] font-bold text-accent-600 uppercase tracking-widest bg-accent-50 px-2 py-0.5 rounded-full inline-block w-fit ml-auto">Live dApp</span>
              <span className="font-display font-bold text-neutral-900 text-lg">Scan to Launch</span>
            </div>
            <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-neutral-100/50">
              <img src="/qr-stella.svg" alt="Stella dApp QR" className="w-20 h-20" />
            </div>
          </div>
          
          <div className="glass-panel p-4 rounded-3xl flex items-center gap-6 hover:-translate-y-1 hover:shadow-lg hover:border-white transition-all duration-300 w-full sm:w-auto hover:scale-[1.02]">
            <div className="flex flex-col gap-1.5 items-end text-right pl-2">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest bg-neutral-100 px-2 py-0.5 rounded-full inline-block w-fit ml-auto">Open Source</span>
              <span className="font-display font-bold text-neutral-900 text-lg">View on GitHub</span>
            </div>
            <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-neutral-100/50">
              <img src="/qr-github.svg" alt="GitHub Repo QR" className="w-20 h-20" />
            </div>
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
            <div className="p-8 rounded-3xl bg-white border border-neutral-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-red-100 transition-all duration-300 group">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
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

            <div className="p-8 rounded-3xl bg-white border border-neutral-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-orange-100 transition-all duration-300 group">
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
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
            <div className="glass-panel-dark border border-neutral-700 rounded-3xl p-6 lg:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/10 rounded-full blur-[80px]" />
              
              <div className="relative z-10 flex flex-col gap-4">
                <div className="bg-neutral-900 glow-border rounded-2xl p-4 flex items-center justify-between shadow-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex flex-shrink-0 items-center justify-center border border-primary-500/30">
                      <Users className="w-5 h-5 text-primary-400" />
                    </div>
                    <div>
                      <div className="text-xs text-neutral-400 font-semibold mb-0.5">Employer Locks</div>
                      <div className="font-mono text-sm tracking-widest text-white">500.00 XLM</div>
                    </div>
                  </div>
                  <Lock className="w-4 h-4 text-primary-400 opacity-60" />
                </div>
                
                <div className="flex justify-center -my-3 z-20">
                  <div className="w-0.5 h-10 bg-gradient-to-b from-primary-500/80 to-accent-500/80 rounded-full animate-pulse shadow-[0_0_8px_rgba(26,101,224,0.8)]" />
                </div>

                <div className="bg-neutral-900 glow-border rounded-2xl p-4 flex items-center justify-between shadow-2xl ml-8 relative overflow-hidden">
                  <div className="absolute inset-0 bg-green-500/5 animate-pulse-slow" />
                  <div className="relative flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-500/20 flex flex-shrink-0 items-center justify-center border border-accent-500/30">
                      <ShieldCheck className="w-5 h-5 text-accent-400" />
                    </div>
                    <div>
                      <div className="text-xs text-neutral-400 font-semibold mb-0.5">Milestone 1: Medical Exam</div>
                      <div className="font-mono text-sm tracking-widest text-white">100.00 XLM</div>
                    </div>
                  </div>
                  <div className="relative text-[10px] font-bold px-2 py-1 bg-green-500 text-neutral-900 rounded-md shadow-[0_0_10px_rgba(16,185,129,0.3)]">UNLOCKED</div>
                </div>

                <div className="flex justify-center -my-3 z-20 ml-8">
                  <div className="w-0.5 h-10 bg-neutral-700 rounded-full" />
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between shadow-2xl ml-16 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-800 flex flex-shrink-0 items-center justify-center border border-neutral-700">
                      <ShieldCheck className="w-5 h-5 text-neutral-500" />
                    </div>
                    <div>
                      <div className="text-xs text-neutral-500 font-semibold mb-0.5">Milestone 2: NBI Clearance</div>
                      <div className="font-mono text-sm tracking-widest text-white">150.00 XLM</div>
                    </div>
                  </div>
                  <div className="text-[10px] font-bold px-2 py-1 bg-neutral-800 text-neutral-500 rounded-md">LOCKED</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 
        ========================================
        4. BOOTCAMP PITCH (ORGANIZER REQUIREMENTS)
        ========================================
      */}
      <section className="px-6 py-24 bg-white border-b border-neutral-100">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <h2 className="font-display text-3xl font-extrabold text-neutral-900 mb-4 flex items-center gap-2">
              <Star className="w-6 h-6 text-accent-500" />
              Project Stella: The Pitch
            </h2>
            <p className="text-neutral-500 font-medium">
              Stellar UniTour Bootcamp Submission Details
            </p>
          </div>

          <div className="space-y-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <h3 className="text-xs font-bold tracking-widest text-primary-600 uppercase mb-2 group-hover:text-primary-500 transition-colors">Problem (1 Sentence)</h3>
              <p className="text-neutral-700 leading-relaxed text-sm lg:text-base">
                Fresh graduates in the Philippines looking for BPO jobs accept job offers and then ghost before Day 1 because they lack the ₱3,000–₱5,000 needed for mandatory pre-employment requirements (medical exams, NBI clearance), costing employers thousands in wasted recruitment time and empty seats.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <h3 className="text-xs font-bold tracking-widest text-primary-600 uppercase mb-2 group-hover:text-primary-500 transition-colors">Solution (1 Sentence)</h3>
              <p className="text-neutral-700 leading-relaxed text-sm lg:text-base">
                Stella bridges this gap with a programmable escrow where employers lock onboarding funds into a Soroban smart contract, releasing partial payouts precisely as the candidate completes each verified milestone, ensuring zero-trust liquidity for graduates while protecting the employer's capital from advance-theft.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <h3 className="text-xs font-bold tracking-widest text-primary-600 uppercase mb-2 group-hover:text-primary-500 transition-colors">Core Feature (MVP)</h3>
                <p className="text-neutral-700 leading-relaxed text-sm">
                  An employer initiates an escrow locking 500 XLM into the Soroban contract. The candidate triggers <code>unlock_milestone</code> to securely receive exactly 100 XLM for their first requirement, instantly transferring the requested liquidity directly to their wallet.
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <h3 className="text-xs font-bold tracking-widest text-primary-600 uppercase mb-2 group-hover:text-primary-500 transition-colors">Why This Wins</h3>
                <p className="text-neutral-700 leading-relaxed text-sm">
                  It directly targets a massive, hyper-local friction point in the Philippine job market (BPO recruitment costs and Day Zero poverty). The solution forces real money movement through conditionally programmable trust, perfectly exemplifying Soroban’s superiority over unsecured cash advances.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-neutral-50/80 backdrop-blur-sm hover:bg-primary-50/50 hover:border-primary-100 transition-all duration-300 rounded-xl p-4 border border-neutral-100">
                <div className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase mb-1">Region</div>
                <div className="font-semibold text-neutral-800 text-sm">SEA (Philippines)</div>
              </div>
              <div className="bg-neutral-50/80 backdrop-blur-sm hover:bg-primary-50/50 hover:border-primary-100 transition-all duration-300 rounded-xl p-4 border border-neutral-100">
                <div className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase mb-1">Theme</div>
                <div className="font-semibold text-neutral-800 text-sm">Escrow for Contracts</div>
              </div>
              <div className="bg-neutral-50/80 backdrop-blur-sm hover:bg-primary-50/50 hover:border-primary-100 transition-all duration-300 rounded-xl p-4 border border-neutral-100">
                <div className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase mb-1">Target Users</div>
                <div className="font-semibold text-neutral-800 text-sm">SMEs / Underbanked</div>
              </div>
              <div className="bg-neutral-50/80 backdrop-blur-sm hover:bg-primary-50/50 hover:border-primary-100 transition-all duration-300 rounded-xl p-4 border border-neutral-100">
                <div className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase mb-1">Features</div>
                <div className="font-semibold text-neutral-800 text-sm">Soroban & XLM</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 
        ========================================
        5. CTA / ONBOARDING INTEGRATION
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-12 relative z-10">
            <button
              onClick={() => handleRoleSelect('employer')}
              className="group bg-white/80 backdrop-blur-md border border-neutral-100 shadow-lg p-8 text-left cursor-pointer hover:shadow-2xl hover:border-primary-200 hover:bg-white transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden rounded-3xl"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-[40px] group-hover:bg-primary-500/10 transition-colors" />
              <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary-500 group-hover:shadow-[0_0_20px_rgba(26,101,224,0.3)] transition-all duration-300 relative z-10 group-hover:scale-110">
                <Users className="w-7 h-7 text-primary-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="font-display text-xl font-bold text-neutral-900 mb-2 relative z-10">I'm hiring someone</h3>
              <p className="text-sm text-neutral-600 leading-relaxed mb-6 relative z-10">
                Lock onboarding funds for your new hire securely on-chain. Prevent drop-offs and recover unused funds.
              </p>
              <span className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 group-hover:gap-3 transition-all duration-300 relative z-10">
                Launch Employer Portal <ArrowRight className="w-4 h-4" />
              </span>
            </button>

            <button
              onClick={() => handleRoleSelect('candidate')}
              className="group bg-white/80 backdrop-blur-md border border-neutral-100 shadow-lg p-8 text-left cursor-pointer hover:shadow-2xl hover:border-accent-200 hover:bg-white transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden rounded-3xl"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/5 rounded-full blur-[40px] group-hover:bg-accent-500/10 transition-colors" />
              <div className="w-14 h-14 bg-accent-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-accent-500 group-hover:shadow-[0_0_20px_rgba(230,173,26,0.3)] transition-all duration-300 relative z-10 group-hover:scale-110">
                <UserCheck className="w-7 h-7 text-accent-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="font-display text-xl font-bold text-neutral-900 mb-2 relative z-10">I'm starting a new job</h3>
              <p className="text-sm text-neutral-600 leading-relaxed mb-6 relative z-10">
                See the funds your employer locked for you. Submit proof of completion and claim your milestone payments.
              </p>
              <span className="flex items-center gap-1.5 text-sm font-semibold text-accent-600 group-hover:gap-3 transition-all duration-300 relative z-10">
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
