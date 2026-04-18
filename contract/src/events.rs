//! Stella — Event Emission Helpers
//!
//! On-chain events that frontends and judges can observe.
//! Events are emitted AFTER state changes and token transfers.
//! Format: topics = (category, action), data = relevant payload.

use soroban_sdk::{Address, Env, Symbol};

/// Emitted when an employer creates a new escrow.
/// Topics: ("escrow", "created")
/// Data: (employer, candidate, amount)
pub fn emit_escrow_created(env: &Env, employer: &Address, candidate: &Address, amount: i128) {
    env.events().publish(
        (Symbol::new(env, "escrow"), Symbol::new(env, "created")),
        (employer.clone(), candidate.clone(), amount),
    );
}

/// Emitted when a candidate claims a milestone payout.
/// Topics: ("escrow", "milestone")
/// Data: (candidate, amount_claimed, remaining_balance)
pub fn emit_milestone_unlocked(
    env: &Env,
    candidate: &Address,
    amount: i128,
    remaining: i128,
) {
    env.events().publish(
        (Symbol::new(env, "escrow"), Symbol::new(env, "milestone")),
        (candidate.clone(), amount, remaining),
    );
}

/// Emitted when an employer claws back remaining escrow funds.
/// Topics: ("escrow", "clawback")
/// Data: (employer, amount_returned)
pub fn emit_clawback(env: &Env, employer: &Address, amount_returned: i128) {
    env.events().publish(
        (Symbol::new(env, "escrow"), Symbol::new(env, "clawback")),
        (employer.clone(), amount_returned),
    );
}

/// Emitted when an escrow is fully completed (all funds claimed).
/// Topics: ("escrow", "completed")
/// Data: (candidate, total_paid)
pub fn emit_escrow_completed(env: &Env, candidate: &Address, total_paid: i128) {
    env.events().publish(
        (Symbol::new(env, "escrow"), Symbol::new(env, "completed")),
        (candidate.clone(), total_paid),
    );
}
