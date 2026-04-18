import React from 'react';
import { Users, UserCheck, Star, ArrowRight, ShieldCheck, Repeat, Banknote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../hooks/useOnboarding';
import { useStellar } from '../hooks/useStellar';

/**
 * Dashboard / Landing — Role selection page
 * 
 * UX principle: Ask the user ONE question — "What brings you here?"
 * No wallet, no stats, no noise. Just two clear paths.
 */
export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { setRole, role } = useOnboarding();
  const { address } = useStellar();

  const handleRoleSelect = (selectedRole: 'employer' | 'candidate') => {
    setRole(selectedRole);
    // If wallet already connected, go straight to workspace
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

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      {/* Logo + Tagline */}
      <div className="flex items-center gap-2 mb-3">
        <Star className="w-6 h-6 text-accent-500 fill-accent-500" />
        <span className="text-2xl font-extrabold tracking-tight text-neutral-900">Stella</span>
      </div>
      <p className="text-sm text-neutral-400 font-semibold mb-12">
        Secure onboarding funds on Stellar
      </p>

      {/* The ONE question */}
      <h1 className="text-2xl lg:text-3xl font-extrabold text-neutral-900 tracking-tight text-center mb-10">
        What brings you here?
      </h1>

      {/* Two role cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl mb-12">
        <button
          onClick={() => handleRoleSelect('employer')}
          className="group card-stella p-6 text-left cursor-pointer hover:shadow-lg hover:border-primary-300 transition-all duration-150"
        >
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-500 transition-colors duration-150">
            <Users className="w-5 h-5 text-primary-600 group-hover:text-white transition-colors duration-150" />
          </div>
          <h2 className="text-base font-bold text-neutral-900 mb-1.5">I'm hiring someone</h2>
          <p className="text-sm text-neutral-500 leading-relaxed mb-4">
            Lock onboarding funds for your new hire. You stay in control.
          </p>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 group-hover:gap-3 transition-all duration-150">
            Get started <ArrowRight className="w-4 h-4" />
          </span>
        </button>

        <button
          onClick={() => handleRoleSelect('candidate')}
          className="group card-stella p-6 text-left cursor-pointer hover:shadow-lg hover:border-accent-300 transition-all duration-150"
        >
          <div className="w-10 h-10 bg-accent-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-accent-500 transition-colors duration-150">
            <UserCheck className="w-5 h-5 text-accent-600 group-hover:text-white transition-colors duration-150" />
          </div>
          <h2 className="text-base font-bold text-neutral-900 mb-1.5">I'm starting a new job</h2>
          <p className="text-sm text-neutral-500 leading-relaxed mb-4">
            See and claim the funds your employer locked for you.
          </p>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-accent-600 group-hover:gap-3 transition-all duration-150">
            Get started <ArrowRight className="w-4 h-4" />
          </span>
        </button>
      </div>

      {/* How it works — compact */}
      <div className="w-full max-w-xl">
        <div className="flex items-center gap-6 justify-center text-neutral-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-semibold">Funds locked on-chain</span>
          </div>
          <div className="flex items-center gap-2">
            <Banknote className="w-4 h-4" />
            <span className="text-xs font-semibold">Claim by milestone</span>
          </div>
          <div className="flex items-center gap-2">
            <Repeat className="w-4 h-4" />
            <span className="text-xs font-semibold">Recoverable if needed</span>
          </div>
        </div>
      </div>
    </div>
  );
};
