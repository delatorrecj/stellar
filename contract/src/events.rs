//! Stella — Event Emission Helpers (V2.0 Dispute Resolution)
//!
//! On-chain events that frontends and judges can observe.
//! Events are emitted AFTER state changes and token transfers.
//! Format: topics = (category, action), data = relevant payload.

use soroban_sdk::{Address, Env, Symbol};

/// Emitted when an employer creates a new escrow.
/// Topics: ("escrow", "created")
/// Data: (employer, candidate, total_amount)
pub fn emit_escrow_created(env: &Env, employer: &Address, candidate: &Address, total_amount: i128) {
    env.events().publish(
        (Symbol::new(env, "escrow"), Symbol::new(env, "created")),
        (employer.clone(), candidate.clone(), total_amount),
    );
}

/// Emitted when a candidate accepts an escrow (Pending → Active).
/// Topics: ("escrow", "accepted")
/// Data: (candidate)
pub fn emit_candidate_accepted(env: &Env, candidate: &Address) {
    env.events().publish(
        (Symbol::new(env, "escrow"), Symbol::new(env, "accepted")),
        candidate.clone(),
    );
}

/// Emitted when an employer releases a specific milestone.
/// Topics: ("escrow", "milestone")
/// Data: (candidate, milestone_id, amount_released)
pub fn emit_milestone_unlocked(
    env: &Env,
    candidate: &Address,
    milestone_id: u32,
    amount: i128,
) {
    env.events().publish(
        (Symbol::new(env, "escrow"), Symbol::new(env, "milestone")),
        (candidate.clone(), milestone_id, amount),
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

/// Emitted when an escrow is fully completed (all milestones released).
/// Topics: ("escrow", "completed")
/// Data: (candidate, total_paid)
pub fn emit_escrow_completed(env: &Env, candidate: &Address, total_paid: i128) {
    env.events().publish(
        (Symbol::new(env, "escrow"), Symbol::new(env, "completed")),
        (candidate.clone(), total_paid),
    );
}

/// New in V2.0: Emitted when a candidate raises a dispute.
/// Topics: ("escrow", "disputed")
/// Data: (candidate)
pub fn emit_dispute_raised(env: &Env, candidate: &Address) {
    env.events().publish(
        (Symbol::new(env, "escrow"), Symbol::new(env, "disputed")),
        candidate.clone(),
    );
}

/// New in V2.0: Emitted when an arbitrator resolves a dispute.
/// Topics: ("escrow", "resolved")
/// Data: (candidate, candidate_payout, employer_payout)
pub fn emit_dispute_resolved(
    env: &Env,
    candidate: &Address,
    candidate_payout: i128,
    employer_payout: i128,
) {
    env.events().publish(
        (Symbol::new(env, "escrow"), Symbol::new(env, "resolved")),
        (candidate.clone(), candidate_payout, employer_payout),
    );
}
