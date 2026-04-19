//! Stella — Contract Tests (V1.3 Multi-Milestone)
//!
//! 19 tests covering the full milestone-based escrow lifecycle:
//!
//!   INIT (T-01 to T-04):
//!     T-01: Happy path — full init with milestones
//!     T-02: Empty milestones rejected
//!     T-03: Zero amount milestone rejected
//!     T-04: Double init for same candidate rejected
//!
//!   CANDIDATE ACCEPT (T-05 to T-07):
//!     T-05: Happy path — transitions Pending → Active
//!     T-06: Wrong signer rejected
//!     T-07: Already active rejected
//!
//!   UNLOCK MILESTONE (T-08 to T-14):
//!     T-08: First milestone only — others untouched
//!     T-09: All milestones released → sets Complete
//!     T-10: Already released rejected
//!     T-11: Invalid milestone ID rejected
//!     T-12: Wrong signer (candidate) rejected
//!     T-13: Not active (Pending) rejected
//!     T-14: After deadline rejected
//!
//!   CLAWBACK (T-15 to T-18):
//!     T-15: Clawback from Pending state
//!     T-16: Partial — only unreleased amount returned
//!     T-17: All released rejected
//!     T-18: Wrong signer (candidate) rejected
//!
//!   READ (T-19):
//!     T-19: get_escrow reflects all state changes
//!
//!   DISPUTE (T-20 to T-25):
//!     T-20: Raise dispute — happy path
//!     T-21: Raise dispute — before deadline rejected
//!     T-22: Resolve dispute — 50/50 split
//!     T-23: Resolve dispute — 100/0 candidate split
//!     T-24: Resolve dispute — wrong arbitrator rejected
//!     T-25: Resolve dispute — not disputed rejected

use crate::{StellaContract, StellaContractClient};
use crate::types::{EscrowState, Milestone, StellaError};
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    token::{StellarAssetClient, Client as TokenClient},
    Address, Env, String, Vec,
};

// ─── Test Helpers ────────────────────────────────────────────────

/// Creates a milestone Vec with the given descriptions and amounts (in stroops).
fn make_milestones(env: &Env, items: &[(&str, i128)]) -> Vec<Milestone> {
    let mut milestones = Vec::new(env);
    for (i, (desc, amount)) in items.iter().enumerate() {
        milestones.push_back(Milestone {
            id: i as u32,
            description: String::from_str(env, desc),
            amount: *amount,
            released: false,
        });
    }
    milestones
}

/// Sets up a clean test environment with:
///   - A registered Stella contract (initialized)
///   - A native XLM token contract (SAC)
///   - Employer and candidate addresses with funded balances
fn setup_test() -> (
    Env,
    StellaContractClient<'static>,
    Address, // employer
    Address, // candidate
    Address, // arbitrator
    Address, // token (XLM SAC)
) {
    let env = Env::default();

    // Mock ALL auth calls — required for tests or require_auth() panics
    env.mock_all_auths();

    // Register the Stella contract
    let contract_id = env.register(StellaContract, ());
    let client = StellaContractClient::new(&env, &contract_id);

    // Create a native XLM token (Stellar Asset Contract)
    let admin = Address::generate(&env);
    let token_address = env
        .register_stellar_asset_contract_v2(admin.clone())
        .address();
    let token_admin_client = StellarAssetClient::new(&env, &token_address);

    // Generate addresses
    let employer = Address::generate(&env);
    let candidate = Address::generate(&env);
    let arbitrator = Address::generate(&env);

    // Fund the employer with 10,000 XLM (in stroops)
    token_admin_client.mint(&employer, &100_000_000_000i128);

    // Initialize the contract with admin and token address
    client.initialize(&admin, &token_address);

    (env, client, employer, candidate, arbitrator, token_address)
}

/// Helper to init a standard 3-milestone escrow (500 XLM total).
fn init_standard_escrow(
    env: &Env,
    client: &StellaContractClient,
    employer: &Address,
    candidate: &Address,
    arbitrator: &Address,
    token: &Address,
) {
    let milestones = make_milestones(env, &[
        ("Background Check", 1_000_000_000),    // 100 XLM
        ("Day 1 Onboarding", 2_000_000_000),     // 200 XLM
        ("Equipment Pickup", 2_000_000_000),      // 200 XLM
    ]);
    let deadline: u64 = 9_999_999_999; // far future
    client.init_escrow(employer, candidate, token, arbitrator, &milestones, &deadline);
}

