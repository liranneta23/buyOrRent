'use client';

import { useMemo } from 'react';

// ── Dutch NL 2026 Constants (percentage-based, not user-editable) ────────────
const TOTAL_TERM_MONTHS = 360;    // 30-year mortgage

// ── Financial Math ───────────────────────────────────────────────────────────

function pmt(rate: number, nper: number, pv: number): number {
  if (rate === 0) return pv / nper;
  return (pv * rate * Math.pow(1 + rate, nper)) / (Math.pow(1 + rate, nper) - 1);
}

function calcAnnuityAvgInterest(rate: number, loan: number, months: number): number {
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

function calcLinearAvgInterest(rate: number, loan: number, months: number): number {
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

export interface Assumption {
  id: string;
  label: string;
  amount: number;
  type: 'one-time' | 'monthly' | 'annual';
}

export const DEFAULT_ASSUMPTIONS: Assumption[] = [
  { id: 'vve',    label: 'VVE / Service Costs',  amount: 250,    type: 'monthly'  },
  { id: 'life',   label: 'Life Insurance',        amount: 20,     type: 'monthly'  },
  { id: 'notary', label: 'Notary & Advisor Fees', amount: 10_000, type: 'one-time' },
];

export interface Inputs {
  housePrice: number;
  downPayment: number;
  transferTaxRate: number;  // percentage, e.g. 2 for 2%
  monthlyRent: number;
  annualRate: number;
  taxReliefRate: number;    // percentage, e.g. 37.56
  years: number;
  marketGrowth: number;
  rentIncrease: number;
  assumptions: Assumption[];
}

export interface MortgageTypeStats {
  avgMonthlyNet: number;
  totalSunkCosts: number;
  totalEquitySaved: number;
  remainingLoanBalance: number;
  profitPessimistic: number;
  profitFlat: number;
  profitOptimistic: number;
  profitCustom: number;
  profitAt: (growthFraction: number) => number;
}

export interface ChartPoint {
  year: number;
  annuityEquity: number;
  linearEquity: number;
  annuityNet: number;
  linearNet: number;
  rentingNet: number;
}

export interface SensitivityRow {
  growth: number;
  annuityProfit: number;
  linearProfit: number;
  annuityVsRent: number;
  linearVsRent: number;
}

export interface MortgageResults {
  annuity: MortgageTypeStats;
  linear: MortgageTypeStats;
  rentingCost: number;
  chartData: ChartPoint[];
  sensitivity: SensitivityRow[];
  bestMortgage: 'annuity' | 'linear';
  betterThanRenting: number;
  breakevenYear: number | null;
  loan: number;
  ltv: number;
  ewfMonthly: number;
}

// ── Main Hook ────────────────────────────────────────────────────────────────

export function useMortgageCalculator(inputs: Inputs): MortgageResults {
  return useMemo(() => {
    const { housePrice, downPayment, transferTaxRate, monthlyRent, annualRate, taxReliefRate, years, marketGrowth, rentIncrease, assumptions } = inputs;
    const TAX_REFUND_RATE = taxReliefRate / 100;

    const loan = Math.max(0, housePrice - downPayment);
    const monthlyRate = annualRate / 12;
    const months = years * 12;
    const ltv = housePrice > 0 ? loan / housePrice : 0;

    // ── Percentage-based fixed costs ─────────────────────────────────────────
    const ewfMonthly = (0.0035 * housePrice) * TAX_REFUND_RATE / 12;
    const ozbMonthly = 0.001 * housePrice / 12;

    // ── User-defined assumptions ─────────────────────────────────────────────
    const extraMonthly = assumptions.reduce((s, a) => {
      if (a.type === 'monthly') return s + a.amount;
      if (a.type === 'annual')  return s + a.amount / 12;
      return s;
    }, 0);

    const transferTax = (transferTaxRate / 100) * housePrice;
    const allOneTime = transferTax + assumptions
      .filter(a => a.type === 'one-time')
      .reduce((s, a) => s + a.amount, 0);

    // ── Annuity ──────────────────────────────────────────────────────────────
    const annuityPayment = pmt(monthlyRate, TOTAL_TERM_MONTHS, loan);
    const annuityAvgInterest = calcAnnuityAvgInterest(monthlyRate, loan, months);
    const annuityTaxRelief = annuityAvgInterest * TAX_REFUND_RATE;
    const annuityEquity = (annuityPayment - annuityAvgInterest) * months;
    const annuityNetMonthly = annuityPayment - annuityTaxRelief + ewfMonthly + extraMonthly;
    const annuityRemainingLoan = loan - annuityEquity;
    const annuityTotalSunk =
      (annuityAvgInterest - annuityTaxRelief) * months +
      allOneTime +
      (extraMonthly + ewfMonthly + ozbMonthly) * months;

    const annuityProfitAt = (g: number) => {
      const appreciation = housePrice * (Math.pow(1 + g, years) - 1);
      return Math.round(appreciation + annuityEquity - annuityTotalSunk);
    };

    const annuity: MortgageTypeStats = {
      avgMonthlyNet: Math.round(annuityNetMonthly),
      totalSunkCosts: Math.round(annuityTotalSunk),
      totalEquitySaved: Math.round(annuityEquity),
      remainingLoanBalance: Math.round(annuityRemainingLoan),
      profitPessimistic: annuityProfitAt(-0.04),
      profitFlat: annuityProfitAt(0),
      profitOptimistic: annuityProfitAt(0.04),
      profitCustom: annuityProfitAt(marketGrowth),
      profitAt: annuityProfitAt,
    };

    // ── Linear ───────────────────────────────────────────────────────────────
    const linearPrincipal = loan / TOTAL_TERM_MONTHS;
    const linearAvgInterest = calcLinearAvgInterest(monthlyRate, loan, months);
    const linearTaxRelief = linearAvgInterest * TAX_REFUND_RATE;
    const linearAvgGross = linearPrincipal + linearAvgInterest;
    const linearEquity = linearPrincipal * months;
    const linearNetMonthly = linearAvgGross - linearTaxRelief + ewfMonthly + extraMonthly;
    const linearRemainingLoan = loan - linearEquity;
    const linearTotalSunk =
      (linearAvgInterest - linearTaxRelief) * months +
      allOneTime +
      (extraMonthly + ewfMonthly + ozbMonthly) * months;

    const linearProfitAt = (g: number) => {
      const appreciation = housePrice * (Math.pow(1 + g, years) - 1);
      return Math.round(appreciation + linearEquity - linearTotalSunk);
    };

    const linear: MortgageTypeStats = {
      avgMonthlyNet: Math.round(linearNetMonthly),
      totalSunkCosts: Math.round(linearTotalSunk),
      totalEquitySaved: Math.round(linearEquity),
      remainingLoanBalance: Math.round(linearRemainingLoan),
      profitPessimistic: linearProfitAt(-0.04),
      profitFlat: linearProfitAt(0),
      profitOptimistic: linearProfitAt(0.04),
      profitCustom: linearProfitAt(marketGrowth),
      profitAt: linearProfitAt,
    };

    // ── Renting ──────────────────────────────────────────────────────────────
    const cumulativeRentAt = (y: number): number => {
      if (rentIncrease === 0) return monthlyRent * y * 12;
      return monthlyRent * 12 * (Math.pow(1 + rentIncrease, y) - 1) / rentIncrease;
    };
    const rentingCost = cumulativeRentAt(years);

    // ── Chart Data ────────────────────────────────────────────────────────────
    const chartYears = Math.max(years, 10);
    let annuityBalance = loan;
    let annuityEquityRunning = 0;
    let annuityInterestRunning = 0;
    let linearEquityRunning = 0;
    let linearInterestRunning = 0;
    const chartData: ChartPoint[] = [];

    for (let y = 1; y <= chartYears; y++) {
      for (let m = 0; m < 12; m++) {
        const aInt = annuityBalance * monthlyRate;
        const aPrinc = annuityPayment - aInt;
        annuityEquityRunning += aPrinc;
        annuityInterestRunning += aInt;
        annuityBalance -= aPrinc;

        const lBal = loan - linearEquityRunning;
        linearInterestRunning += lBal * monthlyRate;
        linearEquityRunning += linearPrincipal;
      }

      const yMonths = y * 12;
      const overhead = (extraMonthly + ewfMonthly + ozbMonthly) * yMonths;
      const appGain = housePrice * (Math.pow(1 + marketGrowth, y) - 1);
      const aSunk = annuityInterestRunning * (1 - TAX_REFUND_RATE) + allOneTime + overhead;
      const lSunk = linearInterestRunning * (1 - TAX_REFUND_RATE) + allOneTime + overhead;

      chartData.push({
        year: y,
        annuityEquity: Math.round(annuityEquityRunning),
        linearEquity: Math.round(linearEquityRunning),
        annuityNet: Math.round(annuityEquityRunning + appGain - aSunk),
        linearNet: Math.round(linearEquityRunning + appGain - lSunk),
        rentingNet: -Math.round(cumulativeRentAt(y)),
      });
    }

    // ── Sensitivity Table ─────────────────────────────────────────────────────
    const sensitivity: SensitivityRow[] = Array.from({ length: 21 }, (_, i) => {
      const g = -5 + i * 0.5;
      const gFrac = g / 100;
      const ap = annuityProfitAt(gFrac);
      const lp = linearProfitAt(gFrac);
      return { growth: g, annuityProfit: ap, linearProfit: lp, annuityVsRent: ap + rentingCost, linearVsRent: lp + rentingCost };
    });

    // ── Verdict ───────────────────────────────────────────────────────────────
    const bestMortgage = annuity.profitCustom >= linear.profitCustom ? 'annuity' : 'linear';
    const bestProfit = bestMortgage === 'annuity' ? annuity.profitCustom : linear.profitCustom;
    const betterThanRenting = Math.round(bestProfit + rentingCost);

    // ── Breakeven Year ────────────────────────────────────────────────────────
    let breakevenYear: number | null = null;
    for (const pt of chartData) {
      const buyingNet = bestMortgage === 'annuity' ? pt.annuityNet : pt.linearNet;
      if (buyingNet > pt.rentingNet) {
        breakevenYear = pt.year;
        break;
      }
    }

    return { annuity, linear, rentingCost, chartData, sensitivity, bestMortgage, betterThanRenting, breakevenYear, loan, ltv, ewfMonthly };
  }, [inputs]);
}
