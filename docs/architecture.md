# Stella — Architecture Document

> Milestone-based escrow dApp on the Stellar (Soroban) smart contract platform.

---

## 1. System Overview

Stella is a fully decentralized escrow application. There is no traditional backend server — the "server" is a Soroban smart contract living on the Stellar Testnet. The frontend communicates directly with the Soroban RPC node.

```
┌─────────────────────────────────────────┐
│         Client Side (Browser)           │
│                                         │
│  ┌──────────────────┐  ┌─────────────┐  │
│  │  React Web App   │◄─►│  Freighter  │  │
│  │  (Vite + TS)     │  │  Wallet     │  │
│  └────────┬─────────┘  └─────────────┘  │
│           │ Builds & Submits XDR        │
└───────────┼─────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│         Stellar Network (Testnet)       │
│                                         │
│  ┌──────────────┐   ┌─────────────────┐ │
│  │  Soroban RPC │──►│  Stella Smart   │ │
│  │  (HTTPS)     │   │  Contract       │ │
│  └──────────────┘   │  (Rust/WASM)    │ │
│                     └─────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 2. Smart Contract State Machine

The contract operates as a strict state machine keyed by a **composite identifier**: `(Employer Address, Candidate Address)`. This allows one candidate to have independent escrows from multiple employers simultaneously.

```
                  ┌─────────────┐
     init_escrow  │             │
    ──────────────►   Pending   │
                  │             │
                  └──────┬──────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
   candidate_accept   clawback         │
          │              │              │
          ▼              ▼              │
   ┌────────────┐  ┌───────────┐       │
   │   Active   │  │ Cancelled │       │
   └─────┬──────┘  └───────────┘       │
         │                             │
    ┌────┼──────────────┐              │
    │    │              │              │
unlock   clawback   raise_dispute      │
(last)   │         (post-deadline)     │
    │    │              │              │
    ▼    ▼              ▼              │
┌──────────┐  ┌───────────┐ ┌─────────┴──┐
│ Complete │  │ Cancelled │ │  Disputed  │
└──────────┘  └───────────┘ └─────┬──────┘
                                   │
                            resolve_dispute
                                   │
                                   ▼
                            ┌────────────┐
                            │  Resolved  │
                            └────────────┘
```

### State Transition Table

| From State | Trigger | To State | Auth Required |
|---|---|---|---|
| — | `init_escrow()` | `Pending` | Employer |
| `Pending` | `candidate_accept()` | `Active` | Candidate |
| `Pending` | `clawback()` | `Cancelled` | Employer |
| `Active` | `unlock_milestone()` (partial) | `Active` | Employer |
| `Active` | `unlock_milestone()` (last) | `Complete` | Employer |
| `Active` | `clawback()` | `Cancelled` | Employer |
| `Active` | `raise_dispute()` (post-deadline) | `Disputed` | Candidate |
| `Disputed` | `resolve_dispute()` | `Resolved` | Arbitrator |

---

## 3. Contract Storage Schema

All state is stored in **persistent storage** on the Soroban ledger.

```rust
// Composite key for escrow lookup
enum DataKey {
    Admin,                              // Instance: admin address
    Token,                              // Instance: XLM SAC address
    Escrow(Address, Address),           // Persistent: (employer, candidate) → Escrow
    CandidateEscrows(Address),          // Persistent: candidate → Vec<employer>
}

// Core escrow struct
struct Escrow {
    employer:   Address,
    candidate:  Address,
    token:      Address,       // XLM SAC
    arbitrator: Address,       // Designated dispute resolver
    milestones: Vec<Milestone>,
    deadline:   u64,           // UNIX timestamp
    state:      EscrowState,
}

