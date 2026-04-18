# STELLAROID FLOW — BUILD GUIDE & SMART CONTRACT BEST PRACTICES
> **Purpose:** Feed this entire document to your IDE agent before every coding session.
> **Audience:** AI coding agent (Antigravity / Cursor / Copilot) working on Soroban + React.
> **Rule:** Agent must read this before writing a single line of `lib.rs` or `contract.ts`.

---

## AGENT DIRECTIVE

You are building a Soroban smart contract on the Stellar blockchain. The developer (Jerico) is new to blockchain development. Your job is to write safe, minimal, demo-ready code. Prioritize correctness over cleverness. Never skip `require_auth()`. Never use temporary storage for financial state. When in doubt, do less — not more.

---

## PART 1: HOW BLOCKCHAIN IS DIFFERENT FROM NORMAL DEVELOPMENT

Before writing any code, the agent must internalize these differences. They are not optional nuances — they are the reason smart contract bugs cause permanent, irreversible financial loss.

### 1.1 Immutability — You Cannot Patch Production
In web development, a bug means you push a fix and redeploy in minutes. In smart contracts, once a contract is deployed, **the code is permanent**. You cannot edit it. You cannot delete it. If your `clawback()` function has a logic error that lets anyone call it — not just the employer — that is a permanent vulnerability.

**What this means for the agent:**
- Write the simplest correct implementation first. No "we'll add the check later."
- Every auth guard (`require_auth`) must be present before deployment, not added in V2.
- Test edge cases before deploying. A failing unit test is cheap. A live exploit is not.

### 1.2 Transactions Are Atomic — All or Nothing
A Stellar transaction either fully succeeds or fully reverts. There is no partial state. If your `init_escrow` function transfers XLM and then panics while writing storage, the XLM transfer is also reverted. The ledger is always consistent.

**What this means for the agent:**
- You do not need manual rollback logic. Let panics revert naturally.
- Do NOT write partial state and then "clean up later." Write state completely or not at all.
- This is a feature, not a limitation. Lean into it.

### 1.3 Every Operation Costs Gas (Fees)
Every instruction executed on Stellar costs a fee in XLM. Complex logic, large storage reads, nested loops — all cost more. On testnet this is invisible. On mainnet, expensive contracts get abandoned.

**What this means for the agent:**
- Avoid loops over unbounded collections in contracts.
- Do not store large strings or arrays on-chain. Store hashes, not content.
- Prefer flat storage (one key = one value) over nested structures.
- The MVP contract should be under 100KB WASM. Check with `ls -lh *.wasm`.

### 1.4 Storage Has Three Tiers — Use Them Correctly
Soroban has three storage types. Using the wrong one will cause your demo to break.

| Storage Type | Persistence | Use For |
|---|---|---|
| `persistent()` | Survives archival (restored by payment) | Escrow balances, user state — anything financial |
| `instance()` | Lives as long as contract instance | Contract-wide config, admin address |
| `temporary()` | Expires after N ledgers (~1 day default) | Short-lived nonces, in-flight flags |

**Rule: All financial state (Escrow struct, balances) MUST use `persistent()`. Never use `temporary()` for anything involving money.**

### 1.5 Addresses Are Not Strings — They Are Auth Objects
In web dev, a "user ID" is just a string you validate. In Soroban, an `Address` is a cryptographic object. When you call `employer.require_auth()`, the Stellar network itself verifies that the transaction was signed by the private key corresponding to that address. You cannot fake this.

**What this means for the agent:**
- Always call `require_auth()` on the actor who should be authorizing the action.
- Never trust a passed address alone — always pair it with `require_auth()`.
- `require_auth()` is free. There is no reason to skip it.

---

## PART 2: SOROBAN-SPECIFIC RULES

### 2.1 The `#![no_std]` Constraint
Soroban contracts run in a WASM sandbox with no access to the Rust standard library. You cannot use `std::collections::HashMap`, `std::time`, `println!`, or anything from `std`.

**Allowed:**
```rust
use soroban_sdk::{contract, contractimpl, contracttype, contracterror};
use soroban_sdk::{Env, Address, Symbol, String, Vec, Map, log};
```

