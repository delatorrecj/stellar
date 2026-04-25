//! Stella — Contract Tests (V1.4 Composite-Key)
//!
//! 25 tests covering the full milestone-based escrow lifecycle:
//!
//!   INIT (T-01 to T-04):
//!     T-01: Happy path — full init with milestones
//!     T-02: Empty milestones rejected
//!     T-03: Zero amount milestone rejected
//!     T-04: Double init for same employer-candidate pair rejected
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
use crate::types::{EscrowState, StellaError};
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    token::{StellarAssetClient, Client as TokenClient},
    Address, Env, String, Vec,
};

// ─── Test Helpers ────────────────────────────────────────────────

/// Helper to create descriptions vector.
fn make_descriptions(env: &Env, items: &[(&str, i128)]) -> Vec<String> {
    let mut v = Vec::new(env);
    for (desc, _) in items {
        v.push_back(String::from_str(env, desc));
    }
    v
}

/// Helper to create amounts vector.
fn make_amounts(env: &Env, items: &[(&str, i128)]) -> Vec<i128> {
    let mut v = Vec::new(env);
    for (_, amount) in items {
        v.push_back(*amount);
    }
    v
}

/// Sets up a clean test environment.
fn setup_test() -> (
    Env,
    StellaContractClient<'static>,
    Address, // employer
    Address, // candidate
    Address, // arbitrator
    Address, // token (XLM SAC)
) {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(StellaContract, ());
    let client = StellaContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let token_address = env
        .register_stellar_asset_contract_v2(admin.clone())
        .address();
    let token_admin_client = StellarAssetClient::new(&env, &token_address);

    let employer = Address::generate(&env);
    let candidate = Address::generate(&env);
    let arbitrator = Address::generate(&env);

    token_admin_client.mint(&employer, &100_000_000_000i128);
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
) {
    let items = [
        ("Background Check", 1_000_000_000),    // 100 XLM
        ("Day 1 Onboarding", 2_000_000_000),     // 200 XLM
        ("Equipment Pickup", 2_000_000_000),      // 200 XLM
    ];
    let descriptions = make_descriptions(env, &items);
    let amounts = make_amounts(env, &items);
    let deadline: u64 = 9_999_999_999;
    client.init_escrow(employer, candidate, arbitrator, &descriptions, &amounts, &deadline);
}

// ═══════════════════════════════════════════════════════════════════
// T-01: INIT — Happy Path
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_init_happy_path() {
    let (env, client, employer, candidate, arbitrator, token) = setup_test();
    let token_client = TokenClient::new(&env, &token);

    let items = [
        ("Background Check", 1_000_000_000),
        ("Day 1 Onboarding", 2_000_000_000),
        ("Equipment Pickup", 2_000_000_000),
    ];
    let descriptions = make_descriptions(&env, &items);
    let amounts = make_amounts(&env, &items);
    let total: i128 = 5_000_000_000;

    client.init_escrow(&employer, &candidate, &arbitrator, &descriptions, &amounts, &9_999_999_999u64);

    let escrow = client.get_escrow(&employer, &candidate);
    assert_eq!(escrow.employer, employer);
    assert_eq!(escrow.candidate, candidate);
    assert_eq!(escrow.state, EscrowState::Pending);
    assert_eq!(escrow.milestones.len(), 3);

    let contract_balance = token_client.balance(&client.address);
    assert_eq!(contract_balance, total);
}

// ═══════════════════════════════════════════════════════════════════
// T-02: INIT — Empty Milestones Rejected
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_init_empty_milestones_rejected() {
    let (env, client, employer, candidate, arbitrator, _token) = setup_test();

    let empty_desc = Vec::new(&env);
    let empty_amt = Vec::new(&env);
    let result = client.try_init_escrow(&employer, &candidate, &arbitrator, &empty_desc, &empty_amt, &9_999_999_999u64);

    assert_eq!(result, Err(Ok(StellaError::EmptyMilestones)));
}

// ═══════════════════════════════════════════════════════════════════
// T-03: INIT — Zero Amount Milestone Rejected
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_init_zero_amount_milestone_rejected() {
    let (env, client, employer, candidate, arbitrator, _token) = setup_test();

    let items = [("Valid", 1_000_000_000), ("Zero", 0)];
    let descriptions = make_descriptions(&env, &items);
    let amounts = make_amounts(&env, &items);
    let result = client.try_init_escrow(&employer, &candidate, &arbitrator, &descriptions, &amounts, &9_999_999_999u64);

    assert_eq!(result, Err(Ok(StellaError::InvalidAmount)));
}