// Per-milestone tracking
struct Milestone {
    id:          u32,
    description: String,
    amount:      i128,         // Stroops (1 XLM = 10,000,000 stroops)
    released:    bool,
}
```

**Storage Strategy:**
- `DataKey::Admin` and `DataKey::Token` → `instance()` storage (lives with contract)
- `DataKey::Escrow` and `DataKey::CandidateEscrows` → `persistent()` storage (TTL managed)
- TTL is extended on every write: `MIN_TTL = 7 days`, `MAX_TTL = 60 days`

---

## 4. Smart Contract Security Model

Every mutating function follows the pattern:

```
Auth → Validate → Check State → Write State → Transfer Tokens → Emit Event
```

| Principle | Implementation |
|---|---|
| **Auth-first** | `employer.require_auth()` / `candidate.require_auth()` called before any logic |
| **Re-entrancy protection** | State is written to storage BEFORE token transfers |
| **Checked arithmetic** | All `i128` operations use `checked_add` / `checked_sub` |
| **Composite key isolation** | Each escrow is uniquely keyed — no cross-escrow contamination |
| **BPS validation** | `resolve_dispute` validates `candidate_bps ∈ [0, 10000]` |
| **TTL management** | Every write extends persistent storage TTL to prevent archival |
| **No-std** | `#![no_std]` — no standard library, minimizes attack surface |

---

## 5. Smart Contract API Reference

| Function | Auth | Description | Returns |
|---|---|---|---|
| `initialize(admin, token)` | Admin | One-time setup | `Result<(), StellaError>` |
| `init_escrow(employer, candidate, arbitrator, descriptions, amounts, deadline)` | Employer | Lock funds + create milestones | `Result<(), StellaError>` |
| `candidate_accept(employer, candidate)` | Candidate | Accept offer → Active | `Result<(), StellaError>` |
| `unlock_milestone(employer, candidate, milestone_id)` | Employer | Release specific milestone | `Result<(), StellaError>` |
| `clawback(employer, candidate)` | Employer | Recover unreleased funds | `Result<i128, StellaError>` |
| `raise_dispute(employer, candidate)` | Candidate | Dispute post-deadline | `Result<(), StellaError>` |
| `resolve_dispute(arbitrator, employer, candidate, candidate_bps)` | Arbitrator | BPS-based fund split | `Result<(), StellaError>` |
| `get_escrow(employer, candidate)` | Public | Read escrow state | `Result<Escrow, StellaError>` |
| `get_candidate_escrows(candidate)` | Public | List employer addresses | `Vec<Address>` |

### Error Codes

| Error | Code | Meaning |
|---|---|---|
| `AlreadyInitialized` | 1 | Contract already set up |
| `NotInitialized` | 2 | Contract not yet initialized |
| `EscrowAlreadyExists` | 3 | Active escrow exists for this pair |
| `EscrowNotFound` | 4 | No escrow for this (employer, candidate) pair |
| `EmptyMilestones` | 5 | Milestone list is empty or mismatched |
| `InvalidAmount` | 6 | Milestone amount is zero or negative |
| `NotPending` | 7 | Action requires Pending state |
| `NotActive` | 8 | Action requires Active state |
| `AlreadyAccepted` | 9 | Candidate already accepted |
| `AlreadyReleased` | 10 | Milestone already paid out |
| `MilestoneNotFound` | 11 | Invalid milestone ID |
| `NoFundsToClawback` | 12 | All funds already released |
| `DeadlineExpired` | 13 | Deadline has passed — cannot unlock |
| `DeadlineNotMet` | 14 | Deadline not yet reached — cannot dispute |
| `Unauthorized` | 15 | Caller is not the authorized actor |
| `NotDisputed` | 16 | Escrow is not in Disputed state |
| `InvalidBps` | 17 | BPS value exceeds 10000 |

---

## 6. On-Chain Events

The contract emits 7 event types for off-chain indexing:

| Event | Topics | Data | Trigger |
|---|---|---|---|
| `escrow_created` | `["escrow", "created"]` | `{employer, candidate, total}` | `init_escrow()` |
| `candidate_accepted` | `["escrow", "accepted"]` | `{candidate}` | `candidate_accept()` |
| `milestone_unlocked` | `["escrow", "milestone"]` | `{candidate, milestone_id, amount}` | `unlock_milestone()` |
| `escrow_completed` | `["escrow", "completed"]` | `{candidate, total_paid}` | `unlock_milestone()` (last) |
| `clawback` | `["escrow", "clawback"]` | `{employer, amount}` | `clawback()` |
| `dispute_raised` | `["escrow", "disputed"]` | `{candidate}` | `raise_dispute()` |
| `dispute_resolved` | `["escrow", "resolved"]` | `{candidate, candidate_payout, employer_payout}` | `resolve_dispute()` |