**Not allowed:**
```rust
use std::collections::HashMap;  // ❌ No std
use std::time::SystemTime;      // ❌ No std time — use env.ledger().timestamp()
println!("debug");              // ❌ No stdout — use log!(&env, "debug")
```

### 2.2 Integer Types — Always Use `i128` for Amounts
Stellar amounts (stroops) are large integers. `u64` overflows. Always use `i128` for any amount.

```rust
// ✅ Correct
pub total_amount: i128,

// ❌ Wrong — will overflow for large XLM amounts
pub total_amount: u64,
```

1 XLM = 10,000,000 stroops. So 500 XLM = 5,000,000,000 stroops. That fits in `i128`, not safely in `u32`.

### 2.3 Token Transfers — Use the Token Client, Not Manual Accounting
You do not manually increment/decrement balances like a bank ledger. You call the Stellar native token contract to move actual XLM.

```rust
// ✅ Correct — transfer real XLM using token client
use soroban_sdk::token::Client as TokenClient;

let xlm_contract = env.current_contract_address(); // contract holds the funds
let token = TokenClient::new(&env, &env.current_contract_address());
token.transfer(&sender, &recipient, &amount);

// ❌ Wrong — this only changes a number in storage, no actual XLM moves
escrow.unlocked_amount += milestone_amount;  // without transfer(), no XLM moves
```

**The correct pattern for init_escrow (locking funds):**
```rust
// Employer → Contract (lock)
let token = get_token_client(&env);
token.transfer(&employer, &env.current_contract_address(), &amount);
```

**The correct pattern for unlock_milestone (releasing funds):**
```rust
// Contract → Candidate (release)
let token = get_token_client(&env);
token.transfer(&env.current_contract_address(), &candidate, &milestone_amount);
```

### 2.4 Getting the Native XLM Token Address
```rust
fn get_xlm_token(env: &Env) -> Address {
    // On testnet, native XLM is the Stellar Asset Contract (SAC)
    // Address: CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC (testnet)
    Address::from_str(env, "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC")
}
```

Or pass it as a parameter during `init_escrow` to avoid hardcoding:
```rust
pub fn init_escrow(env: Env, token: Address, employer: Address, ...) { ... }
```

### 2.5 Auth Pattern — The Correct Order
```rust
pub fn init_escrow(env: Env, employer: Address, candidate: Address, amount: i128) {
    // STEP 1: Auth FIRST, before touching any state
    employer.require_auth();

    // STEP 2: Validate inputs
    if amount <= 0 { panic_with_error!(&env, StellaError::InvalidAmount); }

    // STEP 3: Check preconditions (no existing escrow)
    if env.storage().persistent().has(&DataKey::Escrow(candidate.clone())) {
        panic_with_error!(&env, StellaError::EscrowAlreadyExists);
    }

    // STEP 4: Write state BEFORE token transfer (re-entrancy protection)
    let escrow = Escrow { ... };
    env.storage().persistent().set(&DataKey::Escrow(candidate.clone()), &escrow);

    // STEP 5: Transfer tokens LAST
    let token = TokenClient::new(&env, &get_xlm_token(&env));
    token.transfer(&employer, &env.current_contract_address(), &amount);

    // STEP 6: Emit event LAST
    env.events().publish(("escrow", "created"), (employer, candidate, amount));
}
```

**The order is always: Auth → Validate → Check state → Write state → Transfer → Emit.**

### 2.6 Panic vs. Return Error
For Soroban MVP, use `panic_with_error!` for all error cases. It reverts the transaction cleanly.

```rust
// ✅ Correct for hackathon
panic_with_error!(&env, StellaError::EscrowNotFound);

// ✅ Also fine — Result<> return for cleaner V1 code
pub fn clawback(env: Env, employer: Address) -> Result<i128, StellaError> {
    let escrow = env.storage().persistent()
        .get::<DataKey, Escrow>(&DataKey::Escrow(candidate.clone()))
        .ok_or(StellaError::EscrowNotFound)?;
    Ok(remaining)
}
```

