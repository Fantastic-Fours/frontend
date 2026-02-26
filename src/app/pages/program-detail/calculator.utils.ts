/** One row of the payment schedule */
export interface ScheduleRow {
  period: string;       // e.g. "мар. 2026"
  totalPayment: number;
  interest: number;
  principal: number;
  remaining: number;
}

export interface CalculatorResult {
  monthlyPayment: number;   // first month for differentiated, same for annuity
  totalPayment: number;
  totalOverpayment: number;
  loanAmount: number;
  schedule: ScheduleRow[];
}

const MONTH_NAMES = ['янв.', 'фев.', 'мар.', 'апр.', 'мая', 'июн.', 'июл.', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'];

function formatPeriod(monthIndex: number, year: number): string {
  return `${MONTH_NAMES[monthIndex]} ${year}`;
}

/**
 * Annuity: fixed monthly payment.
 * PMT = L * r * (1+r)^n / ((1+r)^n - 1)
 */
export function calcAnnuity(
  loanAmount: number,
  annualRatePercent: number,
  termYears: number,
  startDate: Date = new Date()
): CalculatorResult {
  const r = annualRatePercent / 100 / 12;
  const n = termYears * 12;
  if (r === 0) {
    const pmt = loanAmount / n;
    const schedule: ScheduleRow[] = [];
    let balance = loanAmount;
    let totalPaid = 0;
    let month = startDate.getMonth();
    let year = startDate.getFullYear();
    for (let i = 0; i < n; i++) {
      const principal = Math.min(loanAmount / n, balance);
      const interest = 0;
      const total = principal;
      balance -= principal;
      totalPaid += total;
      schedule.push({
        period: formatPeriod(month, year),
        totalPayment: Math.round(total),
        interest: 0,
        principal: Math.round(principal),
        remaining: Math.round(balance),
      });
      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
    }
    return {
      monthlyPayment: pmt,
      totalPayment: totalPaid,
      totalOverpayment: totalPaid - loanAmount,
      loanAmount,
      schedule,
    };
  }
  const pmt = loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const schedule: ScheduleRow[] = [];
  let balance = loanAmount;
  let totalPaid = 0;
  let month = startDate.getMonth();
  let year = startDate.getFullYear();
  for (let i = 0; i < n; i++) {
    const interest = balance * r;
    const principal = pmt - interest;
    const total = pmt;
    balance -= principal;
    totalPaid += total;
    schedule.push({
      period: formatPeriod(month, year),
      totalPayment: Math.round(total),
      interest: Math.round(interest),
      principal: Math.round(principal),
      remaining: Math.round(Math.max(0, balance)),
    });
    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }
  return {
    monthlyPayment: pmt,
    totalPayment: totalPaid,
    totalOverpayment: totalPaid - loanAmount,
    loanAmount,
    schedule,
  };
}

/**
 * Differentiated: fixed principal, decreasing interest.
 */
export function calcDifferentiated(
  loanAmount: number,
  annualRatePercent: number,
  termYears: number,
  startDate: Date = new Date()
): CalculatorResult {
  const r = annualRatePercent / 100 / 12;
  const n = termYears * 12;
  const principalMonthly = loanAmount / n;
  const schedule: ScheduleRow[] = [];
  let balance = loanAmount;
  let totalPaid = 0;
  let month = startDate.getMonth();
  let year = startDate.getFullYear();
  let firstPayment = 0;
  for (let i = 0; i < n; i++) {
    const interest = balance * r;
    const principal = i === n - 1 ? balance : principalMonthly;
    const total = principal + interest;
    if (i === 0) firstPayment = total;
    balance -= principal;
    totalPaid += total;
    schedule.push({
      period: formatPeriod(month, year),
      totalPayment: Math.round(total),
      interest: Math.round(interest),
      principal: Math.round(principal),
      remaining: Math.round(Math.max(0, balance)),
    });
    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }
  return {
    monthlyPayment: firstPayment,
    totalPayment: totalPaid,
    totalOverpayment: totalPaid - loanAmount,
    loanAmount,
    schedule,
  };
}
