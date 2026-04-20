# Stella ⭐

<div align="center">
  <img src="frontend/public/S.svg" alt="Stella Logo" width="120"/>
  <h1>Stella</h1>
  
  <p><strong>A milestone-based escrow dApp built on Soroban to end the Day Zero poverty trap for fresh graduates.</strong></p>

  <p>
    <a href="https://stella-escrow.vercel.app/"><img src="frontend/public/qr-stella.svg" alt="QR App" width="120" /></a>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
    <a href="https://github.com/delatorrecj/stellar"><img src="frontend/public/qr-github.svg" alt="QR GitHub" width="120" /></a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Soroban-SDK%20v22-blue" alt="Soroban Badge" />
  </p>
</div>

## What is Stella?

Stella bridges the trust gap between employers and job candidates during onboarding. Employers lock onboarding funds into a Soroban smart contract. Candidates claim those funds as they complete milestones. If something goes wrong, employers can recover their remaining balance. No middlemen, no delays, no hidden fees.

**Built for the Stellar Smart Contract Bootcamp 2026.**

---

## Architecture

### System Design (V1.3 Multi-Milestone State Machine)

```mermaid
stateDiagram-v2
    [*] --> Pending: Employer Lock Funds
    Pending --> Active: Candidate Accept
    Pending --> Cancelled: Employer Clawback
    Active --> Active: unlock_milestone(id)
    Active --> Complete: All Milestones Released
    Active --> Cancelled: Employer Clawback (Unreleased)
    Active --> Disputed: Candidate Raise Dispute (Post-Deadline)
    Disputed --> Resolved: Arbitrator Resolve (BPS Split)
    Complete --> [*]
    Cancelled --> [*]
    Resolved --> [*]
```

```mermaid
graph TD
    subgraph Client ["Client Side (Browser)"]
        UI["React Web App (Vite/TS)"] <--> |"Sign Transactions"| W["Freighter Wallet"]
    end

    subgraph Stellar ["Stellar Network (Testnet)"]
        RPC["Soroban RPC"]
        SC{"Stella Smart Contract"}
    end

    UI --> |"Builds & Submits XDR via Stellar SDK"| RPC
    RPC --> |"Executes on Ledger"| SC

    SC -.-> |"Employer"| Init["init_escrow()"]
    SC -.-> |"Candidate"| Accept["candidate_accept()"]
    SC -.-> |"Employer"| Unlock["unlock_milestone()"]
    SC -.-> |"Employer"| Clawback["clawback()"]
    SC -.-> |"Candidate"| Dispute["raise_dispute()"]
    SC -.-> |"Arbitrator"| Resolve["resolve_dispute()"]
```

> **V2.0 Spotlight:** Introducing the **Dispute Resolution Engine**. Candidates can now raise a formal dispute if a contract passes its deadline without full release. A designated platform arbitrator reviews contributions and executes an on-chain split (BPS-based) to ensure fairness.

### Directory Structure

```
stella/
├── contract/          Soroban smart contract (Rust)
│   └── src/
│       ├── lib.rs     Dispute Resolution & Lifecycle Logic
│       ├── test.rs    25 performance-graded unit tests
│       ├── types.rs   Disputed/Resolved state machine
│       └── events.rs  DisputeRaised & DisputeResolved events
│
├── frontend/          React + Vite dApp (PWA)
│   └── src/
│       ├── pages/     Employer, Candidate, Arbitrator (Resolution Dash)
│       ├── hooks/     useEscrow (Dispute Guards & Polling)
│       ├── lib/       Contract Client & RPC Node Pool
│       └── components/ TransactionToasts & UI Primitives
│
├── docs/              Full project documentation
└── README.md          ← You are here
```

## Smart Contract (V2.0)

| Function           | Description                                   | Guard           |
| ------------------ | --------------------------------------------- | --------------- |
| `initialize`       | One-time setup (Admin + Native Token)         | Admin Only      |
| `init_escrow`      | Create multi-milestone escrow (Locks Funds)   | Employer        |
| `candidate_accept` | Transitions escrow Pending → Active           | Candidate       |
| `unlock_milestone` | Releases specific funds to Candidate          | Employer        |
| `clawback`         | Returns unreleased funds to Employer          | Employer        |
| `raise_dispute`    | Flag contract for arbitration (Post-Deadline) | Candidate       |
| `resolve_dispute`  | Final fund split by trusted third-party       | Arbitrator Only |
| `get_escrow`       | Fetches on-chain state & progress             | Public          |

**Contract ID:** `CAZHXCM3UNLT7HJLYHFWBRWAF3PCFN5TR4QCNYDCGCQ6K3ZMU7X7ZSLH`
**Network:** Stellar Testnet (V22)
**Asset:** Native XLM (`CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`)

## Getting Started

### Prerequisites

- Node.js 18+
- Rust + `wasm32-unknown-unknown` target
- Stellar CLI v26+
- Freighter browser extension

### Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

### Build & Test the Contract

```bash
cd contract
cargo test
stellar contract build
```

### Walkthrough & Testing Guide:

To test the complete end-to-end trust flow, we **mandate** using two separate browser profiles (or two different browsers like Chrome + Firefox). This allows you to simulate the Employer and Candidate side-by-side without wallet conflicts.

1.  **Preparation**:
    *   Install **Freighter** on both browser profiles.
    *   Set both to **Stellar Testnet**.
    *   Fund both wallets using the "Fund with Friendbot" button (10,000 test XLM each).
2.  **Onboarding Guides (New Feature)**:
    *   Whenever you connect a brand new wallet identity to either the Employer or Candidate dashboards for the first time, a **Quick Guide** will automatically pop up. 
    *   This is locally tracked: the guide automatically resets and displays itself anytime a *new* unique ID is detected taking on a role.
3.  **Employer (Browser A)**:
    *   Connect wallet, review the Quick Guide, and enter the portal.
    *   Copy the **Candidate's address** from Browser B.
    *   Lock funds: Enter the address, add 2-3 milestones (e.g., "Medical Exam" - 50 XLM, "NBI Clearance" - 100 XLM), set a deadline (30 days), and click **Lock Onboarding Funds**.
4.  **Candidate (Browser B)**:
    *   Connect wallet, review the Quick Guide, and enter the portal.
    *   You will see a "Pending Acceptance" card. Review the milestones and click **Accept Escrow**.
    *   *System Check*: The status in Browser A (Employer) will instantly flip to "Active".
5.  **Release Funds (Browser A)**:
    *   As the Employer, click **Release** on the first milestone.
    *   *System Check*: The Candidate (Browser B) will see the milestone mark as paid, and their XLM balance (top right) will increase.
6.  **Conflict Simulation (Disputes)**:
    *   If a deadline expires and funds aren't released, the Candidate (Browser B) can click **Raise Formal Dispute**.
    *   This transitions the escrow to `Disputed`. The platform arbitrator securely handles the contract.

## Tech Stack

| Layer    | Technology                               |
| -------- | ---------------------------------------- |
| Contract | Rust, Soroban SDK, soroban-sdk v22       |
| Frontend | React 19, Vite 6, Tailwind CSS v4        |
| PWA      | vite-plugin-pwa, Service Workers         |
| Wallet   | Freighter API v6                         |
| Network  | Stellar Testnet, Soroban RPC             |
| Design   | "Warm Fintech Trust" (Plus Jakarta Sans) |

## Author

- Carlos Jerico Dela Torre
- BS Computer Engineering
- Polytechnic University of the Philippines

## License

MIT — Stellar Bootcamp Philippines 2026 (April 18 • Whitecloak Ortigas)