### 2.7 Events — Emit Them, Judges Look For Them
On-chain events are how frontends (and judges) verify your contract actually did something.

```rust
// Format: topics are a tuple of short symbols, data is the payload
env.events().publish(
    (Symbol::new(&env, "escrow"), Symbol::new(&env, "created")),
    (employer.clone(), candidate.clone(), amount)
);
```

### 2.8 Testing — Use the Soroban Test Environment
Never test against mainnet or testnet during development. Use `soroban_sdk::testutils`.

```rust
#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger};
    use soroban_sdk::Env;

    #[test]
    fn test_init_escrow() {
        let env = Env::default();
        env.mock_all_auths(); // CRITICAL: mock auth in tests or require_auth() panics

        let contract_id = env.register_contract(None, StellaContract);
        let client = StellaContractClient::new(&env, &contract_id);

        let employer = Address::generate(&env);
        let candidate = Address::generate(&env);

        client.init_escrow(&employer, &candidate, &500_0000000i128, &9999999999u64);

        let escrow = client.get_escrow(&candidate);
        assert_eq!(escrow.total_amount, 500_0000000i128);
        assert!(escrow.is_active);
    }
}
```

**`env.mock_all_auths()` is mandatory in tests.** Without it, every `require_auth()` call panics.

---

## PART 3: FRONTEND + WALLET INTEGRATION BEST PRACTICES

### 3.1 The Transaction Lifecycle — Build → Simulate → Sign → Submit
Never skip simulation. Simulation catches errors before the user signs and wastes no fees.

```typescript
// Step 1: Build the operation
const contract = new StellarSdk.Contract(CONTRACT_ID);
const operation = contract.call(
  "init_escrow",
  StellarSdk.nativeToScVal(employerAddress, { type: "address" }),
  StellarSdk.nativeToScVal(candidateAddress, { type: "address" }),
  StellarSdk.nativeToScVal(amountStroops, { type: "i128" }),
  StellarSdk.nativeToScVal(deadlineUnix, { type: "u64" })
);

// Step 2: Build transaction
const account = await rpc.getAccount(publicKey);
const tx = new StellarSdk.TransactionBuilder(account, {
  fee: StellarSdk.BASE_FEE,
  networkPassphrase: StellarSdk.Networks.TESTNET,
})
  .addOperation(operation)
  .setTimeout(30)
  .build();

// Step 3: Simulate (catches errors, gets fee estimate)
const simResult = await rpc.simulateTransaction(tx);
if (StellarSdk.rpc.Api.isSimulationError(simResult)) {
  throw new Error(`Simulation failed: ${simResult.error}`);
}

// Step 4: Assemble (applies resource fees from simulation)
const assembledTx = StellarSdk.rpc.assembleTransaction(tx, simResult).build();

// Step 5: Sign via Freighter
const { signedTxXdr } = await signTransaction(assembledTx.toXDR(), {
  networkPassphrase: StellarSdk.Networks.TESTNET,
});

// Step 6: Submit
const result = await rpc.sendTransaction(
  StellarSdk.TransactionBuilder.fromXDR(signedTxXdr, StellarSdk.Networks.TESTNET)
);
```

### 3.2 Amount Conversion — XLM ↔ Stroops
All on-chain amounts are in stroops. Always convert at the boundary.

```typescript
// Constants
const STROOPS_PER_XLM = 10_000_000n; // BigInt

// User input (XLM) → Contract (stroops)
const xlmInput = parseFloat(userInputString); // e.g. 500.0
const stroops = BigInt(Math.round(xlmInput * 10_000_000)); // 5000000000n

// Contract output (stroops) → Display (XLM)
const displayXLM = (stroops / STROOPS_PER_XLM).toString(); // "500"

// Never use floating point for financial amounts in contract calls
// Always use BigInt for stroops
```

