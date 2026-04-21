# Product Requirements Document: Stella ⭐

## 1. Vision & Purpose
Stella is a decentralized, milestone-based escrow dApp built on the Stellar (Soroban) network. Its purpose is to eliminate the "Day Zero" poverty trap for fresh graduates by providing a trustless mechanism for onboarding funds.

**Core Value Proposition:** 
- **For Employers:** Funds are locked on-chain, ensuring the candidate is committed, with the ability to recover funds (clawback) if the candidate ghosts.
- **For Candidates:** Guaranteed payment for completed milestones, eliminating the risk of non-payment by the employer.

---

## 2. Functional Requirements

### 2.1 Escrow Lifecycle (State Machine)
The system operates as a state machine keyed by a composite identifier: `(Employer Address, Candidate Address)`. This allows a candidate to maintain multiple distinct escrows from different employers.

| State | Trigger | Description | Allowed Actions |
| :--- | :--- | :--- | :--- |
| **Pending** | `init_escrow` | Employer has locked funds and defined milestones. | `candidate_accept`, `clawback` |
| **Active** | `candidate_accept` | Candidate has opted in. Work period has begun. | `unlock_milestone`, `clawback`, `raise_dispute` (post-deadline) |
| **Complete** | `unlock_milestone` (Last) | All milestones have been released to the candidate. | None (Terminal) |
| **Cancelled** | `clawback` | Employer recovered all unreleased funds. | None (Terminal) |
| **Disputed** | `raise_dispute` | Candidate raised a formal dispute after the deadline. | `resolve_dispute` |
| **Resolved** | `resolve_dispute` | Arbitrator executed a final fund split. | None (Terminal) |

### 2.2 Core Features

#### A. Multi-Milestone Funding
- Employers define a list of `Milestones` (Description + Amount).
- The total sum of all milestones is locked into the contract upon initialization.
- Funds are released atomically per milestone.

#### B. Dispute Resolution Engine (V2.0)
- If the deadline passes and milestones remain unreleased, the candidate can transition the escrow to the `Disputed` state.
- A designated **Arbitrator** reviews the work and determines a split of the remaining funds using Basis Points (BPS).
- Example: 70% to Candidate, 30% back to Employer (7000 BPS / 3000 BPS).

#### C. Safety & Integrity
- **Auth Guards:** Every state-changing function requires `require_auth()` from the appropriate actor (Employer, Candidate, or Arbitrator).
- **Atomic Transfers:** Token movements happen via the Stellar Asset Contract (SAC), ensuring no funds are "lost" in the contract.
- **TTL Management:** All persistent storage entries are extended on every write to prevent archival.

---

## 3. Technical Specifications

### 3.1 Storage Schema
- **Composite Key:** `DataKey::Escrow(Address, Address)` → `Escrow` struct.
- **Instance Storage:** `DataKey::Admin` and `DataKey::Token` (Sovereign XLM SAC).

### 3.2 Critical API Signatures
- `init_escrow(employer, candidate, arbitrator, descriptions, amounts, deadline)`
- `candidate_accept(employer, candidate)`
- `unlock_milestone(employer, candidate, milestone_id)`
- `clawback(employer, candidate)`
- `raise_dispute(employer, candidate)`
- `resolve_dispute(arbitrator, employer, candidate, candidate_bps)`
- `get_escrow(employer, candidate)`

---

## 4. User Experience (UX) Requirements
- **Employer Dashboard:** Ability to search for candidates, create milestone-based offers, and track release progress.
- **Candidate Dashboard:** View all pending/active offers across different employers, accept contracts, and track payouts.
- **Arbitrator Dashboard:** List all `Disputed` contracts and execute BPS-based resolutions.
- **Wallet Integration:** Seamless signing via the Freighter extension.