// ═══════════════════════════════════════════════════════════════════
// T-04: INIT — Double Init Rejected
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_double_init_rejected() {
    let (env, client, employer, candidate, arbitrator, _token) = setup_test();

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator);

    let items = [("Duplicate", 1_000_000_000)];
    let descriptions = make_descriptions(&env, &items);
    let amounts = make_amounts(&env, &items);
    let result = client.try_init_escrow(&employer, &candidate, &arbitrator, &descriptions, &amounts, &9_999_999_999u64);

    assert_eq!(result, Err(Ok(StellaError::EscrowAlreadyExists)));
}

// ═══════════════════════════════════════════════════════════════════
// T-05: CANDIDATE ACCEPT — Happy Path
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_candidate_accept_happy_path() {
    let (env, client, employer, candidate, arbitrator, _token) = setup_test();

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator);

    client.candidate_accept(&employer, &candidate);

    let escrow = client.get_escrow(&employer, &candidate);
    assert_eq!(escrow.state, EscrowState::Active);
}

// ═══════════════════════════════════════════════════════════════════
// T-06: CANDIDATE ACCEPT — Wrong Signer Rejected
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_candidate_accept_wrong_signer_rejected() {
    let (env, client, employer, candidate, arbitrator, _token) = setup_test();

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator);

    let random = Address::generate(&env);
    let result = client.try_candidate_accept(&employer, &random);

    assert_eq!(result, Err(Ok(StellaError::EscrowNotFound)));
}

// ═══════════════════════════════════════════════════════════════════
// T-07: CANDIDATE ACCEPT — Already Active Rejected
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_candidate_accept_already_active_rejected() {
    let (env, client, employer, candidate, arbitrator, _token) = setup_test();

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator);
    client.candidate_accept(&employer, &candidate);

    let result = client.try_candidate_accept(&employer, &candidate);

    assert_eq!(result, Err(Ok(StellaError::AlreadyAccepted)));
}

// ═══════════════════════════════════════════════════════════════════
// T-08: UNLOCK — First Milestone Only
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_unlock_first_milestone_only() {
    let (env, client, employer, candidate, arbitrator, token) = setup_test();
    let token_client = TokenClient::new(&env, &token);

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator);
    client.candidate_accept(&employer, &candidate);

    client.unlock_milestone(&employer, &candidate, &0u32);

    let escrow = client.get_escrow(&employer, &candidate);
    assert!(escrow.milestones.get(0).unwrap().released);
    assert!(!escrow.milestones.get(1).unwrap().released);
    assert!(!escrow.milestones.get(2).unwrap().released);
    assert_eq!(escrow.state, EscrowState::Active);

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

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator);
    client.candidate_accept(&employer, &candidate);

    client.unlock_milestone(&employer, &candidate, &0u32);
    client.unlock_milestone(&employer, &candidate, &1u32);
    client.unlock_milestone(&employer, &candidate, &2u32);

    let escrow = client.get_escrow(&employer, &candidate);
    assert_eq!(escrow.state, EscrowState::Complete);

    let candidate_balance = token_client.balance(&candidate);
    assert_eq!(candidate_balance, 5_000_000_000);
}

// ═══════════════════════════════════════════════════════════════════
// T-10: UNLOCK — Already Released Rejected
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_unlock_already_released_rejected() {
    let (env, client, employer, candidate, arbitrator, _token) = setup_test();

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator);
    client.candidate_accept(&employer, &candidate);
    client.unlock_milestone(&employer, &candidate, &0u32);

    let result = client.try_unlock_milestone(&employer, &candidate, &0u32);
    assert_eq!(result, Err(Ok(StellaError::AlreadyReleased)));
}

// ═══════════════════════════════════════════════════════════════════
// T-11: UNLOCK — Invalid Milestone ID Rejected
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_unlock_invalid_id_rejected() {
    let (env, client, employer, candidate, arbitrator, _token) = setup_test();

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator);
    client.candidate_accept(&employer, &candidate);

    let result = client.try_unlock_milestone(&employer, &candidate, &99u32);
    assert_eq!(result, Err(Ok(StellaError::MilestoneNotFound)));
}

// ═══════════════════════════════════════════════════════════════════
// T-12: UNLOCK — Wrong Signer (Candidate) Rejected
// ═══════════════════════════════════════════════════════════════════════

