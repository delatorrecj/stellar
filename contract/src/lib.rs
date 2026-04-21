//! Stella — Soroban Smart Contract (V2.0 Dispute Resolution)
//!
//! Full-featured milestone-based escrow with dispute resolution.
//!
//! A pre-employment onboarding escrow on Stellar with milestone tracking.
//! Employers lock XLM tied to specific milestones. Candidates accept the
//! escrow. Employers release milestones individually as candidates complete
//! onboarding steps. Employers clawback remaining funds if ghosted.
//! Candidates can raise disputes post-deadline; arbitrators resolve via BPS split.
//!
//! State Machine:
//!   Pending   → Candidate has not yet accepted
//!   Active    → Work period. Milestones can be released.
//!   Complete  → All milestones released.
//!   Cancelled → Employer clawed back remaining funds.
//!   Disputed  → Candidate raised a dispute after deadline.
//!   Resolved  → Arbitrator resolved with BPS-based fund split.
//!
//! Functions:
//!   initialize()            — One-time setup: store admin + token address
//!   init_escrow()           — Employer locks XLM with milestone array
//!   candidate_accept()      — Candidate accepts, transitions Pending → Active
//!   unlock_milestone()      — Employer releases a specific milestone by ID
//!   clawback()              — Employer recovers unreleased funds
//!   raise_dispute()         — Candidate disputes post-deadline (Active → Disputed)
//!   resolve_dispute()       — Arbitrator splits funds via BPS (Disputed → Resolved)
//!   get_escrow()            — Read-only escrow lookup
//!   get_candidate_escrows() — List employer addresses for a candidate

#![no_std]

mod events;
mod types;

use soroban_sdk::{contract, contractimpl, token, Address, Env, String, Vec};

use crate::events::{
    emit_candidate_accepted, emit_clawback, emit_dispute_raised, emit_dispute_resolved,
    emit_escrow_completed, emit_escrow_created, emit_milestone_unlocked,
};
use crate::types::{DataKey, Escrow, EscrowState, Milestone, StellaError};

// ─── TTL Constants ───────────────────────────────────────────────
// Soroban state can be archived if TTL is not extended.
// We extend TTL on every write to prevent data loss.

const LEDGERS_PER_DAY: u32 = 17_280; // ~5s per ledger
const MIN_TTL: u32 = LEDGERS_PER_DAY * 7; // 1-week floor
const MAX_TTL: u32 = LEDGERS_PER_DAY * 60; // 60-day ceiling

#[contract]
pub struct StellaContract;

#[contractimpl]
impl StellaContract {
    // ─── INITIALIZE ──────────────────────────────────────────────
    // Called once after deployment to set the admin and token address.
    // This avoids hardcoding the XLM SAC address in the contract.
    //
    // Args:
    //   admin  — The admin address (can perform emergency actions in V2)
    //   token  — The XLM SAC address on the target network
    //
    // Returns AlreadyInitialized if called twice.

    pub fn initialize(env: Env, admin: Address, token: Address) -> Result<(), StellaError> {
        // Prevent re-initialization — this can only be called once
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(StellaError::AlreadyInitialized);
        }

