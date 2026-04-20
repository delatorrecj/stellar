# Gemini Project Context: Stella ⭐

## Project Overview
Stella is a milestone-based escrow dApp built on the **Soroban (Stellar)** smart contract platform. Its primary goal is to bridge the trust gap between employers and fresh graduates during onboarding by locking funds into a smart contract that releases payments as candidates complete predefined milestones.

### Architecture
The project follows a client-server architecture where the "server" is a decentralized smart contract on the Stellar Testnet.

- **Smart Contract (Rust/Soroban):** A state machine managing the escrow lifecycle:
    - `Pending`: Employer has locked funds.
    - `Active`: Candidate has accepted the escrow.
    - `Complete`: All milestones released.
    - `Cancelled`: Employer recovered unreleased funds (clawback).
    - `Disputed`: Candidate raised a dispute post-deadline.
    - `Resolved`: Arbitrator resolved the dispute with a BPS-based fund split.
- **Frontend (React/TypeScript/Vite):** A polished PWA providing dedicated dashboards for:
    - **Employers:** Create escrows, release milestones, and perform clawbacks.
    - **Candidates:** Accept escrows, track progress, and raise disputes.
    - **Arbitrators:** Review disputed contracts and execute fund splits.

### Tech Stack
- **Blockchain:** Stellar Testnet, Soroban SDK v22.
- **Contract Language:** Rust (`#![no_std]`).
- **Frontend:** React 19, Vite 6, TypeScript, Tailwind CSS v4.
- **Wallet Integration:** Freighter API v6.
- **Deployment:** Vercel (Frontend).

## Building and Running

### Prerequisites
- Node.js 18+
- Rust + `wasm32-unknown-unknown` target
- Stellar CLI v26+
- Freighter browser extension (set to Testnet)

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Smart Contract
```bash
cd contract
# Run unit tests
cargo test
# Build WASM
stellar contract build
# Deploy to Testnet
stellar contract deploy --wasm target/wasm32-unknown-unknown/release/stella.wasm --source <your-key> --network testnet
```

## Development Conventions

### Smart Contract Guidelines (Critical)
- **Security First:** Every mutating function MUST start with `require_auth()`.
- **Storage:** Use `persistent()` storage for all financial data (balances, escrow state).
- **Arithmetic:** Use `i128` for all token amounts (stroops) and employ checked arithmetic (`checked_add`, `checked_sub`).
- **Execution Order:** Follow the pattern: `Auth` $
ightarrow$ `Validate` $
ightarrow$ `Check State` $
ightarrow$ `Write State` $
ightarrow$ `Transfer Tokens` $
ightarrow$ `Emit Event`.
- **No Std:** The contract is `#![no_std]`. Use `soroban_sdk` types instead of `std` collections.

### Frontend Guidelines
- **Amount Conversion:** Always convert between XLM and stroops (1 XLM = 10,000,000 stroops) at the boundary using `BigInt`.
- **Transaction Lifecycle:** Always follow: `Build` $
ightarrow$ `Simulate` $
ightarrow$ `Sign (Freighter)` $
ightarrow$ `Submit`.
- **Error Handling:** Map numeric contract error codes to user-friendly messages using a mapping object.

### Project Structure
- `/contract`: Rust source code and tests for the Soroban contract.
- `/frontend`: React source code, hooks, and components for the dApp.
- `/docs`: Product requirements and architectural documentation.
- `/scripts`: Utility scripts for contract initialization.