### 3.3 Freighter — Check Before Every Call
```typescript
import { isConnected, isAllowed, getPublicKey, signTransaction } from "@stellar/freighter-api";

export const connectWallet = async (): Promise<string> => {
  // 1. Check extension exists
  const connection = await isConnected();
  if (!connection.isConnected) {
    throw new Error("Freighter wallet extension is not installed. Install it at freighter.app");
  }

  // 2. Check permission
  const allowed = await isAllowed();
  if (!allowed.isAllowed) {
    // This triggers the Freighter permission popup
    await setAllowed();
  }

  // 3. Get public key
  const { publicKey, error } = await getPublicKey();
  if (error) throw new Error(error);

  return publicKey;
};
```

### 3.4 Stellar Address Validation
```typescript
export const isValidStellarAddress = (address: string): boolean => {
  try {
    StellarSdk.Keypair.fromPublicKey(address);
    return true;
  } catch {
    return false;
  }
};

// Use before EVERY contract call that takes an address input
if (!isValidStellarAddress(candidateInput)) {
  setError("Invalid Stellar address. Must start with G and be 56 characters.");
  return;
}
```

### 3.5 Error Handling — Translate Contract Errors for Users
```typescript
const CONTRACT_ERRORS: Record<number, string> = {
  1: "An escrow already exists for this candidate.",
  2: "No escrow found for this address.",
  3: "This escrow is no longer active.",
  4: "Claim amount exceeds available balance.",
  5: "There is nothing left to clawback.",
  6: "You are not authorized to perform this action.",
  7: "Deadline must be at least 7 days from now.",
};

export const parseContractError = (error: unknown): string => {
  const msg = String(error);
  const match = msg.match(/Error\(Contract, #(\d+)\)/);
  if (match) {
    const code = parseInt(match[1]);
    return CONTRACT_ERRORS[code] ?? `Contract error #${code}`;
  }
  if (msg.includes("insufficient balance")) return "Insufficient XLM balance in wallet.";
  if (msg.includes("timeout")) return "Transaction timed out. Please try again.";
  return "Transaction failed. Check your wallet and try again.";
};
```

### 3.6 Transaction Polling — Wait for Confirmation
```typescript
export const waitForTransaction = async (
  rpc: StellarSdk.rpc.Server,
  hash: string,
  maxAttempts = 20
): Promise<StellarSdk.rpc.Api.GetTransactionResponse> => {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 1500)); // wait 1.5s between polls
    const result = await rpc.getTransaction(hash);
    if (result.status === "SUCCESS") return result;
    if (result.status === "FAILED") throw new Error(`Transaction failed: ${result.resultXdr}`);
    // status === "NOT_FOUND" means still processing — keep polling
  }
  throw new Error("Transaction confirmation timeout after 30 seconds.");
};
```

---

## PART 4: SECURITY RULES — NON-NEGOTIABLE

The agent must enforce every rule in this section without exception.

### RULE 1: Auth Before Everything
```rust
// ✅ ALWAYS first line of any mutating function
pub fn clawback(env: Env, employer: Address) {
    employer.require_auth(); // ← FIRST. ALWAYS.
    // ... rest of logic
}

// ❌ NEVER skip auth "for simplicity" or "for the demo"
pub fn clawback(env: Env, employer: Address) {
    // No auth check — ANYONE can drain the escrow
    let token = TokenClient::new(&env, &get_xlm_token(&env));
    token.transfer(&env.current_contract_address(), &employer, &remaining);
}
```

### RULE 2: State Before Transfer (Re-entrancy Protection)
```rust
// ✅ Correct order — state updated before transfer
escrow.unlocked_amount += milestone_amount;
escrow.milestones_completed += 1;
env.storage().persistent().set(&DataKey::Escrow(candidate.clone()), &escrow); // write first
token.transfer(&env.current_contract_address(), &candidate, &milestone_amount); // transfer second

// ❌ Wrong order — transfer before state write
token.transfer(...); // if something fails after this, state is inconsistent
env.storage().persistent().set(...);
```

### RULE 3: Validate All Arithmetic Bounds
```rust
// ✅ Always check before arithmetic
let remaining = escrow.total_amount
    .checked_sub(escrow.unlocked_amount)
    .expect("arithmetic underflow");

if milestone_amount > remaining {
    panic_with_error!(&env, StellaError::ExceedsTotal);
}

