import numpy_financial as npf


def get_average_linear_interest(monthly_rate, loan_amount, total_term, end_p):
    """
    In a Linear mortgage, interest is calculated on the remaining balance.
    The balance decreases by exactly (Loan / Total Term) every month.
    """
    total_interest = 0
    monthly_principal_flat = loan_amount / total_term

    for month in range(1, end_p + 1):
        # Balance at the start of the month
        current_balance = loan_amount - ((month - 1) * monthly_principal_flat)
        interest_this_month = current_balance * monthly_rate
        total_interest += interest_this_month

    return total_interest / end_p


def get_average_annuity_interest(monthly_rate, loan_amount, total_term, start_p, end_p):
    total_interest = 0
    current_balance = loan_amount
    pmt = (loan_amount * monthly_rate * (1 + monthly_rate) ** total_term) / ((1 + monthly_rate) ** total_term - 1)

    for month in range(1, end_p + 1):
        interest_this_month = current_balance * monthly_rate
        principal_this_month = pmt - interest_this_month
        if month >= start_p:
            total_interest += interest_this_month
        current_balance -= principal_this_month
    return total_interest / end_p


def calculate_full_nl_comparison(house_price, down_payments, monthly_rent, years):
    # --- 1. CORE INPUTS ---
    mortgage_taken = house_price - down_payments
    nhg_rate_annual = 0.0371
    tax_refund_rate = 0.3756
    months = years * 12

    monthly_rate = nhg_rate_annual / 12
    total_term_months = 30 * 12

    # --- 2. EXTRA MONTHLY COSTS (Common to both) ---
    vve_contribution = 250
    life_insurance = 20
    # Eigenwoningforfait logic from your sheet
    eigenwoningforfait = (0.0035 * house_price) * tax_refund_rate / 12

    # --- 3. ANNUITY CALCULATIONS ---
    annuity_gross_monthly = abs(npf.pmt(monthly_rate, total_term_months, mortgage_taken))
    annuity_avg_interest = get_average_annuity_interest(monthly_rate, mortgage_taken, total_term_months, 1, months)
    annuity_tax_relief = annuity_avg_interest * tax_refund_rate
    annuity_net_monthly = annuity_gross_monthly - annuity_tax_relief + eigenwoningforfait + vve_contribution + life_insurance
    annuity_equity_saved = (annuity_gross_monthly - annuity_avg_interest) * months
    annuity_remaining_loan_balance = mortgage_taken - annuity_equity_saved

    # --- 4. LINEAR CALCULATIONS ---
    linear_principal_monthly = mortgage_taken / total_term_months
    linear_avg_interest = get_average_linear_interest(monthly_rate, mortgage_taken, total_term_months, months)
    linear_tax_relief = linear_avg_interest * tax_refund_rate
    # Linear gross starts high and drops; we use the average gross for the period
    linear_avg_gross = linear_principal_monthly + linear_avg_interest
    linear_net_monthly = linear_avg_gross - linear_tax_relief + eigenwoningforfait + vve_contribution + life_insurance
    linear_equity_saved = linear_principal_monthly * months
    linear_remaining_loan_balance = mortgage_taken - linear_equity_saved

    # --- 5. SUNK COSTS & SCENARIOS ---
    upfront_costs = (0.02 * house_price * 0.5) + 10000
    selling_fees = 8000
    total_ozb = (0.001 * house_price / 12) * months

    def calculate_results(net_monthly, equity, remaining_loan_balance, avg_interest_gross, tax_relief):
        total_sunk = ((avg_interest_gross - tax_relief) * months + upfront_costs + selling_fees +
                      (vve_contribution * months) + (eigenwoningforfait * months) +
                      (life_insurance * months) + total_ozb)

        def get_scenario(growth):
            fv = house_price * ((1 + growth) ** years)
            return (fv - house_price) + equity - total_sunk

        return {
            "Avg Monthly Net": int(net_monthly),
            "Total Sunk Costs": int(total_sunk),
            "Total Equity Saved": int(equity),
            "Remaining Loan Balance": int(remaining_loan_balance),
            "Profit (Pes -2%)": int(get_scenario(-0.02)),
            "Profit (Flat 0%)": int(get_scenario(0.00)),
            "Profit (Opt +2%)": int(get_scenario(0.02))
        }

    return {
        "Annuity": calculate_results(annuity_net_monthly, annuity_equity_saved, annuity_remaining_loan_balance,
                                     annuity_avg_interest,
                                     annuity_tax_relief),
        "Linear": calculate_results(linear_net_monthly, linear_equity_saved, linear_remaining_loan_balance,
                                    linear_avg_interest, linear_tax_relief),
        "Renting Total": int(-monthly_rent * months)
    }


