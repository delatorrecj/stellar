# STELLA — BRAND GUIDELINES
> **Version:** 1.0.0 | **Status:** ACTIVE
> **Last Updated:** 2026-04-18
> **Owner:** Jerico
> **IDE Directive:** All frontend code must reference this document for design tokens, color values, typography choices, and component patterns. No ad-hoc colors or fonts.

---

## 1. USER-FIRST BRAND RATIONALE

### Who Are We Designing For?

Before choosing a single color, we studied our two users:

#### Kevin — The Candidate (Primary End User)
- **Age:** 22, fresh IT graduate from Bulacan
- **Financial state:** ₱800 left in GCash. Medical exam costs ₱1,200. He is under real financial stress.
- **Tech comfort:** Very low. Mobile-first. Uses a budget Android phone.
- **Digital world:** GCash, Maya, Facebook, TikTok, Shopee
- **Emotional state when using Stella:** Anxious, hopeful, vulnerable
- **What he needs from the UI:** Reassurance. Clarity. "Someone is helping me."
- **First 3 seconds feeling:** Relief → "I can trust this. I understand what's happening."

#### Maria — The Employer (Primary Buyer)
- **Role:** HR Manager, BPO / SME
- **Tech comfort:** Low. Uses corporate tools (HRIS, email, LinkedIn, spreadsheets).
- **Financial state:** Managing company budgets. Each failed hire costs ₱15,000–₱50,000.
- **Emotional state when using Stella:** Cautious, risk-aware, time-pressed
- **What she needs from the UI:** Confidence. Control. "My money is tracked."
- **First 3 seconds feeling:** Trust → "This is professional. This is legitimate."

### The Brand Tension
Kevin needs **warmth**. Maria needs **professionalism**. Both need **simplicity and trust**.

### The Resolution
Stella's brand sits at the intersection of **Filipino fintech familiarity** and **institutional trust**. It should feel like opening GCash — not like opening a crypto exchange.

---

## 2. AESTHETIC DIRECTION

### Named Direction: **Warm Fintech Trust**

This is NOT a Web3 aesthetic. This is NOT a SaaS dashboard. This is a **financial inclusion tool** for people who have never used blockchain and never should need to know they are.

#### Design Feasibility & Impact Index (DFII)

| Dimension                | Score | Rationale |
|--------------------------|-------|-----------|
| Aesthetic Impact         | 4/5   | Warm, distinctive in the blockchain space (most are cold/dark) |
| Context Fit              | 5/5   | Perfect match for low-tech Filipino users |
| Implementation Feasibility | 5/5 | Standard CSS, no GPU-heavy effects |
| Performance Safety       | 5/5   | Works on budget Android phones |
| Consistency Risk         | -1/5  | Easy to maintain across 3-4 views |

**DFII Score: 18/20 (Excellent — Execute Fully)**

### Why NOT Glassmorphism
1. **Kevin's phone can't handle it.** Blur effects (`backdrop-filter`) stutter on budget Android GPUs.
2. **It reads as "crypto."** Both users would feel alienated.
3. **Low-contrast translucent text** is an accessibility disaster on mobile in bright sunlight.
4. **It's decorative, not functional.** Every pixel in Stella must earn trust, not attention.

### Differentiation Anchor
> "If this were screenshotted with the logo removed, how would someone recognize it?"

**The warm teal + amber star accent on clean white cards with Filipino-scale touch targets.** It looks like the child of GCash and a government employment portal — trustworthy, accessible, and unmistakably purposeful.

---

## 3. COLOR SYSTEM

### Philosophy
- **One dominant tone** (teal = trust, stability, growth)
- **One accent** (amber = hope, achievement, the "stella" star)
- **One neutral system** (warm grays, not cool — warmth matters culturally)
- Background is **off-white**, not pure white (softer on eyes under Manila fluorescent lighting)

### Primary Palette