// ═══════════════════════════════════════════════════════════════════
// T-01: INIT — Happy Path
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_init_happy_path() {
    let (env, client, employer, candidate, arbitrator, token) = setup_test();
    let token_client = TokenClient::new(&env, &token);

    let milestones = make_milestones(&env, &[
        ("Background Check", 1_000_000_000),    // 100 XLM
        ("Day 1 Onboarding", 2_000_000_000),     // 200 XLM
        ("Equipment Pickup", 2_000_000_000),      // 200 XLM
    ]);
    let total: i128 = 5_000_000_000; // 500 XLM

    client.init_escrow(&employer, &candidate, &token, &arbitrator, &milestones, &9_999_999_999u64);

    // Verify escrow state
    let escrow = client.get_escrow(&candidate);
    assert_eq!(escrow.employer, employer);
    assert_eq!(escrow.candidate, candidate);
    assert_eq!(escrow.state, EscrowState::Pending);
    assert_eq!(escrow.milestones.len(), 3);

    // Verify XLM was transferred from employer to contract
    let contract_balance = token_client.balance(&client.address);
    assert_eq!(contract_balance, total);
}

// ═══════════════════════════════════════════════════════════════════
// T-02: INIT — Empty Milestones Rejected
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_init_empty_milestones_rejected() {
    let (env, client, employer, candidate, arbitrator, token) = setup_test();

    let empty = Vec::new(&env);
    let result = client.try_init_escrow(&employer, &candidate, &token, &arbitrator, &empty, &9_999_999_999u64);

    assert_eq!(result, Err(Ok(StellaError::EmptyMilestones)));
}

// ═══════════════════════════════════════════════════════════════════
// T-03: INIT — Zero Amount Milestone Rejected
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_init_zero_amount_milestone_rejected() {
    let (env, client, employer, candidate, arbitrator, token) = setup_test();

    let milestones = make_milestones(&env, &[
        ("Valid", 1_000_000_000),
        ("Zero", 0),  // Invalid
    ]);
    let result = client.try_init_escrow(&employer, &candidate, &token, &arbitrator, &milestones, &9_999_999_999u64);

    assert_eq!(result, Err(Ok(StellaError::InvalidAmount)));
}

// ═══════════════════════════════════════════════════════════════════
// T-04: INIT — Double Init Rejected
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_double_init_rejected() {
    let (env, client, employer, candidate, arbitrator, token) = setup_test();

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator, &token);

    // Attempt second init for same candidate — must fail
    let milestones = make_milestones(&env, &[("Duplicate", 1_000_000_000)]);
    let result = client.try_init_escrow(&employer, &candidate, &token, &arbitrator, &milestones, &9_999_999_999u64);

    assert_eq!(result, Err(Ok(StellaError::EscrowAlreadyExists)));
}

// ═══════════════════════════════════════════════════════════════════
// T-05: CANDIDATE ACCEPT — Happy Path
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_candidate_accept_happy_path() {
    let (env, client, employer, candidate, arbitrator, token) = setup_test();

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator, &token);

    // Candidate accepts
    client.candidate_accept(&candidate);

    let escrow = client.get_escrow(&candidate);
    assert_eq!(escrow.state, EscrowState::Active);
}

// ═══════════════════════════════════════════════════════════════════
// T-06: CANDIDATE ACCEPT — Wrong Signer Rejected
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_candidate_accept_wrong_signer_rejected() {
    let (env, client, employer, candidate, arbitrator, token) = setup_test();

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator, &token);

    // Random address tries to accept — should fail because
    // the escrow's candidate won't match
    let random = Address::generate(&env);
    let result = client.try_candidate_accept(&random);

    assert_eq!(result, Err(Ok(StellaError::EscrowNotFound)));
}

// ═══════════════════════════════════════════════════════════════════
// T-07: CANDIDATE ACCEPT — Already Active Rejected
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_candidate_accept_already_active_rejected() {
    let (env, client, employer, candidate, arbitrator, token) = setup_test();

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator, &token);
    client.candidate_accept(&candidate);

    // Try accepting again — already Active
    let result = client.try_candidate_accept(&candidate);

    assert_eq!(result, Err(Ok(StellaError::AlreadyAccepted)));
}