def print_comparison(results, years):
    print(f"\n{'=' * 60}")
    print(f"   MORTGAGE VS RENTING COMPARISON ({years} YEAR WINDOW)")
    print(f"{'=' * 60}")

    # Header
    print(f"{'Metric':<25} | {'Annuity':<10} | {'Linear':<10} | {'Renting':<10}")
    print(f"{'-' * 60}")

    # Monthly Cash Flow (Net)
    print(
        f"{'Monthly Net Outflow':<25} | €{results['Annuity']['Avg Monthly Net']:<9} | €{results['Linear']['Avg Monthly Net']:<9} | €{int(-results['Renting Total']) / (years * 12) :<9}")

    # Total Sunk Costs (Money you never see again)
    # For renting, all rent is "sunk"
    print(
        f"{'Total Sunk Costs':<25} | €{results['Annuity']['Total Sunk Costs']:<9} | €{results['Linear']['Total Sunk Costs']:<9} | €{results['Renting Total']:<9}")

    print(f"{'-' * 60}")
    print(
        f"{'NET PROFIT (Market @ -2%)':<25} | €{results['Annuity']['Profit (Pes -2%)']:<9} | €{results['Linear']['Profit (Pes -2%)']:<9} | €{results['Renting Total']:<9}")
    print(
        f"{'NET PROFIT (Market @ 0%)':<25} | €{results['Annuity']['Profit (Flat 0%)']:<9} | €{results['Linear']['Profit (Flat 0%)']:<9} | €{results['Renting Total']:<9}")
    print(
        f"{'NET PROFIT (Market @ +2%)':<25} | €{results['Annuity']['Profit (Opt +2%)']:<9} | €{results['Linear']['Profit (Opt +2%)']:<9} | €{results['Renting Total']:<9}")

    print(f"{'-' * 60}")
    print(
        f"{'NET PROFIT (Market @ -2%)':<25} | €{results['Annuity']['Profit (Pes -2%)'] - results['Renting Total']:<9} | €{results['Linear']['Profit (Pes -2%)'] - results['Renting Total']:<9} | €{results['Renting Total']:<9}")
    print(
        f"{'NET PROFIT (Market @ 0%)':<25} | €{results['Annuity']['Profit (Flat 0%)'] - results['Renting Total']:<9} | €{results['Linear']['Profit (Flat 0%)'] - results['Renting Total']:<9} | €{results['Renting Total']:<9}")
    print(
        f"{'NET PROFIT (Market @ +2%)':<25} | €{results['Annuity']['Profit (Opt +2%)'] - results['Renting Total']:<9} | €{results['Linear']['Profit (Opt +2%)'] - results['Renting Total']:<9} | €{results['Renting Total']:<9}")
    print(f"{'=' * 60}")

    # Final Verdict
    best_option = "Linear" if results['Linear']['Profit (Flat 0%)'] > results['Annuity'][
        'Profit (Flat 0%)'] else "Annuity"
    diff = abs(results['Linear']['Profit (Flat 0%)'] - results['Annuity']['Profit (Flat 0%)'])

    print(f"ADVICE: {best_option} is better than the other mortgage by €{diff} over {years} years.")
    print(
        f"ADVICE: Buying {best_option} is better than Renting by €{results[best_option]['Profit (Flat 0%)'] - results['Renting Total']} over {years} years.")


# Execute
house_price = 500000
down_payments = 50000
monthly_rent = 2380
years = 3
results = calculate_full_nl_comparison(house_price, down_payments, monthly_rent, years)
print(f"Annuity Results: {results['Annuity']}")
print(f"Linear Results: {results['Linear']}")
print(f"Renting Total Cost: {results['Renting Total']}")

# Run the printout
print_comparison(results, years)