#[test]
fn test_unlock_wrong_signer_rejected() {
    let (env, client, employer, candidate, arbitrator, _token) = setup_test();

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator);
    client.candidate_accept(&employer, &candidate);

    let result = client.try_unlock_milestone(&candidate, &candidate, &0u32);
    assert_eq!(result, Err(Ok(StellaError::EscrowNotFound)));
}

// ═══════════════════════════════════════════════════════════════════
// T-13: UNLOCK — Not Active (Pending) Rejected
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_unlock_not_active_rejected() {
    let (env, client, employer, candidate, arbitrator, _token) = setup_test();

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator);

    let result = client.try_unlock_milestone(&employer, &candidate, &0u32);
    assert_eq!(result, Err(Ok(StellaError::NotActive)));
}

// ═══════════════════════════════════════════════════════════════════
// T-14: UNLOCK — After Deadline Rejected
// ═══════════════════════════════════════════════════════════════════════

#[test]
fn test_unlock_after_deadline_rejected() {
    let (env, client, employer, candidate, arbitrator, _token) = setup_test();

    let items = [("Task", 1_000_000_000)];
    let descriptions = make_descriptions(&env, &items);
    let amounts = make_amounts(&env, &items);
    client.init_escrow(&employer, &candidate, &arbitrator, &descriptions, &amounts, &1000u64);
    client.candidate_accept(&employer, &candidate);

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

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator);

    let employer_before = token_client.balance(&employer);

    let returned = client.clawback(&employer, &candidate);
    assert_eq!(returned, 5_000_000_000);

    let escrow = client.get_escrow(&employer, &candidate);
    assert_eq!(escrow.state, EscrowState::Cancelled);

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

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator);
    client.candidate_accept(&employer, &candidate);

    client.unlock_milestone(&employer, &candidate, &0u32);

    let employer_before = token_client.balance(&employer);

    let returned = client.clawback(&employer, &candidate);
    assert_eq!(returned, 4_000_000_000);

    let employer_after = token_client.balance(&employer);
    assert_eq!(employer_after, employer_before + 4_000_000_000);

    let escrow = client.get_escrow(&employer, &candidate);
    assert_eq!(escrow.state, EscrowState::Cancelled);
}

// ═══════════════════════════════════════════════════════════════════
// T-17: CLAWBACK — All Released Rejected
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_clawback_all_released_rejected() {
    let (env, client, employer, candidate, arbitrator, _token) = setup_test();

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator);
    client.candidate_accept(&employer, &candidate);

    client.unlock_milestone(&employer, &candidate, &0u32);
    client.unlock_milestone(&employer, &candidate, &1u32);
    client.unlock_milestone(&employer, &candidate, &2u32);

    let result = client.try_clawback(&employer, &candidate);
    assert_eq!(result, Err(Ok(StellaError::NoFundsToClawback)));
}

// ═══════════════════════════════════════════════════════════════════
// T-18: CLAWBACK — Wrong Signer Rejected
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_clawback_wrong_signer_rejected() {
    let (env, client, employer, candidate, arbitrator, _token) = setup_test();

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator);

    let result = client.try_clawback(&candidate, &candidate);
    assert_eq!(result, Err(Ok(StellaError::EscrowNotFound)));
}

// ═══════════════════════════════════════════════════════════════════
// T-19: GET ESCROW — Reflects All State Changes
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_get_escrow_reflects_state_changes() {
    let (env, client, employer, candidate, arbitrator, _token) = setup_test();

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator);

    let e = client.get_escrow(&employer, &candidate);
    assert_eq!(e.state, EscrowState::Pending);
    assert_eq!(e.milestones.len(), 3);

    client.candidate_accept(&employer, &candidate);
    let e = client.get_escrow(&employer, &candidate);
    assert_eq!(e.state, EscrowState::Active);

    client.unlock_milestone(&employer, &candidate, &0u32);
    let e = client.get_escrow(&employer, &candidate);
    assert_eq!(e.state, EscrowState::Active);
    assert!(e.milestones.get(0).unwrap().released);
    assert!(!e.milestones.get(1).unwrap().released);

    client.unlock_milestone(&employer, &candidate, &1u32);
    client.unlock_milestone(&employer, &candidate, &2u32);
    let e = client.get_escrow(&employer, &candidate);
    assert_eq!(e.state, EscrowState::Complete);
}

