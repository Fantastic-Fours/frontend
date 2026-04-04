import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CheckboxComponent } from '../../components/ui';
import { DigitThousandSepDirective } from '../../shared/digit-thousand-sep.directive';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MortgageApiService } from '../../core/services/mortgage-api.service';
import { getBankLogoPath } from '../../core/utils/bank-logo';
import type { ProgramListItem } from '../../core/interfaces/mortgage.types';
import {
  calcAnnuity,
  calcDifferentiated,
  type CalculatorResult,
  type ScheduleRow,
} from './calculator.utils';

@Component({
  selector: 'app-program-detail-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DigitThousandSepDirective, CheckboxComponent],
  templateUrl: './program-detail.page.html',
  styleUrl: './program-detail.page.scss',
})
export class ProgramDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly mortgageApi = inject(MortgageApiService);
  private readonly fb = inject(FormBuilder);

  program = signal<ProgramListItem | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  calcForm!: FormGroup;
  calcResult = signal<CalculatorResult | null>(null);
  calcError = signal<string | null>(null);

  programId = computed(() => {
    const id = this.route.snapshot.paramMap.get('id');
    return id ? parseInt(id, 10) : null;
  });

  /** Minimum down payment in currency (by program's min %) */
  getMinDownPayment(): number {
    const p = this.program();
    const price = this.calcForm?.get('price')?.value;
    if (!p || price == null || !price) return 0;
    const percent = parseFloat(p.min_down_payment_percent) || 0;
    return (price * percent) / 100;
  }

  /** How much less the user could put as down payment (if they put more than min) */
  getDownPaymentCouldBeLess(): number {
    const down = this.calcForm?.get('down_payment')?.value;
    const min = this.getMinDownPayment();
    if (down == null || min == null) return 0;
    return Math.max(0, down - min);
  }

  ngOnInit(): void {
    this.calcForm = this.fb.nonNullable.group({
      price: [25_000_000, [Validators.required, Validators.min(1)]],
      down_payment: [5_000_000, [Validators.required, Validators.min(0)]],
      term_years: [15, [Validators.required, Validators.min(1), Validators.max(30)]],
      payment_type: ['annuity' as const],
      without_income_confirmation: [false],
    });

    const id = this.programId();
    if (id == null || Number.isNaN(id)) {
      this.error.set('Неверный ID программы');
      this.loading.set(false);
      return;
    }
    this.mortgageApi.getProgram(id).subscribe({
      next: (data) => {
        this.program.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.detail ?? err?.message ?? 'Ошибка загрузки программы');
      },
    });
  }

  calculate(): void {
    const p = this.program();
    if (!p || this.calcForm.invalid) {
      this.calcForm.markAllAsTouched();
      this.calcError.set(this.calcForm.invalid ? 'Заполните поля корректно' : null);
      return;
    }
    this.calcError.set(null);
    const { price, down_payment, term_years, payment_type } = this.calcForm.getRawValue();
    const loanAmount = price - down_payment;
    if (loanAmount <= 0) {
      this.calcError.set('Первоначальный взнос не может быть больше или равен стоимости');
      this.calcResult.set(null);
      return;
    }
    const maxLoan = parseFloat(p.max_loan_amount) || Infinity;
    if (loanAmount > maxLoan) {
      this.calcError.set(`Сумма кредита не должна превышать ${this.formatMoney(String(maxLoan))} ₸`);
      this.calcResult.set(null);
      return;
    }
    const minPercent = parseFloat(p.min_down_payment_percent) || 0;
    const minDown = (price * minPercent) / 100;
    if (down_payment < minDown) {
      this.calcError.set(`Минимальный первоначальный взнос: ${this.formatMoney(String(minDown))} ₸ (${minPercent}%)`);
      this.calcResult.set(null);
      return;
    }
    const maxTerm = p.max_term_years ?? 30;
    if (term_years > maxTerm) {
      this.calcError.set(`Максимальный срок по программе: ${maxTerm} лет`);
      this.calcResult.set(null);
      return;
    }
    const rate = parseFloat(p.interest_rate) || 0;
    const result =
      payment_type === 'annuity'
        ? calcAnnuity(loanAmount, rate, term_years)
        : calcDifferentiated(loanAmount, rate, term_years);
    this.calcResult.set(result);
  }

  formatMoney(value: string | number | null | undefined): string {
    if (value == null || value === '') {
      return '—';
    }
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    if (Number.isNaN(num)) {
      return '—';
    }
    return new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  }

  /** Удобные подписи для max_loan_by_region с бэка */
  regionLoanLines(p: ProgramListItem): { label: string; amount: string }[] {
    const raw = p.max_loan_by_region;
    if (!raw || typeof raw !== 'object') {
      return [];
    }
    const labels: Record<string, string> = {
      astana_almaty: 'Астана и Алматы',
      other_regions: 'Прочие регионы РК',
    };
    return Object.entries(raw)
      .filter(([, v]) => v != null && String(v).trim() !== '')
      .map(([key, v]) => ({
        label: labels[key] ?? key,
        amount: `${this.formatMoney(String(v))} ₸`,
      }));
  }

  housingTypeLabel(type: string): string {
    return type === 'primary' ? 'Первичное жильё' : type === 'secondary' ? 'Вторичное жильё' : type;
  }

  getBankLogo(bankName: string): string | null {
    return getBankLogoPath(bankName);
  }

  getScheduleRows(): ScheduleRow[] {
    return this.calcResult()?.schedule ?? [];
  }
}