// ❌ Never assume amounts are safe
let remaining = escrow.total_amount - escrow.unlocked_amount; // can underflow
```

### RULE 4: Never Store Secrets On-Chain
```
❌ Never store: private keys, passwords, emails, names, phone numbers
✅ Store only: addresses, hashes, amounts, timestamps, boolean flags
Everything on a blockchain is PUBLIC. Assume every value in storage is readable by anyone.
```

### RULE 5: Never Hardcode Private Keys in Frontend
```typescript
// ❌ NEVER — instant security incident
const EMPLOYER_SECRET = "SCZANGBA5QLPCE2NQTNEW5C4RPI6POPFY5TVHZFBVBQNKNLCDXOQHH0";

// ✅ ALWAYS — let Freighter manage keys
const { signedTxXdr } = await signTransaction(txXDR, { networkPassphrase });
```

### RULE 6: Testnet Keys Are Not Mainnet Keys
```
The identity my-key and GABTUX53... are testnet identities only.
Before mainnet: generate fresh keys, never reuse testnet keys, audit contract.
For this hackathon: testnet only. Do not deploy to mainnet.
```

---

## PART 5: COMMON MISTAKES & HOW TO FIX THEM

### Mistake 1: WASM Compilation Fails
```
Error: error[E0433]: failed to resolve: use of undeclared crate or module `std`

Fix: Add #![no_std] at the top of lib.rs
Also ensure: use soroban_sdk::vec instead of std::vec
```

### Mistake 2: `require_auth()` Panics in Tests
```
Error: HostError: Error(Auth, InvalidAction)

Fix: Add env.mock_all_auths(); at the start of every test function.
This is ONLY for tests — never mock auth in production contracts.
```

### Mistake 3: Storage Returns None Unexpectedly
```rust
// Wrong: unwrap() panics if key doesn't exist
let escrow = env.storage().persistent().get::<DataKey, Escrow>(&key).unwrap();

// Correct: handle missing key explicitly
let escrow = env.storage().persistent()
    .get::<DataKey, Escrow>(&key)
    .unwrap_or_else(|| panic_with_error!(&env, StellaError::EscrowNotFound));
```

### Mistake 4: XLM Transfer Fails — Contract Has No Trustline
```
Error: op_no_trust or token transfer fails

Fix: The native XLM contract on Stellar does not require a trustline.
But if you use a custom token (USDC), the contract address needs a trustline.
For MVP: stick to native XLM only to avoid this complexity.
```

### Mistake 5: Frontend Says "Contract Not Found"
```
Error: simulation failed / contract not found

Fix checklist:
1. Is VITE_CONTRACT_ID set in .env?
2. Did you restart `npm run dev` after editing .env?
3. Is the contract deployed on TESTNET (not mainnet)?
4. Did the deployment succeed? Check stellar CLI output for the contract ID.
```

### Mistake 6: Freighter Signs But Transaction Fails
```
Error: Transaction submitted but status = FAILED

Fix: Run simulation BEFORE signing. If simulation fails, do not send to Freighter.
The simulation result contains the actual error. Log simResult.error to console.
```

### Mistake 7: Amount Shows as 0 or Huge Number
```
This is a stroop/XLM conversion error.
1 XLM = 10,000,000 stroops.

If you pass 500 instead of 5000000000 to the contract, escrow = 0.0000500 XLM.
If you display 5000000000 directly, it shows as "5 billion" instead of "500 XLM".

Fix: Always convert at the boundary using the STROOPS_PER_XLM constant.
```

### Mistake 8: TypeScript `scValToNative` Returns Wrong Type
```typescript
// The contract returns i128 — scValToNative may return BigInt or string
// Always handle both:
const rawAmount = StellarSdk.scValToNative(returnVal); // could be BigInt
const amount = typeof rawAmount === "bigint" ? rawAmount : BigInt(rawAmount);
```

---

## PART 6: DEPLOYMENT QUICK REFERENCE

### Minimum Viable Build Sequence
```powershell
# 1. From contract/ directory
cargo build --target wasm32-unknown-unknown --release

# 2. Run tests (must pass before deploy)
cargo test

# 3. Deploy
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/stella.wasm \
  --source my-key \
  --network testnet
