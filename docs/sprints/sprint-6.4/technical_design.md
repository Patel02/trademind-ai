# Technical Design Document (TDD) — Sprint 6.4: Portfolio Doctor Pro

This document specifies the technical design, calculations, algorithms, and simulation formulas used by the Portfolio Doctor Pro diagnostic engine.

---

## 1. Mathematical Algorithms & Score Weights

### 1.1 Portfolio Health Score Weight Distribution
The overall Health Score ($H$) is calculated as a weighted average of 6 component sub-scores:
$$H = 0.25 \cdot S_{div} + 0.20 \cdot S_{sec} + 0.20 \cdot S_{risk} + 0.15 \cdot S_{pos} + 0.10 \cdot S_{cash} + 0.10 \cdot S_{qual}$$

#### 1.1.1 Diversification Score ($S_{div}$)
- Calculated based on unique holdings count ($N$) and weight distribution.
- If $N = 0$, $S_{div} = 100$ (Cash buffer default).
- For $N > 0$:
  $$S_{div} = \min\left(100, \max\left(10, \left(\min\left(1.0, \frac{N}{N_{target}}\right) \cdot 60 + \min\left(1.0, \frac{S_{count}}{3}\right) \cdot 40\right) - \sum \text{penalties}\right)\right)$$
  Where $N_{target}$ is goal-adapted (Conservative: 5, Balanced: 4, Aggressive: 3) and penalties are applied for position sizes exceeding limits.

#### 1.1.2 Sector Allocation Score ($S_{sec}$)
- Measures adherence to sectoral exposure boundaries.
- Deducts 20 points for each sector exceeding the target limit (Conservative: 30%, Balanced: 40%, Aggressive: 50%).
- Deducts 10–15 points for missing key index sectors (Financials, IT Services, Energy & Infra).

#### 1.1.3 Risk Health Score ($S_{risk}$)
- Risk Health Score is defined as:
  $$S_{risk} = 100 - R_{index}$$
  Where $R_{index}$ is the raw risk index calculated from concentration, high beta values, and trailing portfolio drawdowns.

#### 1.1.4 Position Size Score ($S_{pos}$)
- Evaluates asset concentration risk:
  $$S_{pos} = 100 - \sum_{i} \max\left(0, W_i - L_{single}\right) \cdot 1.5$$
  Where $W_i$ is stock weight % and $L_{single}$ is the single stock allocation threshold (Conservative: 15%, Balanced: 25%, Aggressive: 40%).

#### 1.1.5 Cash Allocation Score ($S_{cash}$)
- Measures alignment with target liquidity ranges.
- If Cash % is within optimal bounds ($[C_{min}, C_{max}]$), $S_{cash} = 100$.
- Else, penalizes deviation:
  - If Cash % > $C_{max}$: $S_{cash} = 100 - (C_{pct} - C_{max}) \cdot 0.8$ (Cash drag penalty).
  - If Cash % < $C_{min}$: $S_{cash} = 100 - (C_{min} - C_{pct}) \cdot 4.0$ (Liquidity warning penalty).

#### 1.1.6 Position Quality Score ($S_{qual}$)
- Determined by the ratio of profitable positions to total active positions:
  $$S_{qual} = 50 + 50 \cdot \left(\frac{N_{profitable}}{N}\right)$$

---

## 2. Volatility Drag Estimation
Estimated volatility drag ($V_{drag}$) is modeled as a function of portfolio variance approximations:
$$V_{drag} = 2.0 + \min\left(10.0, |PnL_{pct}| \cdot 0.15\right)$$

---

## 3. Correlation Engine Logic
Asset correlation coefficients are mapped statically based on historical sector relationships:
- Intra-sector correlation (e.g. TCS vs INFY): $r = 0.85$ (High).
- Inter-sector correlation (e.g. TCS vs RELIANCE): $r = 0.15$ (Low).

### Correlation Alert Algorithm:
1. Scan all active holdings.
2. Group holdings by sector.
3. If a single sector holds more than 2 positions and has a total weight $> 35\%$, calculate correlation alert flags.
4. Flag warning: *"IT Services holdings (TCS, INFY) exhibit a high correlation of 0.85. Diversification risk is elevated."*

---

## 4. Trade Simulator Math (Decision Impact & What-If)
To preview order impact on portfolio parameters:
1. Simulated NAV ($NAV_{sim}$):
   - For Buy order: $NAV_{sim} = NAV_{current}$ (Cash decreases, holdings value increases by the same amount).
   - For Sell order: $NAV_{sim} = NAV_{current}$ (Cash increases, holdings value decreases by the same amount).
2. Simulated Cash % ($Cash\%_{sim}$):
   - Buy: $\frac{Cash - (\text{quantity} \cdot \text{price})}{NAV_{sim}} \cdot 100$
   - Sell: $\frac{Cash + (\text{quantity} \cdot \text{price})}{NAV_{sim}} \cdot 100$
3. Simulated Position Weight ($W_{i, sim}$):
   - For simulated symbol, adjust quantity and recalculate weight % relative to $NAV_{sim}$.
4. Run `diagnosePortfolio()` using the simulated vectors to generate predicted scores.
