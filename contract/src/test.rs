//! Stella — Contract Tests
//!
//! 4 tests covering the MVP escrow lifecycle:
//!   1. Happy path: init → unlock partial → unlock rest → complete
//!   2. Clawback: init → partial claim → employer clawback
//!   3. Duplicate prevention: second init for same candidate fails
//!   4. Overclaim prevention: claiming more than remaining fails

use crate::{StellaContract, StellaContractClient};
use crate::types::StellaError;
use soroban_sdk::{
    testutils::Address as _,
    token::{StellarAssetClient, Client as TokenClient},
    Address, Env,
};

// ─── Test Helpers ────────────────────────────────────────────────

/// Sets up a clean test environment with:
///   - A registered Stella contract
///   - A native XLM token contract (SAC)
///   - Employer and candidate addresses with funded balances
///   - Contract initialized with the token address
fn setup_test() -> (
    Env,
    StellaContractClient<'static>,
    Address,    // employer
    Address,    // candidate
    Address,    // token (XLM SAC)
) {
    let env = Env::default();

    // Mock ALL auth calls — required for tests or require_auth() panics
    env.mock_all_auths();

    // Register the Stella contract
    let contract_id = env.register(StellaContract, ());
    let client = StellaContractClient::new(&env, &contract_id);

    // Create a native XLM token (Stellar Asset Contract)
    let admin = Address::generate(&env);
    let token_address = env.register_stellar_asset_contract_v2(admin.clone()).address();
    let token_admin_client = StellarAssetClient::new(&env, &token_address);

    // Generate employer and candidate addresses
    let employer = Address::generate(&env);
    let candidate = Address::generate(&env);

    // Fund the employer with 10,000 XLM (in stroops)
    // 10,000 XLM = 100,000,000,000 stroops
    token_admin_client.mint(&employer, &100_000_000_000i128);

    // Initialize the contract with admin and token address
    client.initialize(&admin, &token_address);

    (env, client, employer, candidate, token_address)
}

// ─── Test 1: Happy Path — Full Escrow Lifecycle ──────────────────

#[test]
fn test_full_escrow_lifecycle() {
    let (_env, client, employer, candidate, token_address) = setup_test();
    let token_client = TokenClient::new(&_env, &token_address);

    // Employer locks 500 XLM (5,000,000,000 stroops) for candidate
    let amount: i128 = 5_000_000_000;
    let deadline: u64 = 9_999_999_999; // far future

    client.init_escrow(&employer, &candidate, &amount, &deadline);

    // Verify escrow was created correctly
    let escrow = client.get_escrow(&candidate);
    assert_eq!(escrow.employer, employer);
    assert_eq!(escrow.candidate, candidate);
    assert_eq!(escrow.total_amount, amount);
    assert_eq!(escrow.unlocked_amount, 0);
    assert!(escrow.is_active);

    // Verify XLM was transferred from employer to contract
    let contract_balance = token_client.balance(&client.address);
    assert_eq!(contract_balance, amount);

    // Candidate claims first milestone: 200 XLM
    let claim_1: i128 = 2_000_000_000;
    client.unlock_milestone(&candidate, &claim_1);

    let escrow = client.get_escrow(&candidate);
    assert_eq!(escrow.unlocked_amount, claim_1);
    assert!(escrow.is_active); // still active — not fully claimed

    // Candidate claims remaining: 300 XLM
    let claim_2: i128 = 3_000_000_000;
    client.unlock_milestone(&candidate, &claim_2);

    let escrow = client.get_escrow(&candidate);
    assert_eq!(escrow.unlocked_amount, amount); // fully claimed
    assert!(!escrow.is_active); // now inactive — escrow completed

    // Verify candidate received all funds
    let candidate_balance = token_client.balance(&candidate);
    assert_eq!(candidate_balance, amount);
}

// ─── Test 2: Clawback — Employer Recovers Remaining Funds ────────

#[test]
fn test_clawback_returns_remaining() {
    let (_env, client, employer, candidate, token_address) = setup_test();
    let token_client = TokenClient::new(&_env, &token_address);

    // Employer locks 500 XLM
    let amount: i128 = 5_000_000_000;
    client.init_escrow(&employer, &candidate, &amount, &9_999_999_999u64);

    // Candidate claims 200 XLM
    let claimed: i128 = 2_000_000_000;
    client.unlock_milestone(&candidate, &claimed);

    // Record employer balance before clawback
    let employer_before = token_client.balance(&employer);

    // Employer claws back remaining 300 XLM
    let returned = client.clawback(&candidate);
    let expected_remaining: i128 = 3_000_000_000;
    assert_eq!(returned, expected_remaining);

    // Verify employer got the funds back
    let employer_after = token_client.balance(&employer);
    assert_eq!(employer_after, employer_before + expected_remaining);

    // Verify escrow is now inactive
    let escrow = client.get_escrow(&candidate);
    assert!(!escrow.is_active);
}

// ─── Test 3: Duplicate Escrow Prevention ─────────────────────────

#[test]
fn test_duplicate_escrow_fails() {
    let (_env, client, employer, candidate, _token) = setup_test();

    // Create first escrow — should succeed
    let amount: i128 = 5_000_000_000;
    client.init_escrow(&employer, &candidate, &amount, &9_999_999_999u64);

    // Attempt second escrow for same candidate — must fail
    let result = client.try_init_escrow(&employer, &candidate, &amount, &9_999_999_999u64);

    // Verify it failed with EscrowAlreadyExists (error code 1)
    assert_eq!(result, Err(Ok(StellaError::EscrowAlreadyExists)));
}

// ─── Test 4: Overclaim Prevention ────────────────────────────────

#[test]
fn test_overclaim_fails() {
    let (_env, client, employer, candidate, _token) = setup_test();

    // Create escrow for 500 XLM
    let amount: i128 = 5_000_000_000;
    client.init_escrow(&employer, &candidate, &amount, &9_999_999_999u64);

    // Attempt to claim 600 XLM — more than total — must fail
    let overclaim: i128 = 6_000_000_000;
    let result = client.try_unlock_milestone(&candidate, &overclaim);

    // Verify it failed with ExceedsTotal (error code 4)
    assert_eq!(result, Err(Ok(StellaError::ExceedsTotal)));
}