// ═══════════════════════════════════════════════════════════════════
// T-08: UNLOCK — First Milestone Only
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_unlock_first_milestone_only() {
    let (env, client, employer, candidate, arbitrator, token) = setup_test();
    let token_client = TokenClient::new(&env, &token);

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator, &token);
    client.candidate_accept(&candidate);

    // Release milestone 0 (Background Check — 100 XLM)
    client.unlock_milestone(&employer, &candidate, &0u32);

    let escrow = client.get_escrow(&candidate);
    assert!(escrow.milestones.get(0).unwrap().released);
    assert!(!escrow.milestones.get(1).unwrap().released);
    assert!(!escrow.milestones.get(2).unwrap().released);
    assert_eq!(escrow.state, EscrowState::Active); // still active

    // Verify candidate received the funds
    let candidate_balance = token_client.balance(&candidate);
    assert_eq!(candidate_balance, 1_000_000_000);
}

// ═══════════════════════════════════════════════════════════════════
// T-09: UNLOCK — All Milestones → Complete
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_unlock_all_milestones_sets_complete() {
    let (env, client, employer, candidate, arbitrator, token) = setup_test();
    let token_client = TokenClient::new(&env, &token);

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator, &token);
    client.candidate_accept(&candidate);

    // Release all 3 milestones
    client.unlock_milestone(&employer, &candidate, &0u32);
    client.unlock_milestone(&employer, &candidate, &1u32);
    client.unlock_milestone(&employer, &candidate, &2u32);

    let escrow = client.get_escrow(&candidate);
    assert_eq!(escrow.state, EscrowState::Complete);

    // Verify candidate received all funds (500 XLM)
    let candidate_balance = token_client.balance(&candidate);
    assert_eq!(candidate_balance, 5_000_000_000);
}

// ═══════════════════════════════════════════════════════════════════
// T-10: UNLOCK — Already Released Rejected
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_unlock_already_released_rejected() {
    let (env, client, employer, candidate, arbitrator, token) = setup_test();

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator, &token);
    client.candidate_accept(&candidate);
    client.unlock_milestone(&employer, &candidate, &0u32);

    // Try releasing same milestone again
    let result = client.try_unlock_milestone(&employer, &candidate, &0u32);
    assert_eq!(result, Err(Ok(StellaError::AlreadyReleased)));
}

// ═══════════════════════════════════════════════════════════════════
// T-11: UNLOCK — Invalid Milestone ID Rejected
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_unlock_invalid_id_rejected() {
    let (env, client, employer, candidate, arbitrator, token) = setup_test();

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator, &token);
    client.candidate_accept(&candidate);

    // Milestone ID 99 doesn't exist
    let result = client.try_unlock_milestone(&employer, &candidate, &99u32);
    assert_eq!(result, Err(Ok(StellaError::MilestoneNotFound)));
}

// ═══════════════════════════════════════════════════════════════════
// T-12: UNLOCK — Wrong Signer (Candidate) Rejected
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_unlock_wrong_signer_rejected() {
    let (env, client, employer, candidate, arbitrator, token) = setup_test();

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator, &token);
    client.candidate_accept(&candidate);

    // Candidate tries to release their own milestone — must fail
    let result = client.try_unlock_milestone(&candidate, &candidate, &0u32);
    assert_eq!(result, Err(Ok(StellaError::Unauthorized)));
}

// ═══════════════════════════════════════════════════════════════════
// T-13: UNLOCK — Not Active (Pending) Rejected
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_unlock_not_active_rejected() {
    let (env, client, employer, candidate, arbitrator, token) = setup_test();

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator, &token);

    // Don't accept — escrow is still Pending
    let result = client.try_unlock_milestone(&employer, &candidate, &0u32);
    assert_eq!(result, Err(Ok(StellaError::NotActive)));
}

// ═══════════════════════════════════════════════════════════════════
// T-14: UNLOCK — After Deadline Rejected
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_unlock_after_deadline_rejected() {
    let (env, client, employer, candidate, arbitrator, token) = setup_test();

    // Init with near-future deadline
    let milestones = make_milestones(&env, &[("Task", 1_000_000_000)]);
    client.init_escrow(&employer, &candidate, &token, &arbitrator, &milestones, &1000u64);
    client.candidate_accept(&candidate);

    // Advance time past deadline
    env.ledger().with_mut(|li| li.timestamp = 2000);

    let result = client.try_unlock_milestone(&employer, &candidate, &0u32);
    assert_eq!(result, Err(Ok(StellaError::DeadlineExpired)));
}

