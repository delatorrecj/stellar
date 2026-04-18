# 🚀 Stellar Bootcamp 2026 — Context & Battle Plan

> **Last Updated:** 2026-04-18 09:01 PHT  
> **Status:** 🟢 Fully Ready — Waiting for Bootcamp (4 PM)  
> **Event:** Stellar Bootcamp (Offline) — Whitecloak Office, Ortigas, Manila  
> **Date:** April 18, 2026 | Duration: 4 hours (4:00 PM - 8:00 PM)

---

## 📋 Table of Contents
- [What Is This Bootcamp](#what-is-this-bootcamp)
- [What You Need to Know](#what-you-need-to-know)
- [Environment Status](#environment-status)
- [Two Tracks: Certificate vs Prize Pool](#two-tracks-certificate-vs-prize-pool)
- [What I Can Do For You](#what-i-can-do-for-you)
- [Quick Reference Commands](#quick-reference-commands)
- [Project Structure](#project-structure)
- [Key Links](#key-links)
- [Session Log](#session-log)

---

## What Is This Bootcamp

A **4-hour hands-on session** where you:
1. Receive an assigned **Soroban smart contract** (Stellar's smart contract platform, written in Rust)
2. Complete the contract code
3. Test it locally with `cargo test` (minimum 3 passing tests)
4. Deploy it to the **Stellar testnet**
5. Submit your Contract ID + GitHub repo on **Rise In** for certification

> [!IMPORTANT]
> This is a **Soroban (Rust) smart contract bootcamp**, not a generic web3 workshop. The core deliverable is a **deployed smart contract on Stellar testnet**.

---

## What You Need to Know

### Core Concepts (Crash Course)

| Concept | What It Is | Why It Matters |
|---------|-----------|----------------|
| **Stellar** | A blockchain network optimized for fast, low-cost payments (<$0.01 fees, ~5s finality) | The platform you're building on |
| **Soroban** | Stellar's smart contract platform | Where your code runs on-chain |
| **Rust** | The programming language for Soroban contracts | What you'll write code in |
| **WASM** | WebAssembly — your Rust code compiles to this format | The binary that gets deployed on-chain |
| **Testnet** | A fake version of Stellar for development (free to use) | Where you deploy (not real money) |
| **Freighter** | Browser wallet extension (like MetaMask for Stellar) | Signs transactions, connects dApps |
| **XLM** | Stellar's native cryptocurrency | Needed for gas fees on testnet (free via Friendbot) |
| **Friendbot** | A testnet faucet that gives you free test XLM | Fund your wallet for testing |
| **Stellar CLI** | Command-line tool for deploying/interacting with contracts | Your deployment tool |
| **Contract ID** | On-chain address of your deployed contract (starts with `C...`) | What you submit for certification |
| **Stellar Expert** | Block explorer to verify your contract on-chain | Proof of deployment |

### How a Soroban Contract Works (30-second version)

```
┌─────────────────────────────────────────┐
│  Your Rust Code (lib.rs)                │
│  ├── #[contract] struct MyContract;     │
│  ├── #[contractimpl] impl MyContract {  │
│  │     pub fn my_function(...)  { ... } │
│  │   }                                  │
│  └── Tests (test.rs)                    │
└──────────────┬──────────────────────────┘
               │ cargo build --target wasm32-unknown-unknown
               ▼
┌──────────────────────────────────────────┐
│  .wasm binary                            │
└──────────────┬───────────────────────────┘
               │ stellar contract deploy
               ▼
┌──────────────────────────────────────────┐
│  Stellar Testnet                         │
│  Contract ID: CABCDEF...                 │
│  Verify: stellar.expert/explorer/testnet │
└──────────────────────────────────────────┘
```

### Soroban Rust Patterns (Cheat Sheet)

```rust
// Basic contract structure
#![no_std]
use soroban_sdk::{contract, contractimpl, Env, Symbol, String, log};

#[contract]
pub struct MyContract;

#[contractimpl]
impl MyContract {
    // Public function callable on-chain
    pub fn hello(env: Env, to: Symbol) -> Vec<Symbol> {
        vec![&env, Symbol::new(&env, "Hello"), to]
    }
    
    // Store data
    pub fn set_value(env: Env, key: Symbol, value: i128) {
        env.storage().persistent().set(&key, &value);
    }
    
    // Read data
    pub fn get_value(env: Env, key: Symbol) -> i128 {
        env.storage().persistent().get(&key).unwrap_or(0)
    }
}
```

---

## Environment Status

| Prerequisite | Status | Notes |
|-------------|--------|-------|
| **Git** | ✅ v2.48.1 | Ready |
| **Node.js** | ✅ v22.11.0 | Ready (for frontend if going for prize pool) |
| **npm** | ✅ v10.9.0 | Ready |
| **Rust** | ✅ v1.95.0 | Installed via rustup (GNU toolchain) |
| **WASM target** | ✅ Added | `wasm32-unknown-unknown` target ready |
| **Stellar CLI** | ✅ v26.0.0 | Installed via winget (pre-built binary) |
| **Testnet Identity** | ✅ `my-key` | Public: `GABTUX53227CZQJSRKS6UMT2VWUZCLX27AGCDLHRS7VYJJB4DBIMHKIU` |
| **Funded Testnet Account** | ✅ Funded | 10,000 test XLM via Friendbot |
| **Freighter Wallet** | ✅ v5.39.0 (Testnet) | Public: `GCDBINSYWE36SRQKGU7F43MX3T2Z6VGWR6HFEGMLWGKSNYEK2WNZXE57` |

### 🔧 Setup Instructions (Run These in Order)

#### Step 1: Install Rust
```powershell
# Download and run the Rust installer
# Go to: https://rustup.rs/ and download rustup-init.exe
# OR use winget:
winget install Rustlang.Rustup
```
> After installing, **restart your terminal** so `cargo` and `rustc` are on PATH.

#### Step 2: Add WASM Target
```powershell
rustup target add wasm32-unknown-unknown
```

#### Step 3: Install Stellar CLI
```powershell
cargo install --locked stellar-cli
```
> ⚠️ This takes 5-10 minutes to compile. Start it early!

#### Step 4: Generate Testnet Identity
```powershell
stellar keys generate --global my-key --network testnet
stellar keys address my-key
```

#### Step 5: Fund Testnet Account
```powershell
stellar keys fund my-key --network testnet
```

#### Step 6: Install Freighter Wallet
- Chrome Extension: https://www.freighter.app/
- Switch network to **Testnet** in Freighter settings
- Copy your wallet public address (starts with `G...`)
- Fund it via Friendbot:
```powershell
Invoke-WebRequest "https://friendbot.stellar.org?addr=<YOUR_FREIGHTER_TESTNET_ADDRESS>"
```

---

## ⚠️ Security Notes

> [!CAUTION]
> **NEVER commit secret keys, seed phrases, or identity `.toml` files to Git.**

| Secret | Location | Protected By |
|--------|----------|-------------|
| **Stellar identity `my-key`** | `C:\Users\delat\.config\stellar\identity\my-key.toml` | OS filesystem only |
| **Secret key** | Inside the `.toml` file above | `.gitignore` blocks `*.toml`, `*secret*`, `identity/` |
| **Freighter seed phrase** | Browser extension storage | Never paste anywhere |
| **`.env` files** | Project root (if created) | `.gitignore` blocks `.env` and `.env.*` |

**Your `.gitignore` blocks:** `*.toml` (except Cargo.toml), `identity/`, `*secret*`, `*seed*`, `*.pem`, `*.key`, `.env`, `.env.*`

**Your public address (safe to share):** `GABTUX53227CZQJSRKS6UMT2VWUZCLX27AGCDLHRS7VYJJB4DBIMHKIU`

---

## Two Tracks: Certificate vs Prize Pool

### 🏅 Track 1: Certificate (Minimum Requirement)
> Deploy a smart contract on Stellar testnet and submit it.

**Required Structure:**
```
stella/
└── contract/
    └── src/
        ├── lib.rs       # Your smart contract code
        └── test.rs      # At least 3 passing unit tests
```

**Deliverables:**
- ✅ Completed contract code
- ✅ `cargo test` with 3+ passing tests
- ✅ Contract deployed to Stellar testnet
- ✅ Contract ID + GitHub repo submitted on Rise In

### 🏆 Track 2: Prize Pool ($100-$200)
> Build a **full-stack project** (frontend + smart contract + integration)

**Required Structure:**
```
stella/
├── contract/          # Soroban smart contract (Rust)
│   └── src/
│       ├── lib.rs
│       └── test.rs
├── frontend/          # Web UI (React/Vite + TypeScript)
│   ├── src/
│   │   ├── lib/       # Stellar SDK, Freighter, config
│   │   ├── views/     # Page components
│   │   └── components/
│   ├── .env
│   └── package.json
└── backend/           # (optional)
```

**Deliverables:**
- Everything from Track 1, PLUS
- ✅ A working frontend that connects to Freighter
- ✅ Frontend interacts with your deployed contract
- ✅ Full-stack demo-able project

### Reference: HatidPay (Previous Winner)
**HatidPay** — Cross-border escrow payments for Filipino SMEs, built in 3 hours.
- **Stack:** React + Vite + TypeScript (frontend) | Rust/Soroban (contract) | Convex (real-time state)
- **Contract:** Escrow with `create_escrow`, `confirm_delivery`, `claim_expired`, `raise_dispute`
- **Live:** https://hatidpay.vercel.app
- **Repo:** https://github.com/JpCurada/hatidpay

---

## What I Can Do For You

### During the Bootcamp, I can:

| Capability | Details |
|-----------|---------|
| 🦀 **Write & Debug Rust/Soroban Contracts** | I can write, fix, and explain contract logic in `lib.rs` and tests in `test.rs` |
| 🧪 **Run Tests** | Execute `cargo test` and help diagnose failures |
| 🚀 **Deploy Contracts** | Run deployment commands to Stellar testnet |
| 🌐 **Build the Frontend** | Scaffold a React+Vite+TypeScript frontend with Freighter wallet integration |
| 🔗 **Integrate Contract ↔ Frontend** | Wire up `@stellar/stellar-sdk` to call your deployed contract |
| 📝 **Explain Concepts** | Break down any Stellar/Soroban/Rust concept in plain language |
| 🏗️ **Scaffold Full Project** | Set up the entire project structure for either certificate or prize pool track |
| 🐛 **Debug Errors** | Interpret Rust compiler errors, Soroban errors, deployment issues |
| 📎 **Git Workflow** | Manage commits, branches, remotes for submission |
| 🔍 **Verify Deployment** | Check contract on Stellar Expert explorer |
| 📊 **Update CONTEXT.md** | Keep this file current as we progress through the bootcamp |

### What I CANNOT do:
- Install system-level tools (Rust, etc.) — you need to approve those
- Sign transactions — that's your Freighter wallet
- Submit on Rise In — you do that in your browser

---

## Quick Reference Commands

### Smart Contract Workflow
```powershell
# Test your contract
cargo test

# Build to WASM
cargo build --target wasm32-unknown-unknown --release

# Find your .wasm file
Get-ChildItem target\wasm32-unknown-unknown\release\*.wasm

# Deploy to testnet
stellar contract deploy `
  --wasm target/wasm32-unknown-unknown/release/<YOUR_CONTRACT_NAME>.wasm `
  --source my-key `
  --network testnet

# Invoke a contract function
stellar contract invoke `
  --id <CONTRACT_ID> `
  --source my-key `
  --network testnet `
  -- <function_name> --arg1 value1

# Verify on Stellar Expert
# https://stellar.expert/explorer/testnet/contract/<YOUR_CONTRACT_ID>
```

### Frontend Workflow (Prize Pool Track)
```powershell
# Navigate to frontend
Set-Location frontend

# Install dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:5173
```

### Git Submission Workflow
```powershell
# Add everything
git add .
git commit -m "Complete Soroban contract + tests"

# Add your own remote
git remote add origin <your-github-repo-url>

# Push
git push -u origin main
```

---

## Project Structure

```
c:\Users\delat\OneDrive\Desktop\stella\
├── .git/                    # Git repo (initialized ✅)
├── .gitignore               # Configured ✅
├── bootcamp-ref/            # Cloned bootcamp guide (reference only, git-ignored)
├── CONTEXT.md               # ← YOU ARE HERE (this file)
├── contract/                # 🔲 Will be created when you receive your assignment
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs           # Smart contract code
│       └── test.rs          # Unit tests
└── frontend/                # 🔲 Will be created if going for prize pool
    └── ...
```

---

## Key Links

| Resource | URL |
|----------|-----|
| **Bootcamp Repo** | https://github.com/armlynobinguar/Stellar-Bootcamp-2026 |
| **Pre-Workshop PDF** | https://github.com/armlynobinguar/Stellar-Bootcamp-2026/blob/main/%5BENG%5D%20Pre-Workshop%20Setup%20Guide.pdf |
| **HatidPay Example** | https://github.com/JpCurada/hatidpay |
| **HatidPay Live** | https://hatidpay.vercel.app |
| **Rust Install** | https://rustup.rs/ |
| **Stellar CLI Docs** | https://developers.stellar.org/docs/tools/stellar-cli |
| **Soroban SDK Docs** | https://docs.rs/soroban-sdk |
| **Freighter Wallet** | https://www.freighter.app/ |
| **Stellar Expert (Testnet)** | https://stellar.expert/explorer/testnet |
| **Friendbot (Fund Testnet)** | https://friendbot.stellar.org |
| **Stellar Lab** | https://lab.stellar.org |
| **Rise In Programs** | https://www.risein.com/programs |
| **Stellar Developers** | https://developers.stellar.org |

---

## Session Log

| Time | Event | Status |
|------|-------|--------|
| 08:10 | CONTEXT.md created, workspace initialized | ✅ |
| 08:10 | Bootcamp reference repo cloned | ✅ |
| 08:10 | .gitignore created | ✅ |
| 08:35 | Rust v1.95.0 installed (GNU toolchain) | ✅ |
| 08:35 | WASM target added (wasm32-unknown-unknown) | ✅ |
| 08:47 | Stellar CLI v26.0.0 installed (winget pre-built) | ✅ |
| 08:49 | Testnet identity `my-key` generated | ✅ |
| 08:49 | Testnet funding attempted (Friendbot flaky) | ✅ Funded! |
| 08:50 | `.gitignore` hardened (secrets protection) | ✅ |
| 08:50 | CONTEXT.md updated with full progress | ✅ |
| 08:52 | Testnet account funded (10,000 test XLM) | ✅ |
| — | Freighter wallet set up | ✅ |
| 09:01 | Freighter v5.39.0 on Testnet, address saved | ✅ |
| 09:01 | `.env` updated with Freighter public key | ✅ |
| — | Contract assigned (at bootcamp) | 🔲 Waiting for session |
| — | Contract completed | 🔲 |
| — | Tests passing (3+) | 🔲 |
| — | Contract deployed | 🔲 |
| — | Submitted on Rise In | 🔲 |