        // Store admin and token in instance storage (lives as long as contract)
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);

        // Extend instance TTL to prevent archival
        env.storage()
            .instance()
            .extend_ttl(MIN_TTL, MAX_TTL);

        Ok(())
    }

    // ─── INIT ESCROW ─────────────────────────────────────────────
    // Employer locks XLM for a specific candidate with a milestone array.
    // Each milestone has a description and an amount. The total is computed
    // as the sum of all milestone amounts and transferred atomically.
    //
    // Auth:     employer must sign
    // Checks:   no active escrow for candidate, milestones non-empty,
    //           all amounts > 0, token initialized
    // Transfer: employer → contract (total of all milestone amounts)
    // State:    → Pending
    // Event:    ("escrow", "created")

    pub fn init_escrow(
        env: Env,
        employer: Address,
        candidate: Address,
        arbitrator: Address,
        descriptions: Vec<String>,
        amounts: Vec<i128>,
        deadline: u64,
    ) -> Result<(), StellaError> {
        // STEP 1: Auth — employer must sign this transaction
        employer.require_auth();

        // Fetch token from instance storage
        let token = env.storage().instance().get::<DataKey, Address>(&DataKey::Token)
            .ok_or(StellaError::NotInitialized)?;

        if descriptions.len() != amounts.len() || descriptions.is_empty() {
            return Err(StellaError::EmptyMilestones);
        }

        let mut milestones = Vec::new(&env);
        let mut total: i128 = 0;

        for i in 0..descriptions.len() {
            let desc = descriptions.get_unchecked(i);
            let amt = amounts.get_unchecked(i);
            
            if amt <= 0 {
                return Err(StellaError::InvalidAmount);
            }

            milestones.push_back(Milestone {
                id: i as u32,
                description: desc,
                amount: amt,
                released: false,
            });
            total = total.checked_add(amt).expect("arithmetic overflow");
        }

        // STEP 4: Check for existing active escrow between THIS employer and THIS candidate
        let key = DataKey::Escrow(employer.clone(), candidate.clone());
        if let Some(existing) = env.storage().persistent().get::<_, Escrow>(&key) {
            // Allow overwriting if the previous escrow is finished
            if existing.state == EscrowState::Pending || existing.state == EscrowState::Active {
                return Err(StellaError::EscrowAlreadyExists);
            }
        }

        // STEP 5: Write state BEFORE token transfer (re-entrancy protection)
        let escrow = Escrow {
            employer: employer.clone(),
            candidate: candidate.clone(),
            token: token.clone(),
            arbitrator: arbitrator.clone(),
            milestones: milestones.clone(),
            deadline,
            state: EscrowState::Pending,
        };
        env.storage().persistent().set(&key, &escrow);

        // STEP 6: Extend TTL on the escrow entry
        env.storage()
            .persistent()
            .extend_ttl(&key, MIN_TTL, MAX_TTL);

        // STEP 7: Update candidate's employer list (reverse lookup)
        let candidate_key = DataKey::CandidateEscrows(candidate.clone());
        let mut candidate_employers: Vec<Address> = env
            .storage()
            .persistent()
            .get(&candidate_key)
            .unwrap_or_else(|| Vec::new(&env));
        
        // Prevent duplicate indexing if employer creates multiple (though UI handles 1:1 currently)
        if !candidate_employers.contains(&employer) {
            candidate_employers.push_back(employer.clone());
            env.storage().persistent().set(&candidate_key, &candidate_employers);
        }
        env.storage().persistent().extend_ttl(&candidate_key, MIN_TTL, MAX_TTL);

        // STEP 8: Transfer total XLM from employer to contract
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&employer, &env.current_contract_address(), &total);

        // STEP 9: Emit event
        emit_escrow_created(&env, &employer, &candidate, total);

        Ok(())
    }

    // ─── CANDIDATE ACCEPT ────────────────────────────────────────
    // Candidate accepts the escrow, transitioning from
    // Pending → Active. This is how the candidate opts in.
    //
    // Auth:     candidate must sign
    // Checks:   escrow exists, state == Pending
    // State:    Pending → Active
    // Event:    ("escrow", "accepted")

    pub fn candidate_accept(
        env: Env,
        employer: Address,
        candidate: Address,
    ) -> Result<(), StellaError> {
        // STEP 1: Auth — candidate must sign
        candidate.require_auth();

        // STEP 2: Load escrow
        let key = DataKey::Escrow(employer, candidate.clone());
        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(StellaError::EscrowNotFound)?;

        // STEP 3: Verify the caller is the actual candidate
        if escrow.candidate != candidate {
            return Err(StellaError::Unauthorized);
        }

        // STEP 4: Verify state is Pending
        if escrow.state != EscrowState::Pending {
            if escrow.state == EscrowState::Active {
                return Err(StellaError::AlreadyAccepted);
            }
            return Err(StellaError::NotPending);
        }

        // STEP 5: Transition to Active
        escrow.state = EscrowState::Active;
        env.storage().persistent().set(&key, &escrow);

        // STEP 6: Extend TTL
        env.storage()
            .persistent()
            .extend_ttl(&key, MIN_TTL, MAX_TTL);

        // STEP 7: Emit event
        emit_candidate_accepted(&env, &candidate);

        Ok(())
    }

    // ─── UNLOCK MILESTONE ────────────────────────────────────────
    // Employer releases a specific milestone by its ID.
    // The milestone's amount is transferred from contract to candidate.
    // If all milestones are released, state transitions to Complete.
    //
    // Auth:     employer must sign
    // Checks:   state == Active, deadline not passed, milestone exists,
    //           milestone not already released
    // Transfer: contract → candidate (milestone amount)
    // State:    → Complete (if all milestones released)
    // Events:   ("escrow", "milestone") and optionally ("escrow", "completed")

    pub fn unlock_milestone(
        env: Env,
        employer: Address,
        candidate: Address,
        milestone_id: u32,
    ) -> Result<(), StellaError> {
        // STEP 1: Auth — employer must sign
        employer.require_auth();

        // STEP 2: Load escrow
        let key = DataKey::Escrow(employer.clone(), candidate.clone());
        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(StellaError::EscrowNotFound)?;

        // STEP 3: Verify the caller is the actual employer
        if escrow.employer != employer {
            return Err(StellaError::Unauthorized);
        }

        // STEP 4: Verify state is Active
        if escrow.state != EscrowState::Active {
            return Err(StellaError::NotActive);
        }

        // STEP 5: Enforce deadline — cannot release after expiry
        if env.ledger().timestamp() > escrow.deadline {
            return Err(StellaError::DeadlineExpired);
        }

        // STEP 6: Find milestone by ID
        let mut found = false;
        let mut milestone_amount: i128 = 0;
        let mut updated_milestones = Vec::new(&env);

        for i in 0..escrow.milestones.len() {
            let mut ms = escrow.milestones.get(i).unwrap();
            if ms.id == milestone_id {
                found = true;
                if ms.released {
                    return Err(StellaError::AlreadyReleased);
                }
                milestone_amount = ms.amount;
                ms.released = true;
            }
            updated_milestones.push_back(ms);
        }

        if !found {
            return Err(StellaError::MilestoneNotFound);
        }

        // STEP 7: Check if all milestones are now released
        let all_released = {
            let mut all = true;
            for i in 0..updated_milestones.len() {
                if !updated_milestones.get(i).unwrap().released {
                    all = false;
                    break;
                }
            }
            all
        };

        // STEP 8: Update state BEFORE transfer
        escrow.milestones = updated_milestones;
        if all_released {
            escrow.state = EscrowState::Complete;
        }
        env.storage().persistent().set(&key, &escrow);

        // STEP 9: Extend TTL
        env.storage()
            .persistent()
            .extend_ttl(&key, MIN_TTL, MAX_TTL);

        // STEP 10: Transfer milestone amount from contract → candidate
        let token_client = token::Client::new(&env, &escrow.token);
        token_client.transfer(
            &env.current_contract_address(),
            &candidate,
            &milestone_amount,
        );

        // STEP 11: Emit events
        emit_milestone_unlocked(&env, &candidate, milestone_id, milestone_amount);

        if all_released {
            // Compute total paid for completed event
            let mut total_paid: i128 = 0;
            for i in 0..escrow.milestones.len() {
                total_paid += escrow.milestones.get(i).unwrap().amount;
            }
            emit_escrow_completed(&env, &candidate, total_paid);
        }

        Ok(())
    }

    // ─── CLAWBACK ────────────────────────────────────────────────
    // Employer recovers remaining (unreleased) funds from the escrow.
    // Works in both Pending and Active states.
    // In Pending: employer can clawback before candidate accepts.
    // In Active: employer can clawback unreleased milestones.
    //
    // Auth:     employer must sign
    // Checks:   escrow exists, state is Pending or Active, funds remain
    // Transfer: contract → employer (sum of unreleased milestone amounts)
    // State:    → Cancelled
    // Event:    ("escrow", "clawback")

    pub fn clawback(
        env: Env,
        employer: Address,
        candidate: Address,
    ) -> Result<i128, StellaError> {
        // STEP 1: Auth — employer must sign
        employer.require_auth();

        // STEP 2: Load escrow
        let key = DataKey::Escrow(employer.clone(), candidate.clone());
        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(StellaError::EscrowNotFound)?;

        // STEP 3: Verify the caller is the actual employer
        if escrow.employer != employer {
            return Err(StellaError::Unauthorized);
        }

        // STEP 4: Verify state allows clawback
        if escrow.state == EscrowState::Complete || escrow.state == EscrowState::Cancelled {
            return Err(StellaError::NoFundsToClawback);
        }

        // STEP 5: Compute sum of unreleased milestone amounts
        let mut locked: i128 = 0;
        for i in 0..escrow.milestones.len() {
            let ms = escrow.milestones.get(i).unwrap();
            if !ms.released {
                locked = locked.checked_add(ms.amount).expect("arithmetic overflow");
            }
        }

        if locked <= 0 {
            return Err(StellaError::NoFundsToClawback);
        }

        // STEP 6: Update state BEFORE transfer — preserves audit trail
        escrow.state = EscrowState::Cancelled;
        env.storage().persistent().set(&key, &escrow);

        // STEP 7: Extend TTL
        env.storage()
            .persistent()
            .extend_ttl(&key, MIN_TTL, MAX_TTL);

        // STEP 8: Transfer remaining XLM back to employer
        let token_client = token::Client::new(&env, &escrow.token);
        token_client.transfer(
            &env.current_contract_address(),
            &employer,
            &locked,
        );

        // STEP 9: Emit event
        emit_clawback(&env, &employer, locked);

        Ok(locked)
    }

    // ─── GET ESCROW (read-only) ──────────────────────────────────
    // Returns the escrow state for a given candidate.
    // No auth required — escrow data is public.

    pub fn get_escrow(env: Env, employer: Address, candidate: Address) -> Result<Escrow, StellaError> {
        let key = DataKey::Escrow(employer, candidate);
        env.storage()
            .persistent()
            .get(&key)
            .ok_or(StellaError::EscrowNotFound)
    }

    // ─── RAISE DISPUTE (V2.0) ──────────────────────────────────────
    // Candidate raises a dispute if the employer ghosts
    // them or refuses to release milestones after the deadline.
    //
    // Auth:     candidate must sign
    // Checks:   state == Active, current_time > deadline
    // State:    Active → Disputed
    // Event:    ("escrow", "disputed")

    pub fn raise_dispute(env: Env, employer: Address, candidate: Address) -> Result<(), StellaError> {
        // STEP 1: Auth — candidate must sign
        candidate.require_auth();

        // STEP 2: Load escrow
        let key = DataKey::Escrow(employer, candidate.clone());
        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(StellaError::EscrowNotFound)?;

        // STEP 3: Verify the caller is the actual candidate
        if escrow.candidate != candidate {
            return Err(StellaError::Unauthorized);
        }

        // STEP 4: Verify state is Active
        if escrow.state != EscrowState::Active {
            return Err(StellaError::NotActive);
        }

        // STEP 5: Enforce deadline — can only dispute AFTER expiry
        if env.ledger().timestamp() <= escrow.deadline {
            return Err(StellaError::DeadlineNotMet);
        }

        // STEP 6: Transition to Disputed
        escrow.state = EscrowState::Disputed;
        env.storage().persistent().set(&key, &escrow);

        // STEP 7: Extend TTL
        env.storage()
            .persistent()
            .extend_ttl(&key, MIN_TTL, MAX_TTL);

        // STEP 8: Emit event
        emit_dispute_raised(&env, &candidate);

        Ok(())
    }

    // ─── RESOLVE DISPUTE (V2.0) ─────────────────────────────────────
    // Arbitrator resolves a dispute by splitting unreleased
    // funds between the candidate and employer based on a percentage.
    //
    // Auth:     arbitrator must sign
    // checks: state == Disputed, candidate_bps in 0..=10000
    // Transfer: total_unreleased split based on bps
    // State:    Disputed → Resolved
    // Event:    ("escrow", "resolved")

    pub fn resolve_dispute(
        env: Env,
        arbitrator: Address,
        employer: Address,
        candidate_addr: Address,
        candidate_bps: u32,
    ) -> Result<(), StellaError> {
        // STEP 1: Auth — arbitrator must sign
        arbitrator.require_auth();

        // STEP 2: Load escrow {employer, candidate}
        let key = DataKey::Escrow(employer, candidate_addr.clone());
        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(StellaError::EscrowNotFound)?;

        // STEP 3: Verify the caller is the assigned arbitrator
        if escrow.arbitrator != arbitrator {
            return Err(StellaError::Unauthorized);
        }

        // STEP 4: Verify state is Disputed
        if escrow.state != EscrowState::Disputed {
            return Err(StellaError::NotDisputed);
        }

        // STEP 5: Validate basis points (0-10000)
        if candidate_bps > 10000 {
            return Err(StellaError::InvalidBps);
        }

        // STEP 6: Compute sum of unreleased milestone amounts
        let mut locked: i128 = 0;
        for i in 0..escrow.milestones.len() {
            let ms = escrow.milestones.get(i).unwrap();
            if !ms.released {
                locked = locked.checked_add(ms.amount).expect("arithmetic overflow");
            }
        }

        if locked <= 0 {
            return Err(StellaError::NoFundsToClawback);
        }

        // STEP 7: Compute split
        let candidate_payout = locked
            .checked_mul(candidate_bps as i128)
            .expect("overflow")
            / 10000;
        let employer_payout = locked
            .checked_sub(candidate_payout)
            .expect("underflow");

        // STEP 8: Update state BEFORE transfers
        escrow.state = EscrowState::Resolved;
        // Mark all milestones as released
        let mut updated_milestones = Vec::new(&env);
        for i in 0..escrow.milestones.len() {
            let mut ms = escrow.milestones.get(i).unwrap();
            ms.released = true;
            updated_milestones.push_back(ms);
        }
        escrow.milestones = updated_milestones;
        env.storage().persistent().set(&key, &escrow);

        // STEP 9: Extend TTL
        env.storage()
            .persistent()
            .extend_ttl(&key, MIN_TTL, MAX_TTL);

        // STEP 10: Transfers
        let token_client = token::Client::new(&env, &escrow.token);

        if candidate_payout > 0 {
            token_client.transfer(
                &env.current_contract_address(),
                &candidate_addr,
                &candidate_payout,
            );
        }

        if employer_payout > 0 {
            token_client.transfer(
                &env.current_contract_address(),
                &escrow.employer,
                &employer_payout,
            );
        }

        // STEP 11: Emit event
        emit_dispute_resolved(&env, &candidate_addr, candidate_payout, employer_payout);

        Ok(())
    }

    // ─── UTILITY READS ───────────────────────────────────────────

    /// Returns a list of employer addresses that have created an escrow for this candidate.
    pub fn get_candidate_escrows(env: Env, candidate: Address) -> Vec<Address> {
        let key = DataKey::CandidateEscrows(candidate);
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| Vec::new(&env))
    }
}

// Tests live in a separate file for organization
#[cfg(test)]
mod test;