// ═══════════════════════════════════════════════════════════════════
// T-20: DISPUTE — Raise Happy Path
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_raise_dispute_happy_path() {
    let (env, client, employer, candidate, arbitrator, _token) = setup_test();

    let items = [("Final Task", 1_000_000_000)];
    let descriptions = make_descriptions(&env, &items);
    let amounts = make_amounts(&env, &items);
    client.init_escrow(&employer, &candidate, &arbitrator, &descriptions, &amounts, &1000u64);
    client.candidate_accept(&employer, &candidate);

    env.ledger().with_mut(|li| li.timestamp = 2000);

    client.raise_dispute(&employer, &candidate);

    let escrow = client.get_escrow(&employer, &candidate);
    assert_eq!(escrow.state, EscrowState::Disputed);
}

// ═══════════════════════════════════════════════════════════════════
// T-21: DISPUTE — Raise Before Deadline Rejected
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_raise_dispute_too_early_rejected() {
    let (env, client, employer, candidate, arbitrator, _token) = setup_test();

    let items = [("T", 100)];
    let descriptions = make_descriptions(&env, &items);
    let amounts = make_amounts(&env, &items);
    client.init_escrow(&employer, &candidate, &arbitrator, &descriptions, &amounts, &1000u64);
    client.candidate_accept(&employer, &candidate);

    let result = client.try_raise_dispute(&employer, &candidate);
    assert_eq!(result, Err(Ok(StellaError::DeadlineNotMet)));
}

// ═══════════════════════════════════════════════════════════════════════════
// T-22: DISPUTE — Resolve 50/50 Split
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_resolve_dispute_50_50_split() {
    let (env, client, employer, candidate, arbitrator, token) = setup_test();
    let token_client = TokenClient::new(&env, &token);

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator);
    client.candidate_accept(&employer, &candidate);
    env.ledger().with_mut(|li| li.timestamp = 20_000_000_000);
    client.raise_dispute(&employer, &candidate);

    let employer_before = token_client.balance(&employer);
    let candidate_before = token_client.balance(&candidate);

    client.resolve_dispute(&arbitrator, &employer, &candidate, &5000u32);

    assert_eq!(token_client.balance(&candidate), candidate_before + 2_500_000_000);
    assert_eq!(token_client.balance(&employer), employer_before + 2_500_000_000);

    let escrow = client.get_escrow(&employer, &candidate);
    assert_eq!(escrow.state, EscrowState::Resolved);
}

// ═══════════════════════════════════════════════════════════════════════════
// T-23: DISPUTE — Resolve 100/0 Candidate Split
// ═══════════════════════════════════════════════════════════════════════════

#[test]
fn test_resolve_dispute_100_0_split() {
    let (env, client, employer, candidate, arbitrator, token) = setup_test();
    let token_client = TokenClient::new(&env, &token);

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator);
    client.candidate_accept(&employer, &candidate);
    env.ledger().with_mut(|li| li.timestamp = 20_000_000_000);
    client.raise_dispute(&employer, &candidate);

    let candidate_before = token_client.balance(&candidate);

    client.resolve_dispute(&arbitrator, &employer, &candidate, &10000u32);

    assert_eq!(token_client.balance(&candidate), candidate_before + 5_000_000_000);

    let escrow = client.get_escrow(&employer, &candidate);
    assert_eq!(escrow.state, EscrowState::Resolved);
}

// ═══════════════════════════════════════════════════════════════════════════
// T-24: DISPUTE — Wrong Arbitrator Rejected
// ═══════════════════════════════════════════════════════════════════════════

#[test]
fn test_resolve_dispute_wrong_arbitrator_rejected() {
    let (env, client, employer, candidate, arbitrator, _token) = setup_test();

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator);
    client.candidate_accept(&employer, &candidate);
    env.ledger().with_mut(|li| li.timestamp = 20_000_000_000);
    client.raise_dispute(&employer, &candidate);

    let random = Address::generate(&env);
    let result = client.try_resolve_dispute(&random, &employer, &candidate, &5000u32);
    assert_eq!(result, Err(Ok(StellaError::Unauthorized)));
}

// ═══════════════════════════════════════════════════════════════════════════
// T-25: DISPUTE — Resolve Not Disputed Rejected
// ═══════════════════════════════════════════════════════════════════════════

#[test]
fn test_resolve_not_disputed_rejected() {
    let (env, client, employer, candidate, arbitrator, _token) = setup_test();

    init_standard_escrow(&env, &client, &employer, &candidate, &arbitrator);
    client.candidate_accept(&employer, &candidate);

    let result = client.try_resolve_dispute(&arbitrator, &employer, &candidate, &5000u32);
    assert_eq!(result, Err(Ok(StellaError::NotDisputed)));
}
