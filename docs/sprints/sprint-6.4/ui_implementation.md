# UI Implementation Document — Sprint 6.4: Portfolio Doctor Pro

This document details the user interface layout, design system values, components structure, and styling definitions required for Portfolio Doctor Pro.

---

## 1. Visual Aesthetics & Styling Design System
- **Colors:**
  - Dark Mode background: `#0a0a0a` with deep violet gradients.
  - Border style: `1px solid rgba(255, 255, 255, 0.05)` (glassmorphism ready).
  - Sub-cards background: `rgba(255, 255, 255, 0.015)`.
  - Hedges colors: `var(--accent-green)` (success), `var(--accent-yellow)` (warning/attention), `var(--accent-red)` (danger), `var(--accent-blue)` (info).
- **Typography:**
  - Font Family: `Outfit`, `Inter`, sans-serif.
  - Large titles: `28px` with `-0.5px` letter spacing, semi-bold (`fontWeight: 800`).
  - Text description: `13px` with height `1.5` (`fontWeight: 600` for subtitles).

---

## 2. Page Components & Grid Layouts

### 2.1 Grid Configuration
The primary dashboard layout uses a responsive two-column grid structure:
```css
.responsive-split-row {
  display: grid;
  grid-template-columns: 1.30fr 1.70fr;
  gap: 2rem;
}
@media (max-width: 1024px) {
  .responsive-split-row {
    grid-template-columns: 1fr;
  }
}
```

---

## 3. Simulator UI Elements

### 3.1 AI "What-If" Trade Simulator Layout
Placed inside the main page as an interactive widget:
- **Symbol Selection:** Dropdown listing TCS, INFY, RELIANCE, HDFCBANK.
- **Transaction Type:** BUY / SELL toggle.
- **Share Quantity:** Numeric stepper input.
- **Preview Output Dashboard:** A sub-panel showing original vs. simulated health scores (e.g. 87 → 91) with color-coded comparison badges.

### 3.2 Decision Impact Previewer Modal (Trade Workspace)
A preview dialog triggered before executing any order:
- Centered overlay with a translucent glass background (`backdropFilter: blur(6px)`).
- Visual comparisons of metrics before and after the simulated order:
  - Health Score Gauge comparison (Old vs. New)
  - Allocation Weight change bars
  - Cash liquidity Warning flags (e.g., "Cash drops below 10% limit")
- Options: "Proceed with Order" or "Cancel & Adjust".