---

## 7. Frontend Architecture

### Component Tree

```
App.tsx (React Router)
├── / → Onboarding.tsx (role selection + wallet connect)
├── /employer → Employer.tsx
│   ├── Layout.tsx (sidebar navigation)
│   ├── CreateEscrowForm.tsx (milestone builder)
│   ├── ActiveEscrowCard.tsx (per-escrow actions)
│   ├── StatusBadge.tsx
│   └── TransactionToast.tsx
├── /candidate → Candidate.tsx
│   ├── Layout.tsx
│   ├── EscrowCard.tsx (pending acceptance view)
│   ├── ActiveEscrowCard.tsx (milestone tracker)
│   └── ActivityLedger.tsx (transaction history)
├── /arbitrator → Arbitrator.tsx
│   ├── Layout.tsx
│   └── ActiveEscrowCard.tsx (BPS resolution)
├── /admin → AdminLogin.tsx (credentials gate)
└── /admin/metrics → Metrics.tsx (admin-only dashboard)
    └── AdminGuard.tsx (route protection)
```

### Hooks Architecture

| Hook | Responsibility |
|---|---|
| `useStellar` | Freighter wallet connection, account balance, network detection |
| `useEscrow` | All contract interactions: init, accept, unlock, clawback, dispute, resolve |
| `useActivity` | Transaction history from Horizon API |
| `useOnboarding` | First-visit detection and Quick Guide state |
| `useAdmin` | Admin authentication state (sessionStorage) |

### Transaction Lifecycle

Every state-changing operation follows:
```
1. Build transaction (Stellar SDK)
2. Simulate (Soroban RPC — preflight)
3. Sign (Freighter extension)
4. Submit (Soroban RPC)
5. Poll for confirmation
6. Update UI state
```

### Amount Conversion Boundary

All user-facing amounts are in **XLM**. All on-chain values are in **stroops**.
Conversion happens exclusively at the `contract.ts` boundary:

```typescript
const XLM_TO_STROOPS = BigInt(10_000_000);
const toStroops = (xlm: number) => BigInt(Math.round(xlm * 10_000_000));
const toXlm = (stroops: bigint) => Number(stroops) / 10_000_000;
```

---

## 8. Deployment Architecture

```
Developer
    │
    │  git push origin main
    │
    ▼
GitHub Repository (delatorrecj/stellar)
    │
    ├──► GitHub Actions CI
    │        ├── frontend: lint + build (Node 18)
    │        └── contract: cargo test + wasm build (Rust stable)
    │
    └──► Vercel (Auto-deploy on main push)
             │
             ▼
         stella-escrow.vercel.app
             │
             │  HTTPS + CSP headers
             │
             ▼
         Browser ──► Freighter Extension
             │
             │  Soroban RPC (HTTPS)
             │
             ▼
         Stellar Testnet
             │
             ▼
         Stella Contract
         CAZHXCM3UNLT7HJLYHFWBRWAF3PCFN5TR4QCNYDCGCQ6K3ZMU7X7ZSLH
```

### Environment Configuration

| Variable | Location | Purpose |
|---|---|---|
| `VITE_CONTRACT_ID` | Vercel Env + `.env` | Stella contract address |
| `VITE_NETWORK_PASSPHRASE` | Vercel Env + `.env` | Stellar network identifier |
| `VITE_RPC_URL` | Vercel Env + `.env` | Soroban RPC endpoint |
| `VITE_ADMIN_PASSWORD` | Vercel Env only | Admin dashboard access |
| `VITE_SPONSOR_SECRET` | Vercel Env only | Fee Sponsorship keypair |

---

## 9. Network & Contract Details

| Parameter | Value |
|---|---|
| Network | Stellar Testnet |
| Contract ID | `CAZHXCM3UNLT7HJLYHFWBRWAF3PCFN5TR4QCNYDCGCQ6K3ZMU7X7ZSLH` |
| Native XLM SAC | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |
| Soroban RPC | `https://soroban-testnet.stellar.org` |
| Horizon API | `https://horizon-testnet.stellar.org` |
| Soroban SDK | v22.0.0 |
| Stellar SDK (JS) | v15.0.1 |