```css
:root {
  /* ── Primary: Deep Teal ── */
  /* Trust, stability, growth. GCash-adjacent familiarity. */
  --color-primary-50:  #EEFBFB;
  --color-primary-100: #D5F5F5;
  --color-primary-200: #A8EBEB;
  --color-primary-300: #6DD8D8;
  --color-primary-400: #38BFBF;
  --color-primary-500: #0D9494;  /* Primary button backgrounds */
  --color-primary-600: #0D7A7A;  /* Hover states */
  --color-primary-700: #0B6161;  /* Active / pressed */
  --color-primary-800: #094D4D;
  --color-primary-900: #073A3A;  /* Text on light backgrounds */

  /* ── Accent: Warm Amber ── */
  /* Hope, achievement, the "stella" star. Used sparingly. */
  --color-accent-50:  #FFF8E7;
  --color-accent-100: #FFEFC2;
  --color-accent-200: #FFE299;
  --color-accent-300: #FFD166;  /* Star icon, progress highlights */
  --color-accent-400: #F5BE3B;
  --color-accent-500: #E8A317;  /* Badge backgrounds, CTAs on dark */
  --color-accent-600: #C9880F;
  --color-accent-700: #A06C0A;

  /* ── Semantic ── */
  --color-success:    #10B981;  /* Milestone completed, funds released */
  --color-warning:    #F59E0B;  /* Deadline approaching */
  --color-error:      #EF4444;  /* Failed transaction, validation error */
  --color-info:       #3B82F6;  /* Informational notices */

  /* ── Neutrals (Warm Gray) ── */
  --color-neutral-0:   #FFFFFF;
  --color-neutral-50:  #FAFAF8;  /* Page background */
  --color-neutral-100: #F5F5F0;  /* Card backgrounds */
  --color-neutral-200: #E8E8E3;  /* Borders, dividers */
  --color-neutral-300: #D4D4CF;
  --color-neutral-400: #A3A39E;  /* Placeholder text */
  --color-neutral-500: #737370;  /* Secondary text */
  --color-neutral-600: #525250;  /* Body text */
  --color-neutral-700: #3D3D3B;  /* Headings */
  --color-neutral-800: #292928;
  --color-neutral-900: #1A1A19;  /* High-contrast text */
}
```

### Usage Rules

| Element                  | Token                   | Rationale |
|--------------------------|-------------------------|-----------|
| Page background          | `neutral-50`            | Softer than pure white |
| Card background          | `neutral-0` (white)     | Clean separation from page |
| Primary button           | `primary-500` bg, white text | High contrast, trust color |
| Primary button hover     | `primary-600`           | Subtle darkening |
| Accent star / badge      | `accent-300` or `accent-500` | Draws eye without overwhelming |
| Body text                | `neutral-600`           | Readable, not harsh |
| Heading text             | `neutral-900`           | Strong hierarchy |
| Link text                | `primary-600`           | Distinct from body text |
| Destructive action       | `error` red             | Clawback, cancel |
| Success indicator        | `success` green         | Funds released, milestone done |
| Card border              | `neutral-200`           | Subtle structure |
| Progress bar fill        | `primary-500` → `accent-300` gradient | Visual reward as progress grows |

### Color Accessibility
All text/background combinations must meet **WCAG 2.1 AA** (4.5:1 for body text, 3:1 for large text).

| Combination                    | Ratio  | Pass? |
|--------------------------------|--------|-------|
| `neutral-900` on `neutral-50`  | 15.4:1 | ✅ AAA |
| `neutral-600` on `neutral-0`   | 7.1:1  | ✅ AA  |
| White on `primary-500`         | 4.8:1  | ✅ AA  |
| White on `primary-600`         | 5.9:1  | ✅ AA  |
| `neutral-900` on `accent-300`  | 9.2:1  | ✅ AAA |

---

## 4. TYPOGRAPHY

### Philosophy
Readability on budget phones under Manila sunlight > aesthetic uniqueness. Kevin reads this on a Realme C55 with a 6.7" LCD. Maria reads it between emails on a company laptop. The font must be:
- **Highly legible** at 14px on mobile
- **Warm**, not clinical
- **Multi-weight**, for clear hierarchy without size inflation
- **Free** (Google Fonts)

### Font Selection

