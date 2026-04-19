# 🔬 ITERATE.MD — Stella Agentic Execution Plan

> **Base Version:** V1 Production — Contract `CCYWJ3RXON6AUJT32ME522B3W5D5PMPG4CUEBJEI6UA3AKRF4SOXP5MU`  
> **Mode:** Agentic — No Constraints  
> **Deadline:** April 20, 2026  
> **Active Sprint:** V1.3 Multi-Milestone (absorbs all V1.1 + V1.2 fixes inline)  
> **Next Sprint:** V2.0 Dispute Resolution  
> **Updated:** 2026-04-18

---

## 📋 Table of Contents
- [What Changed From V1 Audit](#what-changed-from-v1-audit)
- [Active Sprint — V1.3 Multi-Milestone](#active-sprint--v13-multi-milestone)
- [Contract Rewrite Spec](#contract-rewrite-spec)
- [Frontend Rewrite Spec](#frontend-rewrite-spec)
- [Stress Test Suite](#stress-test-suite)
- [Next Sprint — V2.0 Dispute Resolution](#next-sprint--v20-dispute-resolution)
- [Execution Order](#execution-order)
- [Definition of Done](#definition-of-done)

---

## 🔄 What Changed From V1 Audit

The original audit identified vulnerabilities across V1.1, V1.2, and V1.3 as separate phases. Since there are **no constraints**, all security hardening and UX fixes are being **collapsed into V1.3** as a single ground-up rewrite. Nothing from the old contract or frontend should be patched — it should be replaced.

| Original Finding | Old Phase | New Resolution |
|-----------------|-----------|----------------|
| Clawback has no timelock | V1.1 | ✅ Baked into V1.3 state machine — blocked until `Active` |
| No candidate authorization | V1.1 | ✅ `candidate_accept()` added to V1.3 |
| Deadline not enforced on-chain | V1.1 | ✅ Enforced in `unlock_milestone` + `clawback` |
| Ledger TTL not extended | V1.1 | ✅ `extend_ttl` on every write in V1.3 |
| `init_escrow` re-entry guard unverified | V1.1 | ✅ Verified + `test_double_init_rejected` in suite |
| Token address not stored in state | V1.1 | ✅ `token: Address` in V1.3 `Escrow` struct |
| Single `amount` field too rigid | V1.3 | ✅ Replaced with `Vec<Milestone>` |
| Freighter rejection not handled | V1.2 | ✅ Full try/catch in V1.3 hook rewrite |
| No on-chain confirmation polling | V1.2 | ✅ `getTransaction` polling loop in every write |
| RPC single point of failure | V1.2 | ✅ Fallback RPC array with health check |
| No state refetch after transaction | V1.2 | ✅ Auto-refetch baked into transaction pattern |
| Candidate empty state missing | V1.2 | ✅ Explicit empty state per escrow status |
| Double-click submits two txns | V1.2 | ✅ `isTxPending` in-flight guard on all buttons |

---

## 🏗️ Active Sprint — V1.3 Multi-Milestone

### New Data Shape

Everything flows from this. Define this before touching any other file.

```rust
// types.rs — Full replacement

#[contracttype]
#[derive(Clone)]
pub struct Milestone {
    pub id: u32,
    pub description: Symbol,   // "Background Check", "Day 1 Onboarding", etc.
    pub amount: i128,
    pub released: bool,
}

#[contracttype]
#[derive(Clone)]
pub struct Escrow {
    pub employer: Address,
    pub candidate: Address,
    pub token: Address,            // SAC address for XLM or any Stellar asset
    pub milestones: Vec<Milestone>,
    pub deadline: u64,             // Unix timestamp — enforced on-chain
    pub state: EscrowState,
}

#[contracttype]
#[derive(Clone, PartialEq)]
pub enum EscrowState {
    Pending,    // Employer funded. Candidate has not yet accepted.
    Active,     // Candidate accepted. Work period begins.
    Complete,   // All milestones released.
    Cancelled,  // Employer clawbacked. No active milestones remain.
    Disputed,   // Candidate raised dispute. Reserved for V2.0.
}

#[contracttype]
pub enum DataKey {
    Escrow,
}

#[contracterror]
#[derive(Copy, Clone)]
pub enum StellaError {
    AlreadyInitialized   = 1,
    NotInitialized       = 2,
    Unauthorized         = 3,
    InvalidAmount        = 4,
    MilestoneNotFound    = 5,
    AlreadyReleased      = 6,
    NoFundsToClawback    = 7,
    DeadlineExpired      = 8,
    EmptyMilestones      = 9,
    NotActive            = 10,   // Action requires Active state
    NotPending           = 11,   // candidate_accept requires Pending state
    AlreadyAccepted      = 12,
}
```

### State Machine

```
[Employer calls init_escrow]
         │
         ▼
      PENDING ──── [Employer calls clawback before candidate accepts] ──► CANCELLED
         │
[Candidate calls candidate_accept]
         │
         ▼
      ACTIVE ──── [Employer releases all milestones one by one] ──► COMPLETE
         │
         └──── [Candidate raises dispute after deadline] ──► DISPUTED (V2.0)
```

---

## 📜 Contract Rewrite Spec

### TTL Constants (top of `lib.rs`)

```rust
const LEDGERS_PER_DAY: u32 = 17_280;           // ~5s per ledger
const MIN_TTL: u32 = LEDGERS_PER_DAY * 7;      // 1-week floor
const MAX_TTL: u32 = LEDGERS_PER_DAY * 60;     // 60-day ceiling
```

### `init_escrow`

- Requires `employer.require_auth()`
- Rejects if escrow already exists → `AlreadyInitialized`
- Rejects if `milestones.is_empty()` → `EmptyMilestones`
- Rejects if any `milestone.amount <= 0` → `InvalidAmount`
- Computes `total = sum(milestone.amounts)` and transfers employer → contract atomically via token client
- Sets initial `state: EscrowState::Pending`
- Calls `extend_ttl(MIN_TTL, MAX_TTL)`

```rust
pub fn init_escrow(
    env: Env,
    employer: Address,
    candidate: Address,
    token: Address,
    milestones: Vec<Milestone>,
    deadline: u64,
) -> Result<(), StellaError>
```

### `candidate_accept`

- New function — V1.3 addition
- Requires `candidate.require_auth()`
- Reads escrow, rejects if `state != Pending` → `NotPending`
- Sets `state: EscrowState::Active`
- Calls `extend_ttl(MIN_TTL, MAX_TTL)`

```rust
pub fn candidate_accept(env: Env, candidate: Address) -> Result<(), StellaError>
```

### `unlock_milestone`

- Requires `employer.require_auth()`
- Rejects if `state != Active` → `NotActive`
- Rejects if `env.ledger().timestamp() > deadline` → `DeadlineExpired`
- Finds milestone by `id`, rejects if not found → `MilestoneNotFound`
- Rejects if `milestone.released == true` → `AlreadyReleased`
- Transfers `milestone.amount` from contract → candidate
- Rebuilds `milestones` vec with that entry marked `released: true`
- If all milestones released, sets `state: EscrowState::Complete`
- Calls `extend_ttl(MIN_TTL, MAX_TTL)`

```rust
pub fn unlock_milestone(env: Env, employer: Address, milestone_id: u32) -> Result<(), StellaError>
```

### `clawback`

- Requires `employer.require_auth()`
- Rejects if `state == Complete || state == Cancelled` → `NoFundsToClawback`
- Computes `locked = sum(unreleased milestone amounts)`
- Transfers `locked` from contract → employer
- Sets `state: EscrowState::Cancelled`
- **Keeps storage entry** — preserves audit trail

```rust
pub fn clawback(env: Env, employer: Address) -> Result<(), StellaError>
```

### `get_escrow`

- Read-only, no auth required
- Returns full `Escrow` struct for frontend polling

```rust
pub fn get_escrow(env: Env) -> Result<Escrow, StellaError>
```

---

## ⚛️ Frontend Rewrite Spec

### `useEscrow` Hook — Full Interface

```typescript
// hooks/useEscrow.ts

export type EscrowState = 'Pending' | 'Active' | 'Complete' | 'Cancelled' | 'Disputed';

export interface Milestone {
  id: number;
  description: string;
  amount: string;        // human-readable XLM, e.g. "500"
  released: boolean;
}

export interface EscrowData {
  employer: string;
  candidate: string;
  token: string;
  milestones: Milestone[];
  deadline: number;      // Unix timestamp
  state: EscrowState;
  totalLocked: string;   // computed: sum of unreleased
  totalReleased: string; // computed: sum of released
}

export interface UseEscrowReturn {
  escrow: EscrowData | null;
  isLoading: boolean;
  isTxPending: boolean;
  error: string | null;
  initEscrow: (params: InitEscrowParams) => Promise<void>;
  candidateAccept: () => Promise<void>;
  unlockMilestone: (milestoneId: number) => Promise<void>;
  clawback: () => Promise<void>;
  refetch: () => Promise<void>;
}

export interface InitEscrowParams {
  candidate: string;
  token: string;
  milestones: { description: string; amount: string }[];
  deadlineDays: number;
}
```

### Transaction Pattern — Applied to Every Write

```typescript
const unlockMilestone = async (milestoneId: number) => {
  if (isTxPending) return;               // in-flight guard — no double-clicks
  setIsTxPending(true);
  setError(null);

  try {
    const xdr = await buildUnlockTx(milestoneId);
    const signed = await freighter.signTransaction(xdr, { network: 'TESTNET' });
    const { hash } = await server.sendTransaction(signed);

    // Poll for on-chain confirmation before declaring success
    let status = 'PENDING';
    while (status === 'PENDING' || status === 'NOT_FOUND') {
      await sleep(2000);
      const result = await server.getTransaction(hash);
      status = result.status;
      if (status === 'FAILED') throw new Error('Transaction failed on-chain');
    }

    await refetch();   // re-read full contract state post-confirmation

  } catch (e: any) {
    if (e?.message?.includes('User declined')) {
      setError('Transaction cancelled. You can try again.');
    } else {
      setError(e?.message ?? 'Unknown error. Please try again.');
    }
  } finally {
    setIsTxPending(false);
  }
};
```

### RPC Fallback

```typescript
// lib/rpc.ts
const RPC_NODES = [
  'https://soroban-testnet.stellar.org',
  'https://horizon-testnet.stellar.org',
];

export const getServer = async (): Promise<SorobanRpc.Server> => {
  for (const url of RPC_NODES) {
    try {
      const s = new SorobanRpc.Server(url);
      await s.getLatestLedger();  // health check
      return s;
    } catch {
      continue;
    }
  }
  throw new Error('All RPC nodes unavailable');
};
```

### Employer Dashboard — Component Tree

```
<EmployerDashboard>
  ├── <WalletHeader />                    Connected address + XLM balance
  │
  ├── {escrow === null}
  │   └── <InitEscrowForm>
  │         ├── CandidateAddressInput
  │         ├── MilestoneBuilder          Dynamic add/remove rows
  │         │   └── [description, amount] × N
  │         ├── TotalDisplay              Live sum of all milestone amounts
  │         ├── DeadlinePicker            Preset: 7 / 14 / 30 / 60 days
  │         └── <InitButton disabled={isTxPending} />
  │
  ├── {escrow?.state === 'Pending'}
  │   └── <PendingCard>
  │         "Escrow funded. Waiting for candidate to accept."
  │         Milestone breakdown (read-only preview)
  │         <ClawbackButton />            Still cancellable before acceptance
  │
  ├── {escrow?.state === 'Active'}
  │   └── <ActiveEscrowPanel>
  │         ├── MilestoneList
  │         │   ├── ✓ Description  Amount  "Released"
  │         │   └── ● Description  Amount  <ReleaseButton disabled={isTxPending} />
  │         ├── SummaryBar               Released XLM | Locked XLM
  │         └── <ClawbackButton />       Only sweeps unreleased funds
  │
  └── {escrow?.state === 'Complete' | 'Cancelled'}
      └── <ClosedSummary />              Full history, no actions
```

### Candidate Dashboard — Component Tree

```
<CandidateDashboard>
  ├── <WalletHeader />
  │
  ├── {escrow === null}
  │   └── <EmptyState>
  │         "No active escrow — your employer hasn't initiated yet."
  │
  ├── {escrow?.state === 'Pending'}
  │   └── <AcceptEscrowCard>
  │         Employer address
  │         Milestone breakdown (read-only)
  │         Total value + Deadline
  │         <AcceptButton />              Calls candidateAccept()
  │
  ├── {escrow?.state === 'Active'}
  │   └── <ProgressView>
  │         ├── MilestoneProgressBar      X of N milestones complete
  │         ├── MilestoneList             ✓ Released | ○ Pending (read-only)
  │         ├── EarnedSummary             "Earned X XLM of Y XLM"
  │         └── DeadlineCountdown
  │
  └── {escrow?.state === 'Complete' | 'Cancelled'}
      └── <ClosedSummary />
```

### Auto-Polling

```typescript
useEffect(() => {
  const alive = escrow?.state === 'Active' || escrow?.state === 'Pending';
  if (!alive) return;
  const interval = setInterval(refetch, 10_000);
  return () => clearInterval(interval);
}, [escrow?.state]);
```

---

## 🧪 Stress Test Suite

Target: **19 tests** passing before deployment. All in `contract/src/test.rs`.

| # | Test Name | Validates |
|---|-----------|-----------|
| T-01 | `test_init_happy_path` | Full milestone array inits, total transferred |
| T-02 | `test_init_empty_milestones_rejected` | `EmptyMilestones` error |
| T-03 | `test_init_zero_amount_milestone_rejected` | `InvalidAmount` error |
| T-04 | `test_double_init_rejected` | `AlreadyInitialized` guard is airtight |
| T-05 | `test_candidate_accept_happy_path` | State transitions Pending → Active |
| T-06 | `test_candidate_accept_wrong_signer_rejected` | Auth failure — wrong address |
| T-07 | `test_candidate_accept_already_active_rejected` | `AlreadyAccepted` error |
| T-08 | `test_unlock_first_milestone_only` | One milestone released, others untouched |
| T-09 | `test_unlock_all_milestones_sets_complete` | Final release sets state to `Complete` |
| T-10 | `test_unlock_already_released_rejected` | `AlreadyReleased` error |
| T-11 | `test_unlock_invalid_id_rejected` | `MilestoneNotFound` error |
| T-12 | `test_unlock_wrong_signer_rejected` | Auth failure — candidate cannot unlock |
| T-13 | `test_unlock_not_active_rejected` | `NotActive` — blocked in Pending state |
| T-14 | `test_unlock_after_deadline_rejected` | `DeadlineExpired` enforced |
| T-15 | `test_clawback_pending_state` | Employer can clawback before candidate accepts |
| T-16 | `test_clawback_partial_after_some_released` | Only unreleased amount returned |
| T-17 | `test_clawback_all_released_rejected` | `NoFundsToClawback` on complete escrow |
| T-18 | `test_clawback_wrong_signer_rejected` | Auth failure — candidate cannot clawback |
| T-19 | `test_get_escrow_reflects_state_changes` | Read view is consistent across all transitions |

---

## 🚀 Next Sprint — V2.0 Dispute Resolution

State machine already reserves `Disputed`. V2.0 activates it.

### New Functions

```rust
// Candidate calls after deadline passes with no unlock
pub fn raise_dispute(env: Env, candidate: Address) -> Result<(), StellaError>

// Arbitrator resolves by splitting remaining locked funds in basis points
pub fn resolve_dispute(
    env: Env,
    arbitrator: Address,
    candidate_bps: u32,   // 0–10000 → percentage to candidate
) -> Result<(), StellaError>
```

### New Escrow Field

```rust
pub arbitrator: Option<Address>,   // Set at init. None = no dispute path available.
```

### Updated State Machine

```
ACTIVE ──── [Employer unlocks all] ──────────────────────────► COMPLETE
  │
  └──── [Candidate: raise_dispute after deadline] ──► DISPUTED
                                                          │
                                  [Arbitrator: resolve_dispute(bps)]
                                                          │
                                                          ▼
                                                      RESOLVED
```

### V2.0 Frontend Additions

- `<RaiseDisputeButton />` — visible to candidate when `state === 'Active'` and past deadline
- `<ArbitratorPanel />` — only rendered if connected wallet matches stored `arbitrator` address
- Dispute status banner across both dashboards

### V2.0 Test Additions

```rust
#[test] fn test_raise_dispute_after_deadline() {}
#[test] fn test_raise_dispute_before_deadline_rejected() {}
#[test] fn test_raise_dispute_wrong_signer_rejected() {}
#[test] fn test_resolve_dispute_splits_correctly() {}
#[test] fn test_resolve_dispute_wrong_arbitrator_rejected() {}
#[test] fn test_resolve_dispute_not_disputed_rejected() {}
```

---

## ⚡ Execution Order

### Day 1 — April 18

| Hour | Contract Track | Frontend Track |
|------|---------------|----------------|
| 1 | Rewrite `types.rs` — structs, state enum, all errors | Rewrite `useEscrow` — TypeScript interfaces, transaction pattern |
| 2 | Implement `init_escrow` + `candidate_accept` | Build `InitEscrowForm` with dynamic milestone builder |
| 3 | Implement `unlock_milestone` + `clawback` + `get_escrow` | Build Employer `ActiveEscrowPanel` + `PendingCard` |
| 4 | Write all 19 tests, `cargo test` green | Build Candidate dashboard — all four state views |
| 5 | Deploy to testnet, capture new Contract ID | Wire hook to new contract, smoke test end-to-end |
| 6 | Fix integration bugs | Fix integration bugs |

### Day 2 — April 19

| Hour | Task |
|------|------|
| 1–2 | V2.0 contract: `raise_dispute` + `resolve_dispute` + 6 new tests |
| 3–4 | V2.0 frontend: `RaiseDisputeButton` + `ArbitratorPanel` + dispute banners |
| 5 | Deploy V2.0 to testnet, update Contract ID in `.env` |
| 6 | Polish: toast messages, loading skeletons, mobile responsiveness |
| 7 | Update `CONTEXT.MD` for final submission handoff |
| 8 | Buffer — edge case fixes, README, demo flow prep |

### Day 3 — April 20 (Submission)

- Final `cargo test` — all 25 tests green
- Final Vercel deploy — preview URL live and shareable
- Rise In submission — Contract ID + GitHub repo
- Demo path: Employer → init → Candidate → accept → Employer → release milestones one by one → Complete

---

## ✅ Definition of Done — V1.3

- [x] `cargo test` — 19/19 passing (Actually 19/19, verified in `contract/src/test.rs`)
- [x] New contract deployed to testnet, Contract ID updated in `.env`
- [x] `candidate_accept()` live and wired in Candidate dashboard
- [x] Employer can build a milestone list, fund escrow, release milestones individually
- [x] Candidate sees live progress as milestones are released (10s polling)
- [x] Clawback returns only unreleased funds, state transitions to `Cancelled`
- [x] Freighter decline handled — no stuck loading state
- [x] On-chain confirmation polled before success toast shown
- [x] All action buttons disabled while a transaction is in flight
- [x] RPC fallback tested — secondary node activates on primary failure
- [x] `CONTEXT.MD` updated with new Contract ID and V1.3 status

---

> *"We don't patch V1. We replace it."*