// ═══════════════════════════════════════════════════════════════════
// T-15: CLAWBACK — From Pending State
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_clawback_pending_state() {
    let (env, client, employer, candidate, arbitrator, token) = setup_test();
    let token_client = TokenClient::new(&env, &token);

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator, &token);

    let employer_before = token_client.balance(&employer);

    // Clawback before candidate accepts — full refund
    let returned = client.clawback(&employer, &candidate);
    assert_eq!(returned, 5_000_000_000); // All 500 XLM

    let escrow = client.get_escrow(&candidate);
    assert_eq!(escrow.state, EscrowState::Cancelled);

    // Employer got funds back
    let employer_after = token_client.balance(&employer);
    assert_eq!(employer_after, employer_before + 5_000_000_000);
}

// ═══════════════════════════════════════════════════════════════════
// T-16: CLAWBACK — Partial After Some Released
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_clawback_partial_after_some_released() {
    let (env, client, employer, candidate, arbitrator, token) = setup_test();
    let token_client = TokenClient::new(&env, &token);

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator, &token);
    client.candidate_accept(&candidate);

    // Release milestone 0 (100 XLM) to candidate
    client.unlock_milestone(&employer, &candidate, &0u32);

    let employer_before = token_client.balance(&employer);

    // Clawback remaining (200 + 200 = 400 XLM)
    let returned = client.clawback(&employer, &candidate);
    assert_eq!(returned, 4_000_000_000); // 400 XLM

    let employer_after = token_client.balance(&employer);
    assert_eq!(employer_after, employer_before + 4_000_000_000);

    let escrow = client.get_escrow(&candidate);
    assert_eq!(escrow.state, EscrowState::Cancelled);
}

// ═══════════════════════════════════════════════════════════════════
// T-17: CLAWBACK — All Released Rejected
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_clawback_all_released_rejected() {
    let (env, client, employer, candidate, arbitrator, token) = setup_test();

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator, &token);
    client.candidate_accept(&candidate);

    // Release all milestones → state = Complete
    client.unlock_milestone(&employer, &candidate, &0u32);
    client.unlock_milestone(&employer, &candidate, &1u32);
    client.unlock_milestone(&employer, &candidate, &2u32);

    // Clawback on completed escrow — must fail
    let result = client.try_clawback(&employer, &candidate);
    assert_eq!(result, Err(Ok(StellaError::NoFundsToClawback)));
}

// ═══════════════════════════════════════════════════════════════════
// T-18: CLAWBACK — Wrong Signer Rejected
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_clawback_wrong_signer_rejected() {
    let (env, client, employer, candidate, arbitrator, token) = setup_test();

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator, &token);

    // Candidate tries to clawback — must fail
    let result = client.try_clawback(&candidate, &candidate);
    assert_eq!(result, Err(Ok(StellaError::Unauthorized)));
}

// ═══════════════════════════════════════════════════════════════════
// T-19: GET ESCROW — Reflects All State Changes
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_get_escrow_reflects_state_changes() {
    let (env, client, employer, candidate, arbitrator, token) = setup_test();

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator, &token);

    // After init → Pending
    let e = client.get_escrow(&candidate);
    assert_eq!(e.state, EscrowState::Pending);
    assert_eq!(e.milestones.len(), 3);

    // After accept → Active
    client.candidate_accept(&candidate);
    let e = client.get_escrow(&candidate);
    assert_eq!(e.state, EscrowState::Active);

    // After first milestone → still Active, milestone 0 released
    client.unlock_milestone(&employer, &candidate, &0u32);
    let e = client.get_escrow(&candidate);
    assert_eq!(e.state, EscrowState::Active);
    assert!(e.milestones.get(0).unwrap().released);
    assert!(!e.milestones.get(1).unwrap().released);

    // After all milestones → Complete
    client.unlock_milestone(&employer, &candidate, &1u32);
    client.unlock_milestone(&employer, &candidate, &2u32);
    let e = client.get_escrow(&candidate);
    assert_eq!(e.state, EscrowState::Complete);
}

