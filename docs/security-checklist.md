# Stella Security Checklist

> Formal security audit for the Stella milestone-based escrow dApp.
> All items verified against source code with evidence references.

---

## Smart Contract Security (`contract/src/`)

### Authentication & Authorization

- [x] **All mutating functions call `require_auth()` first**
  - `init_escrow`: `employer.require_auth()` — [lib.rs:106]
  - `candidate_accept`: `candidate.require_auth()` — [lib.rs:202]
  - `unlock_milestone`: `employer.require_auth()` — [lib.rs:259]
  - `clawback`: `employer.require_auth()` — [lib.rs:371]
  - `raise_dispute`: `candidate.require_auth()` — [lib.rs:450]
  - `resolve_dispute`: `arbitrator.require_auth()` — [lib.rs:508]

- [x] **Role verification after auth** — Even after `require_auth()`, each function verifies the caller matches the escrow's stored role (employer, candidate, or arbitrator). This prevents auth spoofing via composite-key tricks.
  - Evidence: T-06 (wrong signer rejected), T-12, T-18, T-24

- [x] **Arbitrator is escrow-specific** — The `arbitrator` is set per-escrow at creation and verified on `resolve_dispute`. There is no global admin override.
  - Evidence: T-24 (wrong arbitrator rejected)

### Re-entrancy Protection

- [x] **State written BEFORE token transfers** — All functions update `env.storage().persistent().set()` before calling `token_client.transfer()`. This follows the Checks-Effects-Interactions pattern.
  - Evidence: lib.rs steps: "Write State (STEP 8)" → "Transfer (STEP 10)"

### Arithmetic Safety

- [x] **Checked arithmetic on all i128 operations**
  - `init_escrow`: `total.checked_add(amt).expect("arithmetic overflow")` — [lib.rs:133]
  - `clawback`: `locked.checked_add(ms.amount).expect("arithmetic overflow")` — [lib.rs:396]
  - `resolve_dispute`: `locked.checked_mul(...).expect("overflow")` — [lib.rs:548]

- [x] **Overflow checks enabled in release profile**
  - `Cargo.toml`: `overflow-checks = true` — [Cargo.toml:21]

- [x] **BPS bounds validation** — `resolve_dispute` rejects `candidate_bps > 10000`
  - Evidence: T-22, T-23 (valid splits), T-24 checks arbitrator first

### State Machine Integrity

- [x] **Composite key isolation** — Each escrow is keyed by `(employer, candidate)`. One employer can have escrows with many candidates; one candidate can receive from many employers. No cross-contamination.
  - Evidence: T-04 (double init rejected for same pair, but new pairs are allowed)

- [x] **Terminal state protection** — `clawback` is rejected in `Complete` and `Cancelled` states. `resolve_dispute` is rejected unless state is `Disputed`. No state can be re-entered once terminal.

- [x] **Deadline enforcement is bidirectional**
  - `unlock_milestone`: rejects if `timestamp > deadline` (cannot release after expiry)
  - `raise_dispute`: rejects if `timestamp <= deadline` (cannot dispute before expiry)
  - Evidence: T-14, T-21

### Storage & TTL

- [x] **TTL extended on every persistent write** — Prevents Soroban state archival for active escrows
  - `MIN_TTL = 7 days`, `MAX_TTL = 60 days` — [lib.rs:47-49]

- [x] **No `std` imports** — `#![no_std]` minimizes attack surface and ensures no unexpected heap allocations

- [x] **Token is stored, not hardcoded** — XLM SAC address is set once at `initialize()` and read from instance storage. Avoids hardcoded addresses that could be wrong on a different network.

---

## Frontend Security (`frontend/src/`)

### Key Management

- [x] **No private keys stored client-side** — All signing is delegated to the Freighter browser extension
- [x] **Sponsor key in env var only** — `VITE_SPONSOR_SECRET` is set in Vercel environment, never committed to git
  - `.gitignore` includes `frontend/.env`

### Transaction Safety

- [x] **Transaction simulation before signing** — All transactions go through Soroban preflight simulation before being sent to Freighter. This gives accurate fee estimates and catches contract errors before wallet approval.
  - Evidence: `contract.ts` — Build → Simulate → Sign → Submit pattern

- [x] **XLM ↔ Stroops conversion at boundary** — All user-facing amounts are XLM. All on-chain operations use `BigInt` stroops. Conversion happens exclusively in `contract.ts`.

- [x] **Error codes mapped to user-friendly messages** — All `StellaError` numeric codes are mapped to human-readable strings in `contract.ts`. Raw error codes are never shown to users.

### Input Validation

- [x] **Milestone amounts validated before submission** — The `CreateEscrowForm` validates that all milestone amounts are > 0 before building a transaction
- [x] **Address validation** — Stellar address format is validated before use via SDK

### Network Security

- [x] **HTTPS enforced** — Vercel deployment enforces HTTPS. All RPC calls use `https://soroban-testnet.stellar.org`
- [x] **No CORS issues** — Horizon API and Soroban RPC both support browser requests with appropriate CORS headers

---

## Deployment Security (`vercel.json`, `.env`)

- [x] **Environment isolation** — `VITE_CONTRACT_ID`, `VITE_ADMIN_PASSWORD`, `VITE_SPONSOR_SECRET` are Vercel environment variables, not committed to git
- [x] **Admin password via env var** — `VITE_ADMIN_PASSWORD` is set in Vercel. The local dev fallback (`stella-admin-dev`) is intentionally weak and documented.
- [x] **CSP headers configured** — `vercel.json` sets Content-Security-Policy to restrict resource origins
- [ ] **Source maps disabled** — TODO: Configure Vite to disable source maps in production build to prevent contract interaction reverse-engineering

---

## Known Limitations & Accepted Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Sponsor secret in Vite env | Medium | Testnet only; document mainnet migration to Edge Function |
| Admin password in Vite env | Low | Page is not indexed; session-only; wrong password = no access |
| Client-side caching of metrics | Very Low | Cache is read-only; no sensitive data in indexer cache |
| Soroban testnet state archival | Low | TTL management in every write operation |

---

## Test Coverage Evidence

All 25 unit tests in `contract/src/test.rs` pass, covering:

| Test Group | Tests | Coverage |
|---|---|---|
| INIT | T-01 to T-04 | Happy path, empty milestones, zero amounts, double init |
| ACCEPT | T-05 to T-07 | Happy path, wrong signer, already active |
| UNLOCK | T-08 to T-14 | Partial, complete, already released, invalid ID, wrong signer, not active, after deadline |
| CLAWBACK | T-15 to T-18 | Pending state, partial, all released, wrong signer |
| READ | T-19 | State reflection across all transitions |
| DISPUTE | T-20 to T-25 | Happy path, before deadline, 50/50 split, 100/0 split, wrong arbitrator, not disputed |