# → Copy the output CONTRACT_ID

# 4. Update .env
# VITE_CONTRACT_ID=<paste here>

# 5. Start frontend
cd ../frontend && npm run dev

# 6. Smoke test in browser — connect Freighter, create one escrow
```

### If Deployment Fails
```
Error: account not found
Fix: stellar keys fund my-key --network testnet

Error: wasm file not found
Fix: cd contract && cargo build --target wasm32-unknown-unknown --release

Error: insufficient fee
Fix: Add --fee 1000000 to the deploy command

Error: contract already deployed with same hash
Fix: Make any change to the contract (add a comment) and rebuild
```

---

## PART 7: AGENT SESSION PROTOCOL

### Before Every Session
The agent must:
1. Read `PRD.md` — understand current scope and what's already built
2. Read `CONTEXT.md` — understand last session's progress
3. Read this file (`BUILD.md`) — reload all security rules and patterns
4. State out loud: current task, which functions are being implemented, which tests will cover them

### During Every Session
- Write `lib.rs` types first (`DataKey`, `Escrow`, `StellaError`), then functions, then tests
- Compile after every function: `cargo build --target wasm32-unknown-unknown --release`
- Do not move to frontend until `cargo test` passes for all contract functions
- Comment every non-obvious line — the developer is new to blockchain

### Code Review Checklist (Agent runs this before calling a function "done")
- [ ] `require_auth()` called on correct actor
- [ ] Storage type is `persistent()` for all financial data
- [ ] Arithmetic uses `checked_add` / `checked_sub`
- [ ] State written BEFORE token transfer
- [ ] Event emitted at end of function
- [ ] At least one test covers this function
- [ ] No `std::` imports
- [ ] No hardcoded addresses (use env vars or function params)

### After Every Session
- Update `CONTEXT.md` with: what was built, what tests pass, what CONTRACT_ID was deployed, what's next
- Prepend a line to `PRD.md` changelog section

---

## PART 8: GLOSSARY

| Term | Plain English |
|------|---------------|
| **Soroban** | Stellar's smart contract platform. Like Ethereum's EVM but faster, cheaper, and written in Rust. |
| **WASM** | WebAssembly — the compiled format your Rust contract becomes. The blockchain runs WASM, not Rust. |
| **Stroop** | The smallest unit of XLM. 1 XLM = 10,000,000 stroops. Like satoshis for Bitcoin. |
| **Ledger** | One "block" of confirmed transactions on Stellar. New ledger every ~5 seconds. |
| **Testnet** | A fake Stellar network with fake XLM. Use this for development. Free. Safe. |
| **Mainnet** | The real Stellar network with real money. Never deploy here without an audit. |
| **Freighter** | A browser extension wallet for Stellar. Like MetaMask but for Stellar. |
| **XDR** | The binary format of a Stellar transaction. You build it, Freighter signs it, Stellar runs it. |
| **RPC** | Remote Procedure Call — the API you use to talk to the Stellar network from your frontend. |
| **Trustline** | Permission for an account to hold a non-native token (like USDC). Native XLM needs no trustline. |
| **require_auth()** | A Soroban function that verifies the address signed the current transaction. Non-bypassable. |
| **persistent()** | Storage that survives ledger archival. Always use for financial state. |
| **Simulate** | A dry-run of a transaction that catches errors and estimates fees — no actual state change. |
| **Contract ID** | The unique address of your deployed smart contract. Like a URL but permanent and on-chain. |
| **Horizon** | Stellar's REST API for historical data (past transactions, account balances). |
| **Soroban RPC** | Stellar's API for smart contract interactions (simulation, submission, state reads). |
| **SAC** | Stellar Asset Contract — the on-chain wrapper for native XLM that makes it usable in Soroban. |
| **Clawback** | Reclaiming locked funds. On Stellar, this is a contract function — not a built-in protocol feature unless specifically configured. |
| **Event** | A log entry written to the blockchain by a smart contract function. Frontends subscribe to these. |
| **ScVal** | Stellar Contract Value — the serialized format of data passed to and from Soroban contracts. |
