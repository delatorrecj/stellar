//! Stella — Type Definitions
//!
//! All data types used by the Stella escrow contract.
//! Storage keys, escrow state, and error codes live here.

use soroban_sdk::{contracttype, contracterror, Address};

// ─── Storage Keys ────────────────────────────────────────────────
// These are the keys used to read/write data in Soroban storage.
// Each variant maps to a specific piece of contract state.

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// Stores an Escrow struct for a specific candidate.
    /// One escrow per candidate address (MVP).
    Escrow(Address),

    /// The admin address — set once during initialize().
    /// Stored in instance storage (lives as long as contract).
    Admin,

    /// The XLM SAC (Stellar Asset Contract) address.
    /// Set once during initialize() so we don't hardcode it.
    /// Stored in instance storage.
    Token,
}

// ─── Escrow Struct ───────────────────────────────────────────────
// Represents a single employer → candidate escrow.
// All financial state — must ALWAYS be in persistent storage.

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Escrow {
    /// The employer who locked the funds.
    pub employer: Address,

    /// The candidate who can claim milestone payouts.
    pub candidate: Address,

    /// Total XLM locked in this escrow (in stroops).
    /// 1 XLM = 10,000,000 stroops.
    pub total_amount: i128,

    /// Cumulative amount already claimed by the candidate (in stroops).
    /// Invariant: unlocked_amount <= total_amount
    pub unlocked_amount: i128,

    /// UNIX timestamp — escrow expires after this.
    /// Employer can clawback remaining funds after deadline.
    pub deadline: u64,

    /// Whether this escrow is still active.
    /// Set to false when fully claimed or clawed back.
    pub is_active: bool,
}

// ─── Error Codes ─────────────────────────────────────────────────
// Every error has a unique u32 code.
// Frontend maps these codes to human-readable messages.
// See PRD §12 (ERROR_MESSAGES) for the full mapping.

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum StellaError {
    /// Error 1: An escrow already exists for this candidate.
    EscrowAlreadyExists = 1,

    /// Error 2: No escrow found for this candidate address.
    EscrowNotFound = 2,

    /// Error 3: This escrow is no longer active (completed or clawed back).
    EscrowInactive = 3,

    /// Error 4: Claim amount exceeds remaining escrow balance.
    ExceedsTotal = 4,

    /// Error 5: Nothing left to clawback — all funds already claimed.
    NothingToClawback = 5,

    /// Error 6: Caller is not authorized for this action.
    Unauthorized = 6,

    /// Error 7: Deadline must be in the future.
    InvalidDeadline = 7,

    /// Error 8: Amount must be greater than zero.
    InvalidAmount = 8,
}