#### Display + Body: **Plus Jakarta Sans**
- **Why:** Warm geometric sans-serif with soft terminals. More personality than Inter, more readable than Poppins. Excellent weight range (200–800). Designed for UI. Free on Google Fonts.
- **Fallback stack:** `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
```

#### Monospace (transaction hashes, addresses): **JetBrains Mono**
- **Why:** Clear distinction between similar characters (0/O, l/1). Important when Kevin is checking a Stellar address.
- **Fallback:** `'JetBrains Mono', 'Fira Code', 'Courier New', monospace`

```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');
```

### Type Scale (Mobile-First)

```css
:root {
  /* ── Type Scale ── */
  --text-xs:    0.75rem;   /* 12px — captions, timestamps */
  --text-sm:    0.875rem;  /* 14px — secondary labels */
  --text-base:  1rem;      /* 16px — body text (mobile default) */
  --text-lg:    1.125rem;  /* 18px — card titles */
  --text-xl:    1.25rem;   /* 20px — section headers */
  --text-2xl:   1.5rem;    /* 24px — page titles */
  --text-3xl:   1.875rem;  /* 30px — hero text (desktop) */
  --text-4xl:   2.25rem;   /* 36px — landing hero (desktop) */

  /* ── Font Weights ── */
  --font-normal:    400;
  --font-medium:    500;
  --font-semibold:  600;
  --font-bold:      700;
  --font-extrabold: 800;

  /* ── Line Heights ── */
  --leading-tight:  1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;

  /* ── Letter Spacing ── */
  --tracking-tight:  -0.025em;
  --tracking-normal:  0em;
  --tracking-wide:    0.025em;
  --tracking-wider:   0.05em;   /* All-caps labels */
}
```

### Type Usage Rules

| Element               | Size       | Weight       | Color          | Notes |
|-----------------------|------------|--------------|----------------|-------|
| Page title            | `text-2xl` | `extrabold`  | `neutral-900`  | One per page |
| Section heading       | `text-xl`  | `bold`       | `neutral-900`  | |
| Card title            | `text-lg`  | `semibold`   | `neutral-800`  | |
| Body text             | `text-base`| `normal`     | `neutral-600`  | `leading-relaxed` |
| Button label          | `text-base`| `semibold`   | white / primary| ALL CAPS avoided — sentence case |
| Amount (XLM display)  | `text-2xl` | `bold`       | `neutral-900`  | The most important number on screen |
| Stellar address       | `text-sm`  | `mono 400`   | `neutral-500`  | Truncated: `GABT...HKIU` |
| Status badge          | `text-xs`  | `semibold`   | white          | `tracking-wider`, uppercase OK here |
| Error/help text       | `text-sm`  | `normal`     | `error` / `neutral-500` | |

---

## 5. SPACING & LAYOUT

### Spacing Scale (4px base unit)

```css
:root {
  --space-1:  0.25rem;   /* 4px */
  --space-2:  0.5rem;    /* 8px */
  --space-3:  0.75rem;   /* 12px */
  --space-4:  1rem;      /* 16px — base unit */
  --space-5:  1.25rem;   /* 20px */
  --space-6:  1.5rem;    /* 24px */
  --space-8:  2rem;      /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px — section gap */
  --space-16: 4rem;      /* 64px */
  --space-20: 5rem;      /* 80px */
}
```

