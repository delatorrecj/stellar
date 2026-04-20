import React, { useState } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
import { AddressInput } from './AddressInput';
import type { MilestoneInput } from '../lib/contract';

interface CreateEscrowFormProps {
  balance: string | null;
  network: string | null;
  isTxPending: boolean;
  loading: boolean;
  onCreate: (candidate: string, milestones: MilestoneInput[], durationDays: number) => Promise<void>;
  onSuccess: (candidate: string) => void;
}

export const CreateEscrowForm: React.FC<CreateEscrowFormProps> = ({ 
  balance, 
  network, 
  isTxPending, 
  loading, 
  onCreate, 
  onSuccess 
}) => {
  const [candidate, setCandidate] = useState('');
  const [isCandidateValid, setIsCandidateValid] = useState(false);
  const [durationDays, setDurationDays] = useState('30');
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { description: 'Background Check', amount: '' },
    { description: 'Day 1 Onboarding', amount: '' },
  ]);

  const addMilestone = () => {
    setMilestones([...milestones, { description: '', amount: '' }]);
  };

  const removeMilestone = (i: number) => {
    if (milestones.length <= 1) return;
    setMilestones(milestones.filter((_, idx) => idx !== i));
  };

  const updateMilestone = (i: number, field: keyof MilestoneInput, value: string) => {
    const updated = [...milestones];
    updated[i] = { ...updated[i], [field]: value };
    setMilestones(updated);
  };

  const totalXlm = milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCandidateValid) {
      alert("Please enter a complete and valid Stellar address (56 characters).");
      return;
    }

    // 1. Pre-flight Balance Check
    const userBal = parseFloat(balance || '0');
    if (userBal < totalXlm) {
      alert(`Simulation will fail: Insufficient balance. You have ${userBal} XLM, but target lock is ${totalXlm.toFixed(2)} XLM.`);
      return;
    }

    // 2. Network Check
    const currentNetwork = String(network || '').toUpperCase();
    if (currentNetwork && currentNetwork !== 'TESTNET') {
       alert(`Network mismatch: Your wallet is on ${currentNetwork}. Please switch to TESTNET and try again.`);
       return;
    }

    const currentCandidate = candidate;
    try {
      await onCreate(currentCandidate, milestones, Number(durationDays));
      
      // Full reset of form fields
      setCandidate('');
      setDurationDays('30');
      setMilestones([
        { description: 'Background Check', amount: '' },
        { description: 'Day 1 Onboarding', amount: '' },
      ]);
      
      // Focus on the new escrow
      onSuccess(currentCandidate);
    } catch (err: any) {
      console.error(err);
      // If it already exists, let's just search for it so the user can see it
      if (err.message?.includes('13') || String(err).includes('already exists')) {
        onSuccess(currentCandidate);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <AddressInput
          label="Candidate wallet address"
          value={candidate}
          onChange={(val, valid) => {
            setCandidate(val);
            setIsCandidateValid(valid);
          }}
          placeholder="G..."
          helperText="Must be a full 56-character public key (starts with G)"
        />
      </div>

      {/* Milestone Builder */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <label className="label-section" id="milestones-label">Milestones</label>
          <button type="button" onClick={addMilestone} aria-label="Add milestone"
            className="text-xs text-primary-600 font-semibold hover:text-primary-700 transition-colors flex items-center gap-1"
          >
            <PlusCircle size={12} /> Add
          </button>
        </div>
        <div role="group" aria-labelledby="milestones-label" className="flex flex-col gap-2">
          {milestones.map((m, i) => (
            <div key={i} className="flex gap-2 items-start bg-neutral-50 p-3 rounded-lg border border-neutral-100">
              <div className="flex-1 flex flex-col gap-2">
                <input
                  type="text" placeholder={`Milestone ${i + 1} description`} aria-label={`Milestone ${i + 1} description`}
                  className="input-field bg-white text-sm" value={m.description}
                  onChange={(e) => updateMilestone(i, 'description', e.target.value)} required
                />
                <input
                  type="number" step="0.0000001" placeholder="Amount (XLM)" aria-label={`Milestone ${i + 1} amount`} min="0.0000001"
                  className="input-field bg-white text-sm" value={m.amount}
                  onChange={(e) => updateMilestone(i, 'amount', e.target.value)} required
                />
              </div>
              {milestones.length > 1 && (
                <button type="button" onClick={() => removeMilestone(i)}
                  className="p-2 text-neutral-400 hover:text-red-500 transition-colors" aria-label="Remove milestone"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Total + Duration */}
      <div className="flex gap-4">
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="label-section">Total</label>
          <div className="input-field bg-neutral-50 text-neutral-800 font-extrabold cursor-default flex items-center gap-1">
            {totalXlm.toFixed(2)} <span className="text-neutral-400 text-sm font-semibold">XLM</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="label-section" htmlFor="duration-days">Duration (Days)</label>
          <input type="number" id="duration-days" min="1" placeholder="30" aria-label="Duration in days"
            className="input-field" value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)} required
          />
        </div>
      </div>

      <button type="submit" disabled={isTxPending || loading} className="btn-primary mt-2" aria-label="Submit lock onboarding funds">
        {isTxPending ? 'Signing...' : loading ? 'Processing...' : 'Lock Onboarding Funds'}
      </button>
    </form>
  );
};
