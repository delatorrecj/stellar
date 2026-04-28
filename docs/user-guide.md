# Stella — User Guide

> Complete walkthrough for Employers, Candidates, and Arbitrators.

---

## Getting Started

### 1. Install Freighter Wallet

Stella requires the **Freighter** browser extension (Chrome/Firefox/Brave).

1. Install from [freighter.app](https://freighter.app)
2. Create or import a wallet
3. **Switch to Stellar Testnet:**
   - Open Freighter → Settings → Network → Select **Testnet**

### 2. Fund Your Testnet Wallet

You need testnet XLM (free) to interact with the contract.

In Stella's app, click **"Fund with Friendbot"** in the wallet panel — this gives you 10,000 test XLM instantly. You can also use the [official Friendbot](https://friendbot.stellar.org).

> **Note:** Testnet XLM has no real value. It's purely for testing.

### 3. Connect Your Wallet

On any Stella page, click **Connect Wallet**. Freighter will prompt you to authorize the connection. Once connected, your balance and public key appear in the top bar.

---

## For Employers

Employers lock onboarding funds into the escrow and release them as the candidate completes milestones.

### Creating an Escrow

1. Go to `/employer` and connect your wallet
2. Click **Create New Escrow**
3. Fill in the form:
   - **Candidate Address** — The candidate's Stellar public key (starts with `G`)
   - **Arbitrator Address** — A trusted third-party public key for dispute resolution
   - **Deadline** — How long the candidate has to complete milestones
   - **Milestones** — Add 1-10 milestones with a description and XLM amount each
4. Click **Lock Onboarding Funds**
5. Approve in Freighter — funds are now locked on-chain

### Releasing Milestones

Once the candidate accepts the escrow:

1. On your **Employer Dashboard**, find the active escrow
2. Click **Release** next to a completed milestone
3. Approve in Freighter — XLM is instantly sent to the candidate

### Clawback (If Candidate Ghosts)

If the candidate hasn't accepted or isn't completing work:

1. Click **Clawback Funds** on the escrow card
2. Approve in Freighter
3. All unreleased funds return to your wallet
4. The escrow is marked **Cancelled**

---

## For Candidates

Candidates accept escrow offers and receive funds as they complete each milestone.

### Accepting an Escrow

1. Go to `/candidate` and connect your wallet
2. You'll see **Pending Acceptance** cards from employers
3. Review the milestones and amount
4. Click **Accept Escrow**
5. Approve in Freighter — you're now committed, escrow becomes **Active**

> **Tip:** Use two browsers (Chrome + Firefox) to simulate both Employer and Candidate simultaneously.

### Tracking Milestones

Your **Candidate Dashboard** shows:
- All active escrows and milestone progress
- Released vs. unreleased amounts
- Deadline countdown

When an employer releases a milestone, XLM appears in your Freighter wallet automatically.

### Raising a Dispute

If the deadline passes and the employer hasn't released milestones:

1. After the deadline, click **Raise Formal Dispute**
2. Approve in Freighter — escrow transitions to **Disputed**
3. The platform arbitrator reviews your case and splits the remaining funds fairly

> **Important:** You can only raise a dispute **after** the deadline. This is enforced on-chain.

---

## For Arbitrators

Arbitrators resolve disputes by splitting remaining funds between employer and candidate.

### Reviewing Disputes

1. Go to `/arbitrator` and connect your wallet (must be the designated arbitrator for the escrow)
2. You'll see all **Disputed** escrows assigned to you
3. Review the escrow details: milestones, amounts, deadline, and parties

### Resolving a Dispute

1. Enter the **Candidate BPS** (Basis Points: 0–10000)
   - `10000` = 100% to candidate, 0% to employer
   - `5000` = 50/50 split
   - `0` = 100% to employer (full clawback)
2. Click **Resolve Dispute**
3. Approve in Freighter — funds are split and sent atomically

---

## Frequently Asked Questions

**Q: What happens if the employer never releases any milestones?**
A: After the deadline, the candidate can raise a dispute. The arbitrator will split the funds fairly.

**Q: Can the employer change milestones after the escrow is created?**
A: No. Milestones are locked on-chain at creation. Neither party can modify them without cancelling and creating a new escrow.

**Q: What is an Arbitrator and who is it?**
A: An arbitrator is a trusted third party specified when the escrow is created. For Stella's testnet demo, this is the platform's designated arbitrator account.

**Q: Can a candidate have multiple escrows?**
A: Yes. A candidate can receive escrows from multiple different employers simultaneously. Each `(employer, candidate)` pair is a unique escrow.

**Q: What is "Fee Sponsorship / Gasless Mode"?**
A: Stella can cover Stellar network transaction fees for candidates with low balances (< 5 XLM). This means a fresh graduate can accept an escrow without needing any XLM for fees. The platform sponsor pays the fee on their behalf.

**Q: The transaction is failing — what do I do?**
A: Common fixes:
1. Ensure Freighter is on **Testnet** (not Mainnet)
2. Fund your wallet with Friendbot
3. Refresh the page and try again
4. Check that the escrow isn't already in a terminal state (Cancelled/Complete/Resolved)

**Q: Is Stella safe? Can I lose real money?**
A: Stella runs on **Stellar Testnet** — all XLM is fake test tokens with no monetary value. Do not use real Stellar addresses or mainnet wallets.
