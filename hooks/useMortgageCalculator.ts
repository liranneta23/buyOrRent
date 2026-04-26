'use client';

import { useMemo } from 'react';

// ── Dutch NL 2026 Constants ──────────────────────────────────────────────────
const TAX_REFUND_RATE = 0.3756;   // Max hypotheekrenteaftrek
const TOTAL_TERM_MONTHS = 360;    // 30-year mortgage
const VVE = 250;                  // Monthly VVE/service costs (€)
const LIFE_INS = 20;              // Monthly life insurance (€)

// ── Financial Math ───────────────────────────────────────────────────────────

/** Annuity PMT formula — matches numpy_financial.pmt */
function pmt(rate: number, nper: number, pv: number): number {
  if (rate === 0) return pv / nper;
  return (pv * rate * Math.pow(1 + rate, nper)) / (Math.pow(1 + rate, nper) - 1);
}

/**
 * Walk through annuity amortization for `months`, return average monthly
 * interest paid. Mirrors get_average_annuity_interest() in main.py.
 */
function calcAnnuityAvgInterest(
  rate: number,
  loan: number,
  months: number,
): number {
  if (months === 0 || loan === 0) return 0;
  let balance = loan;
  let totalInterest = 0;
  const payment = pmt(rate, TOTAL_TERM_MONTHS, loan);
  for (let m = 0; m < months; m++) {
    const interest = balance * rate;
    totalInterest += interest;
    balance -= payment - interest;
  }
  return totalInterest / months;
}

/**
 * Walk through linear amortization for `months`, return average monthly
 * interest paid. Mirrors get_average_linear_interest() in main.py.
 */
