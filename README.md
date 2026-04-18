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

### System Design

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
    SC -.-> |"Candidate"| Unlock["unlock_milestone()"]
    SC -.-> |"Employer"| Clawback["clawback()"]
```

### Directory Structure

```
stella/
├── contract/          Soroban smart contract (Rust)
│   └── src/
│       ├── lib.rs     Core escrow logic
│       ├── test.rs    Unit tests (3+ passing)
│       ├── types.rs   Data structures
│       └── events.rs  On-chain event definitions
│
├── frontend/          React + Vite dApp
│   └── src/
│       ├── pages/     Dashboard, Employer, Candidate
│       ├── components/ Layout, WalletButton, EscrowCard, Toast
│       ├── hooks/     useStellar (wallet), useEscrow (contract)
│       └── lib/       Soroban client, network config
│
├── docs/              Documentation & Specifications
│   ├── branding.md
│   ├── build.md
│   ├── context.md
│   └── product_requirements.md
│
└── README.md          ← You are here
```

## Smart Contract

| Function           | Description                           |
| ------------------ | ------------------------------------- |
| `init_escrow`      | Lock onboarding funds for a candidate |
| `unlock_milestone` | Candidate claims completed milestone  |
| `clawback`         | Employer recovers remaining funds     |
| `get_escrow`       | View escrow details for a candidate   |

**Contract ID:** `CDA67YOAWOOMMSIW44IOQWDSB2P6PGG3PRH3WPFEFCM5BO3LGF7POHZL`
**Network:** Stellar Testnet

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
