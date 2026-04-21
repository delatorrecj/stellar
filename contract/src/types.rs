//! Stella — Type Definitions (V2.0 Dispute Resolution)
//!
//! Full-featured milestone-based escrow with dispute resolution types.
//! All data types used by the Stella escrow contract.
//! Storage keys, milestone struct, escrow state machine, and error codes.

use soroban_sdk::{contracttype, contracterror, Address, String, Vec};

// ─── Storage Keys ────────────────────────────────────────────────
// These are the keys used to read/write data in Soroban storage.
// Each variant maps to a specific piece of contract state.

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// Stores an Escrow struct for a specific employer-candidate pair.
    /// Format: (Employer Address, Candidate Address)
    Escrow(Address, Address),

    /// Tracks all employer addresses that have created an escrow for this candidate.
    CandidateEscrows(Address),

    /// The admin address — set once during initialize().
    /// Stored in instance storage (lives as long as contract).
    Admin,

    /// The XLM SAC (Stellar Asset Contract) address.
    /// Set once during initialize() so we don't hardcode it.
    /// Stored in instance storage.
    Token,
}

// ─── Milestone Struct ────────────────────────────────────────────
// Represents a single deliverable within an escrow.
// Each milestone has its own amount and release status.

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Milestone {
    /// Unique identifier within the escrow (0-indexed).
    pub id: u32,

    /// Human-readable description, e.g. "Background Check", "Day 1 Onboarding".
    pub description: String,

    /// Amount locked for this milestone (in stroops).
    /// 1 XLM = 10,000,000 stroops.
    pub amount: i128,

    /// Whether this milestone's funds have been released to the candidate.
    pub released: bool,
}

// ─── Escrow State Machine ────────────────────────────────────────
// Governs the lifecycle of every escrow.
//
//!   [init_escrow]       → Pending
//!   [candidate_accept]  → Active
//!   [unlock all]        → Complete
//!   [clawback]          → Cancelled
//!   [raise_dispute]     → Disputed
//!   [resolve_dispute]   → Resolved

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum EscrowState {
    /// Employer funded. Candidate has not yet accepted.
    Pending,

    /// Candidate accepted. Work period begins. Milestones can be released.
    Active,

    /// All milestones released. Escrow fully paid out.
    Complete,

    /// Employer clawed back remaining funds. No active milestones remain.
    Cancelled,

    /// Candidate raised dispute.
    Disputed,

    /// Arbitrator resolved dispute.
    Resolved,
}

// ─── Escrow Struct ───────────────────────────────────────────────
// Represents a single employer → candidate escrow with milestone tracking.
// All financial state — must ALWAYS be in persistent storage.

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Escrow {
    /// The employer who locked the funds.
    pub employer: Address,

    /// The candidate who can claim milestone payouts upon acceptance.
    pub candidate: Address,

    /// The token contract address (XLM SAC or any Stellar asset).
    pub token: Address,

    /// The neutral third party who can resolve disputes.
    pub arbitrator: Address,

    /// Array of milestones — each with its own amount and release status.
    pub milestones: Vec<Milestone>,

    /// UNIX timestamp — escrow deadline.
    /// Employer cannot release milestones after this time.
    /// Candidates can raise disputes after this time.
    pub deadline: u64,

    /// Current state of the escrow lifecycle.
    pub state: EscrowState,
}

// ─── Error Codes ─────────────────────────────────────────────────
// Every error has a unique u32 code.
// Frontend maps these codes to human-readable messages.

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum StellaError {
    /// Error 1: Contract has already been initialized.
    AlreadyInitialized = 1,

    /// Error 2: No escrow found for this candidate address.
    NotInitialized = 2,

    /// Error 3: Caller is not authorized for this action.
    Unauthorized = 3,

    /// Error 4: Amount must be greater than zero.
    InvalidAmount = 4,

    /// Error 5: No milestone found with the given ID.
    MilestoneNotFound = 5,

    /// Error 6: This milestone has already been released.
    AlreadyReleased = 6,

    /// Error 7: Nothing left to clawback — all funds already released or escrow finished.
    NoFundsToClawback = 7,

    /// Error 8: Deadline has expired — cannot release milestones.
    DeadlineExpired = 8,

    /// Error 9: Milestones array cannot be empty.
    EmptyMilestones = 9,

    /// Error 10: Action requires escrow to be in Active state.
    NotActive = 10,

    /// Error 11: candidate_accept requires escrow to be in Pending state.
    NotPending = 11,

    /// Error 12: Candidate has already accepted this escrow.
    AlreadyAccepted = 12,

    /// Error 13: An active escrow already exists for this candidate.
    EscrowAlreadyExists = 13,

    /// Error 14: Escrow not found for this candidate.
    EscrowNotFound = 14,

    /// Error 15: Cannot raise dispute before deadline.
    DeadlineNotMet = 15,

    /// Error 16: Action requires escrow to be in Disputed state.
    NotDisputed = 16,

    /// Error 17: Basis points for split must be 0-10000.
    InvalidBps = 17,
}
