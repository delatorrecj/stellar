//! Stella — Soroban Smart Contract
//!
//! A pre-employment onboarding escrow on Stellar.
//! Employers lock XLM for candidates. Candidates claim as they
//! complete onboarding milestones. Employers clawback if ghosted.
//!
//! Functions:
//!   initialize()       — One-time setup: store admin + token address
//!   init_escrow()      — Employer locks XLM for a candidate
//!   unlock_milestone() — Candidate claims partial payout
//!   clawback()         — Employer recovers remaining funds
//!   get_escrow()       — Read-only escrow lookup

#![no_std]

mod events;
mod types;

use soroban_sdk::{contract, contractimpl, token, Address, Env};

use crate::events::{emit_clawback, emit_escrow_completed, emit_escrow_created, emit_milestone_unlocked};
use crate::types::{DataKey, Escrow, StellaError};

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
    // Panics if already initialized.

    pub fn initialize(env: Env, admin: Address, token: Address) {
        // Prevent re-initialization — this can only be called once
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Contract already initialized");
        }

        // Store admin and token in instance storage (lives as long as contract)
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
    }

    // ─── INIT ESCROW ─────────────────────────────────────────────
    // Employer locks XLM for a specific candidate.
    // The funds are transferred from the employer's wallet to the contract.
    //
    // Auth:     employer must sign
    // Checks:   no existing escrow for candidate, amount > 0, deadline in future
    // Transfer: employer → contract
    // Event:    ("escrow", "created")

    pub fn init_escrow(
        env: Env,
        employer: Address,
        candidate: Address,
        amount: i128,
        deadline: u64,
    ) -> Result<(), StellaError> {
        // STEP 1: Auth — employer must sign this transaction
        employer.require_auth();

        // STEP 2: Validate inputs
        if amount <= 0 {
            return Err(StellaError::InvalidAmount);
        }
        if deadline <= env.ledger().timestamp() {
            return Err(StellaError::InvalidDeadline);
        }

        // STEP 3: Check for existing active escrow
        let key = DataKey::Escrow(candidate.clone());
        if let Some(existing_escrow) = env.storage().persistent().get::<_, Escrow>(&key) {
            // FIX: Allow overwriting if the previous escrow is finished or clawed back
            if existing_escrow.is_active {
                return Err(StellaError::EscrowAlreadyExists);
            }
        }

        // STEP 4: Write state BEFORE token transfer (re-entrancy protection)
        let escrow = Escrow {
            employer: employer.clone(),
            candidate: candidate.clone(),
            total_amount: amount,
            unlocked_amount: 0,
            deadline,
            is_active: true,
        };
        env.storage().persistent().set(&key, &escrow);

        // STEP 5: Transfer XLM from employer to contract
        let token_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .expect("Contract not initialized");
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&employer, &env.current_contract_address(), &amount);

        // STEP 6: Emit event
        emit_escrow_created(&env, &employer, &candidate, amount);

        Ok(())
    }

    // ─── UNLOCK MILESTONE ────────────────────────────────────────
    // Candidate claims a partial payout from their escrow.
    // In MVP, candidate self-claims. In V1, employer will approve.
    //
    // Auth:     candidate must sign
    // Checks:   escrow exists, is active, amount within bounds
    // Transfer: contract → candidate
    // Events:   ("escrow", "milestone") and optionally ("escrow", "completed")

    pub fn unlock_milestone(
        env: Env,
        candidate: Address,
        milestone_amount: i128,
    ) -> Result<(), StellaError> {
        // STEP 1: Load escrow (moved up to get employer address)
        let key = DataKey::Escrow(candidate.clone());
        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(StellaError::EscrowNotFound)?;

        // STEP 2: Auth — EMPLOYER must sign to approve the release of funds to candidate
        escrow.employer.require_auth();

        // STEP 3: Validate amount
        if milestone_amount <= 0 {
            return Err(StellaError::InvalidAmount);
        }

        // STEP 4: Verify escrow is active
        if !escrow.is_active {
            return Err(StellaError::EscrowInactive);
        }

        // STEP 5: Check bounds — can't claim more than remaining
        let remaining = escrow
            .total_amount
            .checked_sub(escrow.unlocked_amount)
            .expect("arithmetic underflow");

        if milestone_amount > remaining {
            return Err(StellaError::ExceedsTotal);
        }

        // STEP 6: Update state BEFORE transfer
        escrow.unlocked_amount = escrow
            .unlocked_amount
            .checked_add(milestone_amount)
            .expect("arithmetic overflow");

        // Check if escrow is fully claimed
        if escrow.unlocked_amount == escrow.total_amount {
            escrow.is_active = false;
        }

        env.storage().persistent().set(&key, &escrow);

        // STEP 7: Transfer XLM from contract to candidate
        let token_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .expect("Contract not initialized");
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(
            &env.current_contract_address(),
            &candidate,
            &milestone_amount,
        );

        // STEP 8: Emit events
        let new_remaining = escrow.total_amount - escrow.unlocked_amount;
        emit_milestone_unlocked(&env, &candidate, milestone_amount, new_remaining);

        if !escrow.is_active {
            emit_escrow_completed(&env, &candidate, escrow.total_amount);
        }

        Ok(())
    }

    // ─── CLAWBACK ────────────────────────────────────────────────
    // Employer recovers remaining (unclaimed) funds from the escrow.
    // Typically used when a candidate ghosts.
    //
    // Auth:     employer must sign
    // Checks:   escrow exists, is active, employer matches, funds remain
    // Transfer: contract → employer
    // Event:    ("escrow", "clawback")

    pub fn clawback(env: Env, candidate: Address) -> Result<i128, StellaError> {
        // STEP 1: Load escrow
        let key = DataKey::Escrow(candidate.clone());
        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(StellaError::EscrowNotFound)?;

        // STEP 2: Auth — the employer of this escrow must sign
        escrow.employer.require_auth();

        // STEP 3: Verify escrow is active
        if !escrow.is_active {
            return Err(StellaError::EscrowInactive);
        }

        // STEP 4: Enforce deadline bounds — employer cannot clawback early
        if env.ledger().timestamp() < escrow.deadline {
            return Err(StellaError::DeadlineNotReached);
        }

        // STEP 5: Calculate remaining balance
        let remaining = escrow
            .total_amount
            .checked_sub(escrow.unlocked_amount)
            .expect("arithmetic underflow");

        if remaining <= 0 {
            return Err(StellaError::NothingToClawback);
        }

        // STEP 5: Update state BEFORE transfer
        escrow.is_active = false;
        env.storage().persistent().set(&key, &escrow);

        // STEP 6: Transfer remaining XLM back to employer
        let token_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .expect("Contract not initialized");
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(
            &env.current_contract_address(),
            &escrow.employer,
            &remaining,
        );

        // STEP 7: Emit event
        emit_clawback(&env, &escrow.employer, remaining);

        Ok(remaining)
    }

    // ─── GET ESCROW (read-only) ──────────────────────────────────
    // Returns the escrow state for a given candidate.
    // No auth required — escrow data is public.

    pub fn get_escrow(env: Env, candidate: Address) -> Result<Escrow, StellaError> {
        let key = DataKey::Escrow(candidate);
        env.storage()
            .persistent()
            .get(&key)
            .ok_or(StellaError::EscrowNotFound)
    }
}

// Tests live in a separate file for organization
#[cfg(test)]
mod test;