// ═══════════════════════════════════════════════════════════════════
// T-20: DISPUTE — Raise Happy Path
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_raise_dispute_happy_path() {
    let (env, client, employer, candidate, arbitrator, token) = setup_test();

    // 1. Init with short deadline
    let milestones = make_milestones(&env, &[("Final Task", 1_000_000_000)]);
    client.init_escrow(&employer, &candidate, &token, &arbitrator, &milestones, &1000u64);
    client.candidate_accept(&candidate);

    // 2. Advance time past deadline
    env.ledger().with_mut(|li| li.timestamp = 2000);

    // 3. Candidate raises dispute
    client.raise_dispute(&candidate);

    let escrow = client.get_escrow(&candidate);
    assert_eq!(escrow.state, EscrowState::Disputed);
}

// ═══════════════════════════════════════════════════════════════════
// T-21: DISPUTE — Raise Before Deadline Rejected
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_raise_dispute_too_early_rejected() {
    let (env, client, employer, candidate, arbitrator, token) = setup_test();

    client.init_escrow(&employer, &candidate, &token, &arbitrator, &make_milestones(&env, &[("T", 100)]), &1000u64);
    client.candidate_accept(&candidate);

    // time is 0, deadline is 1000 — too early
    let result = client.try_raise_dispute(&candidate);
    assert_eq!(result, Err(Ok(StellaError::DeadlineNotMet)));
}

// ═══════════════════════════════════════════════════════════════════
// T-22: DISPUTE — Resolve 50/50 Split
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_resolve_dispute_50_50_split() {
    let (env, client, employer, candidate, arbitrator, token) = setup_test();
    let token_client = TokenClient::new(&env, &token);

    // 1. Setup disputed escrow (500 XLM unreleased)
    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator, &token);
    client.candidate_accept(&candidate);
    env.ledger().with_mut(|li| li.timestamp = 20_000_000_000); // way past deadline
    client.raise_dispute(&candidate);

    let employer_before = token_client.balance(&employer);
    let candidate_before = token_client.balance(&candidate);

    // 2. Arbitrator resolves with 50/50 split (5000 bps)
    client.resolve_dispute(&arbitrator, &candidate, &5000u32);

    // 3. Verify funds split (250 XLM each)
    assert_eq!(token_client.balance(&candidate), candidate_before + 2_500_000_000);
    assert_eq!(token_client.balance(&employer), employer_before + 2_500_000_000);

    let escrow = client.get_escrow(&candidate);
    assert_eq!(escrow.state, EscrowState::Resolved);
}

// ═══════════════════════════════════════════════════════════════════
// T-23: DISPUTE — Resolve 100/0 Candidate Split
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_resolve_dispute_100_0_split() {
    let (env, client, employer, candidate, arbitrator, token) = setup_test();
    let token_client = TokenClient::new(&env, &token);

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator, &token);
    client.candidate_accept(&candidate);
    env.ledger().with_mut(|li| li.timestamp = 20_000_000_000);
    client.raise_dispute(&candidate);

    let candidate_before = token_client.balance(&candidate);

    // 100% to candidate (10000 bps)
    client.resolve_dispute(&arbitrator, &candidate, &10000u32);

    assert_eq!(token_client.balance(&candidate), candidate_before + 5_000_000_000);

    let escrow = client.get_escrow(&candidate);
    assert_eq!(escrow.state, EscrowState::Resolved);
}

// ═══════════════════════════════════════════════════════════════════
// T-24: DISPUTE — Wrong Arbitrator Rejected
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_resolve_dispute_wrong_arbitrator_rejected() {
    let (env, client, employer, candidate, arbitrator, token) = setup_test();

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator, &token);
    client.candidate_accept(&candidate);
    env.ledger().with_mut(|li| li.timestamp = 20_000_000_000);
    client.raise_dispute(&candidate);

    // Random address tries to resolve
    let random = Address::generate(&env);
    let result = client.try_resolve_dispute(&random, &candidate, &5000u32);
    assert_eq!(result, Err(Ok(StellaError::Unauthorized)));
}

// ═══════════════════════════════════════════════════════════════════
// T-25: DISPUTE — Resolve Not Disputed Rejected
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_resolve_not_disputed_rejected() {
    let (env, client, employer, candidate, arbitrator, token) = setup_test();

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator, &token);
    client.candidate_accept(&candidate);

    // Skip raise_dispute() — still Active
    let result = client.try_resolve_dispute(&arbitrator, &candidate, &5000u32);
    assert_eq!(result, Err(Ok(StellaError::NotDisputed)));
}