function calcLinearAvgInterest(
  rate: number,
  loan: number,
  months: number,
): number {
  if (months === 0 || loan === 0) return 0;
  const monthlyPrincipal = loan / TOTAL_TERM_MONTHS;
  let totalInterest = 0;
  for (let m = 0; m < months; m++) {
    const balance = loan - m * monthlyPrincipal;
    totalInterest += balance * rate;
  }
  return totalInterest / months;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface Inputs {
  housePrice: number;
  downPayment: number;
  monthlyRent: number;
  annualRate: number;    // e.g. 0.0371
  years: number;
  marketGrowth: number;  // fraction, e.g. 0.02 for 2 %
}

export interface MortgageTypeStats {
  avgMonthlyNet: number;
  totalSunkCosts: number;
  totalEquitySaved: number;
  remainingLoanBalance: number;
  profitPessimistic: number;  // market @ -2 %
  profitFlat: number;         // market @ 0 %
  profitOptimistic: number;   // market @ +2 %
  profitCustom: number;       // market @ marketGrowth
  profitAt: (growthFraction: number) => number;
}

export interface ChartPoint {
  year: number;
  annuityEquity: number;
  linearEquity: number;
  annuityNet: number;    // net position if sold at this year
  linearNet: number;
  rentingNet: number;    // always negative — cumulative rent paid
}

export interface SensitivityRow {
  growth: number;          // percentage, e.g. -5 … +5
  annuityProfit: number;
  linearProfit: number;
  annuityVsRent: number;
  linearVsRent: number;
}

export interface MortgageResults {
  annuity: MortgageTypeStats;
  linear: MortgageTypeStats;
  rentingCost: number;   // total rent paid (positive)
  chartData: ChartPoint[];
  sensitivity: SensitivityRow[];
  bestMortgage: 'annuity' | 'linear';
  betterThanRenting: number;  // positive = buying wins
  loan: number;
  ltv: number;           // Loan-To-Value ratio (0-1)
  ewfMonthly: number;    // Eigenwoningforfait monthly
}

// ── Main Hook ────────────────────────────────────────────────────────────────

export function useMortgageCalculator(inputs: Inputs): MortgageResults {
  return useMemo(() => {
    const { housePrice, downPayment, monthlyRent, annualRate, years, marketGrowth } = inputs;

    const loan = Math.max(0, housePrice - downPayment);
    const monthlyRate = annualRate / 12;
    const months = years * 12;
    const ltv = housePrice > 0 ? loan / housePrice : 0;

    // Shared monthly costs
    // Eigenwoningforfait: imputed rental income tax (0.35 % of WOZ × marginal rate / 12)
    const ewfMonthly = (0.0035 * housePrice) * TAX_REFUND_RATE / 12;
    const ozbMonthly = 0.001 * housePrice / 12;  // Onroerende zaak belasting

    // One-time costs
    const upfront = (0.02 * housePrice * 0.5) + 10_000;  // transfer tax + notary/etc.
    const selling = 8_000;                                 // makelaar + notary when selling

    // Periodic cost totals over comparison window
    const vveTotal = VVE * months;
    const lifeTotal = LIFE_INS * months;
    const ewfTotal = ewfMonthly * months;
    const ozbTotal = ozbMonthly * months;

    // ── Annuity ──────────────────────────────────────────────────────────────
    const annuityPayment = pmt(monthlyRate, TOTAL_TERM_MONTHS, loan);
    const annuityAvgInterest = calcAnnuityAvgInterest(monthlyRate, loan, months);
    const annuityTaxRelief = annuityAvgInterest * TAX_REFUND_RATE;
    const annuityEquity = (annuityPayment - annuityAvgInterest) * months;
    const annuityNetMonthly = annuityPayment - annuityTaxRelief + ewfMonthly + VVE + LIFE_INS;
    const annuityRemainingLoan = loan - annuityEquity;
    const annuityTotalSunk =
      (annuityAvgInterest - annuityTaxRelief) * months +
      upfront + selling + vveTotal + ewfTotal + lifeTotal + ozbTotal;

    const annuityProfitAt = (g: number) => {
      const appreciation = housePrice * (Math.pow(1 + g, years) - 1);
      return Math.round(appreciation + annuityEquity - annuityTotalSunk);
    };

    const annuity: MortgageTypeStats = {
      avgMonthlyNet: Math.round(annuityNetMonthly),
      totalSunkCosts: Math.round(annuityTotalSunk),
      totalEquitySaved: Math.round(annuityEquity),
      remainingLoanBalance: Math.round(annuityRemainingLoan),
      profitPessimistic: annuityProfitAt(-0.02),
      profitFlat: annuityProfitAt(0),
      profitOptimistic: annuityProfitAt(0.02),
      profitCustom: annuityProfitAt(marketGrowth),
      profitAt: annuityProfitAt,
    };

    // ── Linear ───────────────────────────────────────────────────────────────
    const linearPrincipal = loan / TOTAL_TERM_MONTHS;
    const linearAvgInterest = calcLinearAvgInterest(monthlyRate, loan, months);
    const linearTaxRelief = linearAvgInterest * TAX_REFUND_RATE;
    const linearAvgGross = linearPrincipal + linearAvgInterest;
    const linearEquity = linearPrincipal * months;
    const linearNetMonthly = linearAvgGross - linearTaxRelief + ewfMonthly + VVE + LIFE_INS;
    const linearRemainingLoan = loan - linearEquity;
    const linearTotalSunk =
      (linearAvgInterest - linearTaxRelief) * months +
      upfront + selling + vveTotal + ewfTotal + lifeTotal + ozbTotal;

    const linearProfitAt = (g: number) => {
      const appreciation = housePrice * (Math.pow(1 + g, years) - 1);
      return Math.round(appreciation + linearEquity - linearTotalSunk);
    };

    const linear: MortgageTypeStats = {
      avgMonthlyNet: Math.round(linearNetMonthly),
      totalSunkCosts: Math.round(linearTotalSunk),
      totalEquitySaved: Math.round(linearEquity),
      remainingLoanBalance: Math.round(linearRemainingLoan),
      profitPessimistic: linearProfitAt(-0.02),
      profitFlat: linearProfitAt(0),
      profitOptimistic: linearProfitAt(0.02),
      profitCustom: linearProfitAt(marketGrowth),
      profitAt: linearProfitAt,
    };

    // ── Renting ──────────────────────────────────────────────────────────────
    const rentingCost = monthlyRent * months; // positive — total cash out

    // ── Chart Data (walk month-by-month for accuracy) ─────────────────────
    const chartYears = Math.max(years, 10);

    let annuityBalance = loan;
    let annuityEquityRunning = 0;
    let annuityInterestRunning = 0;
    let linearEquityRunning = 0;
    let linearInterestRunning = 0;

    const chartData: ChartPoint[] = [];

    for (let y = 1; y <= chartYears; y++) {
      for (let m = 0; m < 12; m++) {
        // Annuity month
        const aInt = annuityBalance * monthlyRate;
        const aPrinc = annuityPayment - aInt;
        annuityEquityRunning += aPrinc;
        annuityInterestRunning += aInt;
        annuityBalance -= aPrinc;

        // Linear month
        const lBal = loan - linearEquityRunning;
        const lInt = lBal * monthlyRate;
        linearEquityRunning += linearPrincipal;
        linearInterestRunning += lInt;
      }

      const yMonths = y * 12;
      const overhead = (VVE + LIFE_INS + ewfMonthly + ozbMonthly) * yMonths;
      const appGain = housePrice * (Math.pow(1 + marketGrowth, y) - 1);

      const aSunk = annuityInterestRunning * (1 - TAX_REFUND_RATE) + upfront + selling + overhead;
      const lSunk = linearInterestRunning * (1 - TAX_REFUND_RATE) + upfront + selling + overhead;

      chartData.push({
        year: y,
        annuityEquity: Math.round(annuityEquityRunning),
        linearEquity: Math.round(linearEquityRunning),
        annuityNet: Math.round(annuityEquityRunning + appGain - aSunk),
        linearNet: Math.round(linearEquityRunning + appGain - lSunk),
        rentingNet: -Math.round(monthlyRent * yMonths),
      });
    }

    // ── Sensitivity Table (-5 % → +5 %, step 0.5 %) ─────────────────────
    const sensitivity: SensitivityRow[] = Array.from({ length: 21 }, (_, i) => {
      const g = -5 + i * 0.5;
      const gFrac = g / 100;
      const ap = annuityProfitAt(gFrac);
      const lp = linearProfitAt(gFrac);
      return {
        growth: g,
        annuityProfit: ap,
        linearProfit: lp,
        annuityVsRent: ap + rentingCost,  // buying_profit - renting_profit(-rentingCost)
        linearVsRent: lp + rentingCost,
      };
    });

    // ── Verdict ───────────────────────────────────────────────────────────
    const bestMortgage =
      annuity.profitCustom >= linear.profitCustom ? 'annuity' : 'linear';
    const bestProfit = bestMortgage === 'annuity' ? annuity.profitCustom : linear.profitCustom;
    const betterThanRenting = Math.round(bestProfit + rentingCost);

    return {
      annuity,
      linear,
      rentingCost,
      chartData,
      sensitivity,
      bestMortgage,
      betterThanRenting,
      loan,
      ltv,
      ewfMonthly,
    };
  }, [inputs]);
}