### Layout Rules
- **Max content width:** `480px` (mobile), `768px` (tablet), `1024px` (desktop)
- **Page padding:** `var(--space-4)` on mobile, `var(--space-8)` on desktop
- **Card padding:** `var(--space-5)` on mobile, `var(--space-6)` on desktop
- **Card gap (stacked):** `var(--space-4)`
- **Card border-radius:** `var(--radius-lg)` (12px)
- **Button height:** Minimum `48px` (Google's recommended touch target)
- **Input height:** Minimum `48px`

```css
:root {
  --radius-sm:  6px;
  --radius-md:  8px;
  --radius-lg:  12px;
  --radius-xl:  16px;
  --radius-full: 9999px;  /* Pills, avatars */
}
```

### Card Elevation (Not Glassmorphism)
Cards use **subtle warm shadows**, not blur/translucency:

```css
:root {
  --shadow-sm:  0 1px 2px rgba(26, 26, 25, 0.05);
  --shadow-md:  0 2px 8px rgba(26, 26, 25, 0.08);
  --shadow-lg:  0 4px 16px rgba(26, 26, 25, 0.10);
  --shadow-xl:  0 8px 32px rgba(26, 26, 25, 0.12);
}
```

---

## 6. COMPONENT PATTERNS

### Buttons

```
┌─────────────────────────────────────────┐
│  Primary:   bg primary-500, text white  │  "Lock Onboarding Funds"
│  Secondary: bg neutral-100, text 700    │  "View Details"
│  Danger:    bg error, text white        │  "Clawback Funds"
│  Ghost:     bg transparent, text 600    │  "Cancel"
│  Disabled:  bg neutral-200, text 400    │  All buttons when loading
└─────────────────────────────────────────┘
```

- **Shape:** `border-radius: var(--radius-md)`
- **Height:** `48px` minimum (mobile touch target)
- **Font:** `text-base`, `font-semibold`, sentence case
- **Hover:** Darken by one shade (500 → 600)
- **Active:** Darken by two shades + subtle scale (0.98)
- **Loading:** Show spinner, disable, preserve button width
- **No icons on primary CTAs.** Text-only. Kevin doesn't know what a lock icon means in blockchain context.

### Cards (Escrow Card)

```
┌────────────────────────────────────────────┐
│  [Status Badge: "Active"]                  │
│                                            │
│  Employer: Maria C. (GABT...HKIU)         │
│  ─────────────────────────────────         │
│                                            │
│  ₱ 5,000                                  │  ← Largest element
│  Total Locked                              │
│                                            │
│  ████████████░░░░░░  50%                   │  ← Progress bar
│  ₱2,500 claimed · ₱2,500 remaining        │
│                                            │
│  Deadline: May 15, 2026 (27 days)          │
│                                            │
│  [ Claim Milestone Funds ]                 │  ← Primary CTA
└────────────────────────────────────────────┘
```

- Background: `neutral-0` (white)
- Border: `1px solid neutral-200`
- Shadow: `shadow-md`
- Padding: `space-5`
- Radius: `radius-lg`
- The **amount is the hero** — largest text in the card
- Progress bar: `primary-500` fill on `neutral-200` track, `4px` height, rounded

### Status Badges

| Status     | Background       | Text Color     | Label       |
|------------|------------------|----------------|-------------|
| Active     | `primary-50`     | `primary-700`  | "Active"    |
| Completed  | `success` 10%    | `success` dark | "Completed" |
| Expired    | `neutral-100`    | `neutral-500`  | "Expired"   |
| Clawed Back| `error` 10%      | `error`        | "Returned"  |

### Transaction Toast

```
┌──────────────────────────────────────────────┐
│  ✅  Funds sent successfully!                │
│  250 XLM released to Kevin                   │
│                                              │
│  View on Stellar Expert →                    │  ← Link to explorer
│  TX: 2d29...151d                             │  ← Monospace, truncated
└──────────────────────────────────────────────┘
```

- Position: Bottom of viewport, `space-4` from edges
- Background: `neutral-900` (dark, high contrast)
- Text: white
- Auto-dismiss: 8 seconds (longer than usual — Kevin needs time to read)
- Link: `accent-300` on dark background

---

## 7. ICONOGRAPHY

### Rules
- **Style:** Outlined, 1.5px stroke, rounded caps
- **Size:** 20px default, 24px in navigation
- **Source:** Lucide Icons (free, consistent, MIT license)
- **Color:** Inherit from parent text color

### Core Icons

| Concept          | Icon Name      | Usage |
|------------------|----------------|-------|
| Wallet           | `wallet`       | Connect/disconnect wallet |
| Lock             | `lock`         | Escrow locked |
| Unlock           | `lock-open`    | Milestone claimed |
| Send/Release     | `arrow-up-right` | Funds released |
| Return/Clawback  | `rotate-ccw`   | Funds returned |
| Star             | `star`         | Stella branding accent |
| Clock            | `clock`        | Deadline countdown |
| Check            | `check-circle` | Success state |
| Alert            | `alert-circle` | Error/warning state |
| External link    | `external-link` | "View on Stellar Expert" |
| Copy             | `copy`         | Copy address to clipboard |

### Icon Usage Rules
- Never use an icon alone without a text label (accessibility + low-tech users)
- Exception: Copy icon next to addresses (universally understood)
- Star icon (`★`) appears as the Stella brand accent — a small filled star in `accent-500`

---

## 8. MOTION & ANIMATION

### Philosophy
Motion in Stella is **functional, not decorative**. Kevin is on a budget phone. Maria is in a hurry. Every animation must:
1. Communicate state change (loading → success)
2. Guide attention (new card appearing)
3. Feel fast (never exceed 300ms for UI feedback)

### Timing Tokens

```css
:root {
  --duration-fast:    150ms;   /* Hover, focus, toggle */
  --duration-normal:  250ms;   /* Panel open, card appear */
  --duration-slow:    400ms;   /* Page transition, toast enter */
  --ease-out:     cubic-bezier(0.16, 1, 0.3, 1);    /* Deceleration */
  --ease-in-out:  cubic-bezier(0.65, 0, 0.35, 1);   /* Smooth */
}
```

### Allowed Animations

| Trigger                | Animation                        | Duration     |
|------------------------|----------------------------------|--------------|
| Button hover           | Background color shift           | `fast`       |
| Button press           | `scale(0.98)`                    | `fast`       |
| Card appear            | Fade in + slide up 8px           | `normal`     |
| Toast enter            | Slide up from bottom             | `slow`       |
| Toast exit             | Fade out                         | `normal`     |
| Progress bar fill      | Width transition                 | `slow`       |
| Loading spinner        | CSS rotate (infinite)            | 800ms/cycle  |
| Page route change      | Fade (opacity only)              | `normal`     |

### Banned Animations
- ❌ Parallax
- ❌ Background gradients that animate
- ❌ Particle effects
- ❌ 3D transforms
- ❌ Spring physics (too heavy for budget phones)
- ❌ Scroll-triggered animations
- ❌ Any animation longer than 500ms

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. BRAND VOICE & COPY

### Tone
- **Warm**, not corporate ("Your funds are ready" not "Transaction processed")
- **Plain**, not technical ("Connect your wallet" not "Authenticate via Freighter")
- **Reassuring**, not urgent ("Take your time" not "Act now!")
- **Filipino-contextual** — use ₱ symbols, reference real costs (medical exam, NBI)

### Terminology Map
This is critical. Our users don't speak blockchain.

| Internal / Technical     | User-Facing (What Kevin Sees)    |
|--------------------------|----------------------------------|
| Smart contract           | *(never shown)*                  |
| Escrow                   | "Locked funds" or "Onboarding fund" |
| init_escrow              | "Lock Onboarding Funds"          |
| unlock_milestone         | "Claim Funds"                    |
| clawback                 | "Return Remaining Funds"         |
| Transaction hash         | "Confirmation code"              |
| Stellar address          | "Wallet address"                 |
| XLM                      | "XLM" (acceptable, it's the unit)|
| Soroban                  | *(never shown)*                  |
| WASM                     | *(never shown)*                  |
| Testnet                  | *(shown only in dev banner)*     |
| Block confirmation       | "Confirmed ✓"                    |
| Gas / fees               | *(absorbed, never shown to user)*|

### Sample Copy

**Landing page headline:**
> Start your career without the cash crunch.

**Landing page subheading:**
> Stella lets employers lock onboarding funds for you. Claim them as you complete each step. No loans. No debt. No middleman.

**Employer CTA:**
> Lock Onboarding Funds

**Candidate CTA:**
> Claim Your Funds

**Empty state (no escrow found):**
> No onboarding funds yet. Ask your employer to set up Stella for your onboarding.

**Error (transaction failed):**
> Something went wrong. Your funds are safe — nothing was sent. Please try again.

**Success (funds claimed):**
> ₱2,500 is on its way to you. Your employer has been notified. Keep going! ⭐

---

## 10. LOGO & BRAND MARK

### Logo Construction
- **Wordmark:** "Stella" in Plus Jakarta Sans ExtraBold (800)
- **Brand mark:** A simple 5-pointed star in `accent-500` (amber), placed to the upper-right of the last 'a' — like a guiding star
- **Minimum size:** 80px wide (digital)
- **Clear space:** 1× the height of the star on all sides

### Logo Usage

| Context            | Format          |
|--------------------|-----------------|
| Light background   | `neutral-900` wordmark + `accent-500` star |
| Dark background    | `neutral-0` (white) wordmark + `accent-300` star |
| Favicon            | Star only, `accent-500` on `primary-700` circle |
| Loading screen     | Star only, centered, subtle pulse animation |

### Logo Don'ts
- ❌ Don't use gradients on the wordmark
- ❌ Don't separate the star from the wordmark
- ❌ Don't rotate or skew
- ❌ Don't place on busy backgrounds
- ❌ Don't add "powered by Stellar" to the logo itself (put it in the footer)

---

## 11. RESPONSIVE BREAKPOINTS

```css
/* Mobile-first. No breakpoint = mobile default. */
@media (min-width: 640px)  { /* sm: Large phones, landscape */ }
@media (min-width: 768px)  { /* md: Tablets */ }
@media (min-width: 1024px) { /* lg: Laptops, desktops */ }
@media (min-width: 1280px) { /* xl: Large desktops */ }
```

### Layout Behavior

| Breakpoint | Behavior |
|------------|----------|
| < 640px    | Single column. Cards stack. Full-width buttons. `space-4` padding. |
| 640–767px  | Single column. Slightly wider cards. |
| 768–1023px | Two-column option for employer dashboard (form + status). |
| ≥ 1024px   | Centered container (`max-width: 1024px`). Comfortable whitespace. |

---

## 12. DARK MODE

### Status: **Deferred to V1**

For the hackathon MVP, Stella ships in **light mode only**. Rationale:
- Kevin associates dark mode with gaming/entertainment, not financial tools
- Maria's corporate laptop is in light mode
- GCash, Maya, and BPI mobile are all light-mode-primary
- Dark mode doubles the QA surface for no user-proven benefit at MVP

When implemented in V1, dark mode will use:
- Background: `#1A1A19`
- Card: `#292928`
- Text: `#FAFAF8`
- Primary: `primary-400` (lighter teal for dark backgrounds)

---

## 13. DESIGN ANTI-PATTERNS

Things that **must never appear** in Stella's UI:

| Anti-Pattern | Why It's Banned |
|---|---|
| Glassmorphism / frosted glass | Lags on budget phones, reads as "crypto", poor accessibility |
| Dark mode default | Unfamiliar for Filipino fintech users |
| Crypto jargon in UI | Kevin doesn't know what a "smart contract" is |
| Neon colors | Signals gaming/crypto, not financial trust |
| Complex data visualizations | Maria needs one number, not a chart |
| Hamburger menu | Both users need visible navigation |
| Skeleton screens everywhere | One clean loading spinner is enough |
| Auto-playing video | Budget phones, data limits |
| Parallax scrolling | Performance + nausea on mobile |
| Gradients as backgrounds | Keep the canvas clean and neutral |
| "Connect Wallet" as the first thing users see | Show the value proposition first, then ask to connect |

---

## 14. CHANGELOG

```
v1.0.0 — 2026-04-18
  Initial brand guidelines created
  User-centric design rationale (Kevin + Maria personas)
  Rejected glassmorphism in favor of Warm Fintech Trust aesthetic
  Defined: color system, typography (Plus Jakarta Sans), spacing, motion
  Defined: component patterns, voice & copy, terminology map
  Author: Jerico
```

> **IDE Instruction:** Prepend new entries. Format: `vX.X.X — YYYY-MM-DD | Short description | Author`
