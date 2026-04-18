# STELLA — PRODUCT REQUIREMENTS DOCUMENT
> **Version:** 1.4.0 | **Status:** ACTIVE
> **Last Updated:** 2026-04-18
> **Owner:** Jerico | **Event:** Stellar Philippines UniTour Bootcamp 2026
> **IDE Directive:** This document is a living spec. Update version, status, and changelog on every meaningful change. Do not delete deprecated sections — mark them `[DEPRECATED vX.X.X]` and move to the Graveyard at the bottom.

---

## TABLE OF CONTENTS
1. [Vision & Problem Statement](#1-vision--problem-statement)
2. [Success Metrics](#2-success-metrics)
3. [User Personas](#3-user-personas)
4. [Product Scope (MVP → V2 → V3)](#4-product-scope)
5. [Smart Contract Architecture](#5-smart-contract-architecture)
6. [Frontend Architecture](#6-frontend-architecture)
7. [File Structure & Naming Conventions](#7-file-structure--naming-conventions)
8. [Security Protocols](#8-security-protocols)
9. [System Design](#9-system-design)
10. [Data Models](#10-data-models)
11. [API & Contract Interface](#11-api--contract-interface)
12. [Environment & Configuration](#12-environment--configuration)
13. [Testing Strategy](#13-testing-strategy)
14. [Deployment Protocol](#14-deployment-protocol)
15. [Demo Script (Hackathon)](#15-demo-script-hackathon)
16. [30-Second Pitch](#16-30-second-pitch)
17. [Changelog](#17-changelog)
18. [Graveyard (Deprecated)](#18-graveyard-deprecated)

---

## 1. VISION & PROBLEM STATEMENT

### The Problem
Fresh graduates in the Philippines accept job offers and then ghost employers before Day 1 — not from disinterest, but from a liquidity crisis. The cost of NBI clearance, medical exams, and the first week of commute can reach ₱3,000–₱5,000. For a student with zero income, this is an insurmountable blocker.

The employer's side is equally painful: they've spent weeks and real money sourcing, screening, and selecting a candidate — only to lose them at the finish line over a ₱500 medical exam. In Philippine BPO alone, which hires hundreds of thousands annually, this candidate drop-off rate represents millions of pesos in wasted recruitment spend per year.

**Current "solutions" are broken:**
- Employers give cash advances informally → no guarantee the candidate shows up
- Students take loans → adds financial stress before Day 1
- HR teams absorb the loss and restart the pipeline → 3–6 week delay per failed hire

### The Solution
**Stella** is a milestone-based onboarding escrow on Stellar. Employers lock XLM/USDC into a Soroban smart contract tied to a specific candidate. Funds release in stages as the candidate completes verified onboarding milestones (medical exam, NBI clearance, equipment pickup). If the candidate ghosts, the employer claws back the remaining locked funds.

Real money movement. Programmable trust. No intermediary.

### One-Line Definition
> Stella is a Soroban-powered pre-employment escrow that converts the "Day Zero poverty trap" into a programmable onboarding guarantee — protecting employers from candidate drop-off and giving graduates the liquidity to show up.

---

## 2. SUCCESS METRICS

### Hackathon (April 18, 2026)
| Metric | Target |
|--------|--------|
| Contract compiles to WASM | ✅ Required |
| `cargo test` passing tests | ≥ 3 |
| Contract deployed on Testnet | ✅ Required |
| Frontend connects to Freighter | ✅ Required |
| Full demo flow completes | < 2 minutes |
| Prize pool | $100–$200 USD |

### V1 Post-Hackathon (Month 1–3)
| Metric | Target |
|--------|--------|
| Employer wallets onboarded | 5 pilot companies |
| Escrow contracts created | ≥ 20 |
| Candidate drop-off rate (with Flow) | < 5% vs. industry avg ~30% |
| Avg escrow size | 200–500 XLM |

### V2 Scale (Month 4–12)
| Metric | Target |
|--------|--------|
| Monthly active employers | 50 |
| Total XLM locked through platform | > 100,000 XLM |
| SEA expansion (VN, ID) | 2 new markets |

---

## 3. USER PERSONAS

### Persona A: The Employer (Primary Buyer)
- **Name:** Maria, HR Manager, BPO / SME
- **Pain:** Loses 1–3 candidates per month after offer acceptance. Each failed hire costs ₱15,000–₱50,000 in recruiter hours + job ad spend.
- **Motivation:** Guarantee Day 1 attendance without giving unsecured cash advances.
- **Technical comfort:** Low. Needs a simple web UI. Should not need to understand blockchain.
- **Wallet:** Freighter (set up by the platform onboarding flow)

### Persona B: The Candidate (Primary End User)
- **Name:** Kevin, 22, fresh IT graduate from Bulacan
- **Pain:** Accepted a BPO offer but has ₱800 left in his GCash. Medical exam costs ₱1,200. He will miss Day 1.
- **Motivation:** Access pre-employment funds without debt. Prove he's serious.
- **Technical comfort:** Very low. Mobile-first. Needs one-tap wallet connect.
- **Wallet:** Freighter mobile or web

### Persona C: The Platform Admin (Future V2)
- Monitors escrow health, dispute resolution, compliance
- Has elevated contract permissions for emergency clawback

---

## 4. PRODUCT SCOPE

### MVP — Hackathon Build (Today)
- [x] Soroban smart contract with 3 core functions
- [x] React + Vite + TypeScript frontend
- [x] Progressive Web App (PWA) with offline capabilities
- [x] Freighter wallet integration (employer + candidate)
- [x] Employer creates escrow (locks XLM)
- [x] Candidate views pending escrow
- [x] Candidate claims milestone payout
- [x] Transaction hash displayed on success
- [x] 3+ passing unit tests

### V1 — Post-Hackathon (Weeks 1–4)
- [ ] Employer-approved milestone unlock (currently candidate self-claims)
- [ ] Multiple milestones per escrow (NBI, medical, equipment)
- [ ] Deadline-based auto-clawback
- [ ] Email/SMS notification on escrow events
- [ ] USDC support via Stellar anchors
- [ ] Mobile-responsive UI

### V2 — Scale (Months 2–6)
- [ ] Multi-candidate escrow batching
- [ ] On-chain reputation score for candidates
- [ ] DAO governance for dispute resolution
- [ ] SEA localization (Filipino, Vietnamese, Bahasa)
- [ ] Analytics dashboard for employers
- [ ] API for ATS (Applicant Tracking System) integration

### V3 — Ecosystem (Months 7–12)
- [ ] Anchor integration for PHP fiat on/off ramp
- [ ] DeFi yield on locked escrow funds
- [ ] Candidate credit scoring from on-chain history
- [ ] White-label for universities and bootcamps

---

## 5. SMART CONTRACT ARCHITECTURE

### Language & Runtime
- **Language:** Rust
- **Target:** `wasm32-unknown-unknown`
- **SDK:** `soroban-sdk = "22.0.0"`
- **Network:** Stellar Testnet (MVP) → Mainnet (V1)

### Cargo.toml
```toml
[package]
name = "stella"
version = "1.0.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
soroban-sdk = { version = "22.0.0", features = ["alloc"] }

[dev-dependencies]
soroban-sdk = { version = "22.0.0", features = ["testutils", "alloc"] }

[profile.release]
opt-level = "z"
overflow-checks = true
debug = 0
strip = "symbols"
debug-assertions = false
panic = "abort"
codegen-units = 1
lto = true
```

### Storage Schema
```
Persistent Storage (survives archival — use for all escrow state):
  Key: DataKey::Escrow(candidate: Address) → Escrow struct
  Key: DataKey::Admin → Address

Temporary Storage (in-flight ops only — do NOT use for escrow balances):
  Key: TempKey::PendingMilestone(candidate: Address) → i128
```

### Data Structures
```rust
#[contracttype]
pub enum DataKey {
    Escrow(Address),
    Admin,
    Token,              // Stores the XLM SAC address (set during initialize)
}

#[contracttype]
#[derive(Clone)]
pub struct Escrow {
    pub employer: Address,
    pub candidate: Address,
    pub total_amount: i128,
    pub unlocked_amount: i128,
    pub deadline: u64,       // UNIX timestamp — auto-clawback after this
    pub is_active: bool,
}
```

### Core Functions (MVP — Must Ship)

#### `initialize`
```
Signature: initialize(env, admin, token)
Auth: None (can only be called once — checks if already initialized)
Action:
  1. Verify contract is not already initialized
  2. Store admin address in instance storage
  3. Store token address (XLM SAC) in instance storage
Errors: Already initialized (panic)
```

#### `init_escrow`
```
Signature: init_escrow(env, employer, candidate, amount, deadline)
Auth: employer.require_auth()
Action:
  1. Verify no active escrow exists for candidate
  2. Transfer `amount` XLM from employer to contract address
  3. Write Escrow struct to persistent storage
  4. Emit event: topic=["escrow", "created"], data={employer, candidate, amount}
Errors: EscrowAlreadyExists, InvalidAmount, InvalidDeadline
```

#### `unlock_milestone`
```
Signature: unlock_milestone(env, candidate, milestone_amount)
Auth: candidate.require_auth()  [MVP: self-claim] [V1: employer.require_auth()]
Action:
  1. Load escrow for candidate
  2. Verify escrow is_active = true
  3. Verify (unlocked_amount + milestone_amount) <= total_amount
  4. Transfer milestone_amount from contract to candidate
  5. Update unlocked_amount
  6. If unlocked_amount == total_amount: set is_active = false
  7. Emit event: topic=["escrow", "milestone"], data={candidate, milestone_amount}
Errors: EscrowNotFound, EscrowInactive, ExceedsTotal, InvalidAmount
```

#### `clawback`
```
Signature: clawback(env, employer)
Auth: employer.require_auth()
Action:
  1. Load escrow for the calling employer
  2. Compute remaining = total_amount - unlocked_amount
  3. Transfer remaining from contract to employer
  4. Set is_active = false
  5. Emit event: topic=["escrow", "clawback"], data={employer, remaining}
Errors: EscrowNotFound, NothingToClawback
```

#### `get_escrow` (Read-only)
```
Signature: get_escrow(env, candidate) → Escrow
Auth: None required
Action: Return escrow struct or panic with EscrowNotFound
```

### Error Enum
```rust
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum StellaError {
    EscrowAlreadyExists = 1,
    EscrowNotFound      = 2,
    EscrowInactive      = 3,
    ExceedsTotal        = 4,
    NothingToClawback   = 5,
    Unauthorized        = 6,
    InvalidDeadline     = 7,
    InvalidAmount       = 8,
}
```

---

## 6. FRONTEND ARCHITECTURE

### Stack
```
Framework:   React 18 + Vite 5 + TypeScript 5
Styling:     Tailwind CSS + BRAND.md design tokens (Warm Fintech Trust)
Wallet:      @stellar/freighter-api
Stellar SDK: @stellar/stellar-sdk
State:       React useState / useReducer (no Redux for MVP)
Routing:     React Router v6
Env:         Vite env vars (VITE_ prefix)
Font:        Plus Jakarta Sans (display/body) + JetBrains Mono (addresses)
```

> **IDE Instruction:** All colors, fonts, spacing, and component patterns are defined in `BRAND.md`. Do not use ad-hoc values. Reference `BRAND.md` Section 3 (Color System) and Section 4 (Typography) as the single source of truth for CSS custom properties.

### Views

#### View 1: Landing / Role Select
- "I am an Employer" → routes to `/employer`
- "I am a Candidate" → routes to `/candidate`
- Brand: Stella logo, one-liner value prop

#### View 2: Employer Dashboard (`/employer`)
- Connect Freighter button → shows truncated public key on connect
- Form:
  - Candidate Public Key (text input, validated as Stellar address)
  - Escrow Amount in XLM (number input, min 50)
  - Deadline (date picker, min today + 7 days)
- CTA: "Lock Onboarding Funds" → calls `init_escrow`
- Status panel: shows active escrows created by this employer
- Loading state: spinner + "Submitting to Stellar..."
- Success state: green toast with transaction hash (links to Stellar Expert)
- Error state: red toast with human-readable error

#### View 3: Candidate Portal (`/candidate`)
- Connect Freighter button
- Auto-fetches escrow by connected wallet address
- Escrow card shows:
  - Employer address (truncated)
  - Total locked / Unlocked so far / Remaining
  - Deadline countdown
  - Progress bar (unlocked / total)
- CTA: "Claim Milestone Funds" + amount input → calls `unlock_milestone`
- Success/error toast same pattern as Employer view

#### View 4: Shared Components
- `<WalletButton />` — connect/disconnect, shows address
- `<TransactionToast />` — success/error feedback with tx hash
- `<EscrowCard />` — reusable escrow status display
- `<AddressInput />` — validates G... Stellar address format

### Freighter Integration Pattern
```typescript
// hooks/useFreighter.ts
import {
  isConnected,
  getPublicKey,
  signTransaction,
} from "@stellar/freighter-api";

export const useFreighter = () => {
  const [publicKey, setPublicKey] = useState<string | null>(null);

  const connect = async () => {
    const connected = await isConnected();
    if (!connected.isConnected) throw new Error("Freighter not installed");
    const { publicKey } = await getPublicKey();
    setPublicKey(publicKey);
  };

  return { publicKey, connect };
};
```

### Contract Invocation Pattern
```typescript
// lib/contract.ts
import * as StellarSdk from "@stellar/stellar-sdk";

const rpc = new StellarSdk.rpc.Server(import.meta.env.VITE_STELLAR_RPC_URL);
const contractId = import.meta.env.VITE_CONTRACT_ID;

export const initEscrow = async (
  employerKey: string,
  candidateKey: string,
  amountXLM: number,
  deadlineUnix: number,
  signFn: (xdr: string) => Promise<string>
) => {
  // Build → simulate → sign → submit
  const contract = new StellarSdk.Contract(contractId);
  // ... full implementation here
};
```

---

## 7. FILE STRUCTURE & NAMING CONVENTIONS

### Full Project Tree
```
stella/
│
├── .env                          # Live secrets — NEVER commit
├── .env.example                  # Template — always commit
├── .gitignore                    # Hardened (see Security section)
├── PRD.md                        # This file — living spec
├── CONTEXT.md                    # Session tracker (updated each session)
├── BRAND.md                      # Brand guidelines, design tokens, voice & copy
├── CHANGELOG.md                  # Human-readable change log
│
├── contract/                     # Soroban smart contract
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs                # Contract entry point + all functions
│       ├── types.rs              # DataKey, Escrow struct, StellaError enum
│       ├── events.rs             # Event emission helpers
│       └── test.rs               # Integration + unit tests
│
├── frontend/                     # React + Vite app
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── package.json
│   │
│   ├── public/
│   │   └── logo.svg
│   │
│   └── src/
│       ├── main.tsx              # App entry point
│       ├── App.tsx               # Router setup
│       │
│       ├── pages/
│       │   ├── LandingPage.tsx
│       │   ├── EmployerPage.tsx
│       │   └── CandidatePage.tsx
│       │
│       ├── components/
│       │   ├── WalletButton.tsx
│       │   ├── EscrowCard.tsx
│       │   ├── TransactionToast.tsx
│       │   ├── AddressInput.tsx
│       │   └── MilestoneProgress.tsx
│       │
│       ├── hooks/
│       │   ├── useFreighter.ts
│       │   ├── useEscrow.ts
│       │   └── useTransaction.ts
│       │
│       ├── lib/
│       │   ├── contract.ts       # All Soroban contract call wrappers
│       │   ├── stellar.ts        # RPC client, network helpers
│       │   └── validation.ts     # Address validation, form helpers
│       │
│       ├── types/
│       │   └── index.ts          # Shared TypeScript interfaces
│       │
│       └── constants/
│           └── index.ts          # Network URLs, contract ID, error messages
│
└── scripts/
    ├── deploy.ps1                # Stellar CLI deploy script (Windows)
    ├── deploy.sh                 # Stellar CLI deploy script (Unix)
    └── fund_testnet.sh           # Friendbot funding helper
```

### Naming Conventions

#### Files & Folders
| Context | Convention | Example |
|---------|-----------|---------|
| React components | PascalCase | `EscrowCard.tsx` |
| Hooks | camelCase with `use` prefix | `useFreighter.ts` |
| Utility/lib files | camelCase | `contract.ts`, `stellar.ts` |
| Rust source files | snake_case | `lib.rs`, `types.rs` |
| Scripts | snake_case | `deploy.sh` |
| Folders | kebab-case | `stella/`, `bootcamp-ref/` |
| Constants files | camelCase | `index.ts` inside `constants/` |

#### TypeScript Variables
| Context | Convention | Example |
|---------|-----------|---------|
| Variables | camelCase | `escrowAmount`, `candidateKey` |
| Constants (module-level) | UPPER_SNAKE_CASE | `STELLAR_NETWORK`, `CONTRACT_ID` |
| React components | PascalCase | `EscrowCard`, `WalletButton` |
| Interfaces | PascalCase with `I` prefix optional | `Escrow`, `IEscrowCardProps` |
| Enums | PascalCase | `TransactionStatus` |
| Env vars | `VITE_` prefix + UPPER_SNAKE | `VITE_CONTRACT_ID` |

#### Rust Variables
| Context | Convention | Example |
|---------|-----------|---------|
| Variables | snake_case | `total_amount`, `is_active` |
| Constants | UPPER_SNAKE_CASE | `MAX_MILESTONE_AMOUNT` |
| Structs | PascalCase | `Escrow`, `StellaError` |
| Enums | PascalCase | `DataKey`, `StellaError` |
| Functions | snake_case | `init_escrow`, `unlock_milestone` |
| Modules | snake_case | `types`, `events` |

#### Git Branches
| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/short-description` | `feat/employer-dashboard` |
| Fix | `fix/short-description` | `fix/clawback-auth` |
| Chore | `chore/short-description` | `chore/update-deps` |
| Hotfix | `hotfix/short-description` | `hotfix/escrow-overflow` |

#### Commit Messages
```
Format: <type>(<scope>): <short description>

Types: feat, fix, test, docs, chore, refactor, style
Scope: contract, frontend, deploy, ci

Examples:
  feat(contract): add init_escrow with employer auth
  fix(frontend): handle Freighter not installed error
  test(contract): add clawback test for deadline expiry
  docs(prd): update V2 milestones
```

---

## 8. SECURITY PROTOCOLS

### Smart Contract Security

#### Authentication Rules
```
RULE 1: Every state-mutating function MUST call require_auth() on the actor.
  - init_escrow → employer.require_auth()
  - unlock_milestone → candidate.require_auth() [MVP] / employer.require_auth() [V1]
  - clawback → employer.require_auth()
  NEVER allow unsigned state changes.

RULE 2: Verify escrow ownership before any operation.
  - Always confirm that env.caller() or the passed address matches storage.
  - Reject mismatched employer addresses on clawback.

RULE 3: All arithmetic must use overflow-safe operations.
  - Use checked_add, checked_sub in Rust.
  - Cargo.toml: overflow-checks = true in release profile (already set).

RULE 4: Prevent re-entrancy via state-first updates.
  - Update storage BEFORE transferring tokens, not after.
  - Pattern: write new state → then call token.transfer()

RULE 5: Validate all input bounds.
  - amount > 0
  - deadline > env.ledger().timestamp() + MIN_DEADLINE_BUFFER
  - milestone_amount <= (total_amount - unlocked_amount)
```

#### Storage Security
```
- Use DataKey enum (contracttype) — never raw strings for storage keys
- All escrow state in persistent storage (not instance, not temporary)
- No sensitive off-chain data stored on-chain (no names, emails)
- Candidate address is the storage key — one escrow per candidate per employer (MVP)
```

### Frontend Security

#### Environment Variables
```
NEVER commit .env to git — hardened .gitignore blocks it.
All Stellar keys must live in .env, accessed via import.meta.env.VITE_*
NEVER hardcode CONTRACT_ID, RPC_URL, or any key in source code.
.env.example contains only placeholder values — safe to commit.
```

#### Freighter Integration
```
NEVER store private keys in frontend state or localStorage.
All signing delegated to Freighter extension — app never touches private keys.
Validate all Stellar public keys before sending to contract (G... format, 56 chars).
Display truncated addresses in UI (first 4 + last 4 chars) — never full key in logs.
```

#### Input Validation
```
Stellar address: must match /^G[A-Z2-7]{55}$/ before any contract call.
XLM amounts: must be positive numbers, max precision 7 decimal places (stroops).
Deadline: must be a future timestamp, minimum 7 days from now.
Sanitize all user inputs before displaying in JSX to prevent XSS.
```

#### Dependency Security
```
Pin all npm dependencies to exact versions in package.json.
Run npm audit before every deployment.
Never use deprecated @stellar/freighter-api methods.
Do not install unnecessary packages — attack surface grows with dependencies.
```

### .gitignore (Hardened)
```gitignore
# Secrets
.env
*.pem
*.key
*.secret

# Stellar identities and config
.stellar/
identity/
**/*.toml   # Blocks Cargo.lock from exposing dep tree if desired

# Build artifacts
target/
dist/
node_modules/
*.wasm      # Never commit compiled WASM

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/settings.json
.idea/

# Logs
*.log
npm-debug.log*
```

### Threat Model (MVP)
| Threat | Mitigation |
|--------|-----------|
| Unauthorized clawback by third party | `employer.require_auth()` — only original employer can clawback |
| Candidate overclaiming milestones | Amount check: `unlocked + claim <= total` enforced on-chain |
| Replay attacks | Stellar sequence numbers + transaction TTL prevent replay |
| Contract address spoofing | `CONTRACT_ID` loaded from `.env`, validated at deploy time |
| XSS via malicious address input | Regex validation + React's JSX auto-escaping |
| Private key exposure | All signing through Freighter — app never touches keys |
| Dependency hijack | Pinned versions + `npm audit` pre-deploy |

---

## 9. SYSTEM DESIGN

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER (User)                       │
│                                                         │
│   ┌──────────────┐         ┌─────────────────────┐     │
│   │   React App  │◄───────►│  Freighter Wallet   │     │
│   │  (Vite/TS)   │  signs  │   (Browser Ext)     │     │
│   └──────┬───────┘         └─────────────────────┘     │
└──────────┼──────────────────────────────────────────────┘
           │ @stellar/stellar-sdk (XDR build + submit)
           ▼
┌─────────────────────────────┐
│   Stellar RPC (Testnet)     │  https://soroban-testnet.stellar.org
│   (Horizon / Soroban RPC)   │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│   Stellar Testnet Ledger    │
│                             │
│  ┌──────────────────────┐   │
│  │  Stella              │   │
│  │  Soroban Contract    │   │
│  │                      │   │
│  │  init_escrow()       │   │
│  │  unlock_milestone()  │   │
│  │  clawback()          │   │
│  │  get_escrow()        │   │
│  └──────────────────────┘   │
│                             │
│  Native XLM Token Contract  │
└─────────────────────────────┘
```

### Transaction Flow (Critical Path Demo)

```
EMPLOYER FLOW:
  1. Employer opens /employer → clicks "Connect Freighter"
  2. Freighter pops up → employer approves → public key returned to app
  3. Employer enters: Candidate address + Amount + Deadline → clicks "Lock Funds"
  4. Frontend builds XDR transaction calling init_escrow()
  5. Frontend simulates transaction via Soroban RPC (fee estimation)
  6. Freighter prompts employer to sign → employer approves
  7. Signed XDR submitted to Stellar network
  8. App polls for transaction result → displays success toast + tx hash

CANDIDATE FLOW:
  1. Candidate opens /candidate → clicks "Connect Freighter"
  2. App calls get_escrow(candidateAddress) → displays locked funds
  3. Candidate clicks "Claim Milestone Funds" + enters amount
  4. Frontend builds XDR calling unlock_milestone()
  5. Freighter prompts candidate to sign → candidate approves
  6. Transaction submitted → success toast with updated balance

CLAWBACK FLOW:
  1. Employer triggers clawback (deadline expired or manual)
  2. Frontend builds XDR calling clawback(employerAddress)
  3. Freighter signs → transaction submitted
  4. Remaining funds returned to employer wallet
```

### State Machine (Escrow Lifecycle)
```
              init_escrow()
[NULL] ──────────────────────► [ACTIVE]
                                  │
                    unlock_milestone() (partial)
                                  │◄────────┐
                                  │         │
                    unlock_milestone() (full) │ partial claims
                                  │         │
                                  ▼         │
                              [COMPLETED] ──┘
                                  │
               clawback() at any active point
                                  │
                              [CLAWED_BACK]
```

### V2 System Design Additions (Planned)
```
+ Milestone Approval Service (off-chain microservice for employer approval)
+ Webhook listener for on-chain events → email/SMS triggers
+ Multi-escrow batching (one employer → many candidates)
+ Stellar anchor integration for PHP/USD fiat on-ramp
+ Candidate reputation contract (separate Soroban contract)
```

---

## 10. DATA MODELS

### On-Chain (Soroban Persistent Storage)
```
Key: DataKey::Escrow(candidate_address: Address)
Value: Escrow {
    employer:              Address    // Stellar G-address
    candidate:             Address    // Stellar G-address
    total_amount:          i128       // in stroops (1 XLM = 10^7 stroops)
    unlocked_amount:       i128       // cumulative amount already claimed
    deadline:              u64        // UNIX timestamp
    is_active:             bool       // false when complete or clawed back
}

Key: DataKey::Token
Value: Address    // XLM SAC address (set during initialize)

Key: DataKey::Admin
Value: Address    // Admin address (set during initialize)
```

### Frontend State (TypeScript)
```typescript
interface Escrow {
  employer: string;
  candidate: string;
  totalAmount: bigint;       // i128 as BigInt
  unlockedAmount: bigint;
  deadline: number;          // UNIX timestamp
  isActive: boolean;
}

interface TransactionResult {
  hash: string;
  status: "success" | "error" | "pending";
  errorMessage?: string;
}

interface WalletState {
  publicKey: string | null;
  isConnected: boolean;
  network: "TESTNET" | "MAINNET";
}
```

---

## 11. API & CONTRACT INTERFACE

### Contract Public Interface
```rust
// Read functions (no auth, no state change)
get_escrow(env: Env, candidate: Address) → Escrow

// Write functions (auth required)
init_escrow(
    env: Env,
    employer: Address,
    candidate: Address,
    amount: i128,
    deadline: u64
) → Result<(), StellaError>

unlock_milestone(
    env: Env,
    candidate: Address,
    milestone_amount: i128
) → Result<(), StellaError>

clawback(
    env: Env,
    employer: Address
) → Result<i128, StellaError>   // returns amount returned
```

### On-Chain Events Emitted
```
Event: escrow_created
  topics: ["escrow", "created"]
  data: { employer: Address, candidate: Address, amount: i128 }

Event: milestone_unlocked
  topics: ["escrow", "milestone"]
  data: { candidate: Address, amount: i128, remaining: i128 }

Event: escrow_clawback
  topics: ["escrow", "clawback"]
  data: { employer: Address, amount_returned: i128 }

Event: escrow_completed
  topics: ["escrow", "completed"]
  data: { candidate: Address, total_paid: i128 }
```

---

## 12. ENVIRONMENT & CONFIGURATION

### .env (never commit — use .env.example as template)
```env
# Stellar Network
VITE_STELLAR_NETWORK=TESTNET
VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
VITE_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org

# Contract (set after deployment)
VITE_CONTRACT_ID=

# Identity (CLI use only — not exposed to frontend)
STELLAR_ACCOUNT=my-key
STELLAR_PUBLIC_KEY=GABTUX53227CZQJSRKS6UMT2VWUZCLX27AGCDLHRS7VYJJB4DBIMHKIU

# Freighter (for reference — wallet manages this)
FREIGHTER_PUBLIC_KEY=GCDBINSYWE36SRQKGU7F43MX3T2Z6VGWR6HFEGMLWGKSNYEK2WNZXE57
```

### .env.example (commit this)
```env
VITE_STELLAR_NETWORK=TESTNET
VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
VITE_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
VITE_CONTRACT_ID=
STELLAR_ACCOUNT=
STELLAR_PUBLIC_KEY=
FREIGHTER_PUBLIC_KEY=
```

### Constants (frontend/src/constants/index.ts)
```typescript
export const STELLAR_NETWORK = import.meta.env.VITE_STELLAR_NETWORK;
export const STELLAR_RPC_URL = import.meta.env.VITE_STELLAR_RPC_URL;
export const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID;

export const MIN_ESCROW_XLM = 50;
export const MIN_DEADLINE_DAYS = 7;
export const STROOPS_PER_XLM = 10_000_000n;

export const ERROR_MESSAGES: Record<string, string> = {
  "1": "An escrow already exists for this candidate.",
  "2": "No escrow found for this address.",
  "3": "This escrow is no longer active.",
  "4": "Claim amount exceeds available funds.",
  "5": "Nothing left to clawback.",
  "6": "You are not authorized for this action.",
  "7": "Deadline must be at least 7 days from now.",
  "8": "Amount must be greater than zero.",
};
```

---

## 13. TESTING STRATEGY

### Contract Tests (cargo test)

#### Test 1: Full Employer → Candidate Flow
```rust
#[test]
fn test_full_escrow_flow() {
    // Setup test env
    // init_escrow: employer locks 500 XLM for candidate
    // get_escrow: verify state correct
    // unlock_milestone: candidate claims 250 XLM
    // verify: unlocked_amount = 250, is_active = true
    // unlock_milestone: candidate claims remaining 250 XLM
    // verify: is_active = false, event emitted
}
```

#### Test 2: Clawback
```rust
#[test]
fn test_clawback_returns_remaining() {
    // init_escrow: 500 XLM
    // unlock_milestone: 200 XLM claimed
    // clawback: employer recovers 300 XLM
    // verify: employer balance correct, is_active = false
}
```

#### Test 3: Duplicate Escrow Prevention
```rust
#[test]
fn test_duplicate_escrow_fails() {
    // init_escrow for candidate
    // init_escrow again for same candidate → must panic with EscrowAlreadyExists
}
```

#### Test 4 (Bonus): Overclaim Prevention
```rust
#[test]
fn test_overclaim_fails() {
    // init_escrow: 500 XLM
    // unlock_milestone: attempt 600 XLM → must fail with ExceedsTotal
}
```

### Frontend Tests (V1 — Post-Hackathon)
- Vitest + React Testing Library
- Test wallet connection state transitions
- Test form validation (invalid address, zero amount)
- Test contract call error handling and toast display

---

## 14. DEPLOYMENT PROTOCOL

### Phase 1: Contract Build & Deploy
```powershell
# Navigate to contract folder
cd contract

# Build
cargo build --target wasm32-unknown-unknown --release

# Verify WASM exists
ls target/wasm32-unknown-unknown/release/stella.wasm

# Deploy to testnet
stellar contract deploy `
  --wasm target/wasm32-unknown-unknown/release/stella.wasm `
  --source my-key `
  --network testnet

# SAVE the output CONTRACT_ID into .env:
# VITE_CONTRACT_ID=<output>
```

### Phase 2: Smoke Test Contract via CLI
```powershell
stellar contract invoke `
  --id $CONTRACT_ID `
  --source my-key `
  --network testnet `
  -- get_escrow --candidate <CANDIDATE_ADDRESS>
# Expected: error EscrowNotFound (good — contract is live)
```

### Phase 3: Frontend Build & Run
```bash
cd frontend
npm install
npm run dev
# Verify at http://localhost:5173
```

### Phase 4: Vercel Deploy (Prize Pool Requirement)
```bash
npm install -g vercel
vercel --prod
# Set VITE_* env vars in Vercel dashboard before deploying
```

### Deployment Checklist
- [ ] `cargo test` — all tests pass
- [ ] WASM file size < 100KB (release profile)
- [ ] `CONTRACT_ID` saved to `.env` and Vercel env vars
- [ ] Frontend loads without console errors
- [ ] Freighter connects successfully on Testnet
- [ ] `init_escrow` transaction completes in < 10 seconds
- [ ] `unlock_milestone` transaction completes
- [ ] Transaction hash links correctly to Stellar Expert Testnet

---

## 15. DEMO SCRIPT (HACKATHON)

### 2-Minute Demo Flow

**[0:00 — 0:15] Context Setup (1 sentence)**
> "Every month, Filipino employers lose hired candidates before Day 1 because the grad can't afford their medical exam. Stella fixes that with a programmable escrow on Stellar."

**[0:15 — 0:45] Employer creates escrow**
1. Open `/employer` view
2. Click "Connect Freighter" → wallet connects, address shown
3. Enter candidate address, 500 XLM, deadline
4. Click "Lock Onboarding Funds"
5. Freighter popup → approve → transaction submits
6. Show success toast with transaction hash

**[0:45 — 1:15] Candidate claims milestone**
1. Open `/candidate` view (different browser tab or incognito)
2. Connect candidate Freighter wallet
3. Show escrow card: "500 XLM locked by employer"
4. Click "Claim Milestone Funds" — enter 250 XLM
5. Freighter signs → success toast
6. Escrow card updates: "250 XLM claimed / 250 remaining"

**[1:15 — 1:45] Show on-chain proof**
1. Click transaction hash in toast → opens Stellar Expert
2. Show contract invocation on-chain
3. Show token transfer in ledger

**[1:45 — 2:00] Close**
> "Real money moved on Stellar in under 90 seconds. Employer protected. Candidate funded. No intermediary."

---

## 16. 30-SECOND PITCH

> "Stellar was built for social good and financial inclusion. Stella embodies that.
>
> Every year in the Philippines, employers lose hired candidates before Day 1 — not because the talent disappeared, but because a fresh grad can't afford their ₱1,500 medical exam. The employer already spent ₱50,000 finding them. It's a sunk cost over a ₱500 blocker.
>
> Stella eliminates this pre-employment poverty trap. Using Soroban's low-fee escrows, employers lock onboarding funds on-chain. Candidates unlock them as they complete requirements. If they ghost, employers claw back. No intermediary. No debt. No bank needed.
>
> We're giving unbanked graduates financial access to start their careers — funded by the companies who need them most. We moved 500 XLM on Stellar in under 90 seconds. That's programmable trust for 500,000 Filipino graduates a year."

---

## 17. CHANGELOG

```
v1.4.0 — 2026-04-18
  Created BRAND.md — user-centric brand guidelines
  Rejected glassmorphism: users (Kevin/Maria) need warm fintech trust, not crypto aesthetics
  Defined: color system (teal + amber), Plus Jakarta Sans, spacing tokens, motion rules
  Updated PRD frontend stack to reference BRAND.md design tokens
  Updated CONTEXT.md with deployment + brand milestones
  Author: Jerico

v1.3.0 — 2026-04-18
  Smart contract built, optimized, and successfully deployed to Stellar testnet
  Added Makefile and contract deployment steps to CONTEXT.md
  Author: Jerico

v1.2.0 — 2026-04-18
  Simplified Escrow struct: removed milestone_count, milestones_completed (unused in MVP)
  Added initialize() function for token address + admin setup
  Added InvalidAmount (=8) to StellaError enum
  Updated 30-second pitch: social-good reframe aligned with Stellar Foundation values
  Confirmed tech stack: Tailwind CSS (v3)
  Author: Jerico

v1.1.0 — 2026-04-18
  Renamed product from "Stellaroid Flow" to "Stella"
  Updated: crate name (stella), error enum (StellaError), all references
  Graveyard retains historical names for deprecated concepts
  Author: Jerico

v1.0.0 — 2026-04-18
  Initial PRD created during Stellar Bootcamp 2026
  Scope: MVP hackathon build — contract + frontend
  Author: Jerico
```

> **IDE Instruction:** Prepend new entries here. Format: `vX.X.X — YYYY-MM-DD | Short description | Author`

---

## 18. GRAVEYARD (DEPRECATED)

> Sections moved here retain their history. Do not delete — understanding what was rejected and why is part of the product's intellectual DNA.

### [DEPRECATED v0.1.0] — Stellaroid Earn (Original Concept)
**Reason deprecated:** The "learn-to-earn" credential registry had no sustainable buyer. The XLM reward loop lacked a funding source. A judge could reasonably ask "why not use LinkedIn?" and the answer was insufficient. Pivoted to Stella (escrow model) because it has a real buyer (employer), real money movement, and a solvable problem with clear unit economics.

**Original functions:**
- `register_certificate()` — on-chain credential hash + owner
- `verify_certificate()` — boolean check + event
- `reward_student()` — XLM transfer on verification
- `link_payment()` — employer-triggered payment

**Why each was rejected:**
- `register_certificate` — blockchain adds no value over signed PDF or LinkedIn
- `verify_certificate` — no one is paying for this in a hackathon context
- `reward_student` — who funds the rewards? No answer.
- `link_payment` — good concept, absorbed into `unlock_milestone` in Stella
```
